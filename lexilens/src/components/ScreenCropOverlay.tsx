import React, { useState, useRef } from 'react';
import { CloseIcon, CropIcon } from './Icons';

interface ScreenCropOverlayProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

export const ScreenCropOverlay: React.FC<ScreenCropOverlayProps> = ({ onCapture, onCancel }) => {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startPos) {
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = async () => {
    if (!startPos || !currentPos) return;

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width < 20 || height < 20) {
      // Too small, reset selection
      setStartPos(null);
      setCurrentPos(null);
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Capture the full visible tab via background
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_TAB' });
      if (!response || !response.data) {
        throw new Error('Không thể chụp màn hình tab hiện tại.');
      }

      const fullImage = new Image();
      fullImage.src = response.data;
      await new Promise((resolve) => {
        fullImage.onload = resolve;
      });

      // 2. Crop accurately using devicePixelRatio
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
      className="fixed inset-0 z-[2147483646] cursor-crosshair select-none bg-black/45"
      style={{ backdropFilter: 'blur(1.5px)' }}
    >
      {/* Top Banner Guide */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-outline-hairline shadow-academic text-on-surface text-xs font-medium pointer-events-auto">
        <CropIcon size={16} className="text-primary" />
        <span>Kéo chọn vùng văn bản hoặc đoạn PDF cần đọc bằng LexiLens (Nhấn Esc để hủy)</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="ml-3 p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-medium">
          <div className="flex items-center gap-2.5 bg-surface text-on-surface px-5 py-3 rounded-lg border border-outline-hairline shadow-academic">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Đang cắt ảnh và gửi Gemini OCR...</span>
          </div>
        </div>
      )}
    </div>
  );
};
