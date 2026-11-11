import React, { useState } from 'react';
import {
  Search,
  Volume2,
  ExternalLink,
  Download,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  X,
  BookOpen,
} from 'lucide-react';
import { Flashcard } from '../types';
import { lookupWordOnline } from '../services/dictionary';

interface LibraryViewProps {
  cards: Flashcard[];
  onAddCard: (card: Flashcard) => void;
  onDeleteCard: (cardId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  cards,
  onAddCard,
  onDeleteCard,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Add word modal states
  const [inputWord, setInputWord] = useState<string>('');
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookedUpData, setLookedUpData] = useState<Partial<Flashcard> | null>(null);
  const [meaningVi, setMeaningVi] = useState<string>('');
  const [whyReason, setWhyReason] = useState<string>('');
  const [customSentence, setCustomSentence] = useState<string>('');

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

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookedUpData(null);

    try {
      const result = await lookupWordOnline(inputWord, customSentence);
      setLookedUpData(result);
    } catch (err: any) {
      setLookupError(err.message || 'Lỗi tra từ điển');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveNewCard = () => {
    if (!lookedUpData || !inputWord.trim()) return;

    const newCard: Flashcard = {
      id: `card-${Date.now()}`,
      headword: lookedUpData.headword || inputWord.trim().toLowerCase(),
      pos: lookedUpData.pos || 'noun',
      ipa: lookedUpData.ipa || `/${inputWord.trim()}/`,
      audio_url: lookedUpData.audio_url,
      meaning_vi: meaningVi.trim() || 'Nghĩa ngữ cảnh',
      definition_en: lookedUpData.definition_en || '',
      sentence: customSentence.trim() || lookedUpData.sentence || `Example sentence for ${inputWord}.`,
      why: whyReason.trim() || 'Manh mối ngữ cảnh câu văn',
      collocations: lookedUpData.collocations || [],
      due: new Date().toISOString(),
      stability: 1.0,
      difficulty: 5.0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      created_at: new Date().toISOString(),
      source_article_title: 'Tra cứu trực tiếp trên Web App',
      source_article_url: window.location.href,
    };

    onAddCard(newCard);
    setShowAddModal(false);
    setInputWord('');
    setMeaningVi('');
    setWhyReason('');
    setCustomSentence('');
    setLookedUpData(null);
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
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-on-surface">
            Kho Từ Vựng Học Thuật
          </h2>
          <p className="text-[11px] sm:text-xs text-on-surface-muted font-sans">
            Tất cả từ ngữ cảnh ({cards.length} từ) • Đồng bộ thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-sans font-medium transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Thêm từ mới</span>
          </button>

          <button
            onClick={exportToAnkiCSV}
            disabled={cards.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-high border border-outline-hairline text-xs font-sans text-on-surface transition-colors active:scale-95 disabled:opacity-50"
            title="Xuất thẻ ra Anki"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="hidden sm:inline">Xuất file Anki</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-on-surface-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm từ vựng, nghĩa tiếng Việt hoặc câu văn..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-lowest border border-outline-hairline text-xs sm:text-sm text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:border-primary shadow-sm"
        />
      </div>

      {/* Cards List */}
      <div className="space-y-2.5 sm:space-y-3">
        {filteredCards.length === 0 ? (
          <div className="text-center py-12 text-xs sm:text-sm text-on-surface-muted bg-surface-container/30 rounded-xl border border-outline-hairline space-y-2">
            <BookOpen className="w-8 h-8 text-on-surface-muted mx-auto stroke-[1.5] opacity-50" />
            <p>Không tìm thấy từ vựng nào phù hợp.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-primary font-semibold hover:underline text-xs"
            >
              + Bấm vào đây để thêm từ mới
            </button>
          </div>
        ) : (
          filteredCards.map((card) => (
            <div
              key={card.id}
              className="p-3.5 sm:p-4 rounded-xl bg-surface-lowest border border-outline-hairline hover:border-outline shadow-sm space-y-2 transition-all"
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
                    className="p-1 rounded-full hover:bg-surface-container text-on-surface-muted hover:text-primary transition-colors active:scale-95"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] sm:text-[11px] font-mono text-on-surface-muted bg-surface-low px-2 py-0.5 rounded border border-outline-hairline">
                    Reps: {card.reps} • FSRS
                  </span>
                  <button
                    onClick={() => onDeleteCard(card.id)}
                    className="p-1 text-on-surface-muted hover:text-red-600 transition-colors"
                    title="Xóa thẻ"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                </div>
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

      {/* Add New Word Live Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-outline-hairline shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-hairline">
              <h3 className="font-serif font-bold text-base sm:text-lg text-on-surface flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary stroke-[2]" />
                <span>Tra cứu & Thêm Từ vựng Mới</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            {/* Word Lookup Form */}
            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Từ vựng tiếng Anh (Tra cứu Live API):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputWord}
                    onChange={(e) => setInputWord(e.target.value)}
                    placeholder="e.g. eloquent, poignant, resilient..."
                    required
                    className="flex-1 px-3 py-2 rounded-lg bg-surface-lowest border border-outline-hairline text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {lookupLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5 stroke-[2]" />
                    )}
                    <span>Tra từ</span>
                  </button>
                </div>
              </div>

              {lookupError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-800 text-xs border border-red-200">
                  {lookupError}
                </div>
              )}

              {/* Looked up Result Preview */}
              {lookedUpData && (
                <div className="p-3 rounded-lg bg-surface-container border border-outline-hairline space-y-2 animate-fadeIn">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif font-bold text-primary text-base">
                      {lookedUpData.headword}
                    </span>
                    <span className="font-mono text-xs text-on-surface-muted">
                      {lookedUpData.pos}
                    </span>
                    <span className="font-mono text-xs text-secondary">
                      {lookedUpData.ipa}
                    </span>
                    {lookedUpData.audio_url && (
                      <button
                        type="button"
                        onClick={() => playAudio(lookedUpData.headword || '', lookedUpData.audio_url)}
                        className="p-1 rounded hover:bg-surface-high text-primary"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-muted italic">
                    {lookedUpData.definition_en}
                  </p>
                </div>
              )}

              {/* Vietnamese Meaning & Context */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nghĩa tiếng Việt trong ngữ cảnh:
                </label>
                <input
                  type="text"
                  value={meaningVi}
                  onChange={(e) => setMeaningVi(e.target.value)}
                  placeholder="Ví dụ: hùng hồn, lưu loát, giàu sức thuyết phục..."
                  required
                  className="w-full px-3 py-2 rounded-lg bg-surface-lowest border border-outline-hairline text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Câu ví dụ / Ngữ cảnh bài báo:
                </label>
                <textarea
                  value={customSentence}
                  onChange={(e) => setCustomSentence(e.target.value)}
                  placeholder="Câu chứa từ vựng trong bài đọc..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-surface-lowest border border-outline-hairline text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Lý do ngữ cảnh (Vì sao nghĩa này?):
                </label>
                <input
                  type="text"
                  value={whyReason}
                  onChange={(e) => setWhyReason(e.target.value)}
                  placeholder="Ví dụ: Bổ nghĩa cho bài phát biểu trước công chúng..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-lowest border border-outline-hairline text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-high text-xs font-medium text-on-surface transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewCard}
                  disabled={!meaningVi.trim() || !inputWord.trim()}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  Lưu vào kho thẻ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
