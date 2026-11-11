import React, { useState } from 'react';
import {
  X,
  Download,
  Puzzle,
  Copy,
  FolderArchive,
  ToggleRight,
  UploadCloud,
  Pin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/lexilens-chrome-extension.zip';
    link.download = 'lexilens-chrome-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const steps = [
    {
      num: '01',
      icon: FolderArchive,
      title: 'Tải về & Giải nén',
      desc: 'Bấm nút "Tải file Extension" bên dưới và giải nén thư mục ra máy tính (file manifest.json nằm trực tiếp ngay trong thư mục giải nén).',
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
      title: 'Bật Chế độ nhà phát triển',
      desc: 'Bật công tắc "Developer mode" (Chế độ dành cho nhà phát triển) ở góc trên bên phải màn hình.',
    },
    {
      num: '04',
      icon: UploadCloud,
      title: 'Tải tiện ích đã giải nén',
      desc: 'Bấm nút "Load unpacked" (Tải tiện ích đã giải nén) ở góc trên bên trái và chọn thư mục vừa giải nén.',
    },
    {
      num: '05',
      icon: Pin,
      title: 'Ghim tiện ích để sử dụng',
      desc: 'Bấm vào biểu tượng mảnh ghép trên thanh công cụ của Chrome và bấm Ghim (Pin) tiện ích LexiLens.',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-xl bg-surface rounded-2xl border border-outline-hairline shadow-2xl p-4 sm:p-6 max-h-[92vh] flex flex-col overflow-hidden"
          >
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
                className="p-1.5 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
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
                    <span className="text-[10px] font-mono text-primary bg-primary-tint/30 px-2 py-0.2 rounded-full border border-primary/20 font-bold">
                      v1.0.0
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-muted font-sans mt-0.5">
                    Bản nén zip chứa đầy đủ mã nguồn đã build (dist).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-sans font-semibold transition-all shadow-sm shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2]" />
                    <span>Tải file Extension (.zip)</span>
                  </motion.button>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline text-center sm:text-left px-1 py-1"
                    >
                      (hoặc GitHub Releases)
                    </a>
                  )}
                </div>
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
                        <span className="font-mono text-xs font-bold text-primary bg-primary-tint/30 w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                          {s.num}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-xs sm:text-sm text-on-surface">
                            <Icon className="w-3.5 h-3.5 text-secondary stroke-[1.75]" />
                            <span>{s.title}</span>
                          </div>
                          <p className="text-xs text-on-surface-muted mt-0.5 leading-relaxed">
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Helpful shortcut */}
              <div className="p-3 rounded-xl bg-surface-lowest border border-outline-hairline flex items-center justify-between gap-2">
                <div className="text-xs text-on-surface-muted truncate">
                  <span>Phím tắt mở trang tiện ích: </span>
                  <code className="font-mono text-primary font-semibold">chrome://extensions</code>
                </div>
                <button
                  type="button"
                  onClick={handleCopyChromeUrl}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-high border border-outline-hairline text-xs font-medium text-on-surface transition-colors shrink-0 cursor-pointer"
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
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-surface-container hover:bg-surface-high border border-outline-hairline text-xs font-medium text-on-surface transition-colors ml-auto cursor-pointer"
              >
                Đã hiểu, đóng cửa sổ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
