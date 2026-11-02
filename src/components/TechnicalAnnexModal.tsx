import React, { useState } from 'react';
import { X, BookOpen, CheckCircle, Code2, AlertCircle } from 'lucide-react';

interface TechnicalAnnexModalProps {
  initialMethod?: 1 | 2 | 3;
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalAnnexModal: React.FC<TechnicalAnnexModalProps> = ({
  initialMethod = 1,
  isOpen,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<1 | 2 | 3>(initialMethod);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#0F3E2E]" />
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                Partie C · Processus Détaillé des Méthodes (Annexes Techniques)
              </h2>
              <p className="text-xs text-slate-500">
                Spécifications algorithmiques, formulations mathématiques et code de référence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveSubTab(1)}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 1
                ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            C.1 · Méthode 1 (Fréquences & Chi²)
          </button>
          <button
            onClick={() => setActiveSubTab(2)}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 2
                ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            C.2 · Méthode 2 (Facteur Chance)
          </button>
          <button
            onClick={() => setActiveSubTab(3)}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 3
                ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            C.3 · Méthode 3 (Rétro-ingénierie & Boucle)
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* C.1 */}
          {activeSubTab === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-semibold text-base text-slate-900 mb-1">
                  C.1 — Processus de la Méthode 1 (Fréquences de sortie)
                </h3>
                <p className="text-slate-600">
                  La Méthode 1 s'appuie sur le dépouillement historique filtré par tranche horaire de tirage (Akwaba 10h, Étoile 13h, Fortune 16h, Diamant 18h15).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3 font-mono text-xs">
                <div className="font-semibold text-slate-900 font-sans">Étapes de calcul :</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                  <li>Filtrer l'historique par la tranche horaire sélectionnée (par défaut les tirages de la plage horaire cible).</li>
                  <li>Pour chaque numéro <code className="bg-white px-1 py-0.5 border border-slate-200 rounded">n ∈ [1, 90]</code>, calculer :
                    <ul className="list-disc list-inside ml-4 mt-1 text-slate-600 font-sans text-xs">
                      <li><strong>Fréquence absolue (O) :</strong> Nombre total de sorties du numéro.</li>
                      <li><strong>Fréquence relative :</strong> % des tirages où le numéro est apparu (théorique : 5/90 ≈ 5.56%).</li>
                      <li><strong>Écart actuel (G) :</strong> Nombre de tirages consécutifs depuis sa dernière apparition.</li>
                    </ul>
                  </li>
                  <li><strong>Test du Chi² (d.d.l = 1) :</strong>
                    <div className="mt-1 bg-white p-2 border border-slate-200 rounded text-slate-800">
                      χ² = (O - E)² / E + ((N - O) - (N - E))² / (N - E)  avec E = N × (5/90)
                    </div>
                    Si p &lt; 0.01 (χ² &gt; 6.635), le numéro présente une anomalie statistique significative par rapport à la distribution uniforme.
                  </li>
                  <li><strong>Score global pondéré :</strong> Score = 0.65 × (Freq / MaxFreq) + 0.25 × (Gap / MaxGap) + (Chi2Significatif ? 0.15 : 0).</li>
                  <li>Trier par score décroissant et retenir le <strong>Top 5</strong>. Proposer en alternative un second Top 5 fondé sur les plus grands écarts (numéros en retard).</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#0F3E2E] shrink-0 mt-0.5" />
                <span>
                  <strong>Repère scientifique :</strong> Sur un tirage parfait non biaisé, chaque numéro a exactement 5/90 (5.56%) de probabilité de sortir à chaque tirage, indépendamment de son écart passé.
                </span>
              </div>
            </div>
          )}

          {/* C.2 */}
          {activeSubTab === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-semibold text-base text-slate-900 mb-1">
                  C.2 — Processus de la Méthode 2 (Facteur Chance)
                </h3>
                <p className="text-slate-600">
                  Cette méthode croise les paramètres spatio-temporels du tirage cible (heure décimale H et somme de date S) avec le top fréquence historique.
                </p>
              </div>

              <div className="space-y-3">
                <div className="border border-slate-200 rounded p-3 bg-slate-50 font-mono text-xs space-y-1">
                  <div className="font-sans font-semibold text-slate-900">Paramètres d'entrée formels :</div>
                  <div>• H = Heure en notation décimale : 10h30 → 10.30 ; 14h05 → 14.05 ; 18h15 → 18.15</div>
                  <div>• J = Jour du mois (1..31) ; M = Mois (1..12) ; A = Année (ex. 2026)</div>
                  <div>• S = J + M + A (somme de date)</div>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50 font-mono text-xs space-y-1">
                  <div className="font-sans font-semibold text-slate-900">Les trois opérations déterministes :</div>
                  <div>• <strong>Opération A :</strong> Op1 = H / S</div>
                  <div>• <strong>Opération B (divisions successives) :</strong> r₀ = Op1, puis rᵢ = H / (r_{'{i-1}'} + i × 0.17) pour i = 1..5 (variante enrichie)</div>
                  <div>• <strong>Opération C :</strong> Op3 = S / H</div>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50 font-mono text-xs space-y-1">
                  <div className="font-sans font-semibold text-slate-900">Extraction et filtrage 1..90 :</div>
                  <div>1. Extraire au minimum 40 chiffres après la virgule de chaque résultat avec précision arbitraire.</div>
                  <div>2. Regrouper les chiffres par paires consécutives : (d₁d₂), (d₃d₄)... → nombres 00 à 99.</div>
                  <div>3. Conserver uniquement les entiers compris dans l'intervalle valide [1, 90].</div>
                  <div>4. Union dédupliquée conservant l'ordre naturel d'apparition.</div>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50 font-mono text-xs space-y-1">
                  <div className="font-sans font-semibold text-slate-900">Croisement avec l'historique :</div>
                  <div>• Les numéros présents à la fois dans l'union Chance et dans les numéros les plus fréquents de la tranche horaire forment les <strong>« Nombres en commun »</strong>.</div>
                  <div>• Complétés si nécessaire par les candidats Chance au plus fort score historique, puis par le reliquat du top-fréquence.</div>
                </div>
              </div>
            </div>
          )}

          {/* C.3 */}
          {activeSubTab === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-semibold text-base text-slate-900 mb-1">
                  C.3 — Processus de la Méthode 3 (Rétro-ingénierie & Boucle de révision)
                </h3>
                <p className="text-slate-600">
                  Modèle d'ajustement adaptatif avec rétro-validation sur le dernier tirage masqué, réajusté jusqu'à obtenir au moins 2 numéros corrects.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <strong>Avertissement scientifique obligatoire (Section C.3.3) :</strong>
                  <p className="mt-1">
                    « Cette méthode atteint son objectif de reproduire ≥ 2 numéros sur les tirages passés (par construction — c'est de l'ajustement sur le passé). Cela ne garantit pas de reproduire ≥ 2 numéros sur les tirages futurs. Sur un tirage équitable, la performance future reste en moyenne celle du hasard (~2.33% pour ≥ 2 bons). La méthode a un intérêt descriptif et exploratoire, pas prédictif garanti. »
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3 font-mono text-xs">
                <div className="font-sans font-semibold text-slate-900">Features descriptives calculées par numéro :</div>
                <div className="space-y-1 text-slate-700">
                  <div>• <code>freq</code> = Moyenne d'apparition sur la fenêtre glissante T</div>
                  <div>• <code>ecart</code> = Nombre de tirages écoulés depuis la dernière apparition</div>
                  <div>• <code>lags</code> = Vecteur binaire d'apparition sur les L tirages immédiatement précédents</div>
                  <div>• <code>ligne / 8, col / 9</code> = Coordonnées spatiales dans la grille matricielle 9×10 (1 à 90)</div>
                  <div>• <code>slot_one_hot</code> = Encodage binaire de la tranche horaire</div>
                </div>

                <div className="font-sans font-semibold text-slate-900 pt-2">Algorithme de révision (pseudo-code) :</div>
                <pre className="p-3 bg-white border border-slate-200 rounded text-slate-800 overflow-x-auto text-[11px]">
{`train, cible = history[:-1], history[-1]
best = None
for it in range(max_iter):
    T, L = config(it) # variation de T (fenêtre) et L (lag)
    weights = init_poids(dim_features(T, L))
    pred_final = predire_top5(train, T, L, slot, weights)
    corrects = len(set(pred_final) & set(cible))
    if corrects >= 2:
        break # Critère atteint
# Application des paramètres validés au tirage à venir
prediction_future = predire_top5(history, best.T, best.L, slot, best.weights)`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0F3E2E] text-white rounded text-xs font-semibold hover:bg-[#0A291E] transition-colors"
          >
            Fermer l'annexe
          </button>
        </div>
      </div>
    </div>
  );
};
