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
  Key,
  RotateCcw,
  Mail,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateTarget: (target: number) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateTarget,
  onResetData,
}) => {
  const [geminiKey, setGeminiKey] = useState<string>(
    localStorage.getItem('lexilens_gemini_key') || ''
  );
  const [keySaved, setKeySaved] = useState<boolean>(false);

  // Email / Password Login state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('lexilens_gemini_key', geminiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  // Google OAuth Login
  const handleLoginGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        if (error.message.includes('not enabled') || error.message.includes('validation_failed')) {
          setAuthError(
            'Google OAuth chưa được bật trên Supabase Dashboard. Vui lòng sử dụng tính năng Đăng nhập Email hoặc bật Google Provider trong Supabase.'
          );
          setShowAuthModal(true);
        } else {
          alert(`Đăng nhập Google: ${error.message}`);
        }
      }
    } catch (err: any) {
      setAuthError(err.message);
      setShowAuthModal(true);
    }
  };

  // Email / Password Auth handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
      }
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi đăng nhập/đăng ký.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto w-full overflow-hidden">
      <div>
        <h2 className="text-lg sm:text-xl font-serif font-bold text-on-surface">
          Cài Đặt & Đồng Bộ Hệ Sinh Thái
        </h2>
        <p className="text-[11px] sm:text-xs text-on-surface-muted font-sans">
          Quản lý tài khoản, cầu nối Chrome Extension và chế độ học tập
        </p>
      </div>

      {/* Tài khoản & Trạng thái đồng bộ */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-lowest border border-outline-hairline shadow-academic space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-tint/30 flex items-center justify-center text-primary shrink-0">
              <Shield className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-serif font-bold text-sm sm:text-base text-on-surface">
                  {profile.display_name || 'Học viên'}
                </h4>
                {profile.email && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đã đồng bộ
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-muted font-mono truncate mt-0.5">
                {profile.email || 'Chế độ khách (Chưa đăng nhập)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {profile.email ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-high border border-outline-hairline text-xs font-sans text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Đăng xuất</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-sans font-medium transition-colors shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gemini API Key Configuration */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-lowest border border-outline-hairline space-y-3 shadow-academic">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary stroke-[1.5]" />
          <h4 className="font-serif font-bold text-sm text-on-surface">
            Google Gemini API Key (Tùy chọn)
          </h4>
        </div>
        <p className="text-xs text-on-surface-muted font-sans">
          Nhập key miễn phí từ Google AI Studio để mở khóa dịch nghĩa ngữ cảnh AI trực tiếp trên Web.
        </p>

        <form onSubmit={handleSaveKey} className="flex gap-2">
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="flex-1 px-3 py-2 rounded-lg bg-surface-lowest border border-outline-hairline text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-high border border-outline-hairline text-xs font-medium text-on-surface transition-colors shrink-0"
          >
            {keySaved ? 'Đã lưu!' : 'Lưu Key'}
          </button>
        </form>
      </div>

      {/* Daily Target Setting */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-container border border-outline-hairline space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary stroke-[1.5]" />
            <span className="font-serif font-semibold text-xs sm:text-sm text-on-surface">
              Mục tiêu ôn tập hàng ngày
            </span>
          </div>
          <span className="font-mono font-bold text-xs sm:text-sm text-primary">
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
          className="w-full accent-primary cursor-pointer h-2 bg-surface rounded-lg"
        />

        <div className="flex justify-between text-[10px] sm:text-[11px] text-on-surface-muted font-mono">
          <span>5 từ (Nhẹ)</span>
          <span>20 từ (Chuẩn)</span>
          <span>50 từ (Cao độ)</span>
        </div>
      </div>

      {/* Reset Data Button */}
      <div className="pt-2">
        <button
          onClick={onResetData}
          className="w-full py-2.5 px-4 rounded-lg bg-surface hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-medium border border-outline-hairline hover:border-red-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Đặt lại dữ liệu học tập ban đầu</span>
        </button>
      </div>

      {/* Account Login Modal (Supabase Auth) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-hairline shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-hairline">
              <h3 className="font-serif font-bold text-base text-on-surface flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary stroke-[1.5]" />
                <span>{authMode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản'}</span>
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-on-surface-muted hover:text-on-surface text-sm"
              >
                Đóng
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{authError}</p>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Email học viên:
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="student@university.edu.vn"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-surface-lowest border border-outline-hairline text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Mật khẩu:
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-surface-lowest border border-outline-hairline text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {authLoading ? 'Đang xử lý...' : authMode === 'login' ? 'Đăng Nhập' : 'Đăng Ký Ngay'}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-on-surface-muted border-t border-outline-hairline flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-primary hover:underline font-medium"
              >
                {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
              </button>

              <button
                type="button"
                onClick={handleLoginGoogle}
                className="text-secondary hover:underline font-medium"
              >
                Thử Google OAuth
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
