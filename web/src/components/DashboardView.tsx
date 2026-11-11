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

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Welcome & Streak Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-surface-container border border-outline-hairline shadow-academic">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
            Học thuật & Trực quan
          </span>
          <h1 className="text-2xl font-serif font-bold text-on-surface mt-1">
            Chào buổi tối, {profile.display_name || 'Học viên'}
          </h1>
          <p className="text-sm text-on-surface-muted font-sans mt-0.5">
            Duy trì nhịp đọc và củng cố trí nhớ dài hạn theo chu kỳ FSRS.
          </p>
        </div>

        {/* Streak & Daily Target Widget */}
        <div className="flex items-center gap-3 bg-surface border border-outline-hairline px-4 py-2.5 rounded-lg">
          <div className="flex items-center gap-1.5 text-primary">
            <Flame className="w-5 h-5 stroke-[2] text-primary" />
            <span className="font-mono font-bold text-lg">{profile.current_streak}</span>
            <span className="text-xs font-sans text-on-surface-muted">ngày streak</span>
          </div>
          <div className="h-6 w-px bg-outline-hairline" />
          <div className="flex items-center gap-1.5 text-secondary">
            <TrendingUp className="w-4 h-4 stroke-[1.5]" />
            <span className="font-mono font-semibold text-sm">
              {Math.min(totalCards, profile.daily_target)}/{profile.daily_target}
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Hero: Start Review Session */}
      <div className="relative overflow-hidden rounded-xl bg-surface-lowest border border-primary/20 p-6 shadow-academic">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-tint/30 text-primary text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Khu vực Ôn tập Hôm nay</span>
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-on-surface">
            {dueCards.length > 0
              ? `Bạn có ${dueCards.length} từ vựng cần ôn lại ngay bây giờ`
              : 'Tuyệt vời! Bạn đã hoàn thành tất cả thẻ đến hạn'}
          </h2>
          <p className="text-sm text-on-surface-muted font-sans mt-2">
            Thuật toán FSRS tính toán thời điểm vàng giúp ngăn chặn đường cong quên lãng
            kèm ngữ cảnh câu văn gốc bạn đã tra khi đọc báo.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={onStartStudy}
              disabled={cards.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-sans font-medium text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Layers className="w-4 h-4 stroke-[1.5]" />
              <span>{dueCards.length > 0 ? 'Bắt đầu phiên học (10 phút)' : 'Ôn tập tự do'}</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5]" />
            </button>

            <button
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-low hover:bg-surface-container text-on-surface font-sans text-sm border border-outline-hairline transition-colors"
            >
              <BookOpen className="w-4 h-4 stroke-[1.5]" />
              <span>Xem kho {totalCards} từ đã lưu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <span className="text-xs font-sans text-on-surface-muted">Cần ôn hôm nay</span>
          <div className="text-2xl font-mono font-bold text-primary mt-1">
            {dueCards.length}
          </div>
          <span className="text-[11px] text-on-surface-muted">thẻ đến hạn</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <span className="text-xs font-sans text-on-surface-muted">Tổng kho từ vựng</span>
          <div className="text-2xl font-mono font-bold text-on-surface mt-1">
            {totalCards}
          </div>
          <span className="text-[11px] text-on-surface-muted">từ đã tra từ bài báo</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <span className="text-xs font-sans text-on-surface-muted">Đã ghi nhớ sâu</span>
          <div className="text-2xl font-mono font-bold text-tertiary mt-1">
            {masteredCards}
          </div>
          <span className="text-[11px] text-on-surface-muted">ôn trên 3 lần</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container border border-outline-hairline">
          <span className="text-xs font-sans text-on-surface-muted">Tỷ lệ nhớ ước tính</span>
          <div className="text-2xl font-mono font-bold text-secondary mt-1">
            {totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0}%
          </div>
          <span className="text-[11px] text-on-surface-muted">theo mô hình FSRS</span>
        </div>
      </div>

      {/* Recent Context Articles */}
      <div className="rounded-xl bg-surface-container border border-outline-hairline p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-base text-on-surface flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary stroke-[1.5]" />
            <span>Nguồn tài liệu tra cứu gần đây</span>
          </h3>
        </div>
        <div className="space-y-2">
          {cards.slice(0, 3).map((card) => (
            <div
              key={card.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface border border-outline-hairline"
            >
              <div className="min-w-0">
                <span className="font-serif font-semibold text-sm text-on-surface">
                  {card.headword}
                </span>
                <span className="ml-2 font-mono text-xs text-on-surface-muted">
                  {card.pos}
                </span>
                <p className="text-xs text-on-surface-muted truncate mt-0.5">
                  "{card.sentence}"
                </p>
              </div>
              <span className="text-[11px] font-sans text-primary whitespace-nowrap bg-primary-tint/20 px-2 py-0.5 rounded border border-primary/20">
                {card.meaning_vi}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
