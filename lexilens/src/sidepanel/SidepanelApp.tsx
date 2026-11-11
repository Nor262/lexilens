import React, { useState, useEffect } from 'react';
import { Flashcard, ReviewRating } from '../types';
import { isCardDueToday } from '../services/fsrs';
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
} from '../components/Icons';

export const SidepanelApp: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [activeTab, setActiveTab] = useState<'study' | 'library'>('study');
  const [studyIndex, setStudyIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_CARDS' });
      if (res?.success) {
        setCards(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const dueCards = cards.filter(isCardDueToday);
  const currentCard = dueCards[studyIndex] || null;

  const handleRating = async (rating: ReviewRating) => {
    if (!currentCard) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_CARD_FSRS',
        payload: { cardId: currentCard.id, rating },
      });

      // Reload cards to update FSRS status
      await loadCards();
      setIsFlipped(false);
      if (studyIndex >= dueCards.length - 1) {
        setStudyIndex(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const playCardAudio = (card: Flashcard) => {
    if (card.audio_url) {
      new Audio(card.audio_url).play().catch(() => playSpeech(card.headword));
    } else {
      playSpeech(card.headword);
    }
  };

  const playSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
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
            FSRS
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

      {/* Tabs */}
      <div className="flex border-b border-outline-hairline bg-surface text-xs font-medium">
        <button
          onClick={() => setActiveTab('study')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'study'
              ? 'border-b-2 border-primary text-primary font-semibold bg-surface'
              : 'text-on-surface-variant hover:text-on-surface bg-surface-low'
          }`}
        >
          <BookOpenIcon size={14} />
          Ôn tập hôm nay ({dueCards.length})
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'library'
              ? 'border-b-2 border-primary text-primary font-semibold bg-surface'
              : 'text-on-surface-variant hover:text-on-surface bg-surface-low'
          }`}
        >
          Kho từ ({cards.length})
        </button>
      </div>

      {/* Tab Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'study' ? (
          /* Study Mode */
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
                  className="px-3.5 py-1.5 bg-surface-low border border-outline-hairline rounded text-xs font-semibold text-primary hover:border-primary"
                >
                  Xem lại toàn bộ kho từ ({cards.length})
                </button>
              </div>
            </div>
          ) : currentCard ? (
            <div className="max-w-md mx-auto space-y-4">
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                <span>
                  Thẻ {studyIndex + 1} / {dueCards.length}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-[11px]">
                  {currentCard.topic}
                </span>
              </div>

              {/* Flashcard Box */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="min-h-[260px] p-5 rounded-lg border border-outline-hairline bg-surface-low shadow-academic cursor-pointer flex flex-col justify-between transition-all duration-200 hover:border-primary"
              >
                {!isFlipped ? (
                  /* Front of card */
                  <div className="space-y-4 my-auto text-center">
                    <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                      Đoán nghĩa của từ trong câu sau:
                    </span>
                    <blockquote className="font-serif text-base text-on-surface italic leading-relaxed px-2">
                      "{currentCard.sentence}"
                    </blockquote>
                    <div className="pt-2">
                      <span className="inline-block px-3 py-1 rounded bg-surface text-primary font-serif font-bold text-lg border border-outline-hairline">
                        {currentCard.headword}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant pt-2 flex items-center justify-center gap-1">
                      <RotateCwIcon size={12} /> Bấm để lật thẻ xem nghĩa & phân tích
                    </p>
                  </div>
                ) : (
                  /* Back of card */
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between border-b border-outline-hairline pb-2">
                      <div>
                        <h2 className="font-serif text-xl font-bold text-primary">
                          {currentCard.headword}
                        </h2>
                        <span className="font-mono text-xs text-on-surface-variant">
                          {currentCard.ipa} • {currentCard.pos}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playCardAudio(currentCard);
                        }}
                        className="p-1.5 rounded-full hover:bg-surface-container text-primary"
                        title="Nghe phát âm"
                      >
                        <VolumeIcon size={16} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                          <TargetIcon size={12} /> Nghĩa trong ngữ cảnh:
                        </div>
                        <p className="text-sm font-semibold text-on-surface">{currentCard.meaning_vi}</p>
                        {currentCard.definition_en && (
                          <p className="text-xs text-on-surface-variant italic mt-0.5">
                            "{currentCard.definition_en}"
                          </p>
                        )}
                      </div>

                      {currentCard.why && (
                        <div className="pt-1.5 border-t border-outline-hairline/60">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-secondary">
                            <HelpCircleIcon size={11} /> Lý do chọn nghĩa:
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{currentCard.why}</p>
                        </div>
                      )}
                    </div>

                    {currentCard.article_url && (
                      <div className="pt-2 text-right">
                        <a
                          href={currentCard.article_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-secondary hover:text-primary inline-flex items-center gap-1"
                        >
                          <ExternalLinkIcon size={11} /> Mở bài báo gốc
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FSRS Rating Buttons */}
              {isFlipped ? (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <button
                    onClick={() => handleRating(1)}
                    className="py-2 px-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex flex-col items-center"
                  >
                    <span>Quên</span>
                    <span className="text-[10px] font-mono opacity-80">1 ngày</span>
                  </button>
                  <button
                    onClick={() => handleRating(2)}
                    className="py-2 px-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold flex flex-col items-center"
                  >
                    <span>Khó</span>
                    <span className="text-[10px] font-mono opacity-80">2 ngày</span>
                  </button>
                  <button
                    onClick={() => handleRating(3)}
                    className="py-2 px-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex flex-col items-center"
                  >
                    <span>Nhớ</span>
                    <span className="text-[10px] font-mono opacity-80">4 ngày</span>
                  </button>
                  <button
                    onClick={() => handleRating(4)}
                    className="py-2 px-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex flex-col items-center"
                  >
                    <span>Dễ</span>
                    <span className="text-[10px] font-mono opacity-80">7 ngày</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-2.5 rounded bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Lật thẻ (Space)
                </button>
              )}
            </div>
          ) : null
        ) : (
          /* Library Mode */
          <div className="space-y-3">
            {/* Search & Topic Filters */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Tìm từ vựng hoặc nghĩa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded text-xs bg-surface-low border border-outline-hairline focus:border-primary outline-none"
              />

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedTopic('all')}
                  className={`px-2 py-0.5 text-xs rounded whitespace-nowrap ${
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
                    className={`px-2 py-0.5 text-xs rounded whitespace-nowrap ${
                      selectedTopic === t
                        ? 'bg-primary text-white font-medium'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Anki Button */}
            <div className="flex justify-end">
              <button
                onClick={exportAnkiCsv}
                className="text-xs text-secondary hover:text-primary font-medium flex items-center gap-1"
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
                    className="p-3 rounded-lg bg-surface-low border border-outline-hairline space-y-1.5"
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
