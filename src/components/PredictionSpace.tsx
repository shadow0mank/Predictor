import React, { useState, useMemo } from 'react';
import { Draw, DrawSlot } from '../types/lottery';
import { SLOTS_CONFIG } from '../data/seedDraws';
import {
  runMethod1,
  runMethod2,
  runMethod3,
  calculateConsensus,
} from '../utils/algorithms';
import { runMethod4 } from '../utils/matrixAlgorithm';
import { runMethod5 } from '../utils/ghanaWebAlgorithm';
import { GHANA_WEB_SOURCE_URL } from '../data/ghanaWebData';
import { THEORETICAL_ODDS } from '../utils/probability';
import { LotteryBall } from './LotteryBall';
import { EthicalBanner } from './EthicalBanner';
import { TechnicalAnnexModal } from './TechnicalAnnexModal';
import { CreateTicketModal } from './CreateTicketModal';
import {
  Calendar,
  Clock,
  Sparkles,
  Info,
  Dices,
  Cpu,
  ChevronRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Grid,
  Hash,
  Layers,
  ExternalLink,
  Globe,
  Lock,
  Ticket,
  Check,
} from 'lucide-react';

interface PredictionSpaceProps {
  draws: Draw[];
  selectedSlotInit?: DrawSlot;
}

export const PredictionSpace: React.FC<PredictionSpaceProps> = ({
  draws,
  selectedSlotInit = 'morning',
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlotKey, setSelectedSlotKey] = useState<DrawSlot>(selectedSlotInit);
  const [activeMethodTab, setActiveMethodTab] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [chanceVariant, setChanceVariant] = useState<'simple' | 'enriched'>('enriched');
  const [showTechnicalModal, setShowTechnicalModal] = useState(false);
  const [modalMethodTarget, setModalMethodTarget] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Quick ticket creation modal state
  const [ticketModalData, setTicketModalData] = useState<{
    isOpen: boolean;
    numbers: number[];
    sourceMethod: string;
  } | null>(null);

  // Current slot definition
  const currentSlotDef = useMemo(() => {
    return SLOTS_CONFIG.find((s) => s.slot === selectedSlotKey) || SLOTS_CONFIG[0];
  }, [selectedSlotKey]);

  // Check if official draw for selectedDate and selectedSlot has already occurred in history
  const pastOfficialDraw = useMemo(() => {
    return draws.find(
      (d) =>
        d.drawDate === selectedDate &&
        (d.slot === selectedSlotKey || d.drawTime.startsWith(currentSlotDef.time.slice(0, 2)))
    );
  }, [draws, selectedDate, selectedSlotKey, currentSlotDef.time]);

  const isDrawCompleted = !!pastOfficialDraw;

  // FREEZE PAST PREDICTIONS: If the draw hour is past and present in history,
  // training history is strictly restricted to draws that took place BEFORE this draw!
  // This guarantees that past predictions are frozen and never mutated retroactively.
  const effectiveDraws = useMemo(() => {
    if (pastOfficialDraw) {
      const idx = draws.findIndex((d) => d.id === pastOfficialDraw.id);
      if (idx !== -1) {
        return draws.slice(idx + 1);
      }
    }
    return draws;
  }, [draws, pastOfficialDraw]);

  // Compute Method 1 with case-by-case analysis
  const method1 = useMemo(() => {
    return runMethod1(
      effectiveDraws,
      selectedSlotKey,
      365,
      pastOfficialDraw?.drawName || currentSlotDef.name
    );
  }, [effectiveDraws, selectedSlotKey, pastOfficialDraw, currentSlotDef.name]);

  // Compute Method 2
  const method2 = useMemo(() => {
    return runMethod2(effectiveDraws, selectedSlotKey, selectedDate, currentSlotDef.time, chanceVariant);
  }, [effectiveDraws, selectedSlotKey, selectedDate, currentSlotDef.time, chanceVariant]);

  // Compute Method 3
  const method3 = useMemo(() => {
    return runMethod3(effectiveDraws, selectedSlotKey, selectedDate, 20);
  }, [effectiveDraws, selectedSlotKey, selectedDate]);

  // Compute Method 4 (Matrices Côte d'Ivoire from Loto Matrice Plus)
  const method4 = useMemo(() => {
    return runMethod4(
      effectiveDraws,
      selectedSlotKey,
      selectedDate,
      currentSlotDef.time,
      pastOfficialDraw?.drawName || currentSlotDef.name
    );
  }, [effectiveDraws, selectedSlotKey, selectedDate, currentSlotDef.time, pastOfficialDraw, currentSlotDef.name]);

  // Compute Method 5 (GhanaWeb Solutions Forecast + Output Frequencies Collaboration)
  const method5 = useMemo(() => {
    return runMethod5(effectiveDraws, selectedSlotKey, currentSlotDef.time);
  }, [effectiveDraws, selectedSlotKey, currentSlotDef.time]);

  // Compute Consensus across all 5 methods
  const consensus = useMemo(() => {
    return calculateConsensus(method1, method2, method3, method4, method5);
  }, [method1, method2, method3, method4, method5]);

  // Handler for pure random generation in Method 1
  const [randomAlternative, setRandomAlternative] = useState<number[]>(method1.pureRandomPick);
  const handleRegenerateRandom = () => {
    const pool = Array.from({ length: 90 }, (_, i) => i + 1);
    const pick: number[] = [];
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      pick.push(pool[idx]);
      pool.splice(idx, 1);
    }
    pick.sort((a, b) => a - b);
    setRandomAlternative(pick);
  };

  const openTechnicalModal = (method: 1 | 2 | 3 | 4 | 5) => {
    setModalMethodTarget(method);
    setShowTechnicalModal(true);
  };


  return (
    <div className="space-y-6">
      {/* Permanent Ethical Banner */}
      <EthicalBanner />

      {/* Header and Slot Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 tracking-tight">
              Espace Prédictions & Aide à la Décision
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Sélectionnez l'heure et la date du prochain tirage pour calibrer simultanément les 3 méthodes mathématiques.
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 self-start sm:self-center">
            {draws.length} tirages analysés
          </div>
        </div>

        {/* Date and Time Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date du tirage à venir :
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-9 px-3 text-xs sm:text-sm border border-slate-300 rounded bg-white text-slate-900 focus:outline-hidden focus:border-[#0F3E2E] focus:ring-1 focus:ring-[#0F3E2E]"
            />
          </div>

          <div className="lg:col-span-8 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Heure & Tirage officiel Lonaci :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SLOTS_CONFIG.map((s) => {
                const isSelected = selectedSlotKey === s.slot;
                return (
                  <button
                    key={s.slot}
                    onClick={() => setSelectedSlotKey(s.slot)}
                    className={`px-3 py-2 text-xs rounded border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#0F3E2E] bg-[#0F3E2E] text-white font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-heading font-bold text-xs uppercase tracking-tight">
                      {s.name}
                    </div>
                    <div className={`text-[11px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {s.time}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Draw Status Callout: Frozen if passed / Active if upcoming */}
        {isDrawCompleted && pastOfficialDraw ? (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-950 font-medium">
              <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-900" />
              </div>
              <div>
                <strong className="font-heading font-bold text-amber-950">
                  Tirage Verrouillé & Archivé ({currentSlotDef.time} · {pastOfficialDraw.drawName}) :
                </strong>{' '}
                <span>
                  L'heure de jeu est passée. Les calculs ne sont pas actualisés afin d'éviter toute confusion et de permettre la vérification exacte des prédictions initiales.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-amber-200 font-mono text-[11px] shadow-2xs">
              <span className="text-slate-500 font-sans">Numéros sortis :</span>
              <strong className="text-[#0F3E2E] font-extrabold">{pastOfficialDraw.numbers.join(' - ')}</strong>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 flex items-center justify-between text-xs text-emerald-950 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                <strong>Prochain Tirage en Attente ({currentSlotDef.time} · {currentSlotDef.name}) :</strong> Prédictions actives calculées en direct sur le dernier état certifié.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Consensus Panel (Section B.5) */}
      <div className="bg-[#FFFDF7] border border-[#FDE68A] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <h3 className="font-heading font-bold text-sm sm:text-base text-[#92400E]">
              Panneau de Consensus des 5 Études
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {consensus.consensusNumbers.length > 0 && (
              <button
                onClick={() =>
                  setTicketModalData({
                    isOpen: true,
                    numbers: consensus.consensusNumbers.slice(0, 5).map((c) => c.num),
                    sourceMethod: 'Consensus des 5 Études',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B45309] hover:bg-[#92400E] text-white rounded text-xs font-heading font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-[#FE932C]" />
                <span>Créer un Ticket avec ce Consensus</span>
              </button>
            )}
            <span className="text-[11px] text-[#B45309] font-medium hidden sm:inline">
              Numéros retenus simultanément par au moins 2 méthodes
            </span>
          </div>
        </div>

        {consensus.consensusNumbers.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              {consensus.consensusNumbers.map((c) => (
                <div
                  key={c.num}
                  className="flex items-center gap-2.5 p-2 bg-white rounded border border-amber-200 shadow-xs"
                >
                  <LotteryBall number={c.num} variant="consensus" size="lg" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">
                      Numéro {c.num}
                    </div>
                    <div className="text-[10px] text-[#B45309] font-semibold">
                      {c.count}/5 méthodes ({c.methods.join(', ')})
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#78350F] leading-relaxed">
              <strong>Convergence statistique identifiée :</strong> Ces numéros constituent l'intersection entre la fréquence brute, le facteur chance, la rétro-ingénierie, les Matrices Côte d'Ivoire et les pronostics Web GhanaWeb.
            </p>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-[#92400E] bg-white rounded border border-amber-100 p-4">
            Aucun consensus strict pour ce tirage. Les 5 méthodes explorent des sous-espaces probabilistes indépendants.
          </div>
        )}
      </div>

      {/* 5 Tabs Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/70">
          <button
            onClick={() => setActiveMethodTab(1)}
            className={`flex-1 min-w-[150px] px-3.5 py-3 text-xs sm:text-sm text-center font-medium border-b-2 transition-colors cursor-pointer ${
              activeMethodTab === 1
                ? 'border-[#0F3E2E] bg-white text-[#0F3E2E] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <div className="font-heading">Méthode 1 · Fréquences</div>
            <div className="text-[10px] text-slate-400 font-normal">Dépouillement & Écarts</div>
          </button>

          <button
            onClick={() => setActiveMethodTab(2)}
            className={`flex-1 min-w-[150px] px-3.5 py-3 text-xs sm:text-sm text-center font-medium border-b-2 transition-colors cursor-pointer ${
              activeMethodTab === 2
                ? 'border-[#0F3E2E] bg-white text-[#0F3E2E] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <div className="font-heading">Méthode 2 · Chance</div>
            <div className="text-[10px] text-slate-400 font-normal">Formule Spatiotemporelle</div>
          </button>

          <button
            onClick={() => setActiveMethodTab(3)}
            className={`flex-1 min-w-[150px] px-3.5 py-3 text-xs sm:text-sm text-center font-medium border-b-2 transition-colors cursor-pointer ${
              activeMethodTab === 3
                ? 'border-[#0F3E2E] bg-white text-[#0F3E2E] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <div className="font-heading">Méthode 3 · Rétro-Ingénierie</div>
            <div className="text-[10px] text-slate-400 font-normal">Boucle de révision</div>
          </button>

          <button
            onClick={() => setActiveMethodTab(4)}
            className={`flex-1 min-w-[150px] px-3.5 py-3 text-xs sm:text-sm text-center font-medium border-b-2 transition-colors cursor-pointer ${
              activeMethodTab === 4
                ? 'border-[#0F3E2E] bg-white text-[#0F3E2E] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <div className="font-heading">Méthode 4 · Matrices CI</div>
            <div className="text-[10px] text-slate-400 font-normal">Loto Matrice Plus</div>
          </button>

          <button
            onClick={() => setActiveMethodTab(5)}
            className={`flex-1 min-w-[150px] px-3.5 py-3 text-xs sm:text-sm text-center font-medium border-b-2 transition-colors cursor-pointer ${
              activeMethodTab === 5
                ? 'border-[#0F3E2E] bg-white text-[#0F3E2E] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <div className="font-heading">Méthode 5 · GhanaWeb & Fréq</div>
            <div className="text-[10px] text-slate-400 font-normal">Pronostics Web & Heures</div>
          </button>
        </div>


        {/* Tab Subheader Reminder */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Recommandation statistique fondée sur l’historique. Ne garantit pas un gain.</span>
          <span className="font-mono text-slate-600 uppercase font-semibold">
            {currentSlotDef.name} ({currentSlotDef.time}) · {selectedDate}
          </span>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* TAB 1: METHOD 1 */}
          {activeMethodTab === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    Les 5 numéros recommandés (Top Fréquence & Régularité)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Calculé par analyse hiérarchique au cas par cas ({method1.caseStudyDetails?.targetGameName || currentSlotDef.name}) et généralisation horaire ({currentSlotDef.time}).
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() =>
                      setTicketModalData({
                        isOpen: true,
                        numbers: method1.top5.map((item) => item.num),
                        sourceMethod: 'Méthode 1 · Fréquences de Sortie',
                      })
                    }
                    className="px-3 py-1.5 bg-[#0F3E2E] hover:bg-[#0A291E] text-white rounded text-xs font-heading font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-[#FE932C]" />
                    <span>Créer un Ticket M1</span>
                  </button>

                  <button
                    onClick={() => openTechnicalModal(1)}
                    className="text-xs font-semibold text-[#0F3E2E] hover:text-[#0A291E] underline cursor-pointer flex items-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Fiche C.1</span>
                  </button>
                </div>
              </div>

              {/* Top 5 Display */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {method1.top5.map((item, idx) => (
                  <div
                    key={item.num}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center text-center gap-2"
                  >
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Rang {idx + 1}
                    </span>
                    <LotteryBall number={item.num} variant="hot" size="xl" />
                    <div className="space-y-0.5 text-xs text-slate-600 w-full pt-1 border-t border-slate-200">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Sorties :</span>
                        <span className="font-bold text-slate-800">{item.frequency}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Écart actuel :</span>
                        <span className="font-medium text-slate-800">{item.gap} tirages</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Case-by-Case Hierarchical Analysis Card (Specific game name vs Hourly slot) */}
              {method1.caseStudyDetails && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#0F3E2E]" />
                      <h5 className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                        Analyse au Cas par Cas : Jeu « {method1.caseStudyDetails.targetGameName} » & Généralisation
                      </h5>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <span>Pondération :</span>
                      <strong className="text-[#0F3E2E] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {method1.caseStudyDetails.hierarchyWeights.specificGame}% Cas Spécifique
                      </strong>
                      <span>+</span>
                      <strong className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {method1.caseStudyDetails.hierarchyWeights.hourlySlot}% Tranche Horaire
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {/* Tier 1: Specific Game by name & descending order */}
                    <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5">
                      <div className="font-sans font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          <span>1. Échelon Cas par Cas : {method1.caseStudyDetails.targetGameName}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {method1.caseStudyDetails.gameSpecificDrawsCount} tirages en suite décroissante
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans">
                        Fréquences et retards calculés spécifiquement sur les tirages passés portant ce nom exact.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {method1.caseStudyDetails.gameTopNumbers.map((item) => (
                          <span
                            key={item.num}
                            className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 text-xs"
                          >
                            N°{item.num} ({item.count} sorties)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tier 2: Hourly general slot */}
                    <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5">
                      <div className="font-sans font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          <span>2. Échelon Généralisé : Tranche {currentSlotDef.time}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {method1.caseStudyDetails.hourlyDrawsCount} tirages horaires
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans">
                        Ensemble des tirages programmés à {currentSlotDef.time} (Akwaba, Kado, Soutra...).
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {method1.caseStudyDetails.hourlyTopNumbers.map((item) => (
                          <span
                            key={item.num}
                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-bold border border-blue-200 text-xs"
                          >
                            N°{item.num} ({item.count} sorties)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative Top 5 by Gaps (Numéros en retard) */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D97706]" />
                    <h5 className="font-heading font-semibold text-xs sm:text-sm text-slate-900">
                      Alternative stratégique : Top 5 des numéros en retard (Écart maximal)
                    </h5>
                  </div>
                  <span className="text-[11px] text-slate-400">Pour les adeptes du retour à la moyenne</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {method1.gap5.map((g) => (
                    <div
                      key={g.num}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded shadow-2xs"
                    >
                      <LotteryBall number={g.num} variant="cold" size="sm" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800">{g.num}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5 font-mono">
                          (écart: {g.gap} tirages)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pure Random Alternative (Demonstration of unbiased chance) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Dices className="w-4 h-4 text-slate-500" />
                    <span>Générateur Aléatoire Pur (« Sans Stratégie »)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-lg">
                    Tirage purement stochastique. En théorie mathématique, ce tirage sans aucune stratégie possède exactement la même probabilité de gain (1 sur 1 217 pour ≥ 3 bons).
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {randomAlternative.map((n) => (
                      <LotteryBall key={n} number={n} variant="default" size="sm" />
                    ))}
                  </div>
                  <button
                    onClick={handleRegenerateRandom}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                  >
                    Relancer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: METHOD 2 */}
          {activeMethodTab === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    Les 5 numéros recommandés (Croisement Facteur Chance + Top-Fréquence)
                  </h4>
                  <p className="text-xs text-slate-500">
                    H = {method2.H.toFixed(2)} · S = {method2.S} ({method2.day}/{method2.month}/{method2.year})
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">Variante :</span>
                    <button
                      onClick={() => setChanceVariant('enriched')}
                      className={`px-2 py-1 rounded text-xs cursor-pointer ${
                        chanceVariant === 'enriched'
                          ? 'bg-[#0F3E2E] text-white font-semibold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Enrichie (Recommandée)
                    </button>
                    <button
                      onClick={() => setChanceVariant('simple')}
                      className={`px-2 py-1 rounded text-xs cursor-pointer ${
                        chanceVariant === 'simple'
                          ? 'bg-[#0F3E2E] text-white font-semibold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Simple
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      setTicketModalData({
                        isOpen: true,
                        numbers: method2.recommended5.map((item) => item.num),
                        sourceMethod: 'Méthode 2 · Facteur Chance Décimal',
                      })
                    }
                    className="px-3 py-1.5 bg-[#0F3E2E] hover:bg-[#0A291E] text-white rounded text-xs font-heading font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-[#FE932C]" />
                    <span>Créer un Ticket M2</span>
                  </button>
                  <button
                    onClick={() => openTechnicalModal(2)}
                    className="text-xs font-semibold text-[#0F3E2E] hover:text-[#0A291E] underline cursor-pointer flex items-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Fiche C.2</span>
                  </button>
                </div>
              </div>

              {/* 5 Recommended Numbers with Origin Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {method2.recommended5.map((item, idx) => {
                  const originLabel =
                    item.origin === 'both'
                      ? 'Commun (Chance + Fréq)'
                      : item.origin === 'chance'
                      ? 'Issu du Facteur Chance'
                      : 'Issu du Top-Fréquence';
                  const originBadgeClass =
                    item.origin === 'both'
                      ? 'bg-amber-100 text-[#92400E] border-amber-300'
                      : item.origin === 'chance'
                      ? 'bg-emerald-100 text-[#0F3E2E] border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300';

                  return (
                    <div
                      key={item.num}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center text-center gap-2"
                    >
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Recommandation {idx + 1}
                      </span>
                      <LotteryBall
                        number={item.num}
                        variant={item.origin === 'both' ? 'hot' : 'emerald'}
                        size="xl"
                      />
                      <div className="space-y-1 w-full pt-1 border-t border-slate-200">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wider ${originBadgeClass}`}
                        >
                          {originLabel}
                        </span>
                        <div className="text-[11px] font-mono text-slate-500">
                          Sorties : {item.freqCount} · Écart : {item.currentGap}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trace Complète du Calcul (Section B.3 requirement) */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Sliders className="w-4 h-4 text-[#0F3E2E]" />
                  <h5 className="font-heading font-semibold text-xs sm:text-sm text-slate-900">
                    Trace Complète et Déterministe du Calcul (Facteur Chance)
                  </h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-700 font-sans">Opération A (Op1) :</div>
                    <div className="text-slate-600">H / S = {method2.H.toFixed(2)} / {method2.S}</div>
                    <div className="text-slate-900 font-semibold truncate">≈ {method2.op1.toFixed(8)}</div>
                    <div className="text-[10px] text-slate-500 pt-1">
                      Candidats Op1 ({method2.candOp1.length}) :{' '}
                      <span className="font-bold text-slate-800">
                        {method2.candOp1.slice(0, 6).join(', ')}...
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-700 font-sans">Opération C (Op3) :</div>
                    <div className="text-slate-600">S / H = {method2.S} / {method2.H.toFixed(2)}</div>
                    <div className="text-slate-900 font-semibold truncate">≈ {method2.op3.toFixed(8)}</div>
                    <div className="text-[10px] text-slate-500 pt-1">
                      Candidats Op3 ({method2.candOp3.length}) :{' '}
                      <span className="font-bold text-slate-800">
                        {method2.candOp3.slice(0, 6).join(', ')}...
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-700 font-sans">Opération B (Divisions r₁..r₅) :</div>
                    <div className="text-slate-600">5 itérations ({method2.variantUsed})</div>
                    <div className="text-slate-900 font-semibold truncate">
                      Candidats succès : {method2.candSucc.length}
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1">
                      Exemples :{' '}
                      <span className="font-bold text-slate-800">
                        {method2.candSucc.slice(0, 6).join(', ')}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Candidates Union and Intersection Details */}
                <div className="p-3 bg-white rounded border border-slate-200 text-xs space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-700 font-sans">Union dédupliquée [1..90] :</span>
                    <span className="font-mono text-slate-600">
                      {method2.unionCandidates.slice(0, 15).join(', ')}... ({method2.unionCandidates.length} au total)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-700 font-sans">Top fréquence tranche :</span>
                    <span className="font-mono text-slate-600">
                      {method2.slotTopFreq.slice(0, 10).join(', ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-emerald-800 font-semibold">
                    <span>Nombres en commun ({method2.commonNumbers.length}) :</span>
                    <span className="font-mono">
                      {method2.commonNumbers.length > 0 ? method2.commonNumbers.join(', ') : 'Aucun direct'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METHOD 3 */}
          {activeMethodTab === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    Les 5 numéros recommandés (Rétro-Ingénierie & Scoring Linéaire)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Calibrage multi-features avec validation adaptative sur tirage masqué
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() =>
                      setTicketModalData({
                        isOpen: true,
                        numbers: method3.recommended5.map((item) => item.num),
                        sourceMethod: 'Méthode 3 · Rétro-Ingénierie',
                      })
                    }
                    className="px-3 py-1.5 bg-[#0F3E2E] hover:bg-[#0A291E] text-white rounded text-xs font-heading font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-[#FE932C]" />
                    <span>Créer un Ticket M3</span>
                  </button>
                  <button
                    onClick={() => openTechnicalModal(3)}
                    className="text-xs font-semibold text-[#0F3E2E] hover:text-[#0A291E] underline cursor-pointer flex items-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Fiche C.3</span>
                  </button>
                </div>
              </div>

              {/* 5 Recommended Numbers with Matrix Position and Model Score */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {method3.recommended5.map((item, idx) => (
                  <div
                    key={item.num}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center text-center gap-2"
                  >
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Rang {idx + 1}
                    </span>
                    <LotteryBall number={item.num} variant="emerald" size="xl" />
                    <div className="space-y-1 w-full pt-1 border-t border-slate-200 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Score modèle :</span>
                        <span className="font-bold text-[#0F3E2E]">{item.modelScore.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Grille 9×10 :</span>
                        <span>L{item.matrixPos.row + 1} C{item.matrixPos.col + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trace de la dernière révision (Section B.4 requirement) */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Cpu className="w-4 h-4 text-[#0F3E2E]" />
                  <h5 className="font-heading font-semibold text-xs sm:text-sm text-slate-900">
                    Trace de la Dernière Révision (Boucle d'Ajustement)
                  </h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                    <div className="font-sans font-bold text-slate-700">Hyperparamètres retenus :</div>
                    <div>Fenêtre T = {method3.trace.chosenT} tirages</div>
                    <div>Lag L = {method3.trace.chosenL} tirages</div>
                    <div className="text-[11px] text-slate-500">
                      Poids vectoriels : {method3.trace.weightsCount} features
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                    <div className="font-sans font-bold text-slate-700">Boucle d'ajustement :</div>
                    <div>Itérations nécessaires : <span className="font-bold text-[#0F3E2E]">{method3.trace.iterations}</span></div>
                    <div>Seuil requis : ≥ 2 corrects</div>
                    <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{method3.trace.withheldMatchedCount} numéros corrects atteints</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                    <div className="font-sans font-bold text-slate-700">Tirage masqué testé :</div>
                    <div className="truncate">Tirage : {method3.trace.withheldDrawNumbers.join(', ')}</div>
                    <div className="text-[11px] text-slate-500">
                      Trouvés :{' '}
                      <span className="font-bold text-emerald-700">
                        {method3.trace.withheldMatchedNumbers.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Backtest Honnête de Performance Future (Acceptance Criteria & Section C.3.4) */}
                <div className="p-3 bg-white rounded border border-slate-200 space-y-2 text-xs">
                  <div className="font-semibold text-slate-900 font-sans flex items-center justify-between">
                    <span>Test Honnête de Performance Rétrospective (Sur {method3.trace.simulatedBacktest.evaluatedCount} tirages) :</span>
                    <span className="text-[11px] font-mono text-slate-500 font-normal">Validation out-of-sample</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                      <span>Taux empirique ≥ 2 corrects :</span>
                      <span className="font-bold text-slate-800">
                        {method3.trace.simulatedBacktest.pctAtLeast2Correct}%
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                      <span>Référence théorique pure chance :</span>
                      <span className="font-bold text-slate-500">
                        ~{method3.trace.simulatedBacktest.theoreticalExpectation2}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    <strong>Constat scientifique :</strong> La performance empirique sur les tirages futurs converge vers celle du hasard pur, confirmant que le sur-ajustement passé n'augmente pas la probabilité future.
                  </p>
                </div>

                {/* Mandatory Scientific Warning Box (Section C.3.3) */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded text-amber-900 text-xs leading-relaxed">
                  <strong>Avertissement scientifique obligatoire :</strong> « Cette méthode atteint son objectif de reproduire ≥ 2 numéros sur les tirages passés (par construction — c'est de l'ajustement sur le passé). Cela ne garantit pas de reproduire ≥ 2 numéros sur les tirages futurs. Sur un tirage équitable, la performance future reste en moyenne celle du hasard. La méthode a un intérêt descriptif et exploratoire, pas prédictif garanti. »
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: METHOD 4 (MATRICES CÔTE D'IVOIRE) */}
          {activeMethodTab === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    Les 5 numéros recommandés (Matrices Côte d'Ivoire · Loto Matrice Plus)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Calculé d'après la clé matricielle officielle, le clavier, l'event et le code de l'application pour {currentSlotDef.name} ({currentSlotDef.time}).
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() =>
                      setTicketModalData({
                        isOpen: true,
                        numbers: method4.recommended5.map((item) => item.num),
                        sourceMethod: "Méthode 4 · Matrices Côte d'Ivoire",
                      })
                    }
                    className="px-3 py-1.5 bg-[#0F3E2E] hover:bg-[#0A291E] text-white rounded text-xs font-heading font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-[#FE932C]" />
                    <span>Créer un Ticket M4</span>
                  </button>
                  <button
                    onClick={() => openTechnicalModal(4)}
                    className="text-xs font-semibold text-[#0F3E2E] hover:text-[#0A291E] underline cursor-pointer flex items-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Fiche C.4</span>
                  </button>
                </div>
              </div>

              {/* Top 5 Recommended Display */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {method4.recommended5.map((item, idx) => (
                  <div
                    key={item.num}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center text-center gap-2"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Rang {idx + 1}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-[#0F3E2E] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {item.origin}
                      </span>
                    </div>

                    <LotteryBall number={item.num} variant="emerald" size="xl" />

                    <div className="space-y-0.5 text-xs text-slate-600 w-full pt-1 border-t border-slate-200 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fréquence :</span>
                        <span className="font-bold text-slate-800">{item.freqCount} sorties</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Écart actuel :</span>
                        <span className="font-medium text-slate-800">{item.currentGap} tirages</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Authentic Matrix Inspector Panel */}
              <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-[#0F3E2E]" />
                    <h5 className="font-heading font-semibold text-xs sm:text-sm text-slate-900">
                      Données Brutes de la Matrice (Loto Matrice Plus · Rubrique Matrices CI)
                    </h5>
                  </div>
                  {method4.matrixData && (
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold">
                      Tirage : {method4.matrixData.drawName} ({method4.matrixData.hour}H)
                    </span>
                  )}
                </div>

                {method4.matrixData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    {/* Matrice Key & Decomposition */}
                    <div className="p-3.5 bg-white rounded border border-slate-200 space-y-2">
                      <div className="font-sans font-bold text-slate-800 flex items-center justify-between">
                        <span>Clé Matricielle (12 chiffres) :</span>
                        <span className="text-[11px] font-normal text-slate-500 font-mono">
                          {method4.matrixData.matriceKey}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-sans">Paires directes 2 chiffres : </span>
                          <span className="font-bold text-slate-800">
                            {method4.rawPairs.join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans">Sommes de triplets mod 90 : </span>
                          <span className="font-bold text-slate-800">
                            {method4.tripletSums.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Clavier Key & Pivots */}
                    <div className="p-3.5 bg-white rounded border border-slate-200 space-y-2">
                      <div className="font-sans font-bold text-slate-800 flex items-center justify-between">
                        <span>Clavier Associé :</span>
                        <span className="text-[11px] font-normal text-slate-500 font-mono">
                          {method4.matrixData.clavier || 'Non spécifié'}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-sans">Paires Clavier : </span>
                          <span className="font-bold text-slate-800">
                            {method4.clavierPairs.length > 0
                              ? method4.clavierPairs.join(', ')
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-sans">Pivots Matrice-Clavier (Intersection) : </span>
                          <span className="font-bold text-[#0F3E2E]">
                            {method4.rawPairs.filter((p) => method4.clavierPairs.includes(p)).length > 0
                              ? method4.rawPairs
                                  .filter((p) => method4.clavierPairs.includes(p))
                                  .join(', ')
                              : 'Aucun pivot direct'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Code & Event Decodings */}
                    <div className="p-3.5 bg-white rounded border border-slate-200 space-y-2">
                      <div className="font-sans font-bold text-slate-800 flex items-center justify-between">
                        <span>Composante Event :</span>
                        <span className="text-[11px] font-bold text-[#D97706] font-mono">
                          {method4.matrixData.event || '—'}
                        </span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-slate-500 font-sans">Décodage (Valeur, Miroir, Complément 90) : </span>
                        <span className="font-bold text-slate-800">
                          {method4.eventNumbers.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded border border-slate-200 space-y-2">
                      <div className="font-sans font-bold text-slate-800 flex items-center justify-between">
                        <span>Composante Code :</span>
                        <span className="text-[11px] font-bold text-[#0F3E2E] font-mono">
                          {method4.matrixData.code || '—'}
                        </span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-slate-500 font-sans">Décodage (Direct, Paires, Somme chiffres) : </span>
                        <span className="font-bold text-slate-800">
                          {method4.codeNumbers.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-600">
                    Aucune matrice spécifique enregistrée pour cette date exacte. La méthode utilise les dernières matrices répertoriées pour ce créneau horaire.
                  </div>
                )}

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded text-emerald-950 text-xs leading-relaxed">
                  <strong>Principe de calcul :</strong> « Les matrices Côte d'Ivoire issues de Loto Matrice Plus fournissent des clés combinatoires basées sur des triplets numériques et des claviers. Le modèle extrait les paires directes, les sommes modulaires, ainsi que les composantes Event et Code, puis les croise avec la fréquence historique observée sur le créneau pour ordonner les 5 numéros favoris. »
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Méthode 5 · GhanaWeb Solutions & Fréquences de Sortie */}
          {activeMethodTab === 5 && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Method Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#0F3E2E] text-white">
                      MÉTHODE 5
                    </span>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                      Pronostics Web (GhanaWeb Solutions) & Fréquences de Sortie
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Intègre <strong>au même degré</strong> les prédictions (Banker, Two Sure, Permutation) et les numéros Machines de{' '}
                    <strong>GhanaWeb Solutions</strong> comme candidats potentiellement gagnants, puis applique l'opération de filtrage par fréquences de sortie pour l'heure de jeu ({currentSlotDef.time}).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      setTicketModalData({
                        isOpen: true,
                        numbers: method5.recommended5.map((r) => r.num),
                        sourceMethod: 'M5 : GhanaWeb & Fréquences de Sortie',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded shadow-xs transition-colors cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Créer un Ticket M5</span>
                  </button>

                  <a
                    href={GHANA_WEB_SOURCE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>ghanawebsolutions.com</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>

                  <button
                    onClick={() => openTechnicalModal(5)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Fiche C.5</span>
                  </button>
                </div>
              </div>

              {/* Source Verification Card - Equal Treatment of Predictions & Machines */}
              <div className="bg-gradient-to-r from-emerald-50/60 via-amber-50/30 to-emerald-50/60 border border-emerald-200/90 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/50 pb-2 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-slate-800">Source : GhanaWeb Solutions · Pronostic Loto Gratuit</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                    <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                      Égalité stricte : Prédictions & Machines = Poids initial 25 pts
                    </span>
                    <span>·</span>
                    <span>Créneau : <strong className="text-[#0F3E2E]">{method5.slotName}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Predictions Pool */}
                  <div className="p-3 bg-white rounded border border-emerald-100 space-y-2">
                    <div className="font-heading font-semibold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>Pool Prédictions (Banker, 2Sure, Permutation)</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Éligibilité 100%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px] font-sans w-24">Banker & 2Sure :</span>
                        <span className="font-bold text-[#0F3E2E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {method5.banker} (Banker)
                        </span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {method5.twoSure.join(' - ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px] font-sans w-24">Permutation :</span>
                        <div className="flex flex-wrap gap-1">
                          {method5.permutationPool.map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200 text-xs"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Machine Pool (Treated equally) */}
                  <div className="p-3 bg-white rounded border border-emerald-100 space-y-2">
                    <div className="font-heading font-semibold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>Pool Machine GhanaWeb (Même degré de priorité)</span>
                      </span>
                      <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                        Éligibilité 100%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px] font-sans w-24">Tirage Machine :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {method5.machineNumbers.map((m) => (
                            <span
                              key={m}
                              className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-bold border border-blue-200 text-xs"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 italic font-sans pt-1">
                        Les numéros machines sont injectés à égalité avec les prédictions et départagés par les fréquences de sortie de l'heure {currentSlotDef.time}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final 5 Calibrated Numbers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FE932C]" />
                    <span>Les 5 Numéros Gagnants Calibrés par l'Heure de Jeu ({currentSlotDef.time})</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    Positions 1 à 5 départagées par l'opération fréquentielle
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {method5.recommended5.map((item, idx) => {
                    const posLabels = [
                      'Position 1 · 1er Favori Heure',
                      'Position 2 · 2e Favori Heure',
                      'Position 3 · 3e Favori Heure',
                      'Position 4 · 4e Favori Heure',
                      'Position 5 · 5e Favori Heure',
                    ];

                    const categoryBadgeClass =
                      item.category === 'Machine'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : item.category === 'Mixte'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                    return (
                      <div
                        key={item.num}
                        className="bg-white border-2 border-emerald-200/90 rounded-lg p-3.5 flex flex-col items-center justify-between gap-2.5 text-center shadow-xs hover:border-[#0F3E2E] transition-colors"
                      >
                        <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-tight bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-full truncate">
                          {posLabels[idx]}
                        </div>

                        <div className="my-1">
                          <LotteryBall number={item.num} variant="emerald" size="lg" />
                        </div>

                        <div className="space-y-1 w-full text-xs font-mono pt-1 border-t border-slate-100">
                          <div className="flex items-center justify-center">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${categoryBadgeClass}`}
                            >
                              {item.category === 'Mixte'
                                ? 'Prédiction & Machine'
                                : item.category === 'Machine'
                                ? 'Machine Web'
                                : 'Prédiction Web'}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-600 truncate font-sans font-medium" title={item.origin}>
                            {item.origin}
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>Fréq à {currentSlotDef.time} :</span>
                            <strong className="text-emerald-700">{item.slotFrequency}x</strong>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Écart actuel :</span>
                            <strong className="text-slate-800">{item.currentGap}</strong>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                            <span>Score calibré :</span>
                            <strong className="text-[#0F3E2E] font-bold">{item.score} pts</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collaboration Matrix Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#0F3E2E]" />
                    <span>Détail de l'Opération de Synergie (Prédictions & Machines traitées au même degré)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Formule : Score = Base Égalitaire (25) + Bonus Fréquence ({currentSlotDef.time}) + Bonus Écart + Bonus Global
                  </span>
                </div>

                <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-heading font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Numéro</th>
                        <th className="py-2.5 px-3">Catégorie</th>
                        <th className="py-2.5 px-3">Origine GhanaWeb</th>
                        <th className="py-2.5 px-3 text-center">Poids Initial</th>
                        <th className="py-2.5 px-3 text-center">Fréq à {currentSlotDef.time}</th>
                        <th className="py-2.5 px-3 text-center">Bonus Fréq</th>
                        <th className="py-2.5 px-3 text-center">Écart</th>
                        <th className="py-2.5 px-3 text-center">Bonus Écart</th>
                        <th className="py-2.5 px-3 text-right">Score Total</th>
                        <th className="py-2.5 px-3 text-center">Position Calibrée</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {method5.synergyDetails.map((s) => {
                        const isSelected = method5.recommended5.some((r) => r.num === s.num);
                        const posIdx = method5.recommended5.findIndex((r) => r.num === s.num);

                        return (
                          <tr
                            key={s.num}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? 'bg-emerald-50/40' : 'text-slate-600'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-sans">
                              <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                                <span className="w-6 h-6 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center text-xs font-mono">
                                  {s.num}
                                </span>
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-sans">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  s.category === 'Machine'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : s.category === 'Mixte'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {s.category}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-sans font-medium text-slate-800 text-[11px]">
                              {s.origin}
                            </td>

                            <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                              +{s.baseWeight}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className="font-semibold text-emerald-800">
                                {s.slotFrequency}x
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center text-emerald-700">
                              +{s.slotFreqBonus}
                            </td>

                            <td className="py-2.5 px-3 text-center text-slate-700">
                              {s.currentGap}
                            </td>

                            <td className="py-2.5 px-3 text-center text-amber-700">
                              +{s.gapBonus}
                            </td>

                            <td className="py-2.5 px-3 text-right font-extrabold text-[#0F3E2E]">
                              {s.totalScore}
                            </td>

                            <td className="py-2.5 px-3 text-center font-sans">
                              {isSelected ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                                  Position {posIdx + 1}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Non retenu</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Method Principle Footnote */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded text-emerald-950 text-xs leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Principe de Synergie Égalitaire de la Méthode 5 :</span>
                </div>
                <p>
                  Conformément au protocole, les numéros issus des <strong>prédictions</strong> (Banker, Two Sure, Permutation) et ceux issus des <strong>machines</strong> publiés sur <strong>ghanawebsolutions.com/serve.php?id=2073&d=Pronostic-Loto-Gratuit</strong> sont tous pris au <strong>même degré de probabilité initiale</strong> (poids égal de base = 25 pts). L'opération statistique croise ensuite ces candidats avec l'historique officiel des fréquences de sortie de la Lonaci propres à l'heure du jeu ({currentSlotDef.time}) et la dynamique d'écart pour placer dans l'ordre exact les 5 numéros les plus susceptibles d'être gagnants (Position 1 à Position 5).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Theoretical Odds Callout Card (Section B.6 requirement) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#0F3E2E]" />
            <h4 className="font-heading font-semibold text-xs sm:text-sm text-slate-900">
              Rappel Mathématique Immuable · Probabilités Théoriques (5 numéros parmi 90)
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Total : 43 949 268 combinaisons</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-sans text-slate-500 text-[11px]">Au moins 3 bons numéros :</span>
            <div className="text-base font-bold text-slate-900">≈ 1 chance sur 1 217</div>
            <div className="text-[10px] text-slate-400">0.082 % de probabilité</div>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-sans text-slate-500 text-[11px]">Au moins 4 bons numéros :</span>
            <div className="text-base font-bold text-slate-900">≈ 1 chance sur 103 167</div>
            <div className="text-[10px] text-slate-400">0.00097 % de probabilité</div>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-sans text-slate-500 text-[11px]">5 bons numéros (Gros Lot) :</span>
            <div className="text-base font-bold text-slate-900">≈ 1 chance sur 43 949 268</div>
            <div className="text-[10px] text-slate-400">0.0000023 % de probabilité</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center font-medium italic">
          « Aucune méthode ne modifie ces probabilités théoriques. »
        </p>
      </div>

      {/* Technical Annex Modal */}
      <TechnicalAnnexModal
        isOpen={showTechnicalModal}
        initialMethod={modalMethodTarget}
        onClose={() => setShowTechnicalModal(false)}
      />

      {/* Virtual Ticket Creation Modal */}
      {ticketModalData && (
        <CreateTicketModal
          isOpen={ticketModalData.isOpen}
          onClose={() => setTicketModalData(null)}
          initialNumbers={ticketModalData.numbers}
          initialSlot={selectedSlotKey}
          initialSlotTime={currentSlotDef.time}
          initialGameName={pastOfficialDraw?.drawName || currentSlotDef.name}
          initialDate={selectedDate}
          sourceMethodName={ticketModalData.sourceMethod}
        />
      )}
    </div>
  );
};
