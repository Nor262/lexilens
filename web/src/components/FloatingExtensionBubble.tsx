import React from 'react';
import { Puzzle, ArrowDownToLine } from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingExtensionBubbleProps {
  onOpen: () => void;
}

export const FloatingExtensionBubble: React.FC<FloatingExtensionBubbleProps> = ({ onOpen }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none"
    >
      <button
        onClick={onOpen}
        type="button"
        title="Cài đặt Extension Chrome"
        className="group flex items-center bg-primary hover:bg-primary-hover text-white shadow-2xl rounded-full p-3.5 sm:p-4 transition-all duration-300 ease-out hover:shadow-primary/30 border border-white/20 active:scale-95 cursor-pointer overflow-hidden"
      >
        {/* Extension Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          <Puzzle className="w-5 h-5 sm:w-5 sm:h-5 stroke-[2] transition-transform duration-300 group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-primary animate-pulse" />
        </div>

        {/* Expandable text label on hover */}
        <div className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2.5">
          <span className="font-sans font-semibold text-xs sm:text-sm tracking-wide pr-1 flex items-center gap-1.5">
            <span>Cài đặt Extension</span>
            <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2]" />
          </span>
        </div>
      </button>
    </motion.div>
  );
};
