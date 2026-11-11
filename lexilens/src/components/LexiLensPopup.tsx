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
} from './Icons';

interface LexiLensPopupProps {
  x: number;
  y: number;
  selection: string;
  sentence: string;
  pageTitle: string;
  onClose: () => void;
  onSaveCard: (data: any) => Promise<boolean>;
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
  const [error, setError] = useState<string | null>(null);
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

  // Fetch Lookup Data
  const performLookup = async (selectedTopic: string) => {
    setLoading(true);
    setError(null);
    try {
      if (isSentenceMode) {
        setActiveTab('syntax');
        const res = await chrome.runtime.sendMessage({
          type: 'ANALYZE_SENTENCE',
          payload: { sentence: selection },
        });
        if (res.success) {
          setSentenceData(res.data);
        } else {
          setError(res.error || 'Không thể phân tích ngữ pháp.');
        }
      } else {
        const res = await chrome.runtime.sendMessage({
          type: 'LOOKUP_WORD',
          payload: {
            selection,
            sentence,
            pageTitle,
            topic: selectedTopic,
          },
        });
        if (res.success) {
          setWordData(res.data);
        } else {
          setError(res.error || 'Lỗi tra cứu từ vựng.');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi kết nối extension.');
    } finally {
      setLoading(false);
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

  // Save Flashcard action
  const handleSave = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    try {
      const success = await onSaveCard({
        headword: wordData?.headword || selection,
        pos: wordData?.pos || 'word',
        ipa: wordData?.ipa || '',
        meaning_vi: wordData?.meaning_vi || sentenceData?.translation_vi || '',
        definition_en: wordData?.definition_en || '',
        why: wordData?.why || '',
        sentence,
        article_title: pageTitle,
        article_url: window.location.href,
        topic: wordData?.detected_topic || topic,
        audio_url: wordData?.audio_url,
      });
      if (success) setIsSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
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
              className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors whitespace-nowrap ${
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
              className="p-1 rounded text-on-surface-variant hover:bg-surface-container"
              title="Thêm chủ đề"
            >
              <PlusIcon size={12} />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container transition-colors ml-2"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      {/* 2. Mode Tabs if sentence analysis is available */}
      {isSentenceMode && (
        <div className="flex border-b border-outline-hairline text-xs font-medium">
          <button
            onClick={() => setActiveTab('syntax')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 ${
              activeTab === 'syntax'
                ? 'border-b-2 border-primary text-primary bg-surface'
                : 'text-on-surface-variant bg-surface-low'
            }`}
          >
            <LayersIcon size={13} />
            Phân tích cú pháp
          </button>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="p-3.5 space-y-3 max-h-[460px] overflow-y-auto">
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
                Bản dịch học thuật
              </span>
              <p className="text-sm font-medium leading-relaxed bg-surface-low p-2.5 rounded border border-outline-hairline">
                {sentenceData.translation_vi}
              </p>
            </div>

            {/* Clauses */}
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1.5">
                Bóc tách mệnh đề (Clauses)
              </span>
              <div className="space-y-1.5">
                {sentenceData.clauses?.map((c, i) => {
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

            {/* Grammar Points */}
            {sentenceData.grammar_points?.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
                  Điểm ngữ pháp đáng chú ý
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
                <h2 className="font-serif text-xl font-bold text-on-surface tracking-tight">
                  {wordData.headword || selection}
                </h2>
                {wordData.pos && (
                  <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-container text-secondary border border-outline-hairline">
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
                onClick={playAudio}
                className="p-1.5 rounded-full hover:bg-surface-container text-primary transition-colors cursor-pointer"
                title="Phát âm"
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
                <p className="text-sm font-semibold text-on-surface leading-snug">
                  {wordData.meaning_vi}
                </p>
                {wordData.definition_en && (
                  <p className="text-xs text-on-surface-variant italic mt-0.5">
                    "{wordData.definition_en}"
                  </p>
                )}
              </div>

              {wordData.why && (
                <div className="pt-2 border-t border-outline-hairline/60">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-secondary mb-0.5">
                    <HelpCircleIcon size={12} />
                    <span>Lý do chọn nghĩa này:</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {wordData.why}
                  </p>
                </div>
              )}
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
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-on-surface-variant hover:bg-surface-low transition-colors"
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
              Đã lưu vào kho Flashcard (FSRS)
            </>
          ) : (
            <>
              <BookmarkIcon size={15} />
              {isSaving ? 'Đang lưu...' : 'Lưu vào kho ôn tập (Spaced Repetition)'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
