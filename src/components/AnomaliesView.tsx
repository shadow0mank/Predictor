import React from 'react';
import { Draw } from '../types/lottery';
import { computeNumberStatistics } from '../utils/probability';
import { LotteryBall } from './LotteryBall';
import { AlertTriangle, CheckCircle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface AnomaliesViewProps {
  draws: Draw[];
  isBiasActive: boolean;
  onToggleBias: () => void;
}

export const AnomaliesView: React.FC<AnomaliesViewProps> = ({
  draws,
  isBiasActive,
  onToggleBias,
}) => {
  const stats = computeNumberStatistics(draws);
  const anomalies = stats.filter((s) => s.isSignificant);
  const expected = draws.length * (5 / 90);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 tracking-tight">
              Anomalies & Déviations Statistiques Détectées
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Surveillance continue de la distribution empirique via le test du Chi² (seuil de rejet critique : p &lt; 0.01).
            </p>
          </div>

          <button
            onClick={onToggleBias}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-center ${
              isBiasActive
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isBiasActive ? 'Désactiver le biais injecté' : 'Injecter un biais de test'}</span>
          </button>
        </div>

        {/* Status Callout */}
        {anomalies.length > 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-md text-amber-900 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#92400E]">
              <ShieldAlert className="w-4 h-4 text-[#D97706]" />
              <span>{anomalies.length} anomalie(s) statistique(s) identifiée(s) à α = 0.01</span>
            </div>
            <p className="text-xs text-[#78350F] leading-relaxed">
              Un numéro est classé comme anomalie lorsque l’écart entre sa fréquence observée et son espérance mathématique théorique (5/90 = 5.56%) produit une statistique de Pearson χ² supérieure à 6.635.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-[#0F3E2E] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Aucune anomalie critique détectée : </span>
              <span>
                Sur l'ensemble des 90 numéros du Loto Bonheur CI, aucune sortie ne dévie significativement de la distribution uniforme au seuil p &lt; 0.01. Les tirages observés respectent scrupuleusement l'hypothèse de neutralité mécanique des sphères.
              </span>
            </div>
          </div>
        )}

        {/* Anomalies List */}
        {anomalies.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Fiches détaillées des numéros sous surveillance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomalies.map((a) => {
                const diff = a.count - expected;
                const pctDiff = ((diff / expected) * 100).toFixed(1);

                return (
                  <div
                    key={a.num}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-3">
                        <LotteryBall number={a.num} variant="hot" size="lg" />
                        <div>
                          <div className="font-heading font-bold text-sm text-slate-900">
                            Numéro {a.num}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {diff >= 0 ? 'Sur-représentation' : 'Sous-représentation'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-[#92400E] font-bold text-xs">
                          p = {a.pValue}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">χ² = {a.chi2Value}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 text-[10px] block">Sorties réelles :</span>
                        <span className="font-bold text-slate-900">{a.count}</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 text-[10px] block">Théorique E(X) :</span>
                        <span className="font-medium text-slate-700">{expected.toFixed(1)}</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <span className="text-slate-400 text-[10px] block">Écart relatif :</span>
                        <span className={`font-bold ${diff >= 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                          {diff >= 0 ? `+${pctDiff}%` : `${pctDiff}%`}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                      <strong>Analyse scientifique :</strong>{' '}
                      {diff > 0
                        ? `Le numéro ${a.num} sort avec une fréquence supérieure de ${pctDiff}% à l'espérance normale.`
                        : `Le numéro ${a.num} subit un déficit de tirage significatif.`}{' '}
                      En tirage matériel réel, une telle anomalie peut refléter une micro-variabilité mécanique de la sphère, mais peut aussi être un faux positif stochastique attendu lors du test simultané de 90 variables (correction de Bonferroni).
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scientific Educational Context */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Mise en garde sur la significativité statistique et le paradoxe des tests multiples :</span>
          </div>
          <p>
            Lorsqu'on effectue 90 tests d'hypothèse simultanés au seuil de risque de 1% (α = 0.01), il est mathématiquement probable d'observer <strong>~0.9 « fausse anomalie »</strong> par pur hasard même dans une loterie parfaitement équitable. C'est le phénomène bien documenté de la multiplicité des tests (FWER).
          </p>
        </div>
      </div>
    </div>
  );
};
