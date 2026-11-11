import { ExtensionMessage, Flashcard, WordLookupResult } from '../types';
import { lookupFreeDictionary } from '../services/dictionary';
import { lookupWordWithGemini, analyzeSentenceWithGemini, ocrImageWithGemini } from '../services/gemini';
import { quickTranslateText } from '../services/quickTranslate';
import {
  getExtensionUser,
  signInExtension,
  signUpExtension,
  signOutExtension,
  tryAutoSyncFromWebTab,
  syncCardToCloud,
  fetchCardsFromCloud,
} from '../services/supabase';
import {
  getSettings,
  saveSettings,
  getFlashcards,
  saveFlashcard,
  updateFlashcard,
  generateCacheKey,
  getCachedLookup,
  setCachedLookup,
  updateExtensionBadge,
} from '../services/storage';
import { createNewFsrsState, reviewFsrsCard } from '../services/fsrs';

console.log('[LexiLens] Background Service Worker initialized.');

// Set periodic alarm to refresh due cards badge
chrome.alarms.create('refresh_badge', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refresh_badge') {
    updateExtensionBadge();
  }
});

// Update badge on extension launch
updateExtensionBadge();

// Helper to trigger crop on a tab, auto-injecting content script if missing
async function triggerCropOnTab(tabId: number, url?: string) {
  if (url?.startsWith('chrome://') || url?.startsWith('chrome-extension://')) {
    return;
  }

  chrome.tabs.sendMessage(tabId, { type: 'TRIGGER_SCREEN_CROP' }, () => {
    if (chrome.runtime.lastError) {
      // Content script not ready on this tab, inject dynamically
      chrome.scripting.executeScript(
        {
          target: { tabId },
          files: ['content.js'],
        },
        () => {
          if (!chrome.runtime.lastError) {
            chrome.scripting.insertCSS(
              {
                target: { tabId },
                files: ['content.css'],
              },
              () => {
                setTimeout(() => {
                  chrome.tabs.sendMessage(tabId, { type: 'TRIGGER_SCREEN_CROP' });
                }, 80);
              }
            );
          }
        }
      );
    }
  });
}

// Setup Context Menu for right-click text selection & OCR
function setupContextMenu() {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'lexilens-translate-sidepanel',
        title: 'Dịch bằng LexiLens: "%s"',
        contexts: ['selection'],
      });
      chrome.contextMenus.create({
        id: 'lexilens-crop-ocr',
        title: 'Chụp vùng & Nhận diện chữ (LexiLens Lens)...',
        contexts: ['page', 'image', 'video'],
      });
    });
  } catch (err) {
    console.warn('[LexiLens] Could not setup context menu:', err);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenu();
});

// Context Menu Click Handler -> Opens Sidepanel or triggers OCR
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'lexilens-crop-ocr' && tab?.id) {
    triggerCropOnTab(tab.id, tab.url);
    return;
  }

  if (info.menuItemId === 'lexilens-translate-sidepanel' && info.selectionText) {
    const selectedText = info.selectionText.trim();
    if (!selectedText) return;

    if (tab?.windowId) {
      // @ts-ignore
      if (chrome.sidePanel && chrome.sidePanel.open) {
        try {
          // @ts-ignore
          await chrome.sidePanel.open({ windowId: tab.windowId });
        } catch (e) {
          console.warn('[LexiLens] Failed opening sidePanel:', e);
        }
      }
    }

    const payload = {
      text: selectedText,
      pageTitle: tab?.title || 'Trang web',
      pageUrl: tab?.url || '',
      timestamp: Date.now(),
    };

    try {
      await chrome.storage.local.set({ lexilens_active_lookup: payload });
    } catch (e) {
      console.warn(e);
    }

    // Send direct runtime message to sidepanel if already mounted
    chrome.runtime.sendMessage({
      type: 'SIDEPANEL_TRIGGER_LOOKUP',
      payload,
    }).catch(() => {
      // Sidepanel is loading, local storage handles it
    });
  }
});

// Listen to keyboard shortcut commands (e.g. Alt+Shift+X)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture_screen') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      triggerCropOnTab(tab.id, tab.url);
    }
  }
});

