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
        onClick();
      }}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 2147483647,
      }}
      className="flex items-center justify-center w-7 h-7 rounded-md bg-surface text-primary shadow-academic border border-outline-hairline hover:bg-surface-low hover:border-primary transition-all duration-150 transform hover:scale-105 active:scale-95 cursor-pointer"
      title="Tra cứu với LexiLens"
    >
      <SparklesIcon size={15} className="text-primary animate-pulse" />
    </button>
  );
};
