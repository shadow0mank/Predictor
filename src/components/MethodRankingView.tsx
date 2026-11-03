import React, { useState, useMemo } from 'react';
import { Draw, MethodRankingItem } from '../types/lottery';
import { evaluateAllMethodsRanking, evaluateHourlyMethodsRanking } from '../utils/matrixAlgorithm';
import { LotteryBall } from './LotteryBall';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Target,
  CheckCircle2,
  ListOrdered,
  Sparkles,
  BarChart3,
  Calendar,
  Grid,
  Info,
  Clock,
  ShieldCheck,
  Zap,
  Check,
  Compass,
} from 'lucide-react';

interface MethodRankingViewProps {
  draws: Draw[];
}

export const MethodRankingView: React.FC<MethodRankingViewProps> = ({ draws }) => {
  const [sampleSize, setSampleSize] = useState<number>(50);
  const [selectedMethodId, setSelectedMethodId] = useState<
    'all' | 'method1' | 'method2' | 'method3' | 'method4' | 'method5'
  >('all');
  const [selectedHourlySlot, setSelectedHourlySlot] = useState<string>('10:00');

  const ranking = useMemo(() => {
    return evaluateAllMethodsRanking(draws, sampleSize);
  }, [draws, sampleSize]);

  const hourlyRankings = useMemo(() => {
    return evaluateHourlyMethodsRanking(draws, 35);
  }, [draws]);

  const activeHourlySlotData = useMemo(() => {
    return (
      hourlyRankings.find((h) => h.hour === selectedHourlySlot) || hourlyRankings[0]
    );
  }, [hourlyRankings, selectedHourlySlot]);

  const bestMethod = ranking[0];


  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#0F3E2E] flex items-center justify-center text-white">
                <Trophy className="w-4 h-4 text-[#FE932C]" />
              </div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 tracking-tight">
                Classement des Méthodes & Précision par Position
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Classement objectif calculé sur l'historique officiel <strong>Loto Matrice Plus (Côte d'Ivoire)</strong>. 
              Mesure le nombre total de numéros gagnants exacts fournis par chaque méthode et leur précision selon leur rang de prédiction (Positions 1 à 5).
            </p>
          </div>

          {/* Sample Size Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              Échantillon de test :
            </span>
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => setSampleSize(size)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                    sampleSize === size
                      ? 'bg-[#0F3E2E] text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {size} tirages
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Podium Highlight */}
        {bestMethod && (
          <div className="bg-gradient-to-r from-emerald-50/80 via-amber-50/50 to-emerald-50/80 border border-emerald-200/80 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FE932C] text-slate-900 flex items-center justify-center font-heading font-black text-lg shadow-sm shrink-0">
                #1
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Méthode la plus performante sur {sampleSize} tirages
                </div>
                <div className="text-base sm:text-lg font-heading font-bold text-slate-900">
                  {bestMethod.name}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="px-3 py-1.5 bg-white/90 border border-emerald-200 rounded text-center">
                <span className="text-slate-400 block text-[10px] font-sans">Gagnants exacts trouvés</span>
                <span className="text-base font-bold text-[#0F3E2E]">{bestMethod.totalHits}</span>
                <span className="text-[10px] text-slate-500 font-sans block">
                  ({bestMethod.avgHitsPerDraw} / tirage)
                </span>
              </div>
              <div className="px-3 py-1.5 bg-white/90 border border-emerald-200 rounded text-center">
                <span className="text-slate-400 block text-[10px] font-sans">Succès ≥ 1 numéro</span>
                <span className="text-base font-bold text-slate-800">{bestMethod.successRateAtLeast1}%</span>
                <span className="text-[10px] text-slate-500 font-sans block">des tirages</span>
              </div>
              <div className="px-3 py-1.5 bg-white/90 border border-emerald-200 rounded text-center">
                <span className="text-slate-400 block text-[10px] font-sans">Succès ≥ 2 numéros</span>
                <span className="text-base font-bold text-slate-800">{bestMethod.successRateAtLeast2}%</span>
                <span className="text-[10px] text-slate-500 font-sans block">des tirages</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Grid: The 5 Methods Ranked */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-[#0F3E2E]" />
            <span>Classement Général des 5 Méthodes (Ordre de Réussite Global)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Source : Loto Matrice Plus & GhanaWeb · Historique CI
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {ranking.map((method) => {
            const isFirst = method.rank === 1;
            const rankColors: Record<number, string> = {
              1: 'bg-amber-400 text-slate-950 border-amber-500 font-extrabold',
              2: 'bg-slate-300 text-slate-900 border-slate-400 font-bold',
              3: 'bg-amber-700/80 text-white border-amber-800 font-bold',
              4: 'bg-slate-200 text-slate-700 border-slate-300',
              5: 'bg-slate-100 text-slate-600 border-slate-200',
            };

            return (
              <div
                key={method.id}
                className={`bg-white border rounded-lg p-4 shadow-xs flex flex-col justify-between transition-all ${
                  isFirst
                    ? 'border-emerald-400 ring-2 ring-emerald-500/25 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badge & Rank */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-heading text-xs border shadow-2xs ${
                        rankColors[method.rank] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      #{method.rank}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {method.shortName}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-snug min-h-[2.5rem] line-clamp-2">
                      {method.name}
                    </h4>
                  </div>

                  {/* Big Number of Hits */}
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-md">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Gagnants Exacts
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="font-heading font-extrabold text-xl text-[#0F3E2E]">
                        {method.totalHits}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        / {method.drawsEvaluated * 5}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">
                      Moy : <strong>{method.avgHitsPerDraw}</strong> / tirage
                    </div>
                  </div>

                  {/* Multi-hit Success Rates */}
                  <div className="space-y-1.5 text-xs font-mono pt-1">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-sans text-[10px] text-slate-500">≥ 1 gagnant :</span>
                      <span className="font-bold text-slate-800 text-[11px]">{method.successRateAtLeast1}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${Math.min(100, method.successRateAtLeast1)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-slate-600 pt-0.5">
                      <span className="font-sans text-[10px] text-slate-500">≥ 2 gagnants :</span>
                      <span className="font-bold text-slate-800 text-[11px]">{method.successRateAtLeast2}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, method.successRateAtLeast2 * 2.5)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-slate-600 pt-0.5">
                      <span className="font-sans text-[10px] text-slate-500">≥ 3 gagnants :</span>
                      <span className="font-bold text-slate-800 text-[11px]">{method.successRateAtLeast3}%</span>
                    </div>
                  </div>
                </div>

                {/* Best position summary */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Meilleure pos :</span>
                    <span className="font-bold text-[#0F3E2E]">
                      {(() => {
                        const entries = Object.entries(method.positionStats) as [
                          keyof typeof method.positionStats,
                          (typeof method.positionStats)['pos1']
                        ][];
                        entries.sort((a, b) => b[1].hits - a[1].hits);
                        const top = entries[0];
                        const posMap: Record<string, string> = {
                          pos1: 'Pos 1',
                          pos2: 'Pos 2',
                          pos3: 'Pos 3',
                          pos4: 'Pos 4',
                          pos5: 'Pos 5',
                        };
                        return `${posMap[top[0]]} (${top[1].hitRate}%)`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION REQUISE: Classement Précis des Méthodes par Heure de Jeu (Tranches Horaires) */}
      <div className="bg-white border-2 border-emerald-900/10 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FE932C]/15 text-[#FE932C] flex items-center justify-center font-bold">
                <Clock className="w-4 h-4 text-[#FE932C]" />
              </div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <span>Classement des Méthodes par Heure de Jeu (Tranches de la Journée)</span>
                <span className="text-[11px] font-sans font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Aide au Choix
                </span>
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              La précision des méthodes varie selon les tranches horaires. Ce classement spécial évalue
              l'exactitude historique de chaque méthode <strong>filtrée par heure de tirage</strong> afin de vous indiquer
              exactement quelle méthode privilégier selon l'heure de votre jeu.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
            <Compass className="w-3.5 h-3.5 text-[#0F3E2E]" />
            <span>4 tranches horaires analysées</span>
          </div>
        </div>

        {/* 4 Time Slots Quick Selection Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {hourlyRankings.map((hSlot) => {
            const isSelected = selectedHourlySlot === hSlot.hour;
            const hourIcons: Record<string, string> = {
              '10:00': '🌅',
              '13:00': '☀️',
              '16:00': '🌇',
              '18:15': '🌙',
            };

            return (
              <button
                key={hSlot.hour}
                onClick={() => setSelectedHourlySlot(hSlot.hour)}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-[#0F3E2E] bg-[#0F3E2E]/5 ring-2 ring-[#0F3E2E]/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-sm">{hourIcons[hSlot.hour] || '🕒'}</span>
                    {hSlot.hour}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-[#0F3E2E] bg-emerald-100 px-1.5 py-0.5 rounded">
                      Actif
                    </span>
                  )}
                </div>

                <div className="text-xs font-heading font-semibold text-slate-800 line-clamp-1 mb-2">
                  {hSlot.slotName.split('·')[1]?.trim() || hSlot.slotName}
                </div>

                {/* Best method tag */}
                <div className="pt-2 border-t border-slate-100/80">
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Recommandée :</div>
                  <div className="text-[11px] font-bold text-[#0F3E2E] truncate">
                    {hSlot.bestMethodName.split('·')[1]?.trim() || hSlot.bestMethodName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {hSlot.bestMethodHitRate}% de réussite
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Hour Deep-Dive Card */}
        {activeHourlySlotData && (
          <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 sm:p-5 space-y-4">
            {/* Hour Recommendation Spotlight */}
            <div className="bg-white border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-heading font-bold text-lg shrink-0">
                  <Zap className="w-5 h-5 text-[#FE932C]" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    Conseil d'Aide à la Décision · Tirage de {activeHourlySlotData.hour}
                  </div>
                  <div className="text-base font-heading font-bold text-slate-900">
                    Méthode Conseillée : {activeHourlySlotData.bestMethodName}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sur ce créneau horaire précis, cette méthode affiche un taux de réussite de{' '}
                    <strong className="text-emerald-700">{activeHourlySlotData.bestMethodHitRate}%</strong> (au moins 1 numéro exact).
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-center shrink-0">
                <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wide">
                  Statut Conseillé
                </span>
                <span className="text-xs font-heading font-extrabold text-[#0F3E2E] flex items-center gap-1 justify-center">
                  <Check className="w-3.5 h-3.5" /> Choix Optimal
                </span>
              </div>
            </div>

            {/* Ranking Table for this Specific Hour */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Award className="w-3.5 h-3.5 text-[#FE932C]" />
                  Classement complet des méthodes pour le créneau {activeHourlySlotData.hour} :
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {activeHourlySlotData.drawsEvaluated} tirages de {activeHourlySlotData.hour} évalués
                </span>
              </div>

              <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-700 font-heading font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center">Rang</th>
                      <th className="py-2.5 px-3">Méthode de Prédiction</th>
                      <th className="py-2.5 px-3 text-center">Gagnants Trouvés</th>
                      <th className="py-2.5 px-3 text-center">≥ 1 Gagnant</th>
                      <th className="py-2.5 px-3 text-center">≥ 2 Gagnants</th>
                      <th className="py-2.5 px-3 text-center">Pos 1 (Banker)</th>
                      <th className="py-2.5 px-3 text-right">Recommandation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {activeHourlySlotData.rankings.map((m, rIdx) => {
                      const isTop1 = rIdx === 0;
                      const isTop2 = rIdx === 1;

                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isTop1 ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-heading font-bold ${
                                isTop1
                                  ? 'bg-[#FE932C] text-slate-950 shadow-2xs'
                                  : isTop2
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              #{rIdx + 1}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-bold text-slate-900">{m.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{m.shortName}</div>
                          </td>

                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            <span className="text-[#0F3E2E]">{m.totalHits}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({m.avgHitsPerDraw}/t)
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                isTop1
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'text-slate-800'
                              }`}
                            >
                              {m.successRateAtLeast1}%
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                            {m.successRateAtLeast2}%
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <div className="font-bold text-slate-800">
                              {m.positionStats.pos1.hitRate}%
                            </div>
                            <div className="text-[9px] text-slate-400">
                              ({m.positionStats.pos1.hits} fois)
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-sans">
                            {isTop1 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                Choix N°1
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                                Forte Alternative
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 px-2 py-0.5">
                                Complémentaire
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Deep-Dive: Accuracy by Prediction Position (Positions 1 to 5) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#0F3E2E]" />
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
              Analyse Détaillée de la Précision par Position (Pos 1 à Pos 5)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Lorsqu'une méthode recommande 5 numéros ordonnés (Rang 1 à Rang 5), quelle position fournit le plus de numéros gagnants ?
            La colonne <em>Ordre Exact</em> indique le nombre de fois où le numéro prédit en position <code>i</code> est sorti exactement en position <code>i</code> dans le tirage réel.
          </p>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-md overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 font-heading font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Méthode</th>
                <th className="py-2.5 px-3 text-center">Rang</th>
                <th className="py-2.5 px-3 text-center">Pos 1 (Favori 1)</th>
                <th className="py-2.5 px-3 text-center">Pos 2 (Favori 2)</th>
                <th className="py-2.5 px-3 text-center">Pos 3 (Favori 3)</th>
                <th className="py-2.5 px-3 text-center">Pos 4 (Favori 4)</th>
                <th className="py-2.5 px-3 text-center">Pos 5 (Favori 5)</th>
                <th className="py-2.5 px-3 text-right">Total Gagnants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {ranking.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-sans">
                    <div className="font-bold text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{m.shortName}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-800">
                      #{m.rank}
                    </span>
                  </td>

                  {/* Pos 1 */}
                  <td className="py-3 px-3 text-center">
                    <div className="font-bold text-slate-800">
                      {m.positionStats.pos1.hits} / {m.drawsEvaluated}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      {m.positionStats.pos1.hitRate}%
                    </div>
                    {m.positionStats.pos1.exactOrderHits > 0 && (
                      <div className="text-[9px] text-amber-600">
                        ({m.positionStats.pos1.exactOrderHits} ordre exact)
                      </div>
                    )}
                  </td>

                  {/* Pos 2 */}
                  <td className="py-3 px-3 text-center">
                    <div className="font-bold text-slate-800">
                      {m.positionStats.pos2.hits} / {m.drawsEvaluated}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      {m.positionStats.pos2.hitRate}%
                    </div>
                    {m.positionStats.pos2.exactOrderHits > 0 && (
                      <div className="text-[9px] text-amber-600">
                        ({m.positionStats.pos2.exactOrderHits} ordre exact)
                      </div>
                    )}
                  </td>

                  {/* Pos 3 */}
                  <td className="py-3 px-3 text-center">
                    <div className="font-bold text-slate-800">
                      {m.positionStats.pos3.hits} / {m.drawsEvaluated}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      {m.positionStats.pos3.hitRate}%
                    </div>
                    {m.positionStats.pos3.exactOrderHits > 0 && (
                      <div className="text-[9px] text-amber-600">
                        ({m.positionStats.pos3.exactOrderHits} ordre exact)
                      </div>
                    )}
                  </td>

                  {/* Pos 4 */}
                  <td className="py-3 px-3 text-center">
                    <div className="font-bold text-slate-800">
                      {m.positionStats.pos4.hits} / {m.drawsEvaluated}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      {m.positionStats.pos4.hitRate}%
                    </div>
                    {m.positionStats.pos4.exactOrderHits > 0 && (
                      <div className="text-[9px] text-amber-600">
                        ({m.positionStats.pos4.exactOrderHits} ordre exact)
                      </div>
                    )}
                  </td>

                  {/* Pos 5 */}
                  <td className="py-3 px-3 text-center">
                    <div className="font-bold text-slate-800">
                      {m.positionStats.pos5.hits} / {m.drawsEvaluated}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      {m.positionStats.pos5.hitRate}%
                    </div>
                    {m.positionStats.pos5.exactOrderHits > 0 && (
                      <div className="text-[9px] text-amber-600">
                        ({m.positionStats.pos5.exactOrderHits} ordre exact)
                      </div>
                    )}
                  </td>

                  {/* Total Hits */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-bold text-sm text-[#0F3E2E]">
                      {m.totalHits}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {m.avgHitsPerDraw} / tirage
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Position Visual Comparison Chart */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Comparatif Graphique du Taux de Réussite par Position (%)
            </span>
            <span className="text-[11px] text-slate-400">
              Espérance théorique du hasard pur : ~5.55% par position
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {[1, 2, 3, 4, 5].map((posIdx) => {
              const posKey = `pos${posIdx}` as keyof MethodRankingItem['positionStats'];
              return (
                <div key={posIdx} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                    <span>Position {posIdx}</span>
                    <span className="font-mono text-slate-500">
                      Taux d'apparition moyen :{' '}
                      {(
                        ranking.reduce((acc, m) => acc + m.positionStats[posKey].hitRate, 0) /
                        ranking.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {ranking.map((m) => {
                      const stat = m.positionStats[posKey];
                      return (
                        <div key={m.id} className="space-y-0.5">
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span className="truncate">{m.shortName}</span>
                            <span className="font-bold text-slate-800">{stat.hitRate}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                m.rank === 1
                                  ? 'bg-[#0F3E2E]'
                                  : m.rank === 2
                                  ? 'bg-emerald-600'
                                  : m.rank === 3
                                  ? 'bg-amber-600'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${Math.min(100, stat.hitRate * 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Historical Verification Log: Proof on Recent Draws */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <span>Dépouillement des Prédictions Rétrospectives par Tirage Réel</span>
            </h3>
            <p className="text-xs text-slate-500">
              Vérification concrète tirage par tirage. Les numéros trouvés sont surlignés avec la position exacte prédite.
            </p>
          </div>

          {/* Filter method for trace */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Filtrer méthode :</span>
            <select
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value as any)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded bg-white text-slate-800 focus:outline-hidden"
            >
              <option value="all">Toutes les 5 méthodes</option>
              <option value="method1">Méthode 1 (Fréquences)</option>
              <option value="method2">Méthode 2 (Chance)</option>
              <option value="method3">Méthode 3 (Rétro-Ingénierie)</option>
              <option value="method4">Méthode 4 (Matrices CI)</option>
              <option value="method5">Méthode 5 (GhanaWeb & Fréquences)</option>
            </select>

          </div>
        </div>

        {/* Trace List */}
        <div className="space-y-4">
          {bestMethod.recentMatches.slice(0, 8).map((match, idx) => {
            return (
              <div
                key={idx}
                className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3"
              >
                {/* Draw Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                      {match.drawName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {match.drawDate} ({match.drawTime})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Tirage officiel :</span>
                    <div className="flex items-center gap-1">
                      {match.realNumbers.map((num) => (
                        <LotteryBall key={num} number={num} variant="default" size="sm" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4 Methods Predictions for this draw */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {ranking
                    .filter((m) => selectedMethodId === 'all' || m.id === selectedMethodId)
                    .map((method) => {
                      const mMatch = method.recentMatches[idx];
                      if (!mMatch) return null;

                      const hitSet = new Set(mMatch.matchedDetails.map((d) => d.num));

                      return (
                        <div
                          key={method.id}
                          className={`p-2.5 rounded border text-xs space-y-2 ${
                            mMatch.hitsCount >= 2
                              ? 'bg-amber-50/80 border-amber-300'
                              : mMatch.hitsCount === 1
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-[11px] truncate">
                              {method.shortName}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                mMatch.hitsCount >= 2
                                  ? 'bg-amber-200 text-amber-900'
                                  : mMatch.hitsCount === 1
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {mMatch.hitsCount} gagnant{mMatch.hitsCount > 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Predicted Numbers Row with Position tags */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {mMatch.predictedNumbers.map((pNum, pIdx) => {
                              const isHit = hitSet.has(pNum);
                              const detail = mMatch.matchedDetails.find((d) => d.num === pNum);

                              return (
                                <div key={pNum} className="flex flex-col items-center">
                                  <LotteryBall
                                    number={pNum}
                                    variant={isHit ? 'consensus' : 'default'}
                                    size="sm"
                                  />
                                  <span
                                    className={`text-[9px] font-mono ${
                                      isHit
                                        ? 'text-emerald-700 font-bold'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    P{pIdx + 1}
                                    {detail?.isExactOrder && '★'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Details breakdown */}
                          {mMatch.matchedDetails.length > 0 && (
                            <div className="text-[10px] text-slate-600 font-mono space-y-0.5 border-t border-slate-200/60 pt-1">
                              {mMatch.matchedDetails.map((det) => (
                                <div key={det.num} className="flex items-center justify-between">
                                  <span>
                                    N°{det.num} : Prédit P{det.predictedPos} → Tiré P{det.realPos}
                                  </span>
                                  {det.isExactOrder && (
                                    <span className="text-amber-700 font-bold">Ordre Exact !</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institutional Transparency Note */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-800">
            Protocole de Benchmark Indépendant & Déontologie
          </div>
          <p className="leading-relaxed">
            Ce classement est établi de manière déterministe et reproductible par simulation out-of-sample sur les données historiques certifiées de l'application mobile <strong>Loto Matrice Plus</strong>. 
            Aucun tirage futur n'est garanti : ces statistiques quantifient la performance passée des modélisations pour éclairer le joueur de façon transparente.
          </p>
        </div>
      </div>
    </div>
  );
};
