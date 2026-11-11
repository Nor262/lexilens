import React from 'react';
import { SparklesIcon } from './Icons';

interface FloatingTriggerProps {
  x: number;
  y: number;
  onClick: () => void;
}

export const FloatingTrigger: React.FC<FloatingTriggerProps> = ({ x, y, onClick }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 2147483647,
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white shadow-xl border border-white/20 hover:bg-primary-hover transition-all duration-150 transform hover:scale-105 active:scale-95 cursor-pointer text-xs font-sans font-medium select-none pointer-events-auto"
      title="Bấm để tra cứu nghĩa ngữ cảnh với LexiLens"
    >
      <SparklesIcon size={14} className="text-amber-300 animate-pulse shrink-0" />
      <span className="font-semibold tracking-wide">Tra LexiLens</span>
    </button>
  );
};
