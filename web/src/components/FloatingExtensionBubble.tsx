import React, { useState } from 'react';
import { Puzzle, ArrowDownToLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingExtensionBubbleProps {
  onOpen: () => void;
}

export const FloatingExtensionBubble: React.FC<FloatingExtensionBubbleProps> = ({ onOpen }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        onClick={onOpen}
        type="button"
        title="Cài đặt Extension Chrome"
        whileTap={{ scale: 0.94 }}
        className="flex items-center bg-primary hover:bg-primary-hover text-white shadow-xl hover:shadow-2xl hover:shadow-primary/30 rounded-full p-3 sm:p-3.5 border border-white/20 cursor-pointer overflow-hidden transition-colors"
      >
        {/* Extension Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          <motion.div
            animate={{ rotate: isHovered ? 15 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Puzzle className="w-5 h-5 stroke-[2]" />
          </motion.div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-primary animate-pulse" />
        </div>

        {/* Expandable text label on hover with buttery smooth spring animation */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ width: 0, opacity: 0, marginLeft: 0 }}
              animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
              exit={{ width: 0, opacity: 0, marginLeft: 0 }}
              transition={{
                width: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.25, delay: 0.1 },
                marginLeft: { duration: 0.3 },
              }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="font-sans font-semibold text-xs sm:text-sm tracking-wide pr-1 flex items-center gap-1.5">
                <span>Cài đặt Extension</span>
                <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2]" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
};
