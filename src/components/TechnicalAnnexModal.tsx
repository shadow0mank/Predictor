import React, { useState } from 'react';
import { X, BookOpen, CheckCircle, Code2, AlertCircle } from 'lucide-react';

interface TechnicalAnnexModalProps {
  initialMethod?: 1 | 2 | 3 | 4 | 5;
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalAnnexModal: React.FC<TechnicalAnnexModalProps> = ({
  initialMethod = 1,
  isOpen,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<1 | 2 | 3 | 4 | 5>(initialMethod);

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
        <div className="flex flex-wrap border-b border-slate-200 bg-white px-6 gap-3 sm:gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveSubTab(1)}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 1
                ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            C.1 · Méthode 1 (Fréquences)
          </button>
          <button
            onClick={() => setActiveSubTab(2)}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 2
                ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            C.2 · Méthode 2 (Chance)
          </button>
          <button
            onClick={() => setActiveSubTab(3)}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 3
                ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            C.3 · Méthode 3 (Rétro-ingénierie)
          </button>
          <button
            onClick={() => setActiveSubTab(4)}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 4
                ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            C.4 · Méthode 4 (Matrices CI)
          </button>
          <button
            onClick={() => setActiveSubTab(5)}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 5
                ? 'border-[#0F3E2E] text-[#0F3E2E] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            C.5 · Méthode 5 (GhanaWeb & Fréquences)
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
                <div className="font-sans font-semibold text-slate-900">1. Échelon Cas par Cas & Rétro-Ingénierie des Duos :</div>
                <div className="space-y-1 text-slate-700 font-sans">
                  <p>L'analyse s'effectue dans l'ordre chronologique décroissant sur les tirages du jeu ciblé (ex: Akwaba, Kado, Étoile, Fortune, Diamant). Pour chaque duo consécutif (D_{'{k+1}'} → D_{'{k}'}), le système prend les numéros gagnants (W) et machines (M) du tirage précédent pour identifier l'opérateur mathématique exact ayant produit chaque numéro gagnant :</p>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 font-mono text-xs">
                    <li><strong>Répétition Directe :</strong> <code>W[P] = W_prev[j]</code></li>
                    <li><strong>Migration Machine :</strong> <code>W[P] = M_prev[j]</code></li>
                    <li><strong>Delta Positionnel (±1..±3) :</strong> <code>W[P] = (W_prev[P] ± δ - 1 mod 90) + 1</code></li>
                    <li><strong>Saut Colonne Grille 9×10 :</strong> <code>W[P] = (W_prev[j] ± 10 - 1 mod 90) + 1</code></li>
                    <li><strong>Miroir Décimal (Inversion) :</strong> Inversion unités/dizaines (ex: 24 ↔ 42)</li>
                    <li><strong>Complémentaire à 90 / 91 :</strong> <code>W[P] = 90 - W_prev[j]</code></li>
                    <li><strong>Somme & Différence Modulo 90 :</strong> Combinaison de paires gagnantes précédentes</li>
                  </ul>
                </div>

                <div className="font-sans font-semibold text-slate-900 pt-2">2. Synthèse de Correspondance par Position (P₁ à P₅) :</div>
                <p className="font-sans text-slate-700">
                  L'opérateur dominant à chaque position à travers les différents duos est retenu puis appliqué directement aux résultats du dernier tirage certifié (D₀) pour générer des numéros gagnants précis. Un ancrage empirique Two-Sure (dyade de plus forte co-occurrence) verrouille l'objectif d'au moins 2 numéros gagnants.
                </p>

                <div className="font-sans font-semibold text-slate-900 pt-2">Algorithme de calibration multi-features (pseudo-code) :</div>
                <pre className="p-3 bg-white border border-slate-200 rounded text-slate-800 overflow-x-auto text-[11px]">
{`# 1. Échelon Cas par Cas sur le jeu en ordre décroissant
duos = [(draws[k+1], draws[k]) for k in range(1, 5)]
formules_duos = [resoudre_operateurs_positionnels(prev, curr) for prev, curr in duos]

# 2. Synthèse de Correspondance et application à D_0
synthese_positions = evaluer_operateurs_dominants(formules_duos)
predictions_synthese = [appliquer(op_dom, draws[0]) for op_dom in synthese_positions]

# 3. Ancrage Two-Sure & Validation out-of-sample (>= 2 corrects)
anchor_pair = trouver_dyade_optimale(draws)
recommandes5 = fusionner_synthese_et_ancre(predictions_synthese, anchor_pair)`}
                </pre>
              </div>
            </div>
          )}

