import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpenIcon, CropIcon, SettingsIcon, CheckIcon, AlertCircleIcon } from '../components/Icons';
import { Flashcard, UserSettings } from '../types';
import { isCardDueToday } from '../services/fsrs';
import '../styles/global.css';

const PopupApp: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CARDS' }, (res) => {
      if (res?.success) setCards(res.data || []);
    });
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (res) => {
      if (res?.success) setSettings(res.data);
    });
  }, []);

  const dueCount = cards.filter(isCardDueToday).length;

  const openSidepanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId) {
      // @ts-ignore
      if (chrome.sidePanel && chrome.sidePanel.open) {
        // @ts-ignore
        chrome.sidePanel.open({ windowId: tab.windowId });
      }
    }
    window.close();
  };

  const triggerCapture = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_SCREEN_CROP' });
    }
    window.close();
  };

  return (
    <div
      style={{ width: '380px', minWidth: '380px', maxWidth: '380px' }}
      className="p-4 space-y-3.5 font-sans box-border"
    >
      <div className="flex items-center justify-between border-b border-outline-hairline pb-2.5">
        <div>
          <h1 className="font-serif text-lg font-bold text-primary">LexiLens</h1>
          <p className="text-[11px] text-on-surface-variant">Trợ lý đọc hiểu học thuật</p>
        </div>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
          title="Cài đặt"
        >
          <SettingsIcon size={16} />
        </button>
      </div>

      {/* API Key Status Banner */}
      {!settings?.geminiApiKey ? (
        <div
          onClick={() => chrome.runtime.openOptionsPage()}
          className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <AlertCircleIcon size={14} className="flex-shrink-0" />
          <span>Bấm để nhập Gemini API Key miễn phí</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-tertiary">
          <CheckIcon size={13} />
          <span>Gemini AI ({settings.preferredModel}) sẵn sàng</span>
        </div>
      )}

      {/* Stats Card */}
      <div className="p-3 rounded-lg bg-surface-low border border-outline-hairline flex items-center justify-between">
        <div>
          <span className="text-[11px] text-secondary font-medium">Thẻ cần ôn hôm nay</span>
          <p className="font-serif text-2xl font-bold text-primary">{dueCount}</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-secondary font-medium">Tổng kho thẻ</span>
          <p className="font-mono text-base font-semibold text-on-surface">{cards.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={openSidepanel}
          className="w-full py-2 px-3 rounded bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <BookOpenIcon size={14} />
          Mở thanh học tập Sidepanel
        </button>

        <button
          onClick={triggerCapture}
          className="w-full py-2 px-3 rounded bg-surface-low hover:bg-surface-container text-on-surface border border-outline-hairline text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <CropIcon size={14} className="text-primary" />
          Chụp vùng & OCR (Alt+Shift+X)
        </button>
      </div>

      <div className="text-[10px] text-center text-on-surface-variant font-mono">
        Bôi đen từ trên bất kỳ trang web nào để tra nghĩa
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}
