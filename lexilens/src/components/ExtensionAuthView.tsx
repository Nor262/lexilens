import React, { useState } from 'react';
import { SparklesIcon, AlertCircleIcon, CheckIcon } from './Icons';

interface ExtensionAuthViewProps {
  onSuccess: (user: any) => void;
  onClose?: () => void;
}

export const ExtensionAuthView: React.FC<ExtensionAuthViewProps> = ({ onSuccess, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const actionType = mode === 'login' ? 'SIGN_IN' : 'SIGN_UP';
      chrome.runtime.sendMessage(
        {
          type: actionType,
          payload: { email: cleanEmail, password },
        },
        (res) => {
          setLoading(false);
          if (chrome.runtime.lastError) {
            setError(chrome.runtime.lastError.message || 'Lỗi kết nối extension.');
            return;
          }

          if (res?.success && res.data) {
            setNotice(
              mode === 'login'
                ? 'Đăng nhập thành công! Đang đồng bộ dữ liệu...'
                : 'Đăng ký thành công! Đã đăng nhập vào tài khoản.'
            );
            setTimeout(() => {
              onSuccess(res.data);
            }, 500);
          } else {
            setError(res?.error || 'Không thể đăng nhập. Vui lòng kiểm tra lại mật khẩu.');
          }
        }
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Lỗi xử lý yêu cầu.');
    }
  };

  return (
    <div className="p-3 bg-surface rounded-lg border border-outline-hairline shadow-academic space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-outline-hairline pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center">
            <SparklesIcon size={13} />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-on-surface">
              {mode === 'login' ? 'Đăng nhập tài khoản LexiLens' : 'Tạo tài khoản học tập mới'}
            </h3>
            <p className="text-[10px] text-on-surface-muted">
              Đồng bộ thẻ từ vựng với Web App vĩnh viễn
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-xs p-1 rounded hover:bg-surface-low cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Google SSO / Web App Auto Sync Button */}
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setLoading(true);
          setError(null);
          setNotice('Đang kiểm tra phiên đăng nhập từ Web App...');

          chrome.runtime.sendMessage({ type: 'TRY_AUTO_SYNC_AUTH' }, (res) => {
            const u = res?.data?.user || res?.data;
            if (res?.success && (u?.id || u?.email)) {
              setLoading(false);
              setNotice(`Đã kết nối thành công: ${u.user_metadata?.full_name || u.email}!`);
              setTimeout(() => onSuccess(u), 600);
            } else {
              setLoading(false);
              window.open('https://lexilens-app.vercel.app', '_blank');
              setNotice('Đã mở Web App! Sau khi đăng nhập trên Web, tiện ích sẽ tự động nhận diện ngay.');

              // Auto-poll for 20 seconds while user logs in on web
              const pollInterval = setInterval(() => {
                chrome.runtime.sendMessage({ type: 'TRY_AUTO_SYNC_AUTH' }, (pollRes) => {
                  const pu = pollRes?.data?.user || pollRes?.data;
                  if (pollRes?.success && (pu?.id || pu?.email)) {
                    clearInterval(pollInterval);
                    setNotice(`Đã nhận diện: ${pu.user_metadata?.full_name || pu.email}!`);
                    setTimeout(() => onSuccess(pu), 500);
                  }
                });
              }, 1500);

              setTimeout(() => clearInterval(pollInterval), 25000);
            }
          });
        }}
        className="w-full py-2.5 px-3 rounded-lg bg-surface-lowest hover:bg-surface-low border border-outline-hairline text-on-surface font-sans font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
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
        <span>Đăng nhập bằng Google / Đồng bộ từ Web App</span>
      </button>

      <div className="flex items-center gap-2 my-1">
        <div className="h-px bg-outline-hairline flex-1" />
        <span className="text-[9px] font-mono text-on-surface-muted uppercase">hoặc Email & Mật khẩu</span>
        <div className="h-px bg-outline-hairline flex-1" />
      </div>

      <div className="flex rounded-md bg-surface-low p-0.5 text-[11px] font-medium border border-outline-hairline">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setNotice(null);
          }}
          className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
            mode === 'login' ? 'bg-surface text-primary font-bold shadow-xs' : 'text-on-surface-muted hover:text-on-surface'
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
          className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
            mode === 'signup' ? 'bg-surface text-primary font-bold shadow-xs' : 'text-on-surface-muted hover:text-on-surface'
          }`}
        >
          Tạo tài khoản
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-[10px] font-semibold text-on-surface mb-0.5">
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ten@gmail.com"
            required
            className="w-full px-2.5 py-1.5 rounded-md bg-surface-low border border-outline-hairline text-xs text-on-surface focus:outline-none focus:border-primary transition-colors font-sans"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-on-surface mb-0.5">
            Mật khẩu:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
            required
            minLength={6}
            className="w-full px-2.5 py-1.5 rounded-md bg-surface-low border border-outline-hairline text-xs text-on-surface focus:outline-none focus:border-primary transition-colors font-sans"
          />
        </div>

        {error && (
          <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700 text-[10px] leading-tight flex items-start gap-1.5">
            <AlertCircleIcon size={12} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] leading-tight flex items-center gap-1.5 font-medium">
            <CheckIcon size={12} className="shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <span>Đang xử lý...</span>
          ) : (
            <>
              <CheckIcon size={13} />
              <span>{mode === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}</span>
            </>
          )}
        </button>
      </form>

      <div className="pt-1 text-center">
        <a
          href="https://lexilens-app.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-on-surface-muted hover:text-primary underline cursor-pointer"
        >
          Mở Web App LexiLens trong tab mới ↗
        </a>
      </div>
    </div>
  );
};
