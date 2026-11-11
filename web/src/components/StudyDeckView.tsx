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
  onUpdateCard: (card: Flashcard) => void;
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
    onUpdateCard(updated);

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
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-tertiary-tint flex items-center justify-center text-tertiary">
          <CheckCircle className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-on-surface">
          Hoàn thành phiên ôn tập!
        </h2>
        <p className="text-sm text-on-surface-muted font-sans">
          Bạn đã rà soát {reviewDeck.length} thẻ theo thuật toán FSRS. Các thẻ tiếp theo sẽ
          được dời sang thời điểm ôn tập tối ưu để giữ vững độ nhớ dài hạn.
        </p>
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors shadow-sm"
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
      <p className="font-serif text-lg leading-relaxed text-on-surface">
        {parts.map((part, i) =>
          part.toLowerCase() === currentCard.headword.toLowerCase() ? (
            <span
              key={i}
              className={`font-semibold px-1 rounded transition-colors ${
                isFlipped
                  ? 'bg-primary-tint/40 text-primary border-b border-primary'
                  : 'bg-surface-high text-transparent select-none border-b-2 border-outline'
              }`}
            >
              {isFlipped ? part : '_______'}
            </span>
          ) : (
            part
          )
        )}
      </p>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 md:pb-8">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between text-xs font-mono text-on-surface-muted">
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-1 hover:text-on-surface transition-colors"
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
        className="cursor-pointer select-none rounded-xl bg-surface-lowest border border-outline-hairline p-6 min-h-[320px] flex flex-col justify-between shadow-academic transition-all hover:border-outline"
      >
        {/* Top bar on card */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-on-surface-muted">
            {isFlipped ? 'Mặt sau — Giải nghĩa & Ngữ cảnh' : 'Mặt trước — Đoán từ trong ngữ cảnh'}
          </span>
          <span className="text-xs text-on-surface-muted flex items-center gap-1">
            <RotateCw className="w-3 h-3 stroke-[1.5]" />
            <span>Chạm để lật</span>
          </span>
        </div>

        {/* Center Content */}
        <div className="my-auto py-6 space-y-4">
          {renderClozeSentence()}

          {isFlipped && (
            <div className="pt-4 border-t border-outline-hairline space-y-3 animate-fadeIn">
              <div className="flex items-baseline gap-2">
                <h3 className="font-serif font-bold text-2xl text-primary">
                  {currentCard.headword}
                </h3>
                {currentCard.pos && (
                  <span className="font-mono text-xs text-on-surface-muted px-1.5 py-0.5 rounded bg-surface-container">
                    {currentCard.pos}
                  </span>
                )}
                {currentCard.ipa && (
                  <span className="font-mono text-sm text-secondary">
                    {currentCard.ipa}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentCard.headword, currentCard.audio_url);
                  }}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-muted hover:text-primary transition-colors"
                  title="Phát âm bản xứ"
                >
                  <Volume2 className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Meaning in context */}
              <div className="bg-surface-container/60 p-3 rounded-lg border border-outline-hairline">
                <span className="text-xs font-sans text-on-surface-muted block mb-0.5 font-medium">
                  Nghĩa trong ngữ cảnh:
                </span>
                <p className="font-sans font-semibold text-base text-on-surface">
                  {currentCard.meaning_vi}
                </p>
                {currentCard.definition_en && (
                  <p className="text-xs text-on-surface-muted font-sans mt-1 italic">
                    "{currentCard.definition_en}"
                  </p>
                )}
              </div>

              {/* Context Clue: Why */}
              {currentCard.why && (
                <div className="flex items-start gap-2 text-xs text-on-surface-muted bg-primary-tint/15 p-2.5 rounded-md border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-primary font-medium">Vì sao nghĩa này: </strong>
                    {currentCard.why}
                  </p>
                </div>
              )}

              {/* Source Article Link */}
              {currentCard.source_article_title && (
                <div className="text-[11px] text-on-surface-muted flex items-center gap-1 truncate pt-1">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">Nguồn: {currentCard.source_article_title}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom prompt */}
        {!isFlipped && (
          <div className="text-center text-xs text-on-surface-muted font-sans">
            Bấm vào thẻ để xem đáp án và đánh giá ghi nhớ
          </div>
        )}
      </div>

      {/* 4 FSRS Rating Action Buttons (Shown after card flipped) */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-2 pt-2 animate-fadeIn">
          <button
            onClick={() => handleRate(1)}
            className="flex flex-col items-center py-2.5 px-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 transition-colors"
          >
            <span className="font-sans font-semibold text-xs">Again (Lại)</span>
            <span className="font-mono text-[10px] text-red-600 mt-0.5">&lt; 10 phút</span>
          </button>

          <button
            onClick={() => handleRate(2)}
            className="flex flex-col items-center py-2.5 px-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
          >
            <span className="font-sans font-semibold text-xs">Hard (Khó)</span>
            <span className="font-mono text-[10px] text-amber-600 mt-0.5">1 ngày</span>
          </button>

          <button
            onClick={() => handleRate(3)}
            className="flex flex-col items-center py-2.5 px-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors"
          >
            <span className="font-sans font-semibold text-xs">Good (Tốt)</span>
            <span className="font-mono text-[10px] text-blue-600 mt-0.5">3 ngày</span>
          </button>

          <button
            onClick={() => handleRate(4)}
            className="flex flex-col items-center py-2.5 px-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
          >
            <span className="font-sans font-semibold text-xs">Easy (Dễ)</span>
            <span className="font-mono text-[10px] text-emerald-600 mt-0.5">7 ngày</span>
          </button>
        </div>
      )}
    </div>
  );
};