          {/* C.4 */}
          {activeSubTab === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-semibold text-base text-slate-900 mb-1">
                  C.4 — Processus de la Méthode 4 (Matrices Côte d'Ivoire · Loto Matrice Plus)
                </h3>
                <p className="text-slate-600">
                  Cette méthode exploite les matrices quotidiennes réelles extraites de l'application mobile <strong>Loto Matrice Plus</strong> (champ <code>matricesci</code>). Chaque tirage officiel (Étoile 13H, Réveil 10H, Akwaba 16H, Afterwork 19H) est associé à une clé matricielle à 12 chiffres, un Clavier numérique, un Event et un Code.
                </p>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">1. Décomposition de la Clé Matricielle (12 chiffres) :</div>
                <div className="text-slate-600">
                  La chaîne est découpée en 4 triplets de 3 chiffres : <code>T1 T2 T3 T4</code> (ex : <code>218 627 202 943</code>).
                  Pour chaque triplet <code>d1 d2 d3</code> :
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 font-mono text-xs">
                    <li>Paire directe gauche : <code>P1 = 10*d1 + d2</code> (ex: 21)</li>
                    <li>Paire directe droite : <code>P2 = 10*d2 + d3</code> (ex: 18)</li>
                    <li>Somme modulo 90 : <code>S = ((T - 1) mod 90) + 1</code> (ex: 218 mod 90 = 38)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">2. Résonance Pivot Matrice-Clavier :</div>
                <p className="text-slate-600">
                  Les paires directes du <code>CLAVIER</code> sont également décomposées. Un numéro apparaissant à la fois dans la Matrice et dans le Clavier est classé <strong>« Pivot Matrice-Clavier »</strong> et reçoit la pondération maximale (score de base 60).
                </p>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">3. Décodage des Composantes Event & Code :</div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Event</strong> : valeur directe, son complément à 90 (<code>90 - val</code>), et son miroir inversion (ex : <code>26 ⇄ 62</code>).</li>
                  <li><strong>Code</strong> : valeur directe, extraction des paires de 2 chiffres, et somme des chiffres (ex : <code>193 → 1+9+3 = 13</code>).</li>
                </ul>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">4. Pondération Fréquentielle Historique :</div>
                <p className="text-slate-600">
                  Chaque numéro candidat issu des matrices est modulé par sa fréquence historique réelle observée dans l'Historique Côte d'Ivoire pour la tranche horaire ciblée :
                  <br />
                  <code className="text-xs bg-white px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                    Score_Total = Score_Matrice + 15 * (Freq / MaxFreq) + Bonus_Écart
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* C.5 */}
          {activeSubTab === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-heading font-semibold text-base text-slate-900 mb-1">
                  C.5 — Processus de la Méthode 5 (Pronostics Web GhanaWeb & Hybridation Fréquentielle)
                </h3>
                <p className="text-slate-600">
                  Cette méthode intègre les pronostics spécialisés publiés sur{' '}
                  <strong className="text-slate-900">GhanaWeb Solutions</strong> (URL source :{' '}
                  <a
                    href="https://www.ghanawebsolutions.com/serve.php?id=2073&d=Pronostic-Loto-Gratuit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 underline font-mono text-xs"
                  >
                    ghanawebsolutions.com/serve.php?id=2073&d=Pronostic-Loto-Gratuit
                  </a>
                  ) et les croise avec la distribution fréquentielle historique propre à chaque heure de tirage de la Lonaci.
                </p>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">1. Règle d'Égalité Stricte (Prédictions & Machines) :</div>
                <p className="text-slate-600">
                  Contrairement aux approches dogmatiques, l'algorithme prend <strong>au même degré</strong> les numéros des prédictions (Banker, Two Sure, Permutation) et ceux issus des tirages <strong>Machines</strong> comme autant de candidats légitimes et potentiellement gagnants :
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Prédictions (Banker, Two Sure, Permutation)</strong> : Injectées avec un poids de base égalitaire de <strong>25 points</strong>.</li>
                  <li><strong>Tirage Machine</strong> : Injecté avec le <strong>même poids de base égalitaire de 25 points</strong>.</li>
                  <li><strong>Présence conjointe (Mixte)</strong> : Si un numéro figure à la fois dans les prédictions et les machines, son éligibilité est renforcée par son double ancrage.</li>
                </ul>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">2. L'Opération de Filtrage par Heure de Tirage :</div>
                <p className="text-slate-600">
                  Pour départager objectivement l'ensemble des candidats réunis, l'algorithme applique l'opération fréquentielle relative à l'heure du tirage sélectionné (10h Akwaba, 13h Étoile, 16h Fortune, 18h15 Diamant) :
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded font-mono text-xs text-[#0F3E2E] font-bold">
                  Score_Final(n) = Base_Égalitaire (25) + [ 35 × ( Fréq_Heure(n) / Max_Fréq_Heure ) ] + Bonus_Écart(n) + Bonus_Global(n)
                </div>
                <p className="text-xs text-slate-500">
                  • <strong>Bonus Fréquence Heure (jusqu'à +35 pts)</strong> : Récompense la cadence historique réelle du numéro à cette heure précise.<br />
                  • <strong>Bonus d'Écart Harmonique (jusqu'à +15 pts)</strong> : Favorise les numéros situés dans la fenêtre optimale de répétition (entre 5 et 35 tirages).<br />
                  • <strong>Bonus Global (jusqu'à +10 pts)</strong> : Mesure l'impulsion globale du numéro sur l'ensemble de la base Lonaci.
                </p>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded">
                <div className="font-semibold text-slate-900">3. Ordonnancement Calibré en Positions 1 à 5 :</div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                  <li><strong>Position 1</strong> : Candidat (Prédiction ou Machine) obtenant le plus haut score combiné pour cette heure de jeu.</li>
                  <li><strong>Position 2</strong> : 2e candidat le plus en phase avec le créneau horaire.</li>
                  <li><strong>Positions 3, 4 et 5</strong> : 3e, 4e et 5e candidats ordonnés par score décroissant de synergie temporelle.</li>
                </ol>
                <p className="text-xs text-slate-500 italic">
                  Un numéro issu de la Machine peut ainsi se hisser en Position 1 ou 2 s'il démontre une affinité statistique supérieure à celle du Banker sur cette tranche horaire précise.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-950 text-xs">
                <strong>Garantie de rigueur :</strong> Tous les numéros partent d'un statut égalitaire. C'est l'opération mathématique fondée sur les données historiques réelles de Côte d'Ivoire qui décide du classement des 5 numéros gagnants.
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
