import React, { useState, useEffect } from 'react';
import { Flashcard, ReviewRating, WordLookupResult, SentenceAnalysisResult } from '../types';
import { isCardDueToday } from '../services/fsrs';
import { ExtensionAuthView } from '../components/ExtensionAuthView';
import {
  BookOpenIcon,
  VolumeIcon,
  ExternalLinkIcon,
  RotateCwIcon,
  SettingsIcon,
  CheckIcon,
  CloseIcon,
  TargetIcon,
  HelpCircleIcon,
  SparklesIcon,
  LayersIcon,
  BookmarkIcon,
  AlertCircleIcon,
} from '../components/Icons';

export const SidepanelApp: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [activeTab, setActiveTab] = useState<'translate' | 'study' | 'library'>('translate');
  const [studyIndex, setStudyIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);

  // Translation / Lookup State
  const [inputText, setInputText] = useState<string>('');
  const [sourceSentence, setSourceSentence] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('');
  const [pageUrl, setPageUrl] = useState<string>('');
  const [wordData, setWordData] = useState<WordLookupResult | null>(null);
  const [syntaxData, setSyntaxData] = useState<SentenceAnalysisResult | null>(null);
  const [translating, setTranslating] = useState<boolean>(false);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [cardSaved, setCardSaved] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [showAuthView, setShowAuthView] = useState<boolean>(false);
  const [syncingCards, setSyncingCards] = useState<boolean>(false);

  const loadCards = async () => {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_CARDS' });
      if (res?.success) {
        setCards(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCards();

    // 1. Check user login
    const syncUser = () => {
      chrome.runtime.sendMessage({ type: 'GET_USER' }, (res) => {
        const u = res?.data?.user || res?.data;
        if (res?.success && (u?.id || u?.email)) {
          setCurrentUser(u);
        } else {
          chrome.runtime.sendMessage({ type: 'TRY_AUTO_SYNC_AUTH' }, (sRes) => {
            const su = sRes?.data?.user || sRes?.data;
            if (sRes?.success && (su?.id || su?.email)) {
              setCurrentUser(su);
            } else {
              setCurrentUser(null);
            }
          });
        }
      });
    };
    syncUser();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && 'lexilens_saved_user' in changes) {
        setCurrentUser(changes.lexilens_saved_user.newValue || null);
      }
    };
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    const userInterval = setInterval(syncUser, 2000);

    // 2. Check if there is an active lookup triggered from Context Menu
    chrome.storage.local.get(['lexilens_active_lookup'], (result) => {
      if (result?.lexilens_active_lookup?.text) {
        const item = result.lexilens_active_lookup;
        chrome.storage.local.remove(['lexilens_active_lookup']);
        handleExecuteTranslate(item.text, item.pageTitle, item.pageUrl);
      }
    });

    // 3. Listen to direct runtime message from background
    const messageListener = (msg: any) => {
      if (msg.type === 'SIDEPANEL_TRIGGER_LOOKUP' && msg.payload?.text) {
        handleExecuteTranslate(msg.payload.text, msg.payload.pageTitle, msg.payload.pageUrl);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
      clearInterval(userInterval);
    };
  }, []);

  const handleExecuteTranslate = async (text: string, title = 'Tài liệu', url = '') => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setInputText(cleanText);
    setSourceSentence(cleanText);
    setPageTitle(title);
    setPageUrl(url);
    setActiveTab('translate');
    setTranslating(true);
    setAiAnalyzing(false);
    setTranslateError(null);
    setWordData(null);
    setSyntaxData(null);
    setCardSaved(false);
    setAuthNotice(null);

    const isSentence = cleanText.split(/\s+/).length > 5;

    // Phase 1: Fast Instant Translation (<150ms)
    try {
      const quickRes = await chrome.runtime.sendMessage({
        type: 'QUICK_LOOKUP',
        payload: { text: cleanText, sentence: cleanText },
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
            headword: quickRes.data.headword || cleanText,
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
          payload: { sentence: cleanText },
        });
        if (res?.success && res.data) {
          setSyntaxData(res.data);
        } else if (!syntaxData) {
          setTranslateError(res?.error || 'Không thể phân tích ngữ pháp câu.');
        }
      } else {
        const res = await chrome.runtime.sendMessage({
          type: 'ANALYZE_WORD_CONTEXT',
          payload: {
            selection: cleanText,
            sentence: cleanText,
            pageTitle: title,
            topic: 'auto',
          },
        });
        if (res?.success && res.data) {
          setWordData(res.data);
        } else if (!wordData) {
          setTranslateError(res?.error || 'Lỗi tra cứu từ vựng.');
        }
      }
    } catch (e: any) {
      if (!wordData && !syntaxData) {
        setTranslateError(e.message || 'Lỗi kết nối extension.');
      }
    } finally {
      setTranslating(false);
      setAiAnalyzing(false);
    }
  };

  const handleSaveCardFromPanel = async () => {
    if (cardSaved) return;
    setAuthNotice(null);

    try {
      const payload = {
        headword: wordData?.headword || inputText,
        pos: wordData?.pos || (syntaxData ? 'sentence' : 'word'),
        ipa: wordData?.ipa || '',
        meaning_vi: wordData?.meaning_vi || syntaxData?.translation_vi || '',
        definition_en: wordData?.definition_en || '',
        why: wordData?.why || '',
        sentence: sourceSentence || inputText,
        article_title: pageTitle || 'Trang web',
        article_url: pageUrl || window.location.href,
        topic: wordData?.detected_topic || 'Chung',
        audio_url: wordData?.audio_url,
      };

      const res = await chrome.runtime.sendMessage({
        type: 'SAVE_FLASHCARD',
        payload,
      });

      if (res?.success) {
        setCardSaved(true);
        loadCards();
      } else if (res?.requireAuth) {
        setAuthNotice('⚠️ Bạn cần đăng nhập tài khoản LexiLens để đồng bộ thẻ sang Web App.');
      } else {
        setAuthNotice(res?.error || 'Không thể lưu thẻ.');
      }
    } catch (err: any) {
      setAuthNotice(err.message || 'Lỗi lưu thẻ');
    }
  };

  const dueCards = cards.filter(isCardDueToday);
  const currentCard = dueCards[studyIndex] || null;

  const handleRating = async (rating: ReviewRating) => {
    if (!currentCard) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_CARD_FSRS',
        payload: { cardId: currentCard.id, rating },
      });

      await loadCards();
      setIsFlipped(false);
      if (studyIndex >= dueCards.length - 1) {
        setStudyIndex(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const playCardAudio = (card: Flashcard | { headword: string; audio_url?: string }) => {
    if (card.audio_url) {
      new Audio(card.audio_url).play().catch(() => playSpeech(card.headword));
    } else {
      playSpeech(card.headword);
    }
  };

  const playSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const exportAnkiCsv = () => {
    if (cards.length === 0) {
      alert('Chưa có thẻ từ vựng nào để xuất.');
      return;
    }
    const headers = 'Headword,IPA,Meaning,Sentence,ContextReason,ArticleURL\n';
    const rows = cards
      .map(
        (c) =>
          `"${c.headword}","${c.ipa}","${c.meaning_vi}","${c.sentence.replace(/"/g, '""')}","${c.why.replace(/"/g, '""')}","${c.article_url}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LexiLens_Anki_Deck_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.headword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.meaning_vi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || c.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const topics = Array.from(new Set(cards.map((c) => c.topic).filter(Boolean)));

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface">
      {/* Top Navbar */}
      <header className="px-4 py-3 border-b border-outline-hairline bg-surface-low flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-lg font-bold text-primary tracking-tight">LexiLens</h1>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-secondary border border-outline-hairline">
            Sidepanel
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            title="Cài đặt LexiLens"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </header>

      {/* Account Sync Pill */}
      <div className="flex items-center justify-between text-[11px] px-3.5 py-1.5 bg-surface-low border-b border-outline-hairline">
        {currentUser ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-on-surface truncate max-w-[200px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate font-mono text-[10px]" title={currentUser.email}>
                {currentUser.email}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSyncingCards(true);
                  chrome.runtime.sendMessage({ type: 'MANUAL_SYNC_ALL_CARDS' }, () => {
                    loadCards();
                    setSyncingCards(false);
                  });
                }}
                disabled={syncingCards}
                className="text-[10px] text-primary font-semibold hover:underline cursor-pointer disabled:opacity-50"
              >
                {syncingCards ? 'Đang sync...' : 'Đồng bộ'}
              </button>
              <button
                onClick={() => {
                  chrome.runtime.sendMessage({ type: 'SIGN_OUT' }, () => {
                    setCurrentUser(null);
                  });
                }}
                className="text-[10px] text-on-surface-muted hover:text-red-600 cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-on-surface-variant text-[10px]">Chưa đăng nhập LexiLens</span>
            <button
              onClick={() => {
                chrome.runtime.sendMessage({ type: 'TRY_AUTO_SYNC_AUTH' }, (sRes) => {
                  const su = sRes?.data?.user || sRes?.data;
                  if (sRes?.success && (su?.id || su?.email)) {
                    setCurrentUser(su);
                  } else {
                    setShowAuthView(true);
                  }
                });
              }}
              className="text-primary font-bold text-[10px] hover:underline cursor-pointer bg-primary-tint/30 px-2 py-0.5 rounded border border-primary/20"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}
      </div>

      {showAuthView && (
        <div className="p-3">
          <ExtensionAuthView
            onSuccess={(u) => {
              setCurrentUser(u);
              setShowAuthView(false);
              setAuthNotice(null);
              loadCards();
            }}
            onClose={() => setShowAuthView(false)}
          />
        </div>
      )}

      {authNotice && !showAuthView && (
        <div className="mx-4 mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span className="text-[11px] leading-tight">{authNotice}</span>
          <button
            onClick={() => setShowAuthView(true)}
            className="text-primary font-bold underline shrink-0 ml-2 text-xs cursor-pointer"
          >
            Đăng nhập
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-hairline bg-surface text-xs font-medium">
        <button
          onClick={() => setActiveTab('translate')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'translate'
              ? 'border-b-2 border-primary text-primary font-semibold bg-surface'
              : 'text-on-surface-variant hover:text-on-surface bg-surface-low'
          }`}
        >
          <SparklesIcon size={14} />
          Dịch & Tra cứu
        </button>
        <button
          onClick={() => setActiveTab('study')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'study'
              ? 'border-b-2 border-primary text-primary font-semibold bg-surface'
              : 'text-on-surface-variant hover:text-on-surface bg-surface-low'
          }`}
        >
          <BookOpenIcon size={14} />
          Ôn tập ({dueCards.length})
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'library'
              ? 'border-b-2 border-primary text-primary font-semibold bg-surface'
              : 'text-on-surface-variant hover:text-on-surface bg-surface-low'
          }`}
        >
          <LayersIcon size={14} />
          Kho từ ({cards.length})
        </button>
      </div>

      {/* Tab Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {/* TAB 1: TRANSLATE & LOOKUP */}
        {activeTab === 'translate' && (
          <div className="space-y-4">
            {/* Input Box */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Nhập hoặc bôi đen từ/câu trên trang web:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Gõ từ hoặc câu tiếng Anh..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleExecuteTranslate(inputText);
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-surface-low border border-outline-hairline rounded-lg focus:border-primary outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleExecuteTranslate(inputText)}
                  disabled={translating || !inputText.trim()}
                  className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {translating ? 'Đang dịch...' : 'Dịch'}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {translateError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircleIcon size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <p>{translateError}</p>
                </div>
                {translateError.includes('API Key') && (
                  <button
                    onClick={() => chrome.runtime.openOptionsPage()}
                    className="text-xs font-semibold text-primary underline"
                  >
                    Mở Cài đặt để nhập/kiểm tra Gemini API Key miễn phí
                  </button>
                )}
              </div>
            )}

            {/* Loading Skeleton */}
            {translating && (
              <div className="p-5 rounded-xl border border-outline-hairline bg-surface-low space-y-3 animate-pulse">
                <div className="h-6 bg-surface-container rounded w-1/3" />
                <div className="h-4 bg-surface-container rounded w-1/2" />
                <div className="h-16 bg-surface-container rounded w-full" />
                <div className="h-10 bg-surface-container rounded w-full" />
              </div>
            )}

            {/* Word Lookup Results */}
            {wordData && !translating && (
              <div className="p-4 rounded-xl border border-outline-hairline bg-surface-lowest shadow-academic space-y-3.5 animate-fadeIn">
                <div className="flex items-baseline justify-between border-b border-outline-hairline pb-2.5">
                  <div className="flex items-baseline gap-2">
                    <h2 className="font-serif text-xl font-bold text-primary">
                      {wordData.headword || inputText}
                    </h2>
                    {wordData.pos && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-container text-secondary">
                        {wordData.pos}
                      </span>
                    )}
                    {wordData.ipa && (
                      <span className="font-mono text-xs text-on-surface-variant">
                        {wordData.ipa}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => playCardAudio({ headword: wordData.headword || inputText, audio_url: wordData.audio_url })}
                    className="p-1.5 rounded-full hover:bg-surface-container text-primary transition-colors cursor-pointer"
                    title="Phát âm"
                  >
                    <VolumeIcon size={16} />
                  </button>
                </div>

                {/* In-Context Meaning */}
                <div className="p-3 rounded-lg bg-surface-low border border-outline-hairline space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-bold">
                      Nghĩa trong ngữ cảnh câu:
                    </span>
                    {aiAnalyzing && (
                      <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.2 rounded-full font-mono animate-pulse">
                        AI đang phân tích...
                      </span>
                    )}
                  </div>
                  <p className="font-sans font-bold text-sm text-primary leading-snug">
                    {wordData.meaning_vi}
                  </p>
                </div>

                {aiAnalyzing && !wordData.why && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs animate-pulse">
                    <SparklesIcon size={13} className="animate-spin shrink-0" />
                    <span>Gemini AI đang tìm manh mối ngữ cảnh & cấu trúc chuyên sâu...</span>
                  </div>
                )}

                {/* Context Reason (Why this meaning) */}
                {wordData.why && (
                  <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-hairline/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1">
                      <TargetIcon size={12} /> Manh mối ngữ cảnh:
                    </span>
                    <p className="text-xs text-on-surface leading-relaxed">
                      {wordData.why}
                    </p>
                  </div>
                )}

                {/* English Definition */}
                {wordData.definition_en && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
                      Định nghĩa tiếng Anh:
                    </span>
                    <p className="text-xs text-on-surface-variant italic font-serif leading-relaxed">
                      "{wordData.definition_en}"
                    </p>
                  </div>
                )}

                {/* Collocations */}
                {wordData.collocations && wordData.collocations.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
                      Cụm từ phổ biến (Collocations):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {wordData.collocations.map((col, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[11px] rounded bg-surface-container text-on-surface font-medium"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Meanings */}
                {wordData.other_meanings && wordData.other_meanings.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
                      Các nghĩa thường gặp khác:
                    </span>
                    <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-0.5">
                      {wordData.other_meanings.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Save Flashcard Action */}
                <div className="pt-2 border-t border-outline-hairline">
                  <button
                    type="button"
                    onClick={handleSaveCardFromPanel}
                    disabled={cardSaved}
                    className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                      cardSaved
                        ? 'bg-tertiary text-white cursor-default'
                        : 'bg-primary hover:bg-primary-hover text-white active:scale-98'
                    }`}
                  >
                    {cardSaved ? (
                      <>
                        <CheckIcon size={14} />
                        <span>Đã lưu vào kho thẻ ôn tập FSRS</span>
                      </>
                    ) : (
                      <>
                        <BookmarkIcon size={14} />
                        <span>Lưu thành Flashcard ôn tập (FSRS)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Sentence Analysis Results */}
            {syntaxData && !translating && (
              <div className="p-4 rounded-xl border border-outline-hairline bg-surface-lowest shadow-academic space-y-3.5 animate-fadeIn">
                <div className="border-b border-outline-hairline pb-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-bold">
                    Bản dịch tiếng Việt:
                  </span>
                  <p className="font-sans font-bold text-sm text-primary mt-1">
                    {syntaxData.translation_vi}
                  </p>
                </div>

                {syntaxData.clauses && syntaxData.clauses.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
                      Phân tích các mệnh đề trong câu:
                    </span>
                    <div className="space-y-1.5">
                      {syntaxData.clauses.map((cl, idx) => (
                        <div key={idx} className="p-2 rounded bg-surface-low border border-outline-hairline text-xs">
                          <p className="font-serif font-medium text-on-surface">"{cl.text}"</p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-secondary">
                            <span className="font-mono bg-surface-container px-1 rounded">{cl.type}</span>
                            <span>{cl.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Flashcard Action */}
                <div className="pt-2 border-t border-outline-hairline">
                  <button
                    type="button"
                    onClick={handleSaveCardFromPanel}
                    disabled={cardSaved}
                    className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                      cardSaved
                        ? 'bg-tertiary text-white cursor-default'
                        : 'bg-primary hover:bg-primary-hover text-white active:scale-98'
                    }`}
                  >
                    {cardSaved ? (
                      <>
                        <CheckIcon size={14} />
                        <span>Đã lưu vào kho thẻ ôn tập FSRS</span>
                      </>
                    ) : (
                      <>
                        <BookmarkIcon size={14} />
                        <span>Lưu câu vào kho Flashcard (FSRS)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Instruction helper */}
            {!wordData && !syntaxData && !translating && (
              <div className="text-center py-10 px-2 space-y-2.5 text-on-surface-variant">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mx-auto text-primary">
                  <SparklesIcon size={20} />
                </div>
                <h3 className="font-serif text-sm font-bold text-on-surface">Dịch ngữ cảnh & Tra từ với AI</h3>
                <p className="text-xs max-w-xs mx-auto leading-relaxed">
                  Bôi đen từ trên bất kỳ trang web nào ➔ <strong>chuột phải chọn "Dịch bằng LexiLens"</strong> để tự động mở Side Panel này và nhận giải nghĩa tức thì.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDY MODE */}
        {activeTab === 'study' && (
          dueCards.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-tertiary-tint/40 text-tertiary flex items-center justify-center mx-auto">
                <CheckIcon size={24} />
              </div>
              <h3 className="font-serif text-lg font-bold text-on-surface">Đã hoàn thành ôn tập hôm nay!</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Không còn thẻ nào đến hạn. Thuật toán FSRS sẽ tự động tính toán và nhắc bạn khi đến chu kỳ tối ưu.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('library')}
                  className="px-3.5 py-1.5 bg-surface-low border border-outline-hairline rounded text-xs font-semibold text-primary hover:border-primary cursor-pointer"
                >
                  Xem lại toàn bộ kho từ ({cards.length})
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>
                  Thẻ <strong>{studyIndex + 1}</strong> / {dueCards.length}
                </span>
                <span className="font-mono text-[11px] bg-surface-container px-2 py-0.5 rounded">
                  FSRS Spaced Repetition
                </span>
              </div>

              {currentCard && (
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[280px] p-5 rounded-xl border border-outline-hairline bg-surface-lowest shadow-academic flex flex-col justify-between cursor-pointer transition-all hover:border-primary select-none"
                >
                  <div>
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
                      {isFlipped ? 'Mặt sau — Giải nghĩa & Ngữ cảnh' : 'Mặt trước — Câu gốc'}
                    </span>
                    <p className="font-serif text-base mt-3 leading-relaxed text-on-surface">
                      "{currentCard.sentence}"
                    </p>
                  </div>

                  {isFlipped ? (
                    <div className="space-y-3 pt-4 border-t border-outline-hairline animate-fadeIn">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-serif text-lg font-bold text-primary">
                            {currentCard.headword}
                          </h3>
                          <span className="font-mono text-xs text-on-surface-variant">
                            {currentCard.ipa}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playCardAudio(currentCard);
                          }}
                          className="p-1 rounded hover:bg-surface-container text-primary"
                        >
                          <VolumeIcon size={14} />
                        </button>
                      </div>

                      <div className="p-2.5 rounded bg-surface-low border border-outline-hairline">
                        <p className="text-xs font-bold text-primary">{currentCard.meaning_vi}</p>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          {currentCard.definition_en}
                        </p>
                      </div>

                      {currentCard.why && (
                        <p className="text-xs text-secondary leading-snug">
                          <strong>Manh mối:</strong> {currentCard.why}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-on-surface-variant mt-8">
                      Bấm vào thẻ để lật xem giải nghĩa & phát âm
                    </p>
                  )}
                </div>
              )}

              {/* FSRS Rating Buttons */}
              {isFlipped && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    onClick={() => handleRating(1)}
                    className="p-2 rounded bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-semibold text-center cursor-pointer"
                  >
                    Lại
                    <span className="block text-[10px] font-normal">&lt; 10m</span>
                  </button>
                  <button
                    onClick={() => handleRating(2)}
                    className="p-2 rounded bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-xs font-semibold text-center cursor-pointer"
                  >
                    Khó
                    <span className="block text-[10px] font-normal">1 ngày</span>
                  </button>
                  <button
                    onClick={() => handleRating(3)}
                    className="p-2 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold text-center cursor-pointer"
                  >
                    Tốt
                    <span className="block text-[10px] font-normal">3 ngày</span>
                  </button>
                  <button
                    onClick={() => handleRating(4)}
                    className="p-2 rounded bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold text-center cursor-pointer"
                  >
                    Dễ
                    <span className="block text-[10px] font-normal">7 ngày</span>
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* TAB 3: LIBRARY MODE */}
        {activeTab === 'library' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm từ vựng hoặc nghĩa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-surface-low border border-outline-hairline rounded focus:border-primary outline-none"
              />
            </div>

            {/* Filter by Topic Chips */}
            {topics.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
                <button
                  onClick={() => setSelectedTopic('all')}
                  className={`px-2 py-0.5 text-xs rounded whitespace-nowrap cursor-pointer ${
                    selectedTopic === 'all'
                      ? 'bg-primary text-white font-medium'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Tất cả ({cards.length})
                </button>
                {topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTopic(t)}
                    className={`px-2 py-0.5 text-xs rounded whitespace-nowrap cursor-pointer ${
                      selectedTopic === t
                        ? 'bg-primary text-white font-medium'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Export Anki Button */}
            <div className="flex justify-end">
              <button
                onClick={exportAnkiCsv}
                className="text-xs text-secondary hover:text-primary font-medium flex items-center gap-1 cursor-pointer"
              >
                Xuất file Anki (.CSV)
              </button>
            </div>

            {/* Cards List */}
            <div className="space-y-2">
              {filteredCards.length === 0 ? (
                <p className="text-center py-8 text-xs text-on-surface-variant">
                  Không tìm thấy từ vựng nào.
                </p>
              ) : (
                filteredCards.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-surface-lowest border border-outline-hairline space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <h4 className="font-serif font-bold text-sm text-primary">{c.headword}</h4>
                        <span className="font-mono text-[11px] text-on-surface-variant">{c.ipa}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-secondary">
                        {c.topic}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-on-surface">{c.meaning_vi}</p>
                    <p className="text-xs text-on-surface-variant italic font-serif line-clamp-2">
                      "{c.sentence}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
