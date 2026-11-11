import React from 'react';
import {
  Flame,
  Clock,
  Layers,
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Compass,
} from 'lucide-react';
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
  onOpenInstallModal,
}) => {
  const now = new Date();
  const dueCards = cards.filter((c) => new Date(c.due) <= now);
  const totalCards = cards.length;
  const masteredCards = cards.filter((c) => c.reps >= 3).length;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Welcome & Streak Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-xl bg-surface-container border border-outline-hairline shadow-academic">
        <div className="min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            Học thuật & Trực quan
          </span>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-on-surface mt-0.5 truncate">
            Chào {profile.display_name || 'Học viên'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-muted font-sans mt-0.5">
            Củng cố trí nhớ dài hạn theo chu kỳ lặp lại ngắt quãng FSRS.
          </p>
        </div>

        {/* Streak & Daily Target Widget */}
        <div className="flex items-center justify-around sm:justify-start gap-3 bg-surface border border-outline-hairline px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg shrink-0">
          <div className="flex items-center gap-1.5 text-primary">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] text-primary" />
            <span className="font-mono font-bold text-base sm:text-lg">{profile.current_streak}</span>
            <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">ngày streak</span>
          </div>
          <div className="h-5 sm:h-6 w-px bg-outline-hairline" />
          <div className="flex items-center gap-1.5 text-secondary">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.5]" />
            <span className="font-mono font-semibold text-xs sm:text-sm">
              {Math.min(totalCards, profile.daily_target)}/{profile.daily_target}
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Hero: Start Review Session */}
      <div className="relative overflow-hidden rounded-xl bg-surface-lowest border border-primary/20 p-4 sm:p-6 shadow-academic">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-tint/30 text-primary text-xs font-semibold mb-2.5">
            <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Khu vực Ôn tập Hôm nay</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-serif font-bold text-on-surface leading-snug">
            {dueCards.length > 0
              ? `Bạn có ${dueCards.length} từ vựng cần ôn lại ngay bây giờ`
              : 'Tuyệt vời! Bạn đã hoàn thành tất cả thẻ đến hạn'}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-muted font-sans mt-1.5 sm:mt-2 leading-relaxed">
            Thuật toán FSRS tính toán thời điểm vàng giúp ngăn chặn đường cong quên lãng
            kèm ngữ cảnh câu văn gốc bạn đã tra khi đọc báo.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mt-4 sm:mt-5">
            <button
              onClick={onStartStudy}
              disabled={cards.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-sans font-medium text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50"
            >
              <Layers className="w-4 h-4 stroke-[1.5]" />
              <span>{dueCards.length > 0 ? 'Bắt đầu phiên học 10 phút' : 'Ôn tập tự do'}</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5]" />
            </button>

            <button
              onClick={onOpenLibrary}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-low hover:bg-surface-container text-on-surface font-sans text-sm border border-outline-hairline transition-colors active:scale-98 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 stroke-[1.5]" />
              <span>Xem kho {totalCards} từ đã lưu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">Cần ôn hôm nay</span>
          <div className="text-xl sm:text-2xl font-mono font-bold text-primary mt-1">
            {dueCards.length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-on-surface-muted">thẻ đến hạn</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">Tổng kho từ vựng</span>
          <div className="text-xl sm:text-2xl font-mono font-bold text-on-surface mt-1">
            {totalCards}
          </div>
          <span className="text-[10px] sm:text-[11px] text-on-surface-muted">từ đã tra</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">Đã ghi nhớ sâu</span>
          <div className="text-xl sm:text-2xl font-mono font-bold text-tertiary mt-1">
            {masteredCards}
          </div>
          <span className="text-[10px] sm:text-[11px] text-on-surface-muted">ôn trên 3 lần</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <span className="text-[11px] sm:text-xs font-sans text-on-surface-muted">Tỷ lệ nhớ ước tính</span>
          <div className="text-xl sm:text-2xl font-mono font-bold text-secondary mt-1">
            {totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0}%
          </div>
          <span className="text-[10px] sm:text-[11px] text-on-surface-muted">theo mô hình FSRS</span>
        </div>
      </div>

      {/* Recent Context Articles */}
      <div className="rounded-xl bg-surface-container border border-outline-hairline p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-sm sm:text-base text-on-surface flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary stroke-[1.5]" />
            <span>Nguồn tài liệu tra cứu gần đây</span>
          </h3>
        </div>

        <div className="space-y-2.5">
          {cards.length === 0 ? (
            <p className="text-xs text-on-surface-muted italic py-3 text-center">
              Chưa có từ vựng nào. Hãy bấm "Thêm từ mới" ở tab Từ vựng để bắt đầu!
            </p>
          ) : (
            cards.slice(0, 3).map((card) => (
              <div
                key={card.id}
                className="p-3 rounded-lg bg-surface border border-outline-hairline space-y-1.5"
              >
                {/* Header row: Word + POS on left, Meaning badge on right - NEVER OVERLAPS */}
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
                  <span className="text-[11px] font-sans text-primary bg-primary-tint/25 px-2 py-0.5 rounded border border-primary/20 shrink-0 max-w-[55%] truncate text-right">
                    {card.meaning_vi}
                  </span>
                </div>

                {/* Sentence row: cleanly below */}
                {card.root_meaning && (
                  <p className="text-[11px] text-secondary font-sans truncate">
                    <span className="font-semibold">Nghĩa gốc:</span> {card.root_meaning}
                  </p>
                )}
                <p className="text-xs text-on-surface-muted line-clamp-2 leading-relaxed">
                  "{card.sentence}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
