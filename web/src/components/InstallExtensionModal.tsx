import React, { useState } from 'react';
import {
  X,
  Download,
  Puzzle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FolderArchive,
  ToggleRight,
  UploadCloud,
  Pin,
} from 'lucide-react';

interface InstallExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl?: string;
}

export const InstallExtensionModal: React.FC<InstallExtensionModalProps> = ({
  isOpen,
  onClose,
  downloadUrl,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [downloadTriggered, setDownloadTriggered] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownload = () => {
    setDownloadTriggered(true);
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      // Temporary fallback prompt when link is not yet set
      alert('Đường link tải file zip đang được cập nhật. Bạn sẽ có thể tải về ngay khi có link chính thức!');
    }
  };

  const steps = [
    {
      num: '01',
      icon: FolderArchive,
      title: 'Tải về & Giải nén',
      desc: 'Bấm nút "Tải file Extension (.zip)" bên dưới và giải nén thư mục ra máy tính của bạn.',
    },
    {
      num: '02',
      icon: Puzzle,
      title: 'Mở trang Tiện ích Chrome',
      desc: (
        <span>
          Mở tab mới trên Google Chrome và nhập{' '}
          <code className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-primary text-xs select-all">
            chrome://extensions
          </code>{' '}
          vào thanh địa chỉ.
        </span>
      ),
    },
    {
      num: '03',
      icon: ToggleRight,
      title: 'Bật Chế độ Nhà phát triển',
      desc: 'Tại góc trên cùng bên phải trang tiện ích, gạt bật công tắc "Developer mode" (Chế độ cho nhà phát triển).',
    },
    {
      num: '04',
      icon: UploadCloud,
      title: 'Tải tiện ích đã giải nén',
      desc: 'Bấm nút "Load unpacked" (Tải tiện ích đã giải nén) ở góc trên bên trái ➔ Chọn thư mục vừa giải nén.',
    },
    {
      num: '05',
      icon: Pin,
      title: 'Ghim tiện ích để sử dụng',
      desc: 'Bấm vào biểu tượng mảnh ghép trên thanh công cụ của Chrome và bấm Ghim (Pin) tiện ích LexiLens.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-surface rounded-2xl border border-outline-hairline shadow-2xl p-4 sm:p-6 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-outline-hairline shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-tint/40 flex items-center justify-center text-primary shrink-0">
              <Puzzle className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-on-surface">
                Cài Đặt Tiện Ích LexiLens
              </h3>
              <span className="text-[11px] font-sans text-on-surface-muted block">
                Dành cho Google Chrome, Brave, Edge & Cốc Cốc (Manifest V3)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Download Action Box */}
          <div className="p-4 rounded-xl bg-surface-container border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-academic">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm sm:text-base text-on-surface">
                  LexiLens Extension
                </span>
                <span className="text-[10px] font-mono text-primary bg-primary-tint/30 px-2 py-0.2 rounded-full border border-primary/20">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-on-surface-muted font-sans mt-0.5">
                Bản nén zip chứa đầy đủ mã nguồn đã build (dist).
              </p>
            </div>

            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-sans font-medium transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4 stroke-[2]" />
              <span>Tải file Extension (.zip)</span>
            </button>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2.5">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-on-surface-muted">
              Hướng dẫn cài đặt chi tiết (5 bước đơn giản):
            </h4>

            <div className="space-y-2">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-surface-lowest border border-outline-hairline"
                  >
                    <div className="w-6 h-6 rounded-md bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-on-surface-muted font-semibold">
                          Bước {s.num}
                        </span>
                        <h5 className="font-sans font-semibold text-xs sm:text-sm text-on-surface">
                          {s.title}
                        </h5>
                      </div>
                      <p className="text-xs text-on-surface-muted font-sans mt-0.5 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Copy Link Tool */}
          <div className="p-3 rounded-xl bg-surface-low border border-outline-hairline flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-on-surface-muted shrink-0">Đường dẫn:</span>
              <code className="font-mono text-primary truncate bg-surface-container px-2 py-1 rounded">
                chrome://extensions
              </code>
            </div>
            <button
              onClick={handleCopyChromeUrl}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface hover:bg-surface-high border border-outline-hairline text-on-surface text-xs shrink-0 transition-colors"
            >
              <Copy className="w-3 h-3 stroke-[1.5]" />
              <span>{copiedUrl ? 'Đã sao chép!' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-outline-hairline flex items-center justify-between shrink-0">
          <span className="text-[11px] text-on-surface-muted font-sans hidden sm:inline">
            Cần trợ giúp? Mở tab Cài đặt để đồng bộ dữ liệu.
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-surface-container hover:bg-surface-high border border-outline-hairline text-xs font-medium text-on-surface transition-colors ml-auto"
          >
            Đã hiểu, đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
