import React, { useState, useEffect } from 'react';
import {
  Volume2,
  CheckCircle,
  ExternalLink,
  RotateCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
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
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [sessionRatings, setSessionRatings] = useState<FSRSRating[]>([]);

  // Filter due cards like extension, or fallback to all cards for free study
  const now = new Date();
  const dueCards = cards.filter((c) => new Date(c.due) <= now);
  const [isFreeStudy, setIsFreeStudy] = useState<boolean>(dueCards.length === 0);

  const reviewDeck = isFreeStudy ? cards : dueCards;
  const currentCard = reviewDeck[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  // Keyboard navigation: Space to flip, Arrows to navigate, 1-4 to rate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, reviewDeck.length]);

  const fireCelebration = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#9a4023', '#ba5838', '#37645c', '#fdddb9', '#10b981'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#9a4023', '#37645c'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ba5838', '#10b981'],
        });
      }, 250);
    } catch {
      // ignore if canvas blocked
    }
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    if (currentIndex + 1 < reviewDeck.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      fireCelebration();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRate = (rating: FSRSRating) => {
    if (!currentCard) return;

    setSessionRatings((prev) => [...prev, rating]);
    const updated = reviewCard(currentCard, rating);
    onUpdateCard(updated, rating);

    setIsFlipped(false);
    if (currentIndex + 1 < reviewDeck.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      fireCelebration();
    }
  };

  const playAudio = (text: string, audioUrl?: string) => {
    setIsPlayingAudio(true);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => playSpeech(text);
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
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  // Empty state: No cards at all
  if (cards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto py-12 px-4 text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-container border border-outline-hairline flex items-center justify-center text-primary shadow-sm">
          <BookOpen className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-on-surface">Chưa có từ vựng cần ôn tập</h2>
        <p className="text-xs sm:text-sm text-on-surface-muted font-sans mt-2 leading-relaxed">
          Kho từ vựng của bạn hiện chưa có thẻ nào. Hãy bôi đen tra từ trên web bằng Chrome Extension hoặc thêm thẻ mới trong mục "Kho từ".
        </p>
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-xs sm:text-sm transition-colors shadow-academic cursor-pointer mt-2"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>Về trang Tổng quan</span>
        </button>
      </motion.div>
    );
  }

  // Completed State
  if (sessionCompleted || !currentCard) {
    const successCount = sessionRatings.filter((r) => r >= 3).length;
    const sessionRetention =
      sessionRatings.length > 0 ? Math.round((successCount / sessionRatings.length) * 100) : 100;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="max-w-md mx-auto py-8 sm:py-14 px-4 text-center space-y-4 sm:space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.15, stiffness: 300, damping: 15 }}
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-md"
        >
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.8]" />
        </motion.div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-on-surface">
            Hoàn thành xuất sắc!
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-muted font-sans max-w-sm mx-auto mt-2 leading-relaxed">
            Bạn đã ôn tập xong <strong>{reviewDeck.length} thẻ</strong>. Thuật toán FSRS đã tự động tính toán khoảng cách ngày tối ưu cho chu kỳ tiếp theo!
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-lowest border border-outline-hairline shadow-academic flex items-center justify-around">
          <div>
            <span className="text-[11px] text-on-surface-muted block font-sans">Đã ôn tập</span>
            <span className="font-mono text-xl font-bold text-primary">{reviewDeck.length}</span>
          </div>
          <div className="h-8 w-px bg-outline-hairline" />
          <div>
            <span className="text-[11px] text-on-surface-muted block font-sans">Khả năng nhớ</span>
            <span className="font-mono text-xl font-bold text-emerald-600">~{sessionRetention}%</span>
          </div>
        </div>

        <button
          onClick={onFinish}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors shadow-academic cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>Về trang Tổng quan</span>
        </button>
      </motion.div>
    );
  }

  // Highlight headword inside sentence cleanly
  const renderSentence = () => {
    if (!currentCard.sentence) return null;
    const parts = currentCard.sentence.split(new RegExp(`(${currentCard.headword})`, 'gi'));
    return (
      <p className="font-serif text-base sm:text-lg leading-relaxed text-on-surface">
        &ldquo;
        {parts.map((part, i) =>
          part.toLowerCase() === currentCard.headword.toLowerCase() ? (
            <span
              key={i}
              className={`font-semibold transition-colors ${
                isFlipped ? 'text-primary underline decoration-primary/40' : 'text-primary'
              }`}
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
        &rdquo;
      </p>
    );
  };

  const progressPercent = ((currentIndex + 1) / reviewDeck.length) * 100;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* 1. Header: Exit & Card Counter */}
      <div className="flex items-center justify-between text-xs text-on-surface-muted px-1">
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-1.5 hover:text-on-surface transition-colors py-1 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Thoát</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-sans font-medium text-on-surface">
            Thẻ <strong>{currentIndex + 1}</strong> / {reviewDeck.length}
          </span>
          <span className="font-mono text-[10px] bg-surface-container px-2 py-0.5 rounded border border-outline-hairline text-on-surface-muted">
            FSRS Spaced Repetition
          </span>
        </div>
      </div>

      {/* 2. Progress Bar */}
      <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3. The Flashcard: Exactly like Extension */}
      <div
        onClick={handleFlip}
        className="min-h-[290px] sm:min-h-[320px] p-5 sm:p-7 rounded-2xl border border-outline-hairline bg-surface-lowest shadow-academic flex flex-col justify-between cursor-pointer transition-all hover:border-primary select-none"
      >
        {/* Card Header & Sentence */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-outline-hairline/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-muted font-semibold">
              {isFlipped ? 'Mặt sau — Giải nghĩa & Ngữ cảnh' : 'Mặt trước — Câu gốc'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isFlipped ? 'Xem câu gốc' : 'Lật thẻ'}</span>
            </button>
          </div>

          <div className="mt-4">{renderSentence()}</div>
        </div>

        {/* Card Body: Flipped Details */}
        {isFlipped ? (
          <div className="space-y-3 pt-4 border-t border-outline-hairline animate-fadeIn">
            {/* Headword, POS, IPA & Audio */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary">
                  {currentCard.headword}
                </h3>
                {currentCard.pos && (
                  <span className="font-mono text-[11px] text-on-surface-muted px-2 py-0.5 rounded bg-surface-container border border-outline-hairline">
                    {currentCard.pos}
                  </span>
                )}
                {currentCard.ipa && (
                  <span className="font-mono text-sm text-secondary">/{currentCard.ipa}/</span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentCard.headword, currentCard.audio_url);
                }}
                className={`p-1.5 rounded-full transition-colors ml-auto cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-primary text-white animate-pulse'
                    : 'hover:bg-surface-container text-on-surface-muted hover:text-primary'
                }`}
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Meaning Box */}
            <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-hairline space-y-1">
              <p className="text-sm font-bold text-primary">{currentCard.meaning_vi}</p>
              {currentCard.definition_en && (
                <p className="text-xs text-on-surface-muted leading-relaxed">
                  {currentCard.definition_en}
                </p>
              )}
            </div>

            {/* Context clue / Why */}
            {currentCard.why && (
              <p className="text-xs text-secondary leading-snug">
                <strong className="text-on-surface font-medium">Manh mối: </strong>
                {currentCard.why}
              </p>
            )}

            {/* Collocations */}
            {currentCard.collocations && currentCard.collocations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-on-surface-muted pt-0.5">
                <span className="font-mono text-[10px] text-secondary uppercase font-semibold">
                  Cụm từ:
                </span>
                {currentCard.collocations.map((col, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-hairline text-[11px] font-sans"
                  >
                    {col}
                  </span>
                ))}
              </div>
            )}

            {/* Source article */}
            {currentCard.source_article_title && (
              <div className="text-[10px] text-on-surface-muted flex items-center gap-1 truncate pt-1 border-t border-outline-hairline/40">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">Nguồn: {currentCard.source_article_title}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-on-surface-muted pt-6">
            Bấm vào thẻ hoặc nút bên dưới để lật xem giải nghĩa & phát âm
          </p>
        )}
      </div>

      {/* 4. Controls below card */}
      {!isFlipped ? (
        <div className="flex items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-lowest hover:bg-surface-container border border-outline-hairline text-xs sm:text-sm font-medium text-on-surface transition-colors disabled:opacity-35 disabled:pointer-events-none cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Thẻ trước</span>
          </button>

          <button
            type="button"
            onClick={handleFlip}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold transition-all shadow-academic cursor-pointer hover:bg-primary-hover"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Lật xem nghĩa</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-lowest hover:bg-surface-container border border-outline-hairline text-xs sm:text-sm font-medium text-on-surface transition-colors cursor-pointer shadow-sm"
          >
            <span>{currentIndex + 1 === reviewDeck.length ? 'Hoàn thành' : 'Thẻ tiếp'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* FSRS Rating Buttons (Exactly like extension) */
        <div className="space-y-2 pt-1 animate-fadeIn">
          <span className="text-[11px] font-sans text-on-surface-muted block text-center font-medium">
            Đánh giá khả năng nhớ theo thuật toán FSRS:
          </span>

          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleRate(1)}
              className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100/90 text-red-900 border border-red-200/80 transition-all shadow-sm text-center cursor-pointer"
            >
              <span className="font-sans font-bold text-xs block">Lại</span>
              <span className="font-mono text-[10px] text-red-600 block mt-0.5">&lt; 10m</span>
            </button>

            <button
              type="button"
              onClick={() => handleRate(2)}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-200/80 transition-all shadow-sm text-center cursor-pointer"
            >
              <span className="font-sans font-bold text-xs block">Khó</span>
              <span className="font-mono text-[10px] text-amber-700 block mt-0.5">1 ngày</span>
            </button>

            <button
              type="button"
              onClick={() => handleRate(3)}
              className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100/90 text-sky-900 border border-sky-200/80 transition-all shadow-sm text-center cursor-pointer"
            >
              <span className="font-sans font-bold text-xs block">Tốt</span>
              <span className="font-mono text-[10px] text-sky-700 block mt-0.5">3 ngày</span>
            </button>

            <button
              type="button"
              onClick={() => handleRate(4)}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200/80 transition-all shadow-sm text-center cursor-pointer"
            >
              <span className="font-sans font-bold text-xs block">Dễ</span>
              <span className="font-mono text-[10px] text-emerald-700 block mt-0.5">7 ngày</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs text-on-surface-muted">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Thẻ trước</span>
            </button>
            <button
              type="button"
              onClick={handleFlip}
              className="text-primary hover:underline cursor-pointer flex items-center gap-1 font-medium"
            >
              <RotateCw className="w-3 h-3" />
              <span>Xem lại câu gốc</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hover:text-on-surface cursor-pointer flex items-center gap-1"
            >
              <span>{currentIndex + 1 === reviewDeck.length ? 'Bỏ qua & Xong' : 'Bỏ qua'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
