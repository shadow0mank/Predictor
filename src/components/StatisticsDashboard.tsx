import React, { useState, useMemo } from 'react';
import { Draw, DrawSlot, NumberStat } from '../types/lottery';
import { SLOTS_CONFIG } from '../data/seedDraws';
import { computeNumberStatistics, computeTopPairs, THEORETICAL_ODDS } from '../utils/probability';
import { LotteryBall } from './LotteryBall';
import {
  BarChart3,
  Flame,
  Clock,
  Layers,
  Activity,
  AlertTriangle,
  Filter,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface StatisticsDashboardProps {
  draws: Draw[];
  isBiasActive: boolean;
  onToggleBias: () => void;
}

type PeriodFilter = '7d' | '30d' | '90d' | '365d' | 'all';
type StatSubTab = 'frequencies' | 'gaps' | 'chi2' | 'pairs' | 'sums';

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  draws,
  isBiasActive,
  onToggleBias,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [slotFilter, setSlotFilter] = useState<DrawSlot | 'all'>('all');
  const [activeSubTab, setActiveSubTab] = useState<StatSubTab>('frequencies');
  const [hoveredNumber, setHoveredNumber] = useState<NumberStat | null>(null);

  // Filter draws by period and slot
  const filteredDraws = useMemo(() => {
    let list = [...draws];

    if (slotFilter !== 'all') {
      list = list.filter((d) => d.slot === slotFilter);
    }

    if (period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      list = list.slice(0, Math.min(list.length, days * (slotFilter === 'all' ? 4 : 1)));
    }

    return list;
  }, [draws, period, slotFilter]);

  // Compute number stats for filtered draws
  const stats = useMemo(() => {
    return computeNumberStatistics(filteredDraws);
  }, [filteredDraws]);

  // Compute top pairs
  const topPairs = useMemo(() => {
    return computeTopPairs(filteredDraws, 24);
  }, [filteredDraws]);

  // Max frequency for histogram scaling
  const maxFreq = useMemo(() => {
    return Math.max(...stats.map((s) => s.count), 1);
  }, [stats]);

  // Theoretical expected count
  const expectedCount = useMemo(() => {
    return filteredDraws.length * (5 / 90);
  }, [filteredDraws]);

  // Sum metrics for draws
  const sumMetrics = useMemo(() => {
    const sample = filteredDraws.slice(0, 100);
    const sums = sample.map((d) => ({
      date: d.drawDate,
      time: d.drawTime,
      name: d.drawName,
      sum: d.numbers.reduce((a, b) => a + b, 0),
      evenCount: d.numbers.filter((n) => n % 2 === 0).length,
      oddCount: d.numbers.filter((n) => n % 2 !== 0).length,
    }));

    const avgSum =
      sums.length > 0 ? sums.reduce((acc, s) => acc + s.sum, 0) / sums.length : 227.5;

    return { sums, avgSum };
  }, [filteredDraws]);

  // Detected anomalies (Chi2 p < 0.01)
  const anomalies = useMemo(() => {
    return stats.filter((s) => s.isSignificant);
  }, [stats]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Top Controls & Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 tracking-tight">
              Observatoire Statistique & Visualisations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Analyse rétrospective des 90 sphères sur {filteredDraws.length} tirages analysés.
            </p>
          </div>

          {/* Artificial Bias Injection Button (Acceptance Criterion 6) */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={onToggleBias}
              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isBiasActive
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
              title="Injecte un biais artificiel pour vérifier la détection immédiate du test Chi²"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isBiasActive ? 'Biais Artificiel Actif (Test)' : 'Injecter un Biais de Test'}</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Période :
            </span>
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {(
                [
                  { id: '7d', label: '7 jours' },
                  { id: '30d', label: '30 jours' },
                  { id: '90d', label: '90 jours' },
                  { id: '365d', label: '1 an' },
                  { id: 'all', label: 'Tout l’historique' },
                ] as { id: PeriodFilter; label: string }[]
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    period === p.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slot Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Tranche horaire :</span>
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                onClick={() => setSlotFilter('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  slotFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toutes
              </button>
              {SLOTS_CONFIG.map((s) => (
                <button
                  key={s.slot}
                  onClick={() => setSlotFilter(s.slot)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    slotFilter === s.slot
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.name} ({s.time})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-lg px-4 gap-4 text-xs sm:text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('frequencies')}
          className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'frequencies'
              ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Histogramme des 90 Numéros</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gaps')}
          className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'gaps'
              ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Matrice des Écarts (Retards)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('chi2')}
          className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'chi2'
              ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Test du Chi² & Anomalies</span>
          {anomalies.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
              {anomalies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('pairs')}
          className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'pairs'
              ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Top Paires & Affinités</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sums')}
          className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'sums'
              ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Distribution de la Somme & Parité</span>
        </button>
      </div>

      {/* Main Tab View Canvas */}
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-lg p-5 sm:p-6 space-y-6 shadow-xs">
        {/* 1. FREQUENCIES HISTOGRAM */}
        {activeSubTab === 'frequencies' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Distribution des Fréquences (1 à 90) vs Espérance Théorique
                </h3>
                <p className="text-xs text-slate-500">
                  Ligne en pointillé vert : Espérance théorique uniforme (5/90 = 5.56% soit {expectedCount.toFixed(1)} sorties).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-3 h-3 bg-[#0F3E2E] rounded-xs" /> Observé
                </span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-600" /> Théorique (5/90)
                </span>
              </div>
            </div>

            {/* High-Resolution Interactive SVG Bar Chart for 90 Numbers */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 overflow-x-auto">
              <div className="min-w-[850px] h-64 relative flex items-end gap-1 px-2 pt-6 pb-6">
                {/* Theoretical Reference Line */}
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-600 pointer-events-none z-10"
                  style={{
                    bottom: `${Math.min(95, Math.max(5, (expectedCount / maxFreq) * 85 + 24))}px`,
                  }}
                >
                  <span className="absolute right-2 -top-4 text-[10px] font-mono text-emerald-800 bg-white/90 px-1 rounded shadow-2xs font-semibold">
                    E(X) = {expectedCount.toFixed(1)}
                  </span>
                </div>

                {/* 90 Bars */}
                {stats.map((s) => {
                  const heightPct = (s.count / maxFreq) * 100;
                  const isHovered = hoveredNumber?.num === s.num;
                  const isAnomaly = s.isSignificant;

                  return (
                    <div
                      key={s.num}
                      onMouseEnter={() => setHoveredNumber(s)}
                      onMouseLeave={() => setHoveredNumber(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Bar Column */}
                      <div
                        className={`w-full rounded-t-xs transition-all duration-100 ${
                          isAnomaly
                            ? 'bg-amber-600 group-hover:bg-amber-700'
                            : isHovered
                            ? 'bg-[#0A291E]'
                            : 'bg-[#0F3E2E] group-hover:bg-[#00271B]'
                        }`}
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />

                      {/* Number Label below (every 5 numbers or on hover) */}
                      <span className="text-[9px] font-mono text-slate-400 mt-1 select-none">
                        {s.num % 5 === 0 || isHovered ? s.num : '·'}
                      </span>

                      {/* Interactive Tooltip */}
                      {isHovered && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white rounded p-2 text-[11px] shadow-lg whitespace-nowrap pointer-events-none">
                          <div className="font-bold flex items-center gap-1.5 border-b border-slate-700 pb-1 mb-1">
                            <LotteryBall number={s.num} variant="hot" size="sm" />
                            <span>Numéro {s.num}</span>
                          </div>
                          <div className="font-mono space-y-0.5">
                            <div>Sorties : {s.count} ({((s.relativeFreq || 0) * 100).toFixed(2)}%)</div>
                            <div>Écart actuel : {s.currentGap} tirages</div>
                            <div>Écart max : {s.maxGap} tirages</div>
                            <div>Chi² : {s.chi2Value} (p = {s.pValue})</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick summary stats footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 font-sans block text-[11px]">Numéro le plus fréquent :</span>
                {(() => {
                  const top = [...stats].sort((a, b) => b.count - a.count)[0];
                  return (
                    <span className="font-bold text-slate-900 text-sm">
                      N°{top.num} ({top.count} sorties)
                    </span>
                  );
                })()}
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 font-sans block text-[11px]">Numéro le moins fréquent :</span>
                {(() => {
                  const bot = [...stats].sort((a, b) => a.count - b.count)[0];
                  return (
                    <span className="font-bold text-slate-900 text-sm">
                      N°{bot.num} ({bot.count} sorties)
                    </span>
                  );
                })()}
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 font-sans block text-[11px]">Plus grand retard actuel :</span>
                {(() => {
                  const topGap = [...stats].sort((a, b) => b.currentGap - a.currentGap)[0];
                  return (
                    <span className="font-bold text-slate-900 text-sm">
                      N°{topGap.num} ({topGap.currentGap} tirages)
                    </span>
                  );
                })()}
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 font-sans block text-[11px]">Anomalies Chi² (p &lt; 0.01) :</span>
                <span className="font-bold text-amber-700 text-sm">
                  {anomalies.length} détectée{anomalies.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. GAPS (ÉCARTS) MATRIX */}
        {activeSubTab === 'gaps' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Matrice des Écarts Actuels (1 à 90)
                </h3>
                <p className="text-xs text-slate-500">
                  Nombre de tirages consécutifs écoulés depuis la dernière apparition de chaque numéro.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  Sorti récemment (&le; 5)
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  Moyen (6 à 25)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-[#B45309] border border-amber-200 font-medium">
                  Retard élevé (&gt; 25)
                </span>
              </div>
            </div>

            {/* 9x10 Grid View */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              {stats.map((s) => {
                let badgeStyle = 'bg-white border-slate-200 text-slate-800';
                if (s.currentGap <= 5) {
                  badgeStyle = 'bg-emerald-50/80 border-emerald-300 text-emerald-900';
                } else if (s.currentGap > 25) {
                  badgeStyle = 'bg-amber-50 border-amber-300 text-amber-900 font-bold';
                }

                return (
                  <div
                    key={s.num}
                    className={`p-2 rounded border flex flex-col items-center justify-center text-center shadow-2xs transition-colors hover:border-[#0F3E2E] ${badgeStyle}`}
                  >
                    <span className="font-heading font-bold text-sm">{s.num}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      retard: {s.currentGap}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. CHI² TEST & ANOMALIES */}
        {activeSubTab === 'chi2' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Test d'Adéquation du Chi² (Degré de Liberté = 1)
                </h3>
                <p className="text-xs text-slate-500">
                  Seuil critique de significativité : χ² &gt; 6.635 correspondant à une valeur-p &lt; 0.01 (99% de confiance).
                </p>
              </div>
              <div className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                Seuil α = 0.01 (χ² = 6.635)
              </div>
            </div>

            {anomalies.length > 0 ? (
              <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>
                    {anomalies.length} numéro{anomalies.length > 1 ? 's' : ''} présente{anomalies.length > 1 ? 'nt' : ''} une déviation statistiquement significative :
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {anomalies.map((a) => (
                    <div
                      key={a.num}
                      className="p-3 bg-white rounded border border-amber-200 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LotteryBall number={a.num} variant="hot" size="sm" />
                          <span className="font-bold text-xs text-slate-900">Numéro {a.num}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          p = {a.pValue}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 space-y-0.5">
                        <div>Observé : {a.count} sorties</div>
                        <div>Attendu théorique : {expectedCount.toFixed(1)}</div>
                        <div>Valeur χ² : {a.chi2Value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs sm:text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0F3E2E] shrink-0 mt-0.5" />
                <div>
                  <strong>Conformité stochastique globale :</strong> Aucun numéro ne franchit le seuil critique du Chi² (p &lt; 0.01). Les fluctuations observées sont totalement compatibles avec les lois de tirages indépendants et équitables du Loto Bonheur CI.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TOP PAIRS */}
        {activeSubTab === 'pairs' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Paires les Plus Fréquentes (Sorties Simultanées)
              </h3>
              <p className="text-xs text-slate-500">
                Fréquence des duos de sphères sortis dans le même tirage de 5 numéros.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {topPairs.map((p, idx) => (
                <div
                  key={`${p.pair[0]}-${p.pair[1]}`}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <LotteryBall number={p.pair[0]} variant="emerald" size="sm" />
                    <span className="text-slate-400 font-bold">+</span>
                    <LotteryBall number={p.pair[1]} variant="emerald" size="sm" />
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-slate-900">{p.count} fois</div>
                    <div className="text-[10px] text-slate-400">
                      {((p.relativeFreq || 0) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SUMS & PARITY */}
        {activeSubTab === 'sums' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Distribution de la Somme des 5 Numéros & Répartition Pairs/Impairs
              </h3>
              <p className="text-xs text-slate-500">
                La somme de 5 entiers indépendants choisis parmi 1..90 suit une distribution approximativement normale centrée sur µ = 5 × 45.5 = 227.5.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 font-sans block text-[11px]">Moyenne théorique :</span>
                <span className="font-bold text-slate-900 text-sm">227.5</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 font-sans block text-[11px]">Moyenne observée (échantillon) :</span>
                <span className="font-bold text-slate-900 text-sm">{sumMetrics.avgSum.toFixed(1)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 font-sans block text-[11px]">Intervalle 95% typique :</span>
                <span className="font-bold text-slate-900 text-sm">115 — 340</span>
              </div>
            </div>

            {/* Sums Timeline Visual Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-mono uppercase text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Tirage</th>
                    <th className="px-3 py-2">Somme</th>
                    <th className="px-3 py-2">Écart à la moyenne</th>
                    <th className="px-3 py-2">Parité (Pairs / Impairs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                  {sumMetrics.sums.slice(0, 25).map((s, idx) => {
                    const delta = s.sum - 227.5;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-600">{s.date}</td>
                        <td className="px-3 py-2 font-semibold">{s.name} ({s.time})</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{s.sum}</td>
                        <td className={`px-3 py-2 ${delta >= 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 mr-1.5 font-bold">
                            {s.evenCount}P
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {s.oddCount}I
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
