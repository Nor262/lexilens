import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Sparkles, Lock, Mail, User, ArrowRight, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';

interface AuthGateViewProps {
  onAuthenticated: (user: any) => void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);

  const proceedGoogleLogin = async () => {
    setShowGoogleModal(false);
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      setError(
        'Không thể chuyển hướng Google SSO: ' +
          (err.message || 'Vui lòng sử dụng đăng nhập Email bên dưới.')
      );
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setShowGoogleModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Email hoặc mật khẩu không chính xác.');
          }
          throw signInError;
        }

        if (data?.user) {
          onAuthenticated(data.user);
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || 'Học viên LexiLens',
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            throw new Error('Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.');
          }
          throw signUpError;
        }

        if (data?.user) {
          if (data.session) {
            onAuthenticated(data.user);
          } else {
            setNotice('Tạo tài khoản thành công! Đang tự động đăng nhập...');
            const { data: logData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (logData?.user) {
              onAuthenticated(logData.user);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi trong quá trình xác thực.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-8 sm:py-12 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-hairline shadow-sm mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface-muted font-semibold">
              LexiLens Academic Scholar
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
            LexiLens
          </h1>
          <p className="font-sans text-xs sm:text-sm text-on-surface-muted max-w-sm mx-auto leading-relaxed">
            Hệ sinh thái đọc hiểu báo chí & ôn tập từ vựng ngữ cảnh theo chuẩn thuật toán FSRS.
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-surface-lowest rounded-2xl border border-outline-hairline shadow-academic p-6 sm:p-8 space-y-5">
          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-lowest hover:bg-surface-container border border-outline-hairline text-on-surface font-sans font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng nhập với Google</span>
          </button>

          {/* Google SSO Note & Confirmation Modal */}
          {showGoogleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
              <div className="bg-surface-lowest rounded-2xl border border-outline-hairline shadow-academic max-w-md w-full p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-on-surface">Đăng nhập với Google</h3>
                    <p className="text-[11px] text-on-surface-muted">Supabase OAuth Provider</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container/60 border border-outline-hairline text-xs text-on-surface leading-relaxed space-y-2">
                  <p className="font-semibold text-secondary">
                    📌 Lưu ý về Google Provider trong Supabase:
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Nếu Supabase project chưa bật <strong>Google Provider</strong> trong Dashboard (Authentication ➔ Providers ➔ Google), Supabase sẽ báo lỗi <em>"provider is not enabled"</em>.
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    👉 <strong>Khuyên dùng:</strong> Đăng nhập hoặc Tạo tài khoản bằng Email & Mật khẩu bên dưới — hoạt động ngay lập tức 100%, bảo mật và lưu trữ từ vựng riêng cho bạn!
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleModal(false);
                      setMode('signup');
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                  >
                    Dùng Email & Mật khẩu (Khuyên dùng)
                  </button>
                  <button
                    type="button"
                    onClick={proceedGoogleLogin}
                    className="w-full py-2 rounded-xl bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Vẫn tiếp tục chuyển tới Google SSO
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    className="w-full py-1.5 text-xs text-on-surface-muted hover:text-on-surface transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 my-1">
            <div className="h-px bg-outline-hairline flex-1" />
            <span className="text-[10px] font-mono text-on-surface-muted uppercase tracking-wider">hoặc</span>
            <div className="h-px bg-outline-hairline flex-1" />
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setNotice(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-surface text-primary shadow-sm font-bold'
                  : 'text-on-surface-muted hover:text-on-surface'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setNotice(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-surface text-primary shadow-sm font-bold'
                  : 'text-on-surface-muted hover:text-on-surface'
              }`}
            >
              Tạo tài khoản mới
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Họ và tên của bạn:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface border border-outline-hairline text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Địa chỉ Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu.vn"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface border border-outline-hairline text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Mật khẩu:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-surface border border-outline-hairline text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed animate-fadeIn">
                {error}
              </div>
            )}

            {notice && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed animate-fadeIn flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{notice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-sans font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Đăng nhập vào LexiLens' : 'Tạo tài khoản học tập'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center pt-2">
          <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-hairline/60">
            <ShieldCheck className="w-4 h-4 text-primary mx-auto mb-1 stroke-[1.5]" />
            <p className="text-[11px] font-sans font-medium text-on-surface">Tài khoản bảo mật</p>
            <p className="text-[10px] text-on-surface-muted">Dữ liệu lưu riêng tư</p>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-hairline/60">
            <BookOpen className="w-4 h-4 text-secondary mx-auto mb-1 stroke-[1.5]" />
            <p className="text-[11px] font-sans font-medium text-on-surface">Kho từ vựng thật</p>
            <p className="text-[10px] text-on-surface-muted">Tra cứu trực tiếp</p>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-hairline/60">
            <Sparkles className="w-4 h-4 text-tertiary mx-auto mb-1 stroke-[1.5]" />
            <p className="text-[11px] font-sans font-medium text-on-surface">Thuật toán FSRS</p>
            <p className="text-[10px] text-on-surface-muted">Tối ưu trí nhớ dài hạn</p>
          </div>
        </div>
      </div>
    </div>
  );
};