// Main Message Router
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    try {
      const settings = await getSettings();

      switch (message.type) {
        // ================= AUTH HANDLERS =================
        case 'GET_USER': {
          let user = await getExtensionUser();
          if (!user) {
            user = await tryAutoSyncFromWebTab();
          }
          sendResponse({ success: true, data: user });
          break;
        }

        case 'SIGN_IN': {
          const { email, password } = message.payload;
          const { data, error } = await signInExtension(email, password);
          if (error) {
            sendResponse({ success: false, error: error.message });
          } else {
            sendResponse({ success: true, data: data.user });
          }
          break;
        }

        case 'SIGN_UP': {
          const { email, password } = message.payload;
          const { data, error } = await signUpExtension(email, password);
          if (error) {
            sendResponse({ success: false, error: error.message });
          } else {
            sendResponse({ success: true, data: data.user });
          }
          break;
        }

        case 'SIGN_OUT': {
          await signOutExtension();
          sendResponse({ success: true });
          break;
        }

        case 'TRY_AUTO_SYNC_AUTH': {
          const user = await tryAutoSyncFromWebTab();
          sendResponse({ success: !!user, data: user });
          break;
        }

        // ================= SETTINGS HANDLERS =================
        case 'GET_SETTINGS': {
          sendResponse({ success: true, data: settings });
          break;
        }

        case 'SAVE_SETTINGS': {
          const updated = await saveSettings(message.payload);
          sendResponse({ success: true, data: updated });
          break;
        }

        // ================= STEP 1: ULTRA-FAST TRANSLATE (<150ms) =================
        case 'QUICK_LOOKUP': {
          const { text } = message.payload;
          const cleanText = (text || '').trim();
          if (!cleanText) {
            sendResponse({ success: false, error: 'Vui lòng cung cấp văn bản cần tra.' });
            return;
          }

          const isSentence = cleanText.split(/\s+/).length > 5;

          if (isSentence) {
            const quickVi = await quickTranslateText(cleanText);
            sendResponse({
              success: true,
              data: {
                isSentence: true,
                translation_vi: quickVi || 'Đang dịch...',
              },
            });
          } else {
            // Run Google Translate and Free Dictionary in parallel
            const [quickVi, dictInfo] = await Promise.all([
              quickTranslateText(cleanText),
              lookupFreeDictionary(cleanText).catch(() => null),
            ]);

            sendResponse({
              success: true,
              data: {
                isSentence: false,
                headword: cleanText,
                pos: dictInfo?.pos || 'word',
                ipa: dictInfo?.ipa || '',
                meaning_vi: quickVi || '',
                definition_en: dictInfo?.definitions?.[0] || '',
                audio_url: dictInfo?.audioUrl,
              },
            });
          }
          break;
        }

        // ================= STEP 2: DEEP AI CONTEXT ANALYSIS (Gemini) =================
        case 'ANALYZE_WORD_CONTEXT':
        case 'LOOKUP_WORD': {
          const { selection, sentence, pageTitle, topic } = message.payload;
          const cacheKey = generateCacheKey('word', selection, sentence, topic);
          const cached = await getCachedLookup<WordLookupResult>(cacheKey);

          if (cached) {
            console.log('[LexiLens] Returning cached word result:', selection);
            sendResponse({ success: true, data: cached });
            return;
          }

          if (!settings.geminiApiKey) {
            sendResponse({
              success: false,
              error: 'Chưa cấu hình Gemini API Key. Vui lòng mở Cài đặt LexiLens để nhập Key miễn phí.',
            });
            return;
          }

          // Fetch dictionary IPA if not already available
          let dictInfo = null;
          try {
            dictInfo = await lookupFreeDictionary(selection);
          } catch (e) {
            console.warn('[LexiLens] Dictionary lookup failed:', e);
          }

          // Call Gemini for in-context analysis & "why this meaning"
          const result = await lookupWordWithGemini(
            settings.geminiApiKey,
            settings.preferredModel,
            selection,
            sentence,
            pageTitle,
            topic,
            dictInfo?.ipa
          );

          if (dictInfo?.audioUrl) {
            result.audio_url = dictInfo.audioUrl;
          }

          await setCachedLookup(cacheKey, result);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'ANALYZE_SENTENCE_CONTEXT':
        case 'ANALYZE_SENTENCE': {
          const { sentence } = message.payload;
          const cacheKey = generateCacheKey('sentence', sentence, '', '');
          const cached = await getCachedLookup(cacheKey);

          if (cached) {
            sendResponse({ success: true, data: cached });
            return;
          }

          if (!settings.geminiApiKey) {
            sendResponse({
              success: false,
              error: 'Chưa cấu hình Gemini API Key. Vui lòng mở Cài đặt LexiLens để nhập Key.',
            });
            return;
          }

          const result = await analyzeSentenceWithGemini(
            settings.geminiApiKey,
            settings.preferredModel,
            sentence
          );

          await setCachedLookup(cacheKey, result);
          sendResponse({ success: true, data: result });
          break;
        }

        case 'CAPTURE_VISIBLE_TAB': {
          const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
          sendResponse({ success: true, data: dataUrl });
          break;
        }

        case 'PERFORM_OCR': {
          const { imageBase64 } = message.payload;
          if (!settings.geminiApiKey) {
            sendResponse({
              success: false,
              error: 'Chưa cấu hình Gemini API Key để nhận diện ảnh (OCR).',
            });
            return;
          }

          const ocrResult = await ocrImageWithGemini(
            settings.geminiApiKey,
            settings.preferredModel,
            imageBase64
          );

          sendResponse({ success: true, data: ocrResult });
          break;
        }

        // ================= SAVE FLASHCARD (ENFORCE AUTH & SYNC TO CLOUD) =================
        case 'SAVE_FLASHCARD': {
          const rawCard = message.payload;
          let user = await getExtensionUser();
          if (!user) {
            user = await tryAutoSyncFromWebTab();
          }

          if (!user) {
            sendResponse({
              success: false,
              requireAuth: true,
              error: 'Vui lòng đăng nhập tài khoản LexiLens để lưu từ vựng và đồng bộ sang Web App!',
            });
            return;
          }

          const newCard: Flashcard = {
            id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            user_id: user.id,
            headword: rawCard.headword,
            pos: rawCard.pos || 'word',
            ipa: rawCard.ipa || '',
            meaning_vi: rawCard.meaning_vi,
            root_meaning: rawCard.root_meaning || '',
            definition_en: rawCard.definition_en || '',
            why: rawCard.why || '',
            collocations: rawCard.collocations || [],
            simplified_sentence: rawCard.simplified_sentence || '',
            sentence: rawCard.sentence,
            article_title: rawCard.article_title || 'Tài liệu tra cứu',
            article_url: rawCard.article_url || '',
            topic: rawCard.topic || 'Chung',
            image_crop: rawCard.image_crop,
            audio_url: rawCard.audio_url,
            created_at: Date.now(),
            fsrs: createNewFsrsState(),
          };

          // 1. Save to local storage for instant offline access
          const saveResult = await saveFlashcard(newCard);

          // 2. Sync to Supabase cloud database
          const cloudSynced = await syncCardToCloud(newCard, user.id);

          sendResponse({
            success: true,
            syncedToCloud: cloudSynced,
            data: saveResult,
          });
          break;
        }

        case 'GET_CARDS': {
          let user = await getExtensionUser();
          if (!user) {
            user = await tryAutoSyncFromWebTab();
          }

          // If logged in, fetch from cloud
          if (user) {
            const cloudCards = await fetchCardsFromCloud(user.id);
            if (cloudCards && cloudCards.length > 0) {
              // Convert cloud cards to extension format
              const formatted: Flashcard[] = cloudCards.map((c: any) => ({
                id: c.id,
                user_id: c.user_id,
                headword: c.headword,
                pos: c.pos || 'word',
                ipa: c.ipa || '',
                meaning_vi: c.meaning_vi,
                root_meaning: c.root_meaning || '',
                definition_en: c.definition_en || '',
                why: c.why || '',
                sentence: c.sentence || '',
                article_title: c.source_article_title || 'Tài liệu',
                article_url: c.source_article_url || '',
                topic: c.topic_id || 'Chung',
                audio_url: c.audio_url,
                created_at: new Date(c.created_at).getTime(),
                fsrs: {
                  due: c.due,
                  stability: c.stability,
                  difficulty: c.difficulty,
                  reps: c.reps,
                  lapses: c.lapses,
                  state: c.state,
                },
              }));
              sendResponse({ success: true, data: formatted });
              return;
            }
          }

          // Fallback to local storage
          const localCards = await getFlashcards();
          sendResponse({ success: true, data: localCards });
          break;
        }

        case 'UPDATE_CARD_FSRS': {
          const { cardId, rating } = message.payload;
          const cards = await getFlashcards();
          const target = cards.find((c) => c.id === cardId);
          if (!target) {
            sendResponse({ success: false, error: 'Không tìm thấy thẻ' });
            return;
          }

          const { updatedCard, scheduledDays } = reviewFsrsCard(target, rating);
          await updateFlashcard(updatedCard);

          // If logged in, also sync updated review to cloud
          const user = await getExtensionUser();
          if (user) {
            syncCardToCloud(updatedCard, user.id);
          }

          sendResponse({ success: true, data: { updatedCard, scheduledDays } });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (err: any) {
      console.error('[LexiLens] Background Error:', err);
      sendResponse({ success: false, error: err.message || 'Lỗi xử lý nền' });
    }
  })();

  return true; // Keep message channel open for async response
});
