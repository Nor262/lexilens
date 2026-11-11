import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { FloatingTrigger } from '../components/FloatingTrigger';
import { LexiLensPopup } from '../components/LexiLensPopup';
import { ScreenCropOverlay } from '../components/ScreenCropOverlay';
import { OCRResult } from '../types';
import contentStyles from '../styles/content.css?inline';

interface TriggerState {
  visible: boolean;
  x: number;
  y: number;
  selection: string;
  sentence: string;
}

interface PopupState {
  visible: boolean;
  x: number;
  y: number;
  selection: string;
  sentence: string;
}

const ContentApp: React.FC = () => {
  const [trigger, setTrigger] = useState<TriggerState>({
    visible: false,
    x: 0,
    y: 0,
    selection: '',
    sentence: '',
  });

  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    x: 0,
    y: 0,
    selection: '',
    sentence: '',
  });

  const [showCrop, setShowCrop] = useState<boolean>(false);
  const [ocrData, setOcrData] = useState<OCRResult | null>(null);

  // Extract surrounding sentence from current DOM selection
  const extractSurroundingSentence = (selection: Selection): string => {
    const text = selection.toString().trim();
    if (!text) return '';

    try {
      const anchorNode = selection.anchorNode;
      const parent = anchorNode?.parentElement;
      const fullParagraph = parent?.innerText || parent?.textContent || text;

      // Find sentence boundary around selection
      const sentences = fullParagraph.match(/[^.!?]+[.!?]+/g) || [fullParagraph];
      const matched = sentences.find((s) => s.includes(text));
      return (matched || text).trim();
    } catch {
      return text;
    }
  };

  useEffect(() => {
    // Helper to check if event was inside LexiLens UI
    const isLexiLensTarget = (target: any, path: any[]): boolean => {
      try {
        if (target?.closest?.('#lexilens-host') || target?.closest?.('[data-lexilens]')) {
          return true;
        }
        return path.some((el: any) => {
          return (
            el?.id === 'lexilens-host' ||
            el?.id === 'lexilens-root' ||
            el?.id === 'lexilens-floating-trigger' ||
            el?.id === 'lexilens-popup' ||
            el?.getAttribute?.('data-lexilens') === 'true'
          );
        });
      } catch {
        return false;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (isLexiLensTarget(e.target, path)) {
        return;
      }

      // Small delay so browser completes selection bounding rect calculations
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';

        // Ignore if empty, less than 2 chars, longer than 600 chars, or purely non-letter
        if (!text || text.length < 2 || text.length > 600 || !/[a-zA-Z]/.test(text)) {
          setTrigger((prev) => ({ ...prev, visible: false }));
          return;
        }

        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return;

          const sentence = extractSurroundingSentence(sel);

          // Clamped viewport positioning
          const clampedX = Math.max(10, Math.min(window.innerWidth - 180, rect.left));
          const clampedY = rect.top >= 44 ? rect.top - 38 : rect.bottom + 8;

          setTrigger({
            visible: true,
            x: clampedX,
            y: clampedY,
            selection: text,
            sentence,
          });
        }
      }, 30);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (isLexiLensTarget(e.target, path)) {
        return;
      }
      // Hide trigger when clicking outside
      setTrigger((prev) => ({ ...prev, visible: false }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTrigger((prev) => ({ ...prev, visible: false }));
        setPopup((prev) => ({ ...prev, visible: false }));
        setShowCrop(false);
        setOcrData(null);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);

    // Listen to background messages (e.g. keyboard shortcuts)
    const messageListener = (msg: any) => {
      if (msg.type === 'TRIGGER_SCREEN_CROP') {
        setShowCrop(true);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const openPopupFromTrigger = () => {
    setPopup({
      visible: true,
      x: trigger.x,
      y: trigger.y,
      selection: trigger.selection,
      sentence: trigger.sentence,
    });
    setTrigger((prev) => ({ ...prev, visible: false }));
  };

  const handleSaveCard = async (cardData: any): Promise<boolean> => {
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'SAVE_FLASHCARD',
        payload: cardData,
      });
      return res?.success || false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleCaptureComplete = async (base64Image: string) => {
    setShowCrop(false);
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'PERFORM_OCR',
        payload: { imageBase64: base64Image },
      });

      if (res?.success && res.data) {
        setOcrData(res.data);
      } else {
        alert(res?.error || 'Không thể nhận diện chữ từ ảnh.');
      }
    } catch (err: any) {
      alert('Lỗi nhận diện OCR: ' + err.message);
    }
  };

  return (
    <>
      {/* 1. Floating Trigger Button */}
      {trigger.visible && (
        <FloatingTrigger
          x={trigger.x}
          y={trigger.y}
          text={trigger.selection}
          onClick={openPopupFromTrigger}
        />
      )}

      {/* 2. LexiLens Lookup Popup */}
      {popup.visible && (
        <LexiLensPopup
          x={popup.x}
          y={popup.y}
          selection={popup.selection}
          sentence={popup.sentence}
          pageTitle={document.title || 'Tài liệu'}
          onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
          onSaveCard={handleSaveCard}
        />
      )}

      {/* 3. Screen Crop Overlay (Lens Mode) */}
      {showCrop && (
        <ScreenCropOverlay
          onCapture={handleCaptureComplete}
          onCancel={() => setShowCrop(false)}
        />
      )}

      {/* 4. OCR Result Modal */}
      {ocrData && (
        <div 
          data-lexilens="true" 
          style={{ pointerEvents: 'auto' }}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4 font-sans"
        >
          <div className="bg-surface rounded-lg border border-outline-hairline shadow-academic max-w-lg w-full p-4 text-on-surface space-y-3">
            <div className="flex items-center justify-between border-b border-outline-hairline pb-2">
              <h3 className="font-serif text-lg font-bold text-primary">
                Nhận diện văn bản (LexiLens Lens)
              </h3>
              <button
                onClick={() => setOcrData(null)}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Bấm vào câu bên dưới để mở phân tích từ vựng & cấu trúc câu:
            </p>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {ocrData.sentences?.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPopup({
                      visible: true,
                      x: Math.max(10, window.innerWidth / 2 - 195),
                      y: Math.max(10, window.innerHeight / 2 - 150),
                      selection: s.sentence,
                      sentence: s.sentence,
                    });
                    setOcrData(null);
                  }}
                  className="p-2.5 rounded bg-surface-low border border-outline-hairline hover:border-primary cursor-pointer transition-colors"
                >
                  <p className="font-serif text-sm font-medium">{s.sentence}</p>
                  {s.translation_vi && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      {s.translation_vi}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Initialize Shadow DOM Container with fixed full-screen overlay
function initLexiLens() {
  if (document.getElementById('lexilens-host')) return;

  const host = document.createElement('div');
  host.id = 'lexilens-host';
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '100vw';
  host.style.height = '100vh';
  host.style.overflow = 'visible';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';
  (document.documentElement || document.body).appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const mountPoint = document.createElement('div');
  mountPoint.id = 'lexilens-root';
  mountPoint.style.pointerEvents = 'none';
  shadowRoot.appendChild(mountPoint);

  // 1. Inlined Styles (Guaranteed to work without CSP chrome-extension blocking)
  try {
    const styleEl = document.createElement('style');
    styleEl.textContent = contentStyles;
    shadowRoot.appendChild(styleEl);
  } catch (err) {
    console.warn('[LexiLens] Could not inline style tag:', err);
  }

  // 2. Link stylesheet fallback
  try {
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = chrome.runtime.getURL('content.css');
    shadowRoot.appendChild(linkEl);
  } catch (err) {
    console.warn('[LexiLens] Could not attach link tag:', err);
  }

  const root = createRoot(mountPoint);
  root.render(<ContentApp />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLexiLens);
} else {
  initLexiLens();
}
