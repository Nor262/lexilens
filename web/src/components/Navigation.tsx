import React from 'react';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  BarChart2,
  Settings,
  Sparkles,
} from 'lucide-react';

export type TabType = 'dashboard' | 'study' | 'library' | 'stats' | 'settings';

interface NavItem {
  id: TabType;
  label: string;
  icon: any;
  badge?: number;
}

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dueCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  dueCount,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    {
      id: 'study',
      label: 'Ôn tập',
      icon: Layers,
      badge: dueCount > 0 ? dueCount : undefined,
    },
    { id: 'library', label: 'Từ vựng', icon: BookOpen },
    { id: 'stats', label: 'Thống kê', icon: BarChart2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-outline-hairline px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.5]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-on-surface">
                LexiLens
              </span>
              <span className="text-[10px] sm:text-xs font-sans text-on-surface-muted bg-surface-container px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full border border-outline-hairline">
                Academic
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-container text-primary font-semibold'
                      : 'text-on-surface-muted hover:text-on-surface hover:bg-surface-low'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.5]" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Right Quick Indicator */}
          <div className="md:hidden flex items-center gap-2">
            {dueCount > 0 && (
              <button
                onClick={() => setActiveTab('study')}
                className="flex items-center gap-1 text-[11px] font-medium bg-primary-tint/40 text-primary px-2.5 py-1 rounded-full border border-primary/20"
              >
                <Layers className="w-3 h-3 stroke-[2]" />
                <span>{dueCount} từ cần ôn</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/98 backdrop-blur border-t border-outline-hairline px-1 py-1.5 pb-safe shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg relative transition-all min-h-[44px] ${
                  isActive ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface active:scale-95'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 stroke-[1.75] transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2.5 bg-primary text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center leading-tight">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-sans mt-0.5 tracking-tight ${
                    isActive ? 'font-bold text-primary' : 'font-normal'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
