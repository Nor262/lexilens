import React from 'react';
import { SparklesIcon } from './Icons';

interface FloatingTriggerProps {
  x: number;
  y: number;
  text?: string;
  onClick: () => void;
}

export const FloatingTrigger: React.FC<FloatingTriggerProps> = ({ x, y, text, onClick }) => {
  return (
    <div
      id="lexilens-floating-trigger"
      data-lexilens="true"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 2147483647,
        pointerEvents: 'auto',
      }}
      className="animate-fadeIn"
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        id="lexilens-trigger-btn"
        data-lexilens="true"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white shadow-xl border border-white/20 transition-all duration-150 transform hover:scale-105 active:scale-95 cursor-pointer text-xs font-sans font-medium select-none pointer-events-auto"
        title="Bấm để tra cứu nghĩa ngữ cảnh với LexiLens"
      >
        <SparklesIcon size={14} className="text-amber-300 animate-pulse shrink-0" />
        <span className="font-semibold tracking-wide">
          {text ? `Tra "${text.length > 18 ? text.slice(0, 16) + '...' : text}"` : 'Tra LexiLens'}
        </span>
      </button>
    </div>
  );
};
