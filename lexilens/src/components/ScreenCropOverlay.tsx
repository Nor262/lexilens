import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, CropIcon } from './Icons';

interface ScreenCropOverlayProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

export const ScreenCropOverlay: React.FC<ScreenCropOverlayProps> = ({ onCapture, onCancel }) => {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cachedImage, setCachedImage] = useState<HTMLImageElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Pre-capture the clean viewport immediately when overlay opens
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_TAB' });
        if (response?.data && active) {
          const img = new Image();
          img.src = response.data;
          img.onload = () => {
            if (active) setCachedImage(img);
          };
        }
      } catch (e) {
        console.warn('[LexiLens] Pre-capture tab error:', e);
      }
    })();

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      active = false;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onCancel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startPos) {
      e.stopPropagation();
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!startPos || !currentPos) return;
    e.stopPropagation();

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width < 25 || height < 25) {
      // Too small, reset selection
      setStartPos(null);
      setCurrentPos(null);
      return;
    }

    setIsProcessing(true);

    try {
      let fullImage = cachedImage;

      // If pre-capture hasn't finished, fetch now
      if (!fullImage) {
        const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_TAB' });
        if (!response || !response.data) {
          throw new Error('Không thể chụp màn hình tab hiện tại.');
        }

        fullImage = new Image();
        fullImage.src = response.data;
        await new Promise((resolve) => {
          fullImage!.onload = resolve;
        });
      }

      // Crop accurately using devicePixelRatio
      const dpr = window.devicePixelRatio || 1;
      const canvas = document.createElement('canvas');
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          fullImage,
          x * dpr,
          y * dpr,
          width * dpr,
          height * dpr,
          0,
          0,
          width * dpr,
          height * dpr
        );

        const croppedBase64 = canvas.toDataURL('image/png');
        onCapture(croppedBase64);
      }
    } catch (err) {
      console.error('[LexiLens] Screen crop error:', err);
      alert('Lỗi khi chụp màn hình. Vui lòng thử lại.');
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  const boxStyle = startPos && currentPos ? {
    left: `${Math.min(startPos.x, currentPos.x)}px`,
    top: `${Math.min(startPos.y, currentPos.y)}px`,
    width: `${Math.abs(currentPos.x - startPos.x)}px`,
    height: `${Math.abs(currentPos.y - startPos.y)}px`,
  } : null;

  return (
    <div
      ref={overlayRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      data-lexilens="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646,
        pointerEvents: 'auto',
        cursor: 'crosshair',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(1.5px)',
      }}
      className="select-none"
    >
      {/* Top Banner Guide */}
      <div
        style={{ pointerEvents: 'auto' }}
        className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-outline-hairline shadow-academic text-on-surface text-xs font-medium pointer-events-auto"
      >
        <CropIcon size={16} className="text-primary" />
        <span>Kéo chọn vùng văn bản hoặc đoạn PDF cần đọc bằng LexiLens (Nhấn Esc để hủy)</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="ml-3 p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      {/* Selection Box */}
      {boxStyle && (
        <div
          style={boxStyle}
          className="absolute border-2 border-primary bg-primary/10 pointer-events-none rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
        >
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-primary text-white text-[10px] font-mono rounded">
            {parseInt(boxStyle.width)} × {parseInt(boxStyle.height)} px
          </div>
        </div>
      )}

      {isProcessing && (
        <div
          style={{ pointerEvents: 'auto' }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-medium pointer-events-auto"
        >
          <div className="flex items-center gap-2.5 bg-surface text-on-surface px-5 py-3 rounded-lg border border-outline-hairline shadow-academic">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Đang cắt ảnh và gửi Gemini OCR...</span>
          </div>
        </div>
      )}
    </div>
  );
};
