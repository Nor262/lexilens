import React from 'react';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  BarChart2,
  Settings,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export type TabType = 'dashboard' | 'study' | 'library' | 'stats' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dueCount: number;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: any;
  badge?: number;
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
      {/* Desktop & Tablet Top Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-outline-hairline px-4 md:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-tight text-on-surface">
                LexiLens
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-sans text-on-surface-muted bg-surface-container px-2 py-0.5 rounded-full border border-outline-hairline">
                Academic Edition
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
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur border-t border-outline-hairline px-2 py-1.5 pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg relative transition-all ${
                  isActive ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 stroke-[1.5] transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-sans ${
                    isActive ? 'font-semibold text-primary' : 'font-normal'
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
