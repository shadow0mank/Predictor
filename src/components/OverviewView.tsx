import React, { useMemo } from 'react';
import { Draw, DrawSlot } from '../types/lottery';
import { CountdownHero } from './CountdownHero';
import { EthicalBanner } from './EthicalBanner';
import { LotteryBall } from './LotteryBall';
import { computeNumberStatistics } from '../utils/probability';
import { SLOTS_CONFIG } from '../data/seedDraws';
import { runMethod1, runMethod2, runMethod3, calculateConsensus } from '../utils/algorithms';
import {
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Database,
} from 'lucide-react';
import { ActiveTab } from './Header';

interface OverviewViewProps {
  draws: Draw[];
  onNavigateTab: (tab: ActiveTab, slot?: DrawSlot) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ draws, onNavigateTab }) => {
  const latestDraw = draws[0];

  const stats = useMemo(() => {
    return computeNumberStatistics(draws);
  }, [draws]);

  // Top 5 Hot and Cold numbers
  const hotNumbers = useMemo(() => {
    return [...stats].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [stats]);

  const coldNumbers = useMemo(() => {
    return [...stats].sort((a, b) => b.currentGap - a.currentGap).slice(0, 5);
  }, [stats]);

  // Current slot quick consensus
  const currentSlot = useMemo(() => {
    return SLOTS_CONFIG[0];
  }, []);

  const quickConsensus = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const m1 = runMethod1(draws, currentSlot.slot, 365);
    const m2 = runMethod2(draws, currentSlot.slot, today, currentSlot.time, 'enriched');
    const m3 = runMethod3(draws, currentSlot.slot, today, 10);
    return calculateConsensus(m1, m2, m3);
  }, [draws, currentSlot]);

  return (
    <div className="space-y-6">
      {/* Permanent Ethical Warning Banner */}
      <EthicalBanner />

      {/* Hero Section: Latest Certified Draw & Live Countdown */}
      <CountdownHero
        latestDraw={latestDraw}
        totalDrawsCount={draws.length}
        onNavigateToPredictions={(slot) => onNavigateTab('predictions', slot as DrawSlot)}
      />

      {/* Quick Grid: Consensus Spotlight & Hot/Cold Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Consensus Spotlight Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                Consensus Statistique Actuel · Prochain Tirage ({currentSlot.name} {currentSlot.time})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('predictions', currentSlot.slot)}
              className="text-xs font-semibold text-[#0F3E2E] hover:text-[#0A291E] flex items-center gap-1 cursor-pointer"
            >
              <span>Détails des 3 méthodes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Convergence algorithmique entre Fréquences brutes, Facteur Chance décimal et Rétro-ingénierie adaptative.
          </p>

          {quickConsensus.consensusNumbers.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 py-2">
              {quickConsensus.consensusNumbers.map((c) => (
                <div
                  key={c.num}
                  className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-md flex items-center gap-2.5"
                >
                  <LotteryBall number={c.num} variant="consensus" size="md" />
                  <div className="text-left">
                    <span className="font-bold text-xs text-slate-900 block">N°{c.num}</span>
                    <span className="text-[10px] text-[#B45309] font-medium font-mono">
                      {c.count}/3 méthodes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
              Aucun consensus absolu direct pour le tirage immédiat. Consultez les 3 méthodes séparément.
            </div>
          )}

          {/* Quick slot shortcuts */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Consulter par heure :</span>
            {SLOTS_CONFIG.map((s) => (
              <button
                key={s.slot}
                onClick={() => onNavigateTab('predictions', s.slot)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer transition-colors font-medium text-[11px]"
              >
                {s.name} ({s.time})
              </button>
            ))}
          </div>
        </div>

        {/* Hot and Cold Telemetry (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0F3E2E]" />
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                Pôles Fréquentiels Globaux (1..90)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('statistics')}
              className="text-xs font-semibold text-[#0F3E2E] hover:text-[#0A291E] flex items-center gap-1 cursor-pointer"
            >
              <span>Tous les graphes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Top 5 Hot */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono block">
              Top 5 numéros les plus fréquents (Toutes tranches)
            </span>
            <div className="flex items-center gap-2">
              {hotNumbers.map((h) => (
                <LotteryBall
                  key={h.num}
                  number={h.num}
                  variant="hot"
                  size="md"
                  tooltip={`Numéro ${h.num}: ${h.count} sorties`}
                />
              ))}
            </div>
          </div>

          {/* Top 5 Cold / Delayed */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono block">
              Top 5 numéros en plus grand retard (Écarts actuels)
            </span>
            <div className="flex items-center gap-2">
              {coldNumbers.map((c) => (
                <LotteryBall
                  key={c.num}
                  number={c.num}
                  variant="cold"
                  size="md"
                  tooltip={`Numéro ${c.num}: écart de ${c.currentGap} tirages`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature & Transparency Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-emerald-50 text-[#0F3E2E] flex items-center justify-center font-bold">
            1
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-900">
            Méthode 1 · Fréquences de Sortie
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dépouillement exhaustif par tranche horaire, pondération de l'écart actuel et validation d'adéquation du Chi² (p &lt; 0.01).
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-amber-50 text-[#D97706] flex items-center justify-center font-bold">
            2
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-900">
            Méthode 2 · Facteur Chance Décimal
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Formule spatio-temporelle formelle (H, S, Op1, Op3, divisions successives), extraction des paires de décimales et croisement avec le top-fréquence.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            3
          </div>
          <h4 className="font-heading font-bold text-sm text-slate-900">
            Méthode 3 · Rétro-Ingénierie
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Boucle d'ajustement adaptatif avec rétro-validation masquée sur le tirage précédent (seuil de révision ≥ 2 numéros corrects atteint).
          </p>
        </div>
      </div>
    </div>
  );
};
