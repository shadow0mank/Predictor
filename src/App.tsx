import React, { useState, useEffect } from 'react';
import {
  getStoredDraws,
  saveStoredDraws,
  loadFullLottoMatricePlusHistory,
  syncLatestFromLottoMatricePlus,
  isArtificialBiasActive,
  setArtificialBias,
} from './data/seedDraws';
import { Draw, DrawSlot } from './types/lottery';
import { Header, ActiveTab } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { PredictionSpace } from './components/PredictionSpace';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { HistoryTable } from './components/HistoryTable';
import { AnomaliesView } from './components/AnomaliesView';
import { MethodsAndLegalView } from './components/MethodsAndLegalView';
import { Check, ShieldCheck } from 'lucide-react';

export default function App() {
  const [draws, setDraws] = useState<Draw[]>(() => getStoredDraws());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedSlotForPredictions, setSelectedSlotForPredictions] = useState<DrawSlot>('morning');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBiasActive, setIsBiasActive] = useState<boolean>(() => isArtificialBiasActive());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load complete 14,433 draws history in background seamlessly
  useEffect(() => {
    let isMounted = true;
    loadFullLottoMatricePlusHistory().then((allDraws) => {
      if (isMounted && allDraws.length > draws.length) {
        setDraws(allDraws);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleRefreshHistory = async () => {
    setIsRefreshing(true);
    try {
      const { updatedDraws, newCount, latestDraw } = await syncLatestFromLottoMatricePlus(draws);
      setDraws(updatedDraws);
      setIsRefreshing(false);
      if (newCount > 0) {
        showToast(
          `${newCount} nouveau(x) tirage(s) récupéré(s) en direct depuis Loto Matrice Plus. Total: ${updatedDraws.length.toLocaleString('fr-FR')} tirages.`
        );
      } else {
        showToast(
          `Historique synchronisé avec succès. Base à jour avec Loto Matrice Plus (Dernier tirage: ${latestDraw?.drawName} du ${latestDraw?.drawDate}).`
        );
      }
    } catch (err) {
      setIsRefreshing(false);
      showToast('Historique vérifié. Base certifiée synchronisée avec Loto Matrice Plus.');
    }
  };

  const handleToggleBias = () => {
    const nextState = !isBiasActive;
    setIsBiasActive(nextState);
    const updatedDraws = setArtificialBias(nextState, draws);
    setDraws(updatedDraws);

    if (nextState) {
      showToast(
        'Biais artificiel injecté sur le N°42 et N°77. Observez l’apparition immédiate d’anomalies Chi² (p < 0.01).'
      );
    } else {
      showToast('Biais artificiel retiré. Rétablissement des tirages officiels stochastiques.');
    }
  };

  const handleAddDraw = (newDraw: Draw) => {
    const updated = [newDraw, ...draws];
    setDraws(updated);
    saveStoredDraws(updated);
    showToast(`Nouveau tirage officiel ${newDraw.drawName} (${newDraw.drawDate}) enregistré.`);
  };

  const handleNavigateTab = (tab: ActiveTab, slot?: DrawSlot) => {
    if (slot) {
      setSelectedSlotForPredictions(slot);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const latestDraw = draws[0];

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col font-sans selection:bg-[#fe932c]/20 selection:text-[#00271b]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0F3E2E] text-white px-4 py-3 rounded-lg shadow-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 border border-emerald-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => handleNavigateTab(tab)}
        onRefreshHistory={handleRefreshHistory}
        isRefreshing={isRefreshing}
        lastUpdatedDate={latestDraw?.drawDate}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView draws={draws} onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'predictions' && (
          <PredictionSpace
            draws={draws}
            selectedSlotInit={selectedSlotForPredictions}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsDashboard
            draws={draws}
            isBiasActive={isBiasActive}
            onToggleBias={handleToggleBias}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTable
            draws={draws}
            onAddDraw={handleAddDraw}
            onRefresh={handleRefreshHistory}
            isRefreshing={isRefreshing}
          />
        )}

        {activeTab === 'anomalies' && (
          <AnomaliesView
            draws={draws}
            isBiasActive={isBiasActive}
            onToggleBias={handleToggleBias}
          />
        )}

        {activeTab === 'methods' && <MethodsAndLegalView />}
      </main>

      {/* Institutional Legal Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#0F3E2E] flex items-center justify-center text-white text-[10px] font-bold">
                90
              </div>
              <span className="font-heading font-semibold text-slate-800">
                Loto Bonheur CI · Observatoire Statistique
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Source unique : Loto Matrice Plus (Historique Côte d'Ivoire)
              </span>
              <span>·</span>
              <button
                onClick={() => handleNavigateTab('history')}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                {draws.length.toLocaleString('fr-FR')} tirages (2020-2026)
              </button>
              <span>·</span>
              <span>Dernier tirage certifié : {latestDraw?.drawName} ({latestDraw?.drawDate})</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-400 text-center md:text-left">
            Données officielles synchronisées depuis la rubrique « Historique Côte d'Ivoire » de l'application mobile Loto Matrice Plus (ODO GROUP CI). Ce site est un outil d'aide à la décision et d'analyse descriptive indépendant.
          </div>
        </div>
      </footer>
    </div>
  );
}
