import React, { useState } from 'react';
import {
  Search,
  Volume2,
  ExternalLink,
  Download,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Flashcard } from '../types';

interface LibraryViewProps {
  cards: Flashcard[];
}

export const LibraryView: React.FC<LibraryViewProps> = ({ cards }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCards = cards.filter(
    (card) =>
      card.headword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.meaning_vi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.sentence.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const playAudio = (text: string, audioUrl?: string) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => playSpeech(text));
    } else {
      playSpeech(text);
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

  const exportToAnkiCSV = () => {
    if (cards.length === 0) return;
    const header = 'Headword\tIPA\tPOS\tMeaning (VI)\tDefinition (EN)\tSentence\tWhy\n';
    const rows = cards
      .map(
        (c) =>
          `"${c.headword}"\t"${c.ipa || ''}"\t"${c.pos || ''}"\t"${c.meaning_vi}"\t"${
            c.definition_en || ''
          }"\t"${c.sentence}"\t"${c.why || ''}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lexilens-anki-deck-${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-on-surface">
            Kho Từ Vựng Học Thuật
          </h2>
          <p className="text-[11px] sm:text-xs text-on-surface-muted font-sans">
            Tất cả từ ngữ cảnh đã tra cứu và lưu từ bài báo ({cards.length} từ)
          </p>
        </div>

        <button
          onClick={exportToAnkiCSV}
          disabled={cards.length === 0}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-high border border-outline-hairline text-xs font-sans text-on-surface transition-colors active:scale-98"
        >
          <Download className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Xuất file Anki (.txt)</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-on-surface-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm từ vựng, nghĩa tiếng Việt hoặc câu văn..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-lowest border border-outline-hairline text-sm text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:border-primary shadow-sm"
        />
      </div>

      {/* Cards List */}
      <div className="space-y-2.5 sm:space-y-3">
        {filteredCards.length === 0 ? (
          <div className="text-center py-10 text-xs sm:text-sm text-on-surface-muted bg-surface-container/40 rounded-xl border border-outline-hairline">
            Không tìm thấy từ vựng nào phù hợp.
          </div>
        ) : (
          filteredCards.map((card) => (
            <div
              key={card.id}
              className="p-3.5 sm:p-4 rounded-xl bg-surface-lowest border border-outline-hairline hover:border-outline shadow-sm space-y-2 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                  <span className="font-serif font-bold text-base sm:text-lg text-primary">
                    {card.headword}
                  </span>
                  {card.pos && (
                    <span className="font-mono text-[10px] text-on-surface-muted bg-surface-container px-1.5 py-0.2 rounded">
                      {card.pos}
                    </span>
                  )}
                  {card.ipa && (
                    <span className="font-mono text-xs text-secondary">
                      {card.ipa}
                    </span>
                  )}
                  <button
                    onClick={() => playAudio(card.headword, card.audio_url)}
                    className="p-1 rounded-full hover:bg-surface-container text-on-surface-muted hover:text-primary transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>

                <span className="text-[10px] sm:text-[11px] font-mono text-on-surface-muted bg-surface-low px-2 py-0.5 rounded border border-outline-hairline shrink-0">
                  Reps: {card.reps} • FSRS
                </span>
              </div>

              {/* Meaning & Definition */}
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-on-surface mr-1.5">
                  {card.meaning_vi}
                </span>
                {card.definition_en && (
                  <span className="text-xs text-on-surface-muted font-sans italic">
                    — {card.definition_en}
                  </span>
                )}
              </div>

              {/* Context Sentence */}
              <p className="text-xs text-on-surface-muted font-sans bg-surface-low p-2 rounded-md border border-outline-hairline/60 leading-relaxed">
                "{card.sentence}"
              </p>

              {/* Why & Article */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5 text-[11px] text-on-surface-muted">
                {card.why && (
                  <div className="flex items-start gap-1 text-primary">
                    <Sparkles className="w-3 h-3 stroke-[1.5] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{card.why}</span>
                  </div>
                )}
                {card.source_article_title && (
                  <div className="flex items-center gap-1 text-on-surface-muted shrink-0">
                    <ExternalLink className="w-3 h-3 stroke-[1.5] shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-xs">{card.source_article_title}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
