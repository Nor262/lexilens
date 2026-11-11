import React, { useState, useEffect } from 'react';
import { WordLookupResult, SentenceAnalysisResult } from '../types';
import {
  VolumeIcon,
  TargetIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  BookmarkIcon,
  CheckIcon,
  CloseIcon,
  CompassIcon,
  PlusIcon,
  LayersIcon,
  AlertCircleIcon,
  SparklesIcon,
} from './Icons';

interface LexiLensPopupProps {
  x: number;
  y: number;
  selection: string;
  sentence: string;
  pageTitle: string;
  onClose: () => void;
  onSaveCard: (data: any) => Promise<any>;
}

export const LexiLensPopup: React.FC<LexiLensPopupProps> = ({
  x,
  y,
  selection,
  sentence,
  pageTitle,
  onClose,
  onSaveCard,
}) => {
  const [topic, setTopic] = useState<string>('auto');
  const [loading, setLoading] = useState<boolean>(true);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [wordData, setWordData] = useState<WordLookupResult | null>(null);
  const [sentenceData, setSentenceData] = useState<SentenceAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'word' | 'syntax'>('word');
  const [showOtherMeanings, setShowOtherMeanings] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [customTopicInput, setCustomTopicInput] = useState<boolean>(false);
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [topicsList, setTopicsList] = useState<string[]>([
    'auto',
    'CNTT & AI',
    'Kinh tế & Tài chính',
    'Học thuật & NCKH',
  ]);

  const isSentenceMode = selection.trim().split(/\s+/).length > 5;

  // 2-Phase Progressive Translation: Instant quick translate first, then deep Gemini AI
  const performLookup = async (selectedTopic: string) => {
    setError(null);
    setAuthNotice(null);
    setLoading(true);

    // ================= STEP 1: Quick Translation (<150ms) =================
    try {
      const quickRes = await chrome.runtime.sendMessage({
        type: 'QUICK_LOOKUP',
        payload: { text: selection, sentence },
      });

      if (quickRes?.success && quickRes.data) {
        if (isSentenceMode) {
          setActiveTab('syntax');
          setSentenceData({
            translation_vi: quickRes.data.translation_vi || 'Đang dịch...',
            clauses: [],
            simplified: '',
            grammar_points: [],
          });
        } else {
          setWordData({
            headword: quickRes.data.headword || selection,
            pos: quickRes.data.pos || 'word',
            ipa: quickRes.data.ipa || '',
            meaning_vi: quickRes.data.meaning_vi || 'Đang tra nghĩa...',
            definition_en: quickRes.data.definition_en || '',
            why: '',
            other_meanings: [],
            collocations: [],
            detected_topic: selectedTopic,
            audio_url: quickRes.data.audio_url,
            source: 'quick+gemini',
          });
        }
        // Immediately stop blocking spinner so user can read meaning right now!
        setLoading(false);
        setAiAnalyzing(true);
      }
    } catch (e) {
      console.warn('[LexiLens] Quick translate error:', e);
    }

    // ================= STEP 2: Deep Context AI Analysis (Gemini) =================
    try {
      if (isSentenceMode) {
        const res = await chrome.runtime.sendMessage({
          type: 'ANALYZE_SENTENCE_CONTEXT',
          payload: { sentence: selection },
        });
        if (res?.success && res.data) {
          setSentenceData(res.data);
        } else if (!sentenceData) {
          setError(res?.error || 'Không thể phân tích ngữ pháp.');
        }
      } else {
        const res = await chrome.runtime.sendMessage({
          type: 'ANALYZE_WORD_CONTEXT',
          payload: {
            selection,
            sentence,
            pageTitle,
            topic: selectedTopic,
          },
        });
        if (res?.success && res.data) {
          setWordData((prev) => ({
            ...res.data,
            audio_url: prev?.audio_url || res.data.audio_url,
          }));
        } else if (!wordData) {
          setError(res?.error || 'Lỗi tra cứu từ vựng.');
        }
      }
    } catch (e: any) {
      if (!wordData && !sentenceData) {
        setError(e.message || 'Lỗi kết nối extension.');
      }
    } finally {
      setLoading(false);
      setAiAnalyzing(false);
    }
  };

  useEffect(() => {
    performLookup(topic);
  }, [topic]);

  // Audio pronunciation handler
  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wordData?.audio_url) {
      const audio = new Audio(wordData.audio_url);
      audio.play().catch(() => playBrowserSpeech(wordData.headword || selection));
    } else {
      playBrowserSpeech(wordData?.headword || selection);
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

  // Save Flashcard action with cloud sync enforcement
  const handleSave = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    setAuthNotice(null);
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'SAVE_FLASHCARD',
        payload: {
          headword: wordData?.headword || selection,
          pos: wordData?.pos || 'word',
          ipa: wordData?.ipa || '',
          meaning_vi: wordData?.meaning_vi || sentenceData?.translation_vi || '',
          root_meaning: wordData?.root_meaning || '',
          definition_en: wordData?.definition_en || '',
          why: wordData?.why || '',
          collocations: wordData?.collocations || [],
          sentence,
          article_title: pageTitle,
          article_url: window.location.href,
          topic: wordData?.detected_topic || topic,
          audio_url: wordData?.audio_url,
        },
      });

      if (res?.success) {
        setIsSaved(true);
      } else if (res?.requireAuth) {
        setAuthNotice(res.error || 'Vui lòng đăng nhập tài khoản để đồng bộ sang Web App!');
      } else {
        alert(res?.error || 'Không thể lưu thẻ.');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const openSidepanelToAuth = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.windowId) {
        // @ts-ignore
        if (chrome.sidePanel && chrome.sidePanel.open) {
          // @ts-ignore
          await chrome.sidePanel.open({ windowId: tab.windowId });
        }
      }
      onClose();
    } catch (e) {
      window.open('https://lexilens-app.vercel.app', '_blank');
    }
  };

  // Prevent popup from going offscreen with fixed coordinates
  const popupWidth = 390;
  const left = Math.min(Math.max(10, x), window.innerWidth - popupWidth - 20);
  const top = Math.max(10, Math.min(window.innerHeight - 500, y + 8));

  return (
    <div
      id="lexilens-popup"
      data-lexilens="true"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${popupWidth}px`,
        zIndex: 2147483647,
        pointerEvents: 'auto',
      }}
      className="bg-surface border border-outline-hairline rounded-lg shadow-academic font-sans text-on-surface text-sm overflow-hidden animate-fadeIn"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Topic Chips & Close */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-outline-hairline bg-surface-low">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {topicsList.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
                topic === t
                  ? 'bg-primary text-white font-medium'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {t === 'auto' ? <CompassIcon size={12} /> : null}
              {t === 'auto' ? 'Tự động' : t}
            </button>
          ))}

          {customTopicInput ? (
            <input
              type="text"
              autoFocus
              placeholder="Chủ đề..."
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTopicName.trim()) {
                  setTopicsList([...topicsList, newTopicName.trim()]);
                  setTopic(newTopicName.trim());
                  setCustomTopicInput(false);
                  setNewTopicName('');
                } else if (e.key === 'Escape') {
                  setCustomTopicInput(false);
                }
              }}
              className="px-1.5 py-0.5 text-xs border border-primary rounded bg-surface outline-none w-20"
            />
          ) : (
            <button
              onClick={() => setCustomTopicInput(true)}
              className="p-1 rounded text-on-surface-variant hover:bg-surface-container cursor-pointer"
              title="Thêm chủ đề"
            >
              <PlusIcon size={12} />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container transition-colors ml-2 cursor-pointer"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      {/* 2. Mode Tabs if sentence analysis is available */}
      {isSentenceMode && (
        <div className="flex border-b border-outline-hairline text-xs font-medium">
          <button
            onClick={() => setActiveTab('syntax')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'syntax'
                ? 'border-b-2 border-primary text-primary bg-surface'
                : 'text-on-surface-variant bg-surface-low'
            }`}
          >
            <LayersIcon size={13} />
            Bản dịch & Ngữ pháp
          </button>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="p-3.5 space-y-3 max-h-[460px] overflow-y-auto">
        {/* Auth Notice Alert if user clicked save without logging in */}
        {authNotice && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-1.5">
              <AlertCircleIcon size={14} className="shrink-0 text-amber-600" />
              <span>{authNotice}</span>
            </div>
            <button
              onClick={openSidepanelToAuth}
              className="px-2 py-1 rounded bg-amber-600 text-white font-semibold text-[11px] shrink-0 hover:bg-amber-700 cursor-pointer"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* AI Analyzing Shimmer Status Badge */}
        {aiAnalyzing && (
          <div className="flex items-center justify-between px-2.5 py-1 rounded-md bg-primary-tint/25 border border-primary/20 text-primary text-[11px] font-medium animate-pulse">
            <span className="flex items-center gap-1.5">
              <SparklesIcon size={12} className="animate-spin" />
              <span>Đã hiện nghĩa nhanh. AI đang phân tích ngữ cảnh...</span>
            </span>
          </div>
        )}

        {loading ? (
          <div className="space-y-2.5 py-2">
            <div className="h-6 bg-surface-container rounded animate-pulse w-2/3" />
            <div className="h-4 bg-surface-container rounded animate-pulse w-full" />
            <div className="h-16 bg-surface-container rounded animate-pulse w-full" />
          </div>
        ) : error ? (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
            <AlertCircleIcon size={15} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Thông báo</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : activeTab === 'syntax' && sentenceData ? (
          /* Sentence & Syntax View */
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
                Bản dịch câu
              </span>
              <p className="text-sm font-medium leading-relaxed bg-surface-low p-2.5 rounded border border-outline-hairline font-serif">
                {sentenceData.translation_vi}
              </p>
            </div>

            {/* Clauses */}
            {sentenceData.clauses?.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1.5">
                  Bóc tách mệnh đề (Clauses)
                </span>
                <div className="space-y-1.5">
                  {sentenceData.clauses.map((c, i) => {
                    const tagStyle =
                      c.type === 'main'
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : c.type === 'relative'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : c.type === 'subordinate'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200';

                    return (
                      <div key={i} className={`p-2 rounded border text-xs leading-relaxed ${tagStyle}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold uppercase text-[10px] tracking-wider">
                            {c.type === 'main'
                              ? 'Mệnh đề chính'
                              : c.type === 'relative'
                              ? 'Mệnh đề quan hệ'
                              : c.type === 'subordinate'
                              ? 'Mệnh đề phụ'
                              : 'Cụm phân từ/rút gọn'}
                          </span>
                          <span className="text-[10px] opacity-80">{c.role}</span>
                        </div>
                        <p className="font-serif italic text-sm">"{c.text}"</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grammar Points */}
            {sentenceData.grammar_points?.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
                  Điểm ngữ pháp trọng tâm
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sentenceData.grammar_points.map((pt, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[11px] border border-outline-hairline"
                    >
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : wordData ? (
          /* Word in Context View */
          <div className="space-y-3">
            {/* Word Header */}
            <div className="flex items-baseline justify-between border-b border-outline-hairline pb-2">
              <div className="flex items-baseline gap-2">
                <h2 className="font-serif text-xl font-bold text-primary tracking-tight">
                  {wordData.headword || selection}
                </h2>
                {wordData.pos && (
                  <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-container text-secondary border border-outline-hairline">
                    {wordData.pos}
                  </span>
                )}
                {wordData.ipa && (
                  <span className="font-mono text-xs text-secondary">
                    /{wordData.ipa}/
                  </span>
                )}
              </div>

              <button
                onClick={playAudio}
                className="p-1.5 rounded-full hover:bg-surface-container text-primary transition-colors cursor-pointer"
                title="Nghe phát âm"
              >
                <VolumeIcon size={16} />
              </button>
            </div>

            {/* Context Card: Meaning & Why this meaning */}
            <div className="p-3 rounded-lg bg-surface-low border border-outline-hairline space-y-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-0.5">
                  <TargetIcon size={13} />
                  <span>NGHĨA TRONG NGỮ CẢNH:</span>
                </div>
                <p className="text-sm font-bold text-on-surface leading-snug">
                  {wordData.meaning_vi}
                </p>
                {wordData.definition_en && (
                  <p className="text-xs text-on-surface-variant italic mt-0.5">
                    "{wordData.definition_en}"
                  </p>
                )}
              </div>

              {wordData.why ? (
                <div className="pt-2 border-t border-outline-hairline/60 animate-fadeIn">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-secondary mb-0.5">
                    <HelpCircleIcon size={12} />
                    <span>Lý do chọn nghĩa này (AI giải thích):</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {wordData.why}
                  </p>
                </div>
              ) : aiAnalyzing ? (
                <div className="pt-1.5 border-t border-outline-hairline/40">
                  <span className="text-[10px] text-on-surface-variant italic">
                    AI đang phân tích câu văn để giải thích ngữ cảnh...
                  </span>
                </div>
              ) : null}
            </div>

            {/* Collocations */}
            {wordData.collocations?.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
                  Cụm từ liên quan (Collocations)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {wordData.collocations.map((col, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-surface-container rounded text-xs text-on-surface border border-outline-hairline font-serif italic"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Other Meanings Accordion */}
            {wordData.other_meanings?.length > 0 && (
              <div className="border border-outline-hairline rounded">
                <button
                  onClick={() => setShowOtherMeanings(!showOtherMeanings)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-on-surface-variant hover:bg-surface-low transition-colors cursor-pointer"
                >
                  <span>Các nghĩa phổ thông khác ({wordData.other_meanings.length})</span>
                  <ChevronDownIcon
                    size={13}
                    className={`transform transition-transform ${showOtherMeanings ? 'rotate-180' : ''}`}
                  />
                </button>
                {showOtherMeanings && (
                  <div className="px-2.5 py-2 border-t border-outline-hairline bg-surface-low text-xs space-y-1">
                    {wordData.other_meanings.map((m, i) => (
                      <p key={i} className="text-on-surface-variant">
                        • {m}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 4. Footer Action: Save Flashcard */}
      <div className="p-3 border-t border-outline-hairline bg-surface-low">
        <button
          onClick={handleSave}
          disabled={loading || isSaved || isSaving}
          className={`w-full py-2 px-3 rounded flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-150 ${
            isSaved
              ? 'bg-tertiary text-white cursor-default'
              : 'bg-primary hover:bg-primary-hover text-white active:scale-[0.98] cursor-pointer'
          }`}
        >
          {isSaved ? (
            <>
              <CheckIcon size={15} />
              Đã lưu & đồng bộ sang Web App!
            </>
          ) : (
            <>
              <BookmarkIcon size={15} />
              {isSaving ? 'Đang lưu & đồng bộ đám mây...' : 'Lưu thẻ Flashcard (Đồng bộ Web)'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
