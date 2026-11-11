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
          // If auto confirmed or session created
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
