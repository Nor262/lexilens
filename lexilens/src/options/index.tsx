import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { UserSettings } from '../types';
import { CheckIcon, AlertCircleIcon, ExternalLinkIcon } from '../components/Icons';
import '../styles/global.css';

const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    geminiApiKey: '',
    preferredModel: 'gemini-2.0-flash',
    defaultTopic: 'auto',
    dailyReminderHour: 20,
    customTopics: [],
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
      if (res?.success && res.data) {
        setSettings(res.data);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        payload: settings,
      });
      if (res?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async () => {
    if (!settings.geminiApiKey) {
      setTestStatus('Vui lòng nhập API Key trước khi kiểm tra.');
      return;
    }
    setTesting(true);
    setTestStatus('Đang kiểm tra kết nối với Google Gemini...');

    try {
      const startTime = performance.now();
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.preferredModel}:generateContent?key=${settings.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping test. Reply with word OK.' }] }],
          }),
        }
      );

      const elapsed = Math.round(performance.now() - startTime);

      if (res.ok) {
        setTestStatus(` Kết nối thành công! Tốc độ phản hồi: ${elapsed}ms.`);
      } else {
        const err = await res.text();
        setTestStatus(` Lỗi kết nối (${res.status}): ${err}`);
      }
    } catch (e: any) {
      setTestStatus(` Lỗi mạng: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-8 max-w-2xl mx-auto font-sans text-on-surface">
      <header className="border-b border-outline-hairline pb-4 mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary tracking-tight">
          Cài đặt LexiLens
        </h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Cấu hình khóa AI Gemini cá nhân (BYOK), mô hình ngôn ngữ và tùy chọn học tập.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Gemini API Key Box */}
        <div className="p-5 rounded-lg border border-outline-hairline bg-surface-low space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Google Gemini API Key (Miễn phí 100%)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value.trim() })}
                className="flex-1 px-3 py-2 text-xs font-mono bg-surface border border-outline-hairline rounded focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing}
                className="px-3 py-2 rounded bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-secondary transition-colors"
              >
                {testing ? 'Đang test...' : 'Kiểm tra Key'}
              </button>
            </div>
            {testStatus && (
              <p className="text-xs mt-2 leading-relaxed text-secondary">{testStatus}</p>
            )}
          </div>

          <div className="text-xs text-on-surface-variant leading-relaxed p-3 rounded bg-surface border border-outline-hairline">
            <p className="font-semibold text-secondary mb-1">💡 Làm sao để lấy Gemini API Key miễn phí?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Truy cập Google AI Studio bằng tài khoản Google cá nhân.</li>
              <li>Bấm nút <strong>"Get API key"</strong> ➔ <strong>"Create API key"</strong>.</li>
              <li>Gói miễn phí cấp sẵn 1.500 lượt tra/ngày, không yêu cầu thẻ tín dụng!</li>
            </ol>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-primary hover:underline font-semibold"
            >
              Mở Google AI Studio <ExternalLinkIcon size={12} />
            </a>
          </div>
        </div>

        {/* Model Selection */}
        <div className="p-5 rounded-lg border border-outline-hairline bg-surface-low space-y-3">
          <label className="block text-xs font-semibold text-on-surface">
            Mô hình Gemini ưu tiên
          </label>
          <select
            value={settings.preferredModel}
            onChange={(e) => setSettings({ ...settings, preferredModel: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-surface border border-outline-hairline rounded focus:border-primary outline-none font-mono"
          >
            <option value="gemini-2.0-flash">gemini-2.0-flash (Khuyên dùng - Cực nhanh & Multimodal OCR)</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash (Ổn định, tiết kiệm quota)</option>
          </select>
          <p className="text-[11px] text-on-surface-variant">
            Mô hình Gemini 2.0 Flash có tốc độ phản hồi trung bình chỉ ~0.5 giây và hỗ trợ phân tích ảnh trực tiếp.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-xs text-tertiary font-semibold">
              <CheckIcon size={16} /> Đã lưu cài đặt thành công!
            </div>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<OptionsApp />);
}
