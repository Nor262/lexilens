import React, { useState } from 'react';
import {
  Share2,
  CheckCircle,
  LogIn,
  LogOut,
  Target,
  RefreshCw,
  Sparkles,
  Smartphone,
  Shield,
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateTarget: (target: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateTarget,
}) => {
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  const handleSyncWithExtension = () => {
    setSyncing(true);
    setSyncStatus('Đang tìm kiếm Chrome Extension LexiLens trên trình duyệt...');

    // Post message to window for content script / extension bridge
    window.postMessage(
      {
        type: 'LEXILENS_WEB_HANDSHAKE',
        payload: {
          timestamp: Date.now(),
          origin: window.location.origin,
        },
      },
      '*'
    );

    setTimeout(() => {
      setSyncing(false);
      setSyncStatus(
        'Đã phát tín hiệu đồng bộ! Mở tiện ích LexiLens trên Chrome để hoàn tất bắt tay (Handshake).'
      );
    }, 1200);
  };

  const handleLoginGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(`Đăng nhập Google: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-xl mx-auto">
      <div>
        <h2 className="text-xl font-serif font-bold text-on-surface">
          Cài Đặt & Đồng Bộ Hệ Sinh Thái
        </h2>
        <p className="text-xs text-on-surface-muted font-sans">
          Quản lý tài khoản, cầu nối Chrome Extension và chế độ học tập
        </p>
      </div>

      {/* Extension Sync Bridge Card */}
      <div className="p-5 rounded-xl bg-surface-lowest border border-primary/20 shadow-academic space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-tint/40 flex items-center justify-center text-primary shrink-0">
            <Share2 className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-on-surface">
              Cầu nối Đồng bộ với Chrome Extension
            </h3>
            <p className="text-xs text-on-surface-muted font-sans mt-0.5">
              Tự động nhận diện và đồng bộ từ vựng đã tra khi đọc báo trên laptop sang Web App
              điện thoại.
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncWithExtension}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-sans font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 stroke-[1.5] ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Đang đồng bộ...' : 'Kích hoạt Đồng bộ Extension'}</span>
        </button>

        {syncStatus && (
          <div className="p-3 rounded-lg bg-surface-container text-xs text-on-surface-muted font-sans border border-outline-hairline">
            {syncStatus}
          </div>
        )}
      </div>

      {/* Supabase Google Auth Card */}
      <div className="p-5 rounded-xl bg-surface-container border border-outline-hairline space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-tertiary stroke-[1.5]" />
            <div>
              <h4 className="font-serif font-bold text-sm text-on-surface">
                Tài khoản Cloud (Supabase)
              </h4>
              <span className="text-[11px] text-on-surface-muted">
                {profile.email ? profile.email : 'Chế độ Khách (Offline-First lưu trên máy)'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLoginGoogle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-high border border-outline-hairline text-xs font-sans text-on-surface transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Đăng nhập Google</span>
          </button>
        </div>
      </div>

      {/* Daily Target Setting */}
      <div className="p-5 rounded-xl bg-surface-container border border-outline-hairline space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary stroke-[1.5]" />
            <span className="font-serif font-semibold text-sm text-on-surface">
              Mục tiêu ôn tập hàng ngày
            </span>
          </div>
          <span className="font-mono font-bold text-sm text-primary">
            {profile.daily_target} từ/ngày
          </span>
        </div>

        <input
          type="range"
          min="5"
          max="50"
          step="5"
          value={profile.daily_target}
          onChange={(e) => onUpdateTarget(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />

        <div className="flex justify-between text-[11px] text-on-surface-muted font-mono">
          <span>5 từ (Nhẹ nhàng)</span>
          <span>20 từ (Chuẩn)</span>
          <span>50 từ (Cường độ cao)</span>
        </div>
      </div>

      {/* PWA Guidance */}
      <div className="p-4 rounded-xl bg-surface-low border border-outline-hairline text-xs text-on-surface-muted space-y-1.5">
        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
          <Smartphone className="w-4 h-4 text-primary stroke-[1.5]" />
          <span>Cài đặt PWA lên điện thoại</span>
        </div>
        <p className="font-sans">
          Trên Safari (iOS): Bấm <strong>Chia sẻ</strong> ➔ chọn{' '}
          <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
        </p>
        <p className="font-sans">
          Trên Chrome (Android): Bấm menu <strong>3 chấm</strong> ➔ chọn{' '}
          <strong>Cài đặt ứng dụng</strong>.
        </p>
      </div>
    </div>
  );
};
