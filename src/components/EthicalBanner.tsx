import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ExternalLink, X } from 'lucide-react';

interface EthicalBannerProps {
  compact?: boolean;
  className?: string;
}

export const EthicalBanner: React.FC<EthicalBannerProps> = ({ compact = false, className = '' }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className={`relative overflow-hidden bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-md ${
          compact ? 'px-3.5 py-2' : 'px-4 py-3'
        } ${className}`}
        role="region"
        aria-label="Avertissement éthique et légal"
      >
        {/* Left Indicator: 4px vertical anchor bar in #D97706 */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D97706]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pl-1.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-[#78350F]">
              <strong className="font-semibold text-[#92400E]">Positionnement scientifique & légal : </strong>
              <span>
                Outil d’analyse descriptive et d’aide à la décision. Les tirages du Loto Bonheur (5/90) sont des événements stochastiques indépendants. Aucune analyse historique ne garantit ni n’augmente la probabilité mathématique de gain. Jouez de façon responsable.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setShowModal(true)}
              className="text-[11px] font-semibold text-[#B45309] hover:text-[#78350F] underline underline-offset-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              Comprendre les probabilités
            </button>
          </div>
        </div>
      </div>

      {/* Educational & Responsible Play Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0F3E2E]" />
                <h3 className="font-heading font-semibold text-base text-slate-900">
                  Rigueur Mathématique & Jeu Responsable
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                <strong>1. Indépendance Stochastique :</strong> Chaque tirage officiel de la Lonaci (Loto Bonheur) est matériellement indépendant. Les sphères numérotées 1 à 90 n’ont aucune mémoire des tirages antérieurs.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-900 font-semibold">Probabilités réelles (C(90, 5) = 43 949 268) :</div>
                <div className="flex justify-between text-slate-700">
                  <span>5 numéros corrects :</span>
                  <span>1 chance sur 43 949 268</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Au moins 4 numéros :</span>
                  <span>1 chance sur 103 167</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Au moins 3 numéros :</span>
                  <span>1 chance sur 1 217 (0.082%)</span>
                </div>
              </div>
              <p>
                <strong>2. Absence d’engagement commercial :</strong> Ce site est un observatoire purement scientifique et gratuit. Il n’encaisse aucune mise et n’a aucun lien de parrainage avec la Lonaci ou ODO GROUP.
              </p>
              <p>
                <strong>3. Prévention de l’addiction :</strong> Si le jeu impacte votre équilibre financier ou personnel, sollicitez une assistance :
              </p>
              <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200 text-amber-900 flex items-center justify-between">
                <span>Ligne d’aide & écoute anonyme (Côte d’Ivoire / Afrique de l’Ouest)</span>
                <span className="font-semibold text-xs">+225 27 20 21 00 00</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-[#0F3E2E] text-white rounded text-xs font-semibold hover:bg-[#0A291E] transition-colors"
              >
                J’ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
