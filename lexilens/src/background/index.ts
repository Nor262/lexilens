import { ExtensionMessage, Flashcard, WordLookupResult } from '../types';
import { lookupFreeDictionary } from '../services/dictionary';
import { lookupWordWithGemini, analyzeSentenceWithGemini, ocrImageWithGemini } from '../services/gemini';
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

// Listen to keyboard shortcut commands (e.g. Alt+Shift+X)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture_screen') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_SCREEN_CROP' });
    }
  }
});

// Main Message Router
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    try {
      const settings = await getSettings();

      switch (message.type) {
        case 'GET_SETTINGS': {
          sendResponse({ success: true, data: settings });
          break;
        }

        case 'SAVE_SETTINGS': {
          const updated = await saveSettings(message.payload);
          sendResponse({ success: true, data: updated });
          break;
        }

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
              error: 'Chưa cấu hình Gemini API Key. Vui lòng bấm vào icon LexiLens hoặc mở Cài đặt để nhập Key miễn phí.',
            });
            return;
          }

          // 1. Try Free Dictionary API first (for standard IPA & authentic audio MP3)
          let dictInfo = null;
          try {
            dictInfo = await lookupFreeDictionary(selection);
          } catch (e) {
            console.warn('[LexiLens] Dictionary lookup failed, falling back to pure Gemini:', e);
          }

          // 2. Call Gemini for in-context analysis & "why this meaning"
          const result = await lookupWordWithGemini(
            settings.geminiApiKey,
            settings.preferredModel,
            selection,
            sentence,
            pageTitle,
            topic,
            dictInfo?.ipa
          );

          // Attach verified audio URL from dictionary if present
          if (dictInfo?.audioUrl) {
            result.audio_url = dictInfo.audioUrl;
          }

          // Save to cache
          await setCachedLookup(cacheKey, result);

          sendResponse({ success: true, data: result });
          break;
        }

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

        case 'SAVE_FLASHCARD': {
          const rawCard = message.payload;
          const newCard: Flashcard = {
            id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            headword: rawCard.headword,
            pos: rawCard.pos || 'word',
            ipa: rawCard.ipa || '',
            meaning_vi: rawCard.meaning_vi,
            definition_en: rawCard.definition_en || '',
            why: rawCard.why || '',
            sentence: rawCard.sentence,
            article_title: rawCard.article_title || 'Tài liệu',
            article_url: rawCard.article_url || '',
            topic: rawCard.topic || 'Chung',
            image_crop: rawCard.image_crop,
            audio_url: rawCard.audio_url,
            created_at: Date.now(),
            fsrs: createNewFsrsState(),
          };

          const saveResult = await saveFlashcard(newCard);
          sendResponse({ success: true, data: saveResult });
          break;
        }

        case 'GET_CARDS': {
          const cards = await getFlashcards();
          sendResponse({ success: true, data: cards });
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
