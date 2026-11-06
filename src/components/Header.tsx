import React, { useState } from 'react';
import {
  RefreshCw,
  Menu,
  X,
  LayoutDashboard,
  Sparkles,
  Dices,
  Ticket,
  BarChart3,
  History,
  Trophy,
} from 'lucide-react';

export type ActiveTab = 'overview' | 'predictions' | 'generator' | 'tickets' | 'statistics' | 'history' | 'ranking';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onRefreshHistory: () => void;
  isRefreshing?: boolean;
  lastUpdatedDate?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onRefreshHistory,
  isRefreshing = false,
  lastUpdatedDate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Vue Générale', icon: LayoutDashboard },
    { id: 'predictions', label: 'Prédictions', icon: Sparkles },
    { id: 'generator', label: 'Simulateur', icon: Dices },
    { id: 'tickets', label: 'Mes Tickets', icon: Ticket },
    { id: 'statistics', label: 'Analyses', icon: BarChart3 },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'ranking', label: 'Classement', icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 w-full max-w-full overflow-x-hidden shadow-2xs">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Wordmark & Emblem */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('overview')}
              className="flex items-center gap-2.5 text-left cursor-pointer group transition-transform active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0F3E2E] to-[#0A291E] border border-emerald-600/30 flex items-center justify-center text-white shadow-xs group-hover:border-emerald-500/50 transition-colors">
                <span className="font-heading font-black text-sm tracking-tight text-[#FE932C]">90</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                    Loto Bonheur CI
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#0F3E2E] border border-emerald-200">
                    Observatoire
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Base Certifiée Lonaci</span>
                </div>
              </div>
            </button>
          </div>

          {/* Zone 2: Harmonized Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs xl:text-[13px] rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#0F3E2E] font-bold shadow-xs border border-slate-200/80 ring-1 ring-black/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-[#0F3E2E]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action (Refresh) & Mobile Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onRefreshHistory}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F3E2E] hover:bg-[#0A291E] active:bg-[#00271B] rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-xs disabled:opacity-70 border border-emerald-800/40"
              title="Relancer manuellement la vérification de l'historique auprès de Lotto Matrice Plus / Lonaci"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Actualisation...' : 'Actualiser l’historique'}
              </span>
              <span className="sm:hidden">{isRefreshing ? '...' : 'Actualiser'}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-200"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-3 space-y-1.5 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-[#0F3E2E] font-bold border border-emerald-200 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#0F3E2E]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
          {lastUpdatedDate && (
            <div className="pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between font-mono">
              <span>Dernier tirage vérifié :</span>
              <span className="font-semibold text-slate-800">{lastUpdatedDate}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
