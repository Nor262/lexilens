import React from 'react';
import {
  Flame,
  Layers,
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { motion, Variants } from 'motion/react';
import { Flashcard, UserProfile } from '../types';

interface DashboardViewProps {
  cards: Flashcard[];
  profile: UserProfile;
  onStartStudy: () => void;
  onOpenLibrary: () => void;
  onOpenInstallModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cards,
  profile,
  onStartStudy,
  onOpenLibrary,
}) => {
  const now = new Date();
  const dueCards = cards.filter((c) => new Date(c.due) <= now);
  const totalCards = cards.length;
  const masteredCards = cards.filter((c) => c.reps >= 3).length;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden"
    >
      {/* 1. Welcome & Streak Banner */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-surface-lowest border border-outline-hairline shadow-academic"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Học thuật & Trực quan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-on-surface mt-0.5 truncate">
            Chào {profile.display_name || 'Học viên'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-muted font-sans mt-0.5">
            Củng cố trí nhớ dài hạn theo chu kỳ lặp lại ngắt quãng FSRS.
          </p>
        </div>

        {/* Streak & Daily Target Widget */}
        <div className="flex items-center justify-around sm:justify-start gap-3 bg-surface-low border border-outline-hairline px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shrink-0">
          <div className="flex items-center gap-1.5 text-primary">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] text-primary animate-pulse" />
            <span className="font-mono font-bold text-base sm:text-lg">{profile.current_streak}</span>
            <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">ngày streak</span>
          </div>
          <div className="h-5 sm:h-6 w-px bg-outline-hairline" />
          <div className="flex items-center gap-1.5 text-secondary">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]" />
            <span className="font-mono font-semibold text-xs sm:text-sm">
              {Math.min(totalCards, profile.daily_target)}/{profile.daily_target}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Main Action Hero: Start Review Session */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-lowest via-surface-lowest to-primary-tint/15 border border-primary/25 p-5 sm:p-7 shadow-academic"
      >
        <div className="max-w-xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-tint/40 text-primary text-xs font-semibold mb-3 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 stroke-[1.8]" />
            <span>Khu vực Ôn tập Hôm nay</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-on-surface leading-snug">
            {totalCards === 0
              ? 'Kho từ vựng của bạn đang trống'
              : dueCards.length > 0
              ? `Bạn có ${dueCards.length} từ vựng cần ôn lại ngay bây giờ`
              : 'Tuyệt vời! Bạn đã hoàn thành tất cả thẻ đến hạn'}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-muted font-sans mt-2 leading-relaxed">
            {totalCards === 0
              ? 'Hãy bôi đen tra từ trên web bằng Chrome Extension hoặc thêm thẻ mới để kích hoạt thuật toán FSRS ngăn chặn đường cong quên lãng.'
              : 'Thuật toán FSRS tính toán thời điểm vàng giúp ngăn chặn đường cong quên lãng kèm ngữ cảnh câu văn gốc bạn đã tra khi đọc báo.'}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mt-5">
            {totalCards === 0 ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenLibrary}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-sans font-semibold text-sm transition-colors shadow-academic cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 stroke-[1.8]" />
                  <span>Tạo thẻ từ vựng đầu tiên</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.8]" />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onStartStudy}
                  disabled={cards.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-sans font-semibold text-sm transition-colors shadow-academic disabled:opacity-50 cursor-pointer"
                >
                  <Layers className="w-4 h-4 stroke-[1.8]" />
                  <span>{dueCards.length > 0 ? 'Bắt đầu phiên học 10 phút' : 'Ôn tập tự do'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.8]" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenLibrary}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-lowest hover:bg-surface-container text-on-surface font-sans text-sm font-medium border border-outline-hairline transition-colors cursor-pointer shadow-sm"
                >
                  <BookOpen className="w-4 h-4 stroke-[1.8]" />
                  <span>Xem kho {totalCards} từ đã lưu</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* 3. Quick Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="p-3.5 sm:p-4 rounded-xl bg-surface-lowest border border-outline-hairline shadow-academic"
        >
          <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">Cần ôn hôm nay</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-primary mt-1">
            {dueCards.length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-on-surface-muted font-medium">thẻ đến hạn FSRS</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="p-3.5 sm:p-4 rounded-xl bg-surface-lowest border border-outline-hairline shadow-academic"
        >
          <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">Tổng kho từ vựng</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-on-surface mt-1">
            {totalCards}
          </div>
          <span className="text-[10px] sm:text-[11px] text-on-surface-muted font-medium">từ đã tra</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="p-3.5 sm:p-4 rounded-xl bg-surface-lowest border border-outline-hairline shadow-academic"
        >
          <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">Đã ghi nhớ sâu</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-tertiary mt-1">
            {masteredCards}
          </div>
          <span className="text-[10px] sm:text-[11px] text-on-surface-muted font-medium">ôn trên 3 lần</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="p-3.5 sm:p-4 rounded-xl bg-surface-lowest border border-outline-hairline shadow-academic"
        >
          <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">Tỷ lệ nhớ ước tính</span>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-secondary mt-1">
            {totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0}%
          </div>
          <span className="text-[10px] sm:text-[11px] text-on-surface-muted font-medium">mô hình FSRS</span>
        </motion.div>
      </motion.div>

      {/* 4. Recent Context Articles */}
      <motion.div variants={itemVariants} className="rounded-2xl bg-surface-lowest border border-outline-hairline p-4 sm:p-5 shadow-academic">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-sm sm:text-base text-on-surface flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary stroke-[1.8]" />
            <span>Nguồn tài liệu tra cứu gần đây</span>
          </h3>
        </div>

        <div className="space-y-2.5">
          {cards.length === 0 ? (
            <p className="text-xs text-on-surface-muted italic py-3 text-center">
              Chưa có từ vựng nào. Hãy bấm "Thêm từ mới" ở tab Kho từ để bắt đầu!
            </p>
          ) : (
            cards.slice(0, 3).map((card) => (
              <motion.div
                key={card.id}
                whileHover={{ scale: 1.008 }}
                className="p-3 rounded-xl bg-surface-low border border-outline-hairline/80 space-y-1.5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-serif font-bold text-sm sm:text-base text-on-surface truncate">
                      {card.headword}
                    </span>
                    {card.pos && (
                      <span className="font-mono text-[10px] text-on-surface-muted bg-surface-container px-1.5 py-0.5 rounded shrink-0">
                        {card.pos}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-sans text-primary bg-primary-tint/35 px-2 py-0.5 rounded border border-primary/20 shrink-0 max-w-[55%] truncate text-right font-medium">
                    {card.meaning_vi}
                  </span>
                </div>

                {card.root_meaning && (
                  <p className="text-[11px] text-secondary font-sans truncate">
                    <span className="font-semibold">Nghĩa gốc:</span> {card.root_meaning}
                  </p>
                )}
                <p className="text-xs text-on-surface-muted line-clamp-2 leading-relaxed italic">
                  "{card.sentence}"
                </p>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
