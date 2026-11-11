import React, { useState, useEffect } from 'react';
import {
  Volume2,
  CheckCircle,
  ExternalLink,
  RotateCw,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
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
  const [direction, setDirection] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Motion drag values
  const dragX = useMotionValue(0);
  const rotateDrag = useTransform(dragX, [-240, 240], [-12, 12]);
  const opacityPrev = useTransform(dragX, [30, 90], [0, 1]);
  const opacityNext = useTransform(dragX, [-30, -90], [0, 1]);

  const reviewDeck = cards.length > 0 ? cards : [];
  const currentCard = reviewDeck[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
    setShowHint(false);
    dragX.set(0);
  }, [currentIndex]);

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
    setDirection(1);
    if (currentIndex + 1 < reviewDeck.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      fireCelebration();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRate = (rating: FSRSRating) => {
    if (!currentCard) return;

    const updated = reviewCard(currentCard, rating);
    onUpdateCard(updated, rating);

    setDirection(1);
    if (currentIndex + 1 < reviewDeck.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      fireCelebration();
    }
  };

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 80;
    const velocityThreshold = 350;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swiped Left -> Next Card
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> Prev Card
      handlePrev();
    } else if (Math.abs(info.offset.x) < 8) {
      // Simple tap -> Flip
      handleFlip();
    }
  };

  const playAudio = (text: string, audioUrl?: string) => {
    setIsPlayingAudio(true);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        playSpeech(text);
      };
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

  if (sessionCompleted || !currentCard) {
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
            Bạn đã ôn tập xong toàn bộ <strong>{reviewDeck.length} thẻ</strong>. Thuật toán FSRS đã tự động tính toán khoảng cách ngày tối ưu cho chu kỳ tiếp theo!
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
            <span className="font-mono text-xl font-bold text-emerald-600">~92%</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onFinish}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors shadow-academic cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>Về trang Tổng quan</span>
        </motion.button>
      </motion.div>
    );
  }

  // Cloze mask: Highlight the headword inside sentence
  const renderClozeSentence = () => {
    const parts = currentCard.sentence.split(new RegExp(`(${currentCard.headword})`, 'gi'));
    return (
      <p className="font-serif text-lg sm:text-xl leading-relaxed text-on-surface">
        {parts.map((part, i) =>
          part.toLowerCase() === currentCard.headword.toLowerCase() ? (
            <span
              key={i}
              className={`font-semibold px-2 py-0.5 rounded transition-all duration-200 inline-block ${
                isFlipped
                  ? 'bg-primary-tint/50 text-primary border-b-2 border-primary shadow-sm'
                  : 'bg-primary/10 text-primary border border-primary/30 font-mono text-base'
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

  const progressPercent = ((currentIndex + 1) / reviewDeck.length) * 100;

  return (
    <div className="max-w-xl mx-auto space-y-3.5 sm:space-y-4">
      {/* 1. Session Progress Header */}
      <div className="flex items-center justify-between text-xs font-mono text-on-surface-muted px-1">
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-1 hover:text-on-surface transition-colors py-1 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Thoát</span>
        </button>
        <span className="font-medium bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-hairline">
          Thẻ {currentIndex + 1} / {reviewDeck.length}
        </span>
      </div>

      {/* 2. Animated Progress Bar */}
      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        />
      </div>

      {/* 3. Interactive 3D Flashcard with Gesture Swipe */}
      <div className="relative overflow-visible py-1">
        {/* Dynamic Swipe Direction Badges */}
        <motion.div
          style={{ opacity: opacityPrev }}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 px-3.5 py-1.5 rounded-full bg-surface-lowest/95 border border-primary text-primary text-xs font-bold shadow-lg flex items-center gap-1.5 pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2]" />
          <span>Thẻ trước</span>
        </motion.div>

        <motion.div
          style={{ opacity: opacityNext }}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-30 px-3.5 py-1.5 rounded-full bg-surface-lowest/95 border border-primary text-primary text-xs font-bold shadow-lg flex items-center gap-1.5 pointer-events-none"
        >
          <span>Thẻ tiếp</span>
          <ChevronRight className="w-4 h-4 stroke-[2]" />
        </motion.div>

        {/* Card Stage with AnimatePresence for transitions */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentCard.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 50, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="w-full perspective-1200"
          >
            {/* Drag Container */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.65}
              style={{ x: dragX, rotate: rotateDrag }}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.01 }}
              className="w-full cursor-grab active:cursor-grabbing select-none"
            >
              {/* 3D Flip Shell */}
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full relative min-h-[380px] sm:min-h-[420px]"
              >
                {/* ================= FRONT FACE ================= */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                  className={`w-full rounded-2xl bg-surface-lowest border border-outline-hairline p-5 sm:p-7 shadow-academic flex flex-col justify-between min-h-[380px] sm:min-h-[420px] transition-colors hover:border-outline ${
                    isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  {/* Top Bar Front */}
                  <div className="flex items-center justify-between pb-3 border-b border-outline-hairline/70">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mặt trước — Đoán từ trong ngữ cảnh</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlip();
                      }}
                      className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 stroke-[1.8]" />
                      <span>Chạm để lật</span>
                    </button>
                  </div>

                  {/* Body Sentence */}
                  <div className="my-auto py-5 space-y-4">
                    {renderClozeSentence()}

                    {/* Hint Toggle */}
                    <div className="pt-2">
                      {!showHint ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-on-surface bg-surface-container/70 hover:bg-surface-container px-3 py-1.5 rounded-lg border border-outline-hairline transition-colors cursor-pointer"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Mở gợi ý nghĩa gốc</span>
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-hairline text-xs text-on-surface-muted"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-primary stroke-[1.5] shrink-0" />
                          <span>
                            <strong className="text-on-surface font-medium">Gợi ý nghĩa gốc: </strong>
                            {currentCard.root_meaning || currentCard.definition_en || currentCard.meaning_vi}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Footer Hint */}
                  <div className="flex items-center justify-between text-[11px] text-on-surface-muted font-sans pt-3 border-t border-outline-hairline/50">
                    <span>Kéo sang trái/phải để chuyển thẻ</span>
                    <span className="text-primary font-medium">Chạm bất kỳ đâu để lật</span>
                  </div>
                </div>

                {/* ================= BACK FACE ================= */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                  className={`absolute inset-0 w-full h-full rounded-2xl bg-surface-lowest border border-outline-hairline p-5 sm:p-7 shadow-academic flex flex-col justify-between overflow-y-auto transition-colors hover:border-outline ${
                    !isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  {/* Top Bar Back */}
                  <div className="flex items-center justify-between pb-3 border-b border-outline-hairline/70">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-semibold">
                      Mặt sau — Giải nghĩa & Ngữ cảnh
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlip();
                      }}
                      className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 stroke-[1.8]" />
                      <span>Xem câu hỏi</span>
                    </button>
                  </div>

                  {/* Word Header */}
                  <div className="py-2 space-y-3">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <h3 className="font-serif font-bold text-2xl sm:text-3xl text-primary">
                        {currentCard.headword}
                      </h3>
                      {currentCard.pos && (
                        <span className="font-mono text-xs text-on-surface-muted px-2 py-0.5 rounded bg-surface-container border border-outline-hairline">
                          {currentCard.pos}
                        </span>
                      )}
                      {currentCard.ipa && (
                        <span className="font-mono text-sm text-secondary">
                          /{currentCard.ipa}/
                        </span>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
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
                        title="Nghe phát âm bản xứ"
                      >
                        <Volume2 className="w-4 h-4 stroke-[1.8]" />
                      </motion.button>
                    </div>

                    {/* Dual Cards: Contextual Meaning & Root Meaning */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {/* Context Meaning */}
                      <div className="bg-primary-tint/25 p-3 rounded-xl border border-primary/30 space-y-1 shadow-sm">
                        <span className="text-[10px] font-sans text-primary font-bold uppercase tracking-wider block">
                          Nghĩa trong ngữ cảnh
                        </span>
                        <p className="font-sans font-bold text-sm sm:text-base text-primary leading-snug">
                          {currentCard.meaning_vi}
                        </p>
                        {currentCard.definition_en && (
                          <p className="text-[11px] text-on-surface-muted italic leading-snug">
                            "{currentCard.definition_en}"
                          </p>
                        )}
                      </div>

                      {/* Root Meaning */}
                      <div className="bg-surface-container/60 p-3 rounded-xl border border-outline-hairline space-y-1">
                        <span className="text-[10px] font-sans text-secondary font-bold uppercase tracking-wider block">
                          Nghĩa gốc phổ thông
                        </span>
                        <p className="font-sans font-medium text-xs sm:text-sm text-on-surface leading-snug">
                          {currentCard.root_meaning || currentCard.definition_en || 'Nghĩa phổ thông của từ.'}
                        </p>
                      </div>
                    </div>

                    {/* Why this meaning */}
                    {currentCard.why && (
                      <div className="flex items-start gap-2 text-xs text-on-surface-muted bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70">
                        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong className="text-primary font-medium">Vì sao nghĩa này: </strong>
                          {currentCard.why}
                        </p>
                      </div>
                    )}

                    {/* Collocations */}
                    {currentCard.collocations && currentCard.collocations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-on-surface-muted pt-1">
                        <span className="font-mono text-[10px] text-secondary uppercase font-semibold">Cụm từ:</span>
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
                  </div>

                  {/* Footer Article Link */}
                  {currentCard.source_article_title && (
                    <div className="text-[10px] text-on-surface-muted flex items-center gap-1 truncate pt-2 border-t border-outline-hairline/50">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">Nguồn: {currentCard.source_article_title}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. Navigation Controls: Back, Flip & Next */}
      <div className="flex items-center justify-between gap-2.5 pt-1">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-lowest hover:bg-surface-container border border-outline-hairline text-xs sm:text-sm font-medium text-on-surface transition-colors disabled:opacity-35 disabled:pointer-events-none cursor-pointer shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2]" />
          <span>Thẻ trước</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={handleFlip}
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold transition-all shadow-academic cursor-pointer hover:bg-primary-hover"
        >
          <RotateCw className="w-3.5 h-3.5 stroke-[2]" />
          <span>{isFlipped ? 'Xem câu hỏi' : 'Lật xem nghĩa'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleNext}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-lowest hover:bg-surface-container border border-outline-hairline text-xs sm:text-sm font-medium text-on-surface transition-colors cursor-pointer shadow-sm"
        >
          <span>{currentIndex + 1 === reviewDeck.length ? 'Hoàn thành' : 'Thẻ tiếp'}</span>
          <ChevronRight className="w-4 h-4 stroke-[2]" />
        </motion.button>
      </div>

      {/* 5. Four FSRS Rating Buttons (animated when flipped) */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="space-y-2 pt-1 overflow-hidden"
          >
            <span className="text-[11px] font-sans text-on-surface-muted block text-center font-medium">
              Đánh giá khả năng nhớ theo thuật toán FSRS:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Rating 1: Quên */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => handleRate(1)}
                className="flex items-center sm:flex-col justify-between sm:justify-center py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100/90 text-red-900 border border-red-200/80 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-sans font-bold text-xs">Quên</span>
                <span className="font-mono text-[10px] text-red-600 sm:mt-0.5">&lt; 10 phút</span>
              </motion.button>

              {/* Rating 2: Khó */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => handleRate(2)}
                className="flex items-center sm:flex-col justify-between sm:justify-center py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-200/80 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-sans font-bold text-xs">Khó</span>
                <span className="font-mono text-[10px] text-amber-700 sm:mt-0.5">1 ngày</span>
              </motion.button>

              {/* Rating 3: Nhớ */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => handleRate(3)}
                className="flex items-center sm:flex-col justify-between sm:justify-center py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100/90 text-sky-900 border border-sky-200/80 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-sans font-bold text-xs">Nhớ</span>
                <span className="font-mono text-[10px] text-sky-700 sm:mt-0.5">3 ngày</span>
              </motion.button>

              {/* Rating 4: Dễ */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => handleRate(4)}
                className="flex items-center sm:flex-col justify-between sm:justify-center py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200/80 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-sans font-bold text-xs">Dễ</span>
                <span className="font-mono text-[10px] text-emerald-700 sm:mt-0.5">7 ngày</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
