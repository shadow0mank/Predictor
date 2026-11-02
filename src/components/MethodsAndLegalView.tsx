import React from 'react';
import { EthicalBanner } from './EthicalBanner';
import { ShieldCheck, Scale, AlertOctagon, BookOpen, ExternalLink, HelpCircle } from 'lucide-react';

export const MethodsAndLegalView: React.FC = () => {
  return (
    <div className="space-y-6">
      <EthicalBanner />

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-slate-900 tracking-tight">
            Méthodologie Scientifique, Cadre Légal & Éthique
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Déclaration de conformité réglementaire, fondements probabilistes et transparence algorithmique.
          </p>
        </div>

        {/* Section 1: Non-Négociable Scientific Realities */}
        <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/70 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-heading font-semibold text-sm">
            <Scale className="w-4 h-4 text-[#0F3E2E]" />
            <span>Fondements Mathématiques Rigoureux</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Un tirage officiel de Loto Bonheur équitable est un <strong>processus stochastique sans mémoire</strong> (propriété markovienne d'ordre zéro). La probabilité d'obtenir au moins 3 bons numéros sur 5 parmi 90 est strictement fixe :
          </p>

          <div className="bg-white border border-slate-200 rounded p-3 text-xs font-mono space-y-1 text-slate-800">
            <div>• P(≥ 3 numéros gagnants) = C(5, 3)·C(85, 2) / C(90, 5) ≈ 1 chance sur 1 217 (0,082 %)</div>
            <div>• P(≥ 4 numéros gagnants) ≈ 1 chance sur 103 167 (0,00097 %)</div>
            <div>• P(5 numéros gagnants) = 1 / C(90, 5) = 1 chance sur 43 949 268</div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Les concepts empiriques dits de « numéros chauds », de « numéros froids », de « facteur chance » ou de « rétro-ingénierie adaptative » constituent des outils d'exploration descriptive. <strong>Aucune méthode ne permet d'augmenter la probabilité mathématique d'un tirage futur non biaisé.</strong>
          </p>
        </div>

        {/* Section 2: Legal & Institutional Identity */}
        <div className="border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-heading font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#0F3E2E]" />
            <span>Cadre Légal & Monopole Réglementaire en Côte d'Ivoire</span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              Conformément à la législation de la République de Côte d'Ivoire, la <strong>Loterie Nationale de Côte d'Ivoire (LONACI)</strong> détient l'exclusivité et le monopole légal sur l'organisation des jeux de loterie, tirages et paris sur le territoire national.
            </p>
            <p>
              Le présent site web :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
              <li><strong>N'est pas un opérateur de jeux d'argent</strong> et n'enregistre aucune mise, pari ou transaction financière.</li>
              <li><strong>Ne vend aucun numéro ni pronostic payant</strong>. L'ensemble des données, algorithmes et historiques sont 100% gratuits et librement accessibles.</li>
              <li><strong>Ne possède aucun partenariat commercial ou affiliation officielle</strong> avec la LONACI ou avec l'éditeur de l'application Lotto Matrice Plus (ODO GROUP CI). Les marques citées demeurent la propriété exclusive de leurs ayants droit respectifs.</li>
              <li>Publie uniquement les résultats officiels des 5 numéros gagnants (les numéros machines ne font l'objet d'aucun calcul spéculatif).</li>
            </ul>
          </div>
        </div>

        {/* Section 3: Responsible Gaming & Addiction Prevention */}
        <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#92400E] font-heading font-semibold text-sm">
            <AlertOctagon className="w-4 h-4 text-[#D97706]" />
            <span>Prévention de l'Addiction & Jeu Responsable</span>
          </div>

          <p className="text-xs text-[#78350F] leading-relaxed">
            Le jeu comporte des risques majeurs : endettement, isolement social, dépendance psychologique. Jouez uniquement pour le divertissement et ne misez jamais des sommes nécessaires à votre subsistance ou à celle de vos proches.
          </p>

          <div className="bg-white border border-amber-200 rounded p-3 text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900">Structures d'écoute et d'assistance en Côte d'Ivoire :</div>
            <div>• Institut National d'Hygiène Publique (INHP) — Service d'addictologie : +225 27 20 21 00 00</div>
            <div>• Association d'aide aux joueurs dépendants (Abidjan) : Consultation confidentielle et gratuite</div>
            <div>• Ligne Verte d'assistance psychologique : Contactez les services hospitaliers spécialisés (CHU Treichville / Cocody)</div>
          </div>
        </div>

        {/* Section 4: Data Sources & Scraping Pipeline */}
        <div className="border border-slate-200 rounded-lg p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-center gap-2 text-slate-900 font-heading font-semibold text-sm">
            <BookOpen className="w-4 h-4 text-[#0F3E2E]" />
            <span>Sources des Données & Pipeline de Synchronisation</span>
          </div>
          <p>
            Les tirages sont collectés et recoupés entre les flux officiels de l'application mobile <strong>Lotto Matrice Plus</strong> (ODO GROUP CI, Android package <code>com.lotomatriceplus.odo</code>) et les publications de contrôle du site Lonaci et de sa page officielle.
          </p>
          <p>
            Une procédure d'idempotence stricte garantit qu'aucun tirage ne peut être inséré en doublon (clé unique <code>(date, heure)</code>). Le bouton d'actualisation permet de forcer une interrogation synchrone pour garantir que la base reflète le dernier tirage sorti.
          </p>
        </div>
      </div>
    </div>
  );
};
