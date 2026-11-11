import React from 'react';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  BarChart2,
  Settings,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

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
  onOpenInstallModal?: () => void;
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
    { id: 'library', label: 'Kho từ', icon: BookOpen },
    { id: 'stats', label: 'Thống kê', icon: BarChart2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-hairline/80 px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-on-surface">
                LexiLens
              </span>
              <span className="text-[10px] sm:text-xs font-sans text-on-surface-muted bg-surface-container px-2 py-0.5 rounded-full border border-outline-hairline font-medium">
                Academic
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-3">
            <nav className="flex items-center gap-1 bg-surface-low p-1 rounded-xl border border-outline-hairline">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-on-surface-muted hover:text-on-surface'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktopActiveNav"
                        className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-outline-hairline/60"
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
                      <span>{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="ml-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/92 backdrop-blur-md border-t border-outline-hairline px-2 py-1.5 pb-safe shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl relative transition-all min-h-[46px] cursor-pointer ${
                  isActive ? 'text-primary' : 'text-on-surface-muted'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveNav"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <div className="relative z-10">
                  <Icon
                    className={`w-4 h-4 stroke-[1.8] transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] font-bold px-1 rounded-full min-w-[13px] text-center font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`relative z-10 text-[10px] font-sans mt-0.5 tracking-tight ${
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
