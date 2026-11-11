import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle,
  ExternalLink,
  RotateCw,
  HelpCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Flashcard, FSRSRating } from '../types';
import { reviewCard } from '../services/fsrs';

interface StudyDeckViewProps {
  cards: Flashcard[];
  onUpdateCard: (card: Flashcard, rating: FSRSRating) => void;
  onFinish: () => void;
}

export const StudyDeckView: React.FC<StudyDeckViewProps> = ({
  cards,
  onUpdateCard,
  onFinish,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Cards to review
  const reviewDeck = cards.length > 0 ? cards : [];
  const currentCard = reviewDeck[currentIndex];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleRate = (rating: FSRSRating) => {
    if (!currentCard) return;

    const updated = reviewCard(currentCard, rating);
    onUpdateCard(updated, rating);

    if (currentIndex + 1 < reviewDeck.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionCompleted(true);
    }
  };

  const playAudio = (text: string, audioUrl?: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => playSpeech(text));
    } else {
      playSpeech(text);
    }
  };

  const playSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (sessionCompleted || !currentCard) {
    return (
      <div className="max-w-lg mx-auto py-8 sm:py-12 px-4 text-center space-y-4 sm:space-y-5">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-tertiary-tint flex items-center justify-center text-tertiary">
          <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-on-surface">
          Hoàn thành phiên ôn tập!
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-muted font-sans max-w-sm mx-auto">
          Bạn đã rà soát {reviewDeck.length} thẻ theo thuật toán FSRS. Các thẻ tiếp theo sẽ
          được dời sang thời điểm ôn tập tối ưu.
        </p>
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>Quay lại Trang chủ</span>
        </button>
      </div>
    );
  }

  // Cloze mask: Replace headword inside the sentence
  const renderClozeSentence = () => {
    const parts = currentCard.sentence.split(new RegExp(`(${currentCard.headword})`, 'gi'));
    return (
      <p className="font-serif text-base sm:text-lg leading-relaxed text-on-surface">
        {parts.map((part, i) =>
          part.toLowerCase() === currentCard.headword.toLowerCase() ? (
            <span
              key={i}
              className={`font-semibold px-1.5 py-0.5 rounded transition-all inline-block ${
                isFlipped
                  ? 'bg-primary-tint/40 text-primary border-b-2 border-primary'
                  : 'bg-surface-container text-primary/80 border border-outline-hairline font-mono text-sm'
              }`}
            >
              {isFlipped ? part : '[ _____ ]'}
            </span>
          ) : (
            part
          )
        )}
      </p>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-3 sm:space-y-4">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between text-xs font-mono text-on-surface-muted px-1">
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-1 hover:text-on-surface transition-colors py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Thoát phiên</span>
        </button>
        <span>
          Thẻ {currentIndex + 1} / {reviewDeck.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / reviewDeck.length) * 100}%` }}
        />
      </div>

      {/* Interactive Flashcard Card */}
      <div
        onClick={handleFlip}
        className="cursor-pointer select-none rounded-xl bg-surface-lowest border border-outline-hairline p-4 sm:p-6 min-h-[260px] sm:min-h-[320px] flex flex-col justify-between shadow-academic transition-all hover:border-outline active:scale-[0.99]"
      >
        {/* Top bar on card */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-hairline/60">
          <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-muted truncate">
            {isFlipped ? 'Mặt sau — Giải nghĩa' : 'Mặt trước — Đoán từ'}
          </span>
          <span className="text-[11px] text-primary flex items-center gap-1 shrink-0 font-medium">
            <RotateCw className="w-3 h-3 stroke-[1.5]" />
            <span>Chạm để lật</span>
          </span>
        </div>

        {/* Center Content */}
        <div className="my-auto py-4 sm:py-6 space-y-3 sm:space-y-4">
          {renderClozeSentence()}

          {isFlipped && (
            <div className="pt-3 sm:pt-4 border-t border-outline-hairline space-y-2.5 sm:space-y-3 animate-fadeIn">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-primary">
                  {currentCard.headword}
                </h3>
                {currentCard.pos && (
                  <span className="font-mono text-[11px] text-on-surface-muted px-1.5 py-0.2 rounded bg-surface-container">
                    {currentCard.pos}
                  </span>
                )}
                {currentCard.ipa && (
                  <span className="font-mono text-xs sm:text-sm text-secondary">
                    {currentCard.ipa}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentCard.headword, currentCard.audio_url);
                  }}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-muted hover:text-primary transition-colors ml-auto sm:ml-0"
                  title="Phát âm bản xứ"
                >
                  <Volume2 className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Meaning in context */}
              <div className="bg-surface-container/60 p-2.5 sm:p-3 rounded-lg border border-outline-hairline">
                <span className="text-[11px] font-sans text-on-surface-muted block font-medium">
                  Nghĩa trong ngữ cảnh:
                </span>
                <p className="font-sans font-semibold text-sm sm:text-base text-on-surface mt-0.5">
                  {currentCard.meaning_vi}
                </p>
                {currentCard.definition_en && (
                  <p className="text-[11px] sm:text-xs text-on-surface-muted font-sans mt-0.5 italic">
                    "{currentCard.definition_en}"
                  </p>
                )}
              </div>

              {/* Context Clue: Why */}
              {currentCard.why && (
                <div className="flex items-start gap-2 text-xs text-on-surface-muted bg-primary-tint/15 p-2 sm:p-2.5 rounded-md border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="text-primary font-medium">Vì sao nghĩa này: </strong>
                    {currentCard.why}
                  </p>
                </div>
              )}

              {/* Source Article Link */}
              {currentCard.source_article_title && (
                <div className="text-[10px] sm:text-[11px] text-on-surface-muted flex items-center gap-1 truncate pt-0.5">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">Nguồn: {currentCard.source_article_title}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom prompt */}
        {!isFlipped && (
          <div className="text-center text-xs text-on-surface-muted font-sans pt-2 border-t border-outline-hairline/40">
            Chạm vào thẻ để xem đáp án và chấm điểm FSRS
          </div>
        )}
      </div>

      {/* 4 FSRS Rating Action Buttons (2x2 on Mobile, 4 columns on Desktop) */}
      {isFlipped && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-fadeIn">
          <button
            onClick={() => handleRate(1)}
            className="flex items-center sm:flex-col justify-between sm:justify-center py-2.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 transition-colors active:scale-95"
          >
            <span className="font-sans font-semibold text-xs">Again (Lại)</span>
            <span className="font-mono text-[10px] text-red-600 sm:mt-0.5">&lt; 10 phút</span>
          </button>

          <button
            onClick={() => handleRate(2)}
            className="flex items-center sm:flex-col justify-between sm:justify-center py-2.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors active:scale-95"
          >
            <span className="font-sans font-semibold text-xs">Hard (Khó)</span>
            <span className="font-mono text-[10px] text-amber-600 sm:mt-0.5">1 ngày</span>
          </button>

          <button
            onClick={() => handleRate(3)}
            className="flex items-center sm:flex-col justify-between sm:justify-center py-2.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors active:scale-95"
          >
            <span className="font-sans font-semibold text-xs">Good (Tốt)</span>
            <span className="font-mono text-[10px] text-blue-600 sm:mt-0.5">3 ngày</span>
          </button>

          <button
            onClick={() => handleRate(4)}
            className="flex items-center sm:flex-col justify-between sm:justify-center py-2.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors active:scale-95"
          >
            <span className="font-sans font-semibold text-xs">Easy (Dễ)</span>
            <span className="font-mono text-[10px] text-emerald-600 sm:mt-0.5">7 ngày</span>
          </button>
        </div>
      )}
    </div>
  );
};
