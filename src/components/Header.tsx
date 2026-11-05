import React, { useState } from 'react';
import { RefreshCw, Menu, X, Activity } from 'lucide-react';

export type ActiveTab = 'overview' | 'predictions' | 'generator' | 'statistics' | 'history' | 'anomalies' | 'ranking';

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

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: 'Vue Générale' },
    { id: 'predictions', label: 'Prédictions' },
    { id: 'generator', label: 'Simulateur de Boules' },
    { id: 'statistics', label: 'Analyses & Graphes' },
    { id: 'history', label: 'Historique des Tirages' },
    { id: 'anomalies', label: 'Anomalies' },
    { id: 'ranking', label: 'Classement des Méthodes' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('overview')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded bg-[#0F3E2E] flex items-center justify-center text-white shadow-xs group-hover:bg-[#0A291E] transition-colors">
                <span className="font-heading font-bold text-sm tracking-tight">90</span>
              </div>
              <span className="font-heading font-bold text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                Loto Bonheur CI <span className="font-normal text-slate-400">·</span> <span className="text-[#0F3E2E] font-medium text-sm sm:text-base">Observatoire</span>
              </span>
            </button>
          </div>

          {/* Zone 2: 4–6 concise single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 text-xs xl:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                    isActive
                      ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRefreshHistory}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F3E2E] hover:bg-[#0A291E] active:bg-[#00271B] rounded transition-colors whitespace-nowrap cursor-pointer shadow-xs disabled:opacity-70"
              title="Relancer manuellement la vérification de l'historique auprès de Lotto Matrice Plus / Lonaci"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Actualisation...' : 'Actualiser l’historique'}
              </span>
              <span className="sm:hidden">{isRefreshing ? '...' : 'Actualiser'}</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-md">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === item.id
                  ? 'bg-emerald-50 text-[#0F3E2E] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          {lastUpdatedDate && (
            <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Base synchronisée :</span>
              <span className="font-mono">{lastUpdatedDate}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
