import React from 'react';
import {
  BarChart2,
  Calendar,
  Flame,
  CheckCircle2,
  Brain,
  Award,
} from 'lucide-react';
import { Flashcard, ReviewLog, UserProfile } from '../types';
import { calculateDynamicStats } from '../services/supabase';

interface StatsViewProps {
  cards: Flashcard[];
  reviews: ReviewLog[];
  profile: UserProfile;
}

export const StatsView: React.FC<StatsViewProps> = ({ cards, reviews, profile }) => {
  const newCards = cards.filter((c) => c.state === 0 || c.reps === 0).length;
  const learningCards = cards.filter((c) => c.state === 1 || (c.reps > 0 && c.reps < 3)).length;
  const reviewCards = cards.filter((c) => c.state === 2 || c.reps >= 3).length;

  // Compute completely dynamic metrics from actual user review logs
  const { streak, retention, totalReviews, heatmapDays } = calculateDynamicStats(cards, reviews);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-serif font-bold text-on-surface">
          Thống Kê Trí Nhớ & Tiến Độ Học
        </h2>
        <p className="text-[11px] sm:text-xs text-on-surface-muted font-sans">
          {totalReviews > 0
            ? `Dữ liệu thống kê thực tế tính toán từ ${totalReviews} lượt ôn tập theo mô hình FSRS`
            : 'Chưa có lượt ôn tập nào. Hãy bắt đầu ôn tập thẻ để hệ thống tính toán tỷ lệ nhớ FSRS.'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <Flame className="w-4 h-4 stroke-[2]" />
            <span>Chuỗi Streak Thực</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-on-surface mt-1">
            {streak} <span className="text-[11px] font-sans text-on-surface-muted">ngày</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <div className="flex items-center gap-1.5 text-tertiary text-xs font-semibold">
            <Brain className="w-4 h-4 stroke-[1.5]" />
            <span>Tỷ Lệ Nhớ Thực Tế</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-on-surface mt-1">
            {retention}% <span className="text-[11px] font-sans text-on-surface-muted">retention</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <div className="flex items-center gap-1.5 text-secondary text-xs font-semibold">
            <Award className="w-4 h-4 stroke-[1.5]" />
            <span>Mục Tiêu Ngày</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-on-surface mt-1">
            {profile.daily_target} <span className="text-[11px] font-sans text-on-surface-muted">từ/ngày</span>
          </div>
        </div>
      </div>

      {/* GitHub-style Heatmap */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-lowest border border-outline-hairline shadow-academic space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-serif font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5 sm:gap-2">
            <Calendar className="w-4 h-4 text-primary stroke-[1.5]" />
            <span>Mức độ chuyên cần (12 tuần qua)</span>
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono text-on-surface-muted">
            Tổng: {totalReviews} lượt ôn tập
          </span>
        </div>

        {/* Heatmap Grid with horizontal scroll on mobile */}
        <div className="overflow-x-auto pb-1.5 pt-0.5 -mx-1 px-1">
          <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
            {heatmapDays.map((d) => {
              let bg = 'bg-surface-high';
              if (d.count === 1) bg = 'bg-primary-tint/60';
              if (d.count === 2) bg = 'bg-primary/50';
              if (d.count >= 3) bg = 'bg-primary';

              return (
                <div
                  key={d.dayIndex}
                  title={`${d.date}: ${d.count} lượt ôn tập`}
                  className={`w-3 h-3 rounded-sm ${bg} transition-colors`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-on-surface-muted font-mono pt-1 border-t border-outline-hairline/60">
          <span className="sm:hidden text-primary">← Vuốt ngang xem đủ 12 tuần →</span>
          <span className="hidden sm:inline">Chu kỳ 12 tuần</span>
          <div className="flex items-center gap-1 ml-auto">
            <span>Ít</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-surface-high" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary-tint/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/50" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span>Nhiều</span>
          </div>
        </div>
      </div>

      {/* Mastery Breakdown */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-outline-hairline space-y-3.5">
        <h3 className="font-serif font-bold text-xs sm:text-sm text-on-surface">
          Phân bố trạng thái ghi nhớ ({cards.length} từ)
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-sans mb-1">
              <span className="text-on-surface">Đã thành thạo (Review / Reps ≥ 3)</span>
              <span className="font-mono font-semibold text-tertiary">{reviewCards} thẻ</span>
            </div>
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-tertiary transition-all"
                style={{ width: `${cards.length > 0 ? (reviewCards / cards.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-sans mb-1">
              <span className="text-on-surface">Đang học & Củng cố (Learning)</span>
              <span className="font-mono font-semibold text-primary">{learningCards} thẻ</span>
            </div>
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${cards.length > 0 ? (learningCards / cards.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-sans mb-1">
              <span className="text-on-surface">Mới thêm từ bài báo (New)</span>
              <span className="font-mono font-semibold text-secondary">{newCards} thẻ</span>
            </div>
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary transition-all"
                style={{ width: `${cards.length > 0 ? (newCards / cards.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
