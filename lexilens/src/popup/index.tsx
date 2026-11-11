import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BookOpenIcon,
  CropIcon,
  SettingsIcon,
  CheckIcon,
  AlertCircleIcon,
  VolumeIcon,
  SparklesIcon,
  BookmarkIcon,
  ExternalLinkIcon,
} from '../components/Icons';
import { Flashcard, UserSettings, WordLookupResult, SentenceAnalysisResult } from '../types';
import { isCardDueToday } from '../services/fsrs';
import '../styles/global.css';

const PopupApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'translate' | 'review'>('translate');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Search & Translate state
  const [inputText, setInputText] = useState<string>('');
  const [translating, setTranslating] = useState<boolean>(false);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [wordData, setWordData] = useState<WordLookupResult | null>(null);
  const [syntaxData, setSyntaxData] = useState<SentenceAnalysisResult | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [cardSaved, setCardSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CARDS' }, (res) => {
      if (res?.success) setCards(res.data || []);
    });
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
      if (res?.success) setSettings(res.data);
    });
    chrome.runtime.sendMessage({ type: 'GET_USER' }, (res) => {
      if (res?.success && res.data?.user) {
        setCurrentUser(res.data.user);
      } else {
        chrome.runtime.sendMessage({ type: 'TRY_AUTO_SYNC_AUTH' }, (sRes) => {
          if (sRes?.success && sRes.data?.user) {
            setCurrentUser(sRes.data.user);
          }
        });
      }
    });

    // Check if user currently has highlighted text on active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (activeTabId) {
        try {
          chrome.scripting.executeScript(
            {
              target: { tabId: activeTabId },
              func: () => window.getSelection()?.toString().trim() || '',
            },
            (results) => {
              if (chrome.runtime.lastError) return;
              const selectedText = results?.[0]?.result;
              if (selectedText && selectedText.length > 1 && selectedText.length < 500) {
                setInputText(selectedText);
                handleExecuteLookup(selectedText);
              }
            }
          );
        } catch {
          // Scripting might be restricted on internal pages, ignore
        }
      }
    });
  }, []);

  const dueCount = cards.filter(isCardDueToday).length;

  const openSidepanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId) {
      // @ts-ignore
      if (chrome.sidePanel && chrome.sidePanel.open) {
        // @ts-ignore
        chrome.sidePanel.open({ windowId: tab.windowId });
      }
    }
    window.close();
  };

  const triggerCapture = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      alert('Không thể kích hoạt tính năng chụp ảnh trên trang hệ thống nội bộ của trình duyệt. Vui lòng thử trên một bài báo hoặc trang web thông thường.');
      return;
    }

    // Try sending message directly, fallback to dynamic script injection if tab was opened before extension reload
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_SCREEN_CROP' }, () => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id! },
            files: ['content.js'],
          },
          () => {
            if (chrome.runtime.lastError) {
              alert('Không thể kích hoạt OCR trên tab này: ' + chrome.runtime.lastError.message);
              return;
            }
            chrome.scripting.insertCSS(
              {
                target: { tabId: tab.id! },
                files: ['content.css'],
              },
              () => {
                setTimeout(() => {
                  chrome.tabs.sendMessage(tab.id!, { type: 'TRIGGER_SCREEN_CROP' });
                  window.close();
                }, 80);
              }
            );
          }
        );
      } else {
        window.close();
      }
    });
  };

  const playSpeech = (text: string, audioUrl?: string) => {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.play().catch(() => playBrowserSpeech(text));
    } else {
      playBrowserSpeech(text);
    }
  };

  const playBrowserSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExecuteLookup = async (textToQuery?: string) => {
    const query = (textToQuery !== undefined ? textToQuery : inputText).trim();
    if (!query) return;

    setTranslating(true);
    setAiAnalyzing(false);
    setTranslateError(null);
    setWordData(null);
    setSyntaxData(null);
    setCardSaved(false);
    setAuthNotice(null);

    const isSentence = query.split(/\s+/).length > 5;

    // Phase 1: Fast Instant Translation (<150ms)
    try {
      const quickRes = await chrome.runtime.sendMessage({
        type: 'QUICK_LOOKUP',
        payload: { text: query, sentence: query },
      });

      if (quickRes?.success && quickRes.data) {
        if (isSentence) {
          setSyntaxData({
            translation_vi: quickRes.data.translation_vi || 'Đang phân tích...',
            clauses: [],
            simplified: '',
            grammar_points: [],
          });
        } else {
          setWordData({
            headword: quickRes.data.headword || query,
            pos: quickRes.data.pos || 'word',
            ipa: quickRes.data.ipa || '',
            meaning_vi: quickRes.data.meaning_vi || 'Đang tra nghĩa...',
            definition_en: quickRes.data.definition_en || '',
            why: '',
            other_meanings: [],
            collocations: [],
            detected_topic: 'Chung',
            audio_url: quickRes.data.audio_url,
            source: 'quick+gemini',
          });
        }
        // UI unblocked instantly!
        setTranslating(false);
        setAiAnalyzing(true);
      }
    } catch (e) {
      console.warn('[LexiLens] Quick lookup error:', e);
    }

    // Phase 2: Deep Context AI Analysis (Gemini)
    try {
      if (isSentence) {
        const res = await chrome.runtime.sendMessage({
          type: 'ANALYZE_SENTENCE_CONTEXT',
          payload: { sentence: query },
        });
        if (res?.success && res.data) {
          setSyntaxData(res.data);
        } else if (!syntaxData) {
          setTranslateError(res?.error || 'Không thể phân tích ngữ pháp.');
        }
      } else {
        const res = await chrome.runtime.sendMessage({
          type: 'ANALYZE_WORD_CONTEXT',
          payload: {
            selection: query,
            sentence: query,
            pageTitle: 'Tra cứu nhanh Popup',
            topic: 'auto',
          },
        });
        if (res?.success && res.data) {
          setWordData(res.data);
        } else if (!wordData) {
          setTranslateError(res?.error || 'Không thể tra cứu từ vựng.');
        }
      }
    } catch (err: any) {
      if (!wordData && !syntaxData) {
        setTranslateError(err?.message || 'Lỗi kết nối extension.');
      }
    } finally {
      setTranslating(false);
      setAiAnalyzing(false);
    }
  };

  const handleSaveCard = async () => {
    if (cardSaved || isSaving) return;
    setIsSaving(true);
    setAuthNotice(null);
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'SAVE_FLASHCARD',
        payload: {
          headword: wordData?.headword || inputText,
          pos: wordData?.pos || (syntaxData ? 'sentence' : 'word'),
          ipa: wordData?.ipa || '',
          meaning_vi: wordData?.meaning_vi || syntaxData?.translation_vi || '',
          definition_en: wordData?.definition_en || '',
          why: wordData?.why || '',
          sentence: inputText,
          article_title: 'Tra cứu nhanh Popup',
          article_url: '',
          topic: wordData?.detected_topic || 'Chung',
          audio_url: wordData?.audio_url,
        },
      });

      if (res?.success) {
        setCardSaved(true);
        // refresh cards
        chrome.runtime.sendMessage({ type: 'GET_CARDS' }, (cRes) => {
          if (cRes?.success) setCards(cRes.data || []);
        });
      } else if (res?.requireAuth) {
        setAuthNotice('⚠️ Bạn cần đăng nhập tài khoản LexiLens để đồng bộ thẻ sang Web App.');
      } else {
        setAuthNotice(res?.error || 'Không thể lưu thẻ.');
      }
    } catch (e: any) {
      setAuthNotice(e.message || 'Lỗi lưu thẻ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{ width: '420px', minWidth: '420px', maxWidth: '420px' }}
      className="p-3.5 space-y-3 font-sans box-border bg-surface text-on-surface"
    >
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-outline-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white font-serif font-bold text-xs">
            L
          </div>
          <div>
            <h1 className="font-serif text-sm font-bold text-primary leading-tight">LexiLens</h1>
            <p className="text-[10px] text-on-surface-variant">Trợ lý đọc hiểu học thuật</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={openSidepanel}
            className="flex items-center gap-1 px-2 py-1 rounded bg-surface-low hover:bg-surface-container text-primary border border-outline-hairline text-xs font-medium cursor-pointer transition-colors"
            title="Mở thanh Sidepanel bên phải"
          >
            <BookOpenIcon size={13} />
            <span>Sidepanel</span>
          </button>
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
            title="Cài đặt API Key"
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>

      {/* API Key Alert Banner if not set */}
      {!settings?.geminiApiKey && (
        <div
          onClick={() => chrome.runtime.openOptionsPage()}
          className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5 cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <AlertCircleIcon size={13} className="flex-shrink-0" />
          <span>Chưa có Gemini API Key. Bấm vào đây để cài đặt miễn phí!</span>
        </div>
      )}

      {/* Account Sync Pill */}
      <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-md bg-surface-low border border-outline-hairline">
        {currentUser ? (
          <div className="flex items-center gap-1.5 text-on-surface truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate font-mono text-[10px]">{currentUser.email}</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded ml-1">Đã đồng bộ</span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-on-surface-variant text-[10px]">Chưa kết nối Web</span>
            <button
              onClick={() => {
                chrome.runtime.sendMessage({ type: 'TRY_AUTO_SYNC_AUTH' }, (sRes) => {
                  if (sRes?.success && sRes.data?.user) {
                    setCurrentUser(sRes.data.user);
                  } else {
                    window.open('https://lexilens-app.vercel.app', '_blank');
                  }
                });
              }}
              className="text-primary font-semibold text-[10px] hover:underline cursor-pointer"
            >
              Đồng bộ từ Web App
            </button>
          </div>
        )}
      </div>

      {authNotice && (
        <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
          <span className="text-[10px] leading-tight">{authNotice}</span>
          <button
            onClick={() => window.open('https://lexilens-app.vercel.app', '_blank')}
            className="text-primary font-bold underline shrink-0 ml-2 text-[10px]"
          >
            Đăng nhập
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-hairline text-xs">
        <button
          onClick={() => setActiveTab('translate')}
          className={`flex-1 py-1.5 text-center font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'translate'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Dịch & Tra cứu
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`flex-1 py-1.5 text-center font-medium border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'review'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span>Ôn tập FSRS</span>
          {dueCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary text-white text-[10px] font-mono">
              {dueCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Dịch & Tra cứu */}
      {activeTab === 'translate' && (
        <div className="space-y-2.5">
          {/* Input Box */}
          <div className="relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExecuteLookup();
                }
              }}
              placeholder="Nhập từ vựng hoặc câu tiếng Anh cần tra (Nhấn Enter để tra)..."
              className="w-full p-2 text-xs border border-outline-hairline rounded-md bg-surface-low focus:bg-surface focus:border-primary focus:outline-none font-serif resize-none"
            />
            {inputText && (
              <button
                onClick={() => {
                  setInputText('');
                  setWordData(null);
                  setSyntaxData(null);
                  setTranslateError(null);
                }}
                className="absolute top-2 right-2 text-on-surface-variant hover:text-on-surface text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExecuteLookup()}
              disabled={translating || !inputText.trim()}
              className="flex-1 py-1.5 px-3 rounded bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <SparklesIcon size={13} className={translating ? 'animate-spin' : ''} />
              <span>{translating ? 'Đang phân tích...' : 'Dịch & Tra cứu'}</span>
            </button>

            <button
              onClick={triggerCapture}
              className="py-1.5 px-2.5 rounded bg-surface-low hover:bg-surface-container text-on-surface border border-outline-hairline text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Chụp ảnh màn hình để tra (Alt+Shift+X)"
            >
              <CropIcon size={13} className="text-primary" />
              <span>OCR</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {translating && (
            <div className="p-4 text-center space-y-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-on-surface-variant font-medium">
                LexiLens AI đang phân tích nghĩa ngữ cảnh & cấu trúc...
              </p>
            </div>
          )}

          {/* Error Message */}
          {translateError && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-800 text-xs">
              {translateError}
            </div>
          )}

          {/* Word Lookup Results */}
          {wordData && !translating && (
            <div className="p-3 rounded-lg bg-surface-low border border-outline-hairline space-y-2.5 text-xs animate-fadeIn">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base font-bold text-primary">
                      {wordData.headword}
                    </span>
                    {wordData.pos && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                        {wordData.pos}
                      </span>
                    )}
                  </div>
                  {wordData.ipa && (
                    <div className="flex items-center gap-1.5 text-secondary text-[11px] font-mono mt-0.5">
                      <span>/{wordData.ipa}/</span>
                      <button
                        onClick={() => playSpeech(wordData.headword, wordData.audio_url)}
                        className="text-primary hover:text-primary-hover cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <VolumeIcon size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Save Flashcard Button */}
                <button
                  onClick={handleSaveCard}
                  disabled={cardSaved || isSaving}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                    cardSaved
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-primary text-white hover:bg-primary-hover'
                  }`}
                >
                  {cardSaved ? <CheckIcon size={12} /> : <BookmarkIcon size={12} />}
                  <span>{cardSaved ? 'Đã lưu' : 'Lưu thẻ'}</span>
                </button>
              </div>

              {/* Contextual Meaning */}
              <div className="p-2 rounded bg-surface border border-outline-hairline space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider block">
                    Nghĩa trong ngữ cảnh
                  </span>
                  {aiAnalyzing && (
                    <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.2 rounded-full font-mono animate-pulse">
                      AI đang phân tích...
                    </span>
                  )}
                </div>
                <p className="font-serif text-sm font-semibold text-primary">
                  {wordData.meaning_vi}
                </p>
                {wordData.definition_en && (
                  <p className="text-[11px] text-on-surface-variant italic">
                    "{wordData.definition_en}"
                  </p>
                )}
              </div>

              {aiAnalyzing && !wordData.why && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 text-primary text-[10px] animate-pulse">
                  <SparklesIcon size={11} className="animate-spin shrink-0" />
                  <span>Gemini AI đang tìm ngữ cảnh & lý do có nghĩa này...</span>
                </div>
              )}

              {/* Why This Meaning */}
              {wordData.why && (
                <div className="p-2 rounded bg-amber-50/70 border border-amber-200/60 text-[11px] text-on-surface">
                  <span className="font-semibold text-primary block mb-0.5">
                    💡 Vì sao có nghĩa này:
                  </span>
                  <p className="leading-relaxed">{wordData.why}</p>
                </div>
              )}
            </div>
          )}

          {/* Sentence Analysis Results */}
          {syntaxData && !translating && (
            <div className="p-3 rounded-lg bg-surface-low border border-outline-hairline space-y-2 text-xs animate-fadeIn">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider block">
                Bản dịch tiếng Việt
              </span>
              <p className="font-serif text-sm font-medium text-primary">
                {syntaxData.translation_vi}
              </p>

              {syntaxData.grammar_points?.length > 0 && (
                <div className="pt-2 border-t border-outline-hairline space-y-1.5">
                  <span className="text-[10px] font-semibold text-secondary block">
                    Cấu trúc ngữ pháp trọng tâm:
                  </span>
                  {syntaxData.grammar_points.slice(0, 3).map((gp, i) => (
                    <div key={i} className="p-1.5 rounded bg-surface text-[11px] text-on-surface-variant">
                      • {gp}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Ôn tập FSRS */}
      {activeTab === 'review' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-surface-low border border-outline-hairline flex items-center justify-between">
            <div>
              <span className="text-[11px] text-secondary font-medium">Thẻ cần ôn hôm nay</span>
              <p className="font-serif text-2xl font-bold text-primary">{dueCount}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-secondary font-medium">Tổng kho từ</span>
              <p className="font-mono text-base font-semibold text-on-surface">{cards.length}</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={openSidepanel}
              className="w-full py-2 px-3 rounded bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <BookOpenIcon size={14} />
              Mở phiên ôn tập trên Sidepanel
            </button>

            <a
              href="https://lexilens-app.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="w-full py-1.5 px-3 rounded bg-surface-low hover:bg-surface-container text-on-surface border border-outline-hairline text-xs font-medium flex items-center justify-center gap-1.5 transition-colors block text-center"
            >
              <ExternalLinkIcon size={13} />
              Mở Web App đầy đủ
            </a>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-outline-hairline text-[10px] text-center text-on-surface-variant font-mono">
        Bôi đen từ trên web để hiện nút tra, hoặc bấm chuột phải chọn "Dịch bằng LexiLens"
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}
