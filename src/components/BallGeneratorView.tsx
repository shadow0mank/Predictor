import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  CheckCircle2,
  Sparkles,
  Layers,
  Award,
  Clock,
  ShieldCheck,
  ChevronRight,
  Ticket,
  Calculator,
  Flame,
  BookmarkPlus,
} from 'lucide-react';
import { Draw, DrawSlot, SimulationStudyMode } from '../types/lottery';
import {
  generateSimulatedDraw,
  initChamberParticles,
  updateChamberPhysics,
  ChamberBallParticle,
  getBallColor,
} from '../utils/simulatorEngine';
import { lotteryAudio } from '../utils/lotteryAudio';
import { CreateTicketModal } from './CreateTicketModal';

interface BallGeneratorViewProps {
  draws: Draw[];
}

const SLOTS_LIST: { slot: DrawSlot; label: string; time: string; name: string }[] = [
  { slot: 'morning', label: '10h00 · Akwaba (Matin)', time: '10:00', name: 'AKWABA' },
  { slot: 'noon', label: '13h00 · Étoile (Midi)', time: '13:00', name: 'ÉTOILE' },
  { slot: 'afternoon', label: '16h00 · Fortune (Après-Midi)', time: '16:00', name: 'FORTUNE' },
  { slot: 'evening', label: '18h15 · Diamant (Soirée)', time: '18:15', name: 'DIAMANT' },
];

const STUDY_MODES: { id: SimulationStudyMode; label: string; desc: string }[] = [
  {
    id: 'consensus',
    label: 'Synthèse des 5 Études Réunies (Recommandé)',
    desc: 'Consensus pondéré : Fréquences, Chance, Rétro-ingénierie, Matrices CI & GhanaWeb/Machines',
  },
  {
    id: 'method1',
    label: 'Méthode 1 · Fréquences de Sortie & Écarts',
    desc: 'Densité historique des 90 numéros et retour harmonique',
  },
  {
    id: 'method2',
    label: 'Méthode 2 · Facteur Chance Décimal',
    desc: 'Calculs calendaires, décimales et trigrammes successifs',
  },
  {
    id: 'method3',
    label: 'Méthode 3 · Rétro-Ingénierie & Grille 9×10',
    desc: 'Scoring vectoriel pondéré et lag adaptatif',
  },
  {
    id: 'method4',
    label: 'Méthode 4 · Matrices CI (Loto Matrice Plus)',
    desc: 'Clés 12 chiffres, claviers, codes et events',
  },
  {
    id: 'method5',
    label: 'Méthode 5 · GhanaWeb & Tirages Machines',
    desc: 'Égalité stricte prédictions et machines calibrée par heure de jeu',
  },
];

export const BallGeneratorView: React.FC<BallGeneratorViewProps> = ({ draws }) => {
  const [selectedSlot, setSelectedSlot] = useState<DrawSlot>('morning');
  const [studyMode, setStudyMode] = useState<SimulationStudyMode>('consensus');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [speedMode, setSpeedMode] = useState<'normal' | 'fast' | 'instant'>('normal');

  // Simulation execution state
  const [isSpinning, setIsSpinning] = useState(false);
  const [extractedCount, setExtractedCount] = useState(0); // 0 to 5
  const [currentlyExtractingNum, setCurrentlyExtractingNum] = useState<number | undefined>(undefined);
  const [isCompleted, setIsCompleted] = useState(false);

  // Virtual ticket state
  const [ticketNumbers, setTicketNumbers] = useState<number[]>([]);
  const [ticketBetType, setTicketBetType] = useState<'1N' | '2N' | '3N' | '4N' | '5N'>('2N');
  const [ticketStake, setTicketStake] = useState<number>(1000);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Generate target simulated winning numbers based on selected study & slot
  const simulationData = useMemo(() => {
    return generateSimulatedDraw(draws, selectedSlot, studyMode);
  }, [draws, selectedSlot, studyMode]);

  const targetWinningNumbers = useMemo(() => {
    return simulationData.winningBalls.map((b) => b.num);
  }, [simulationData]);

  const currentSlotInfo = useMemo(() => {
    return SLOTS_LIST.find((s) => s.slot === selectedSlot) || SLOTS_LIST[0];
  }, [selectedSlot]);

  // Canvas ref & physics particles state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ChamberBallParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Sync audio mute
  const handleToggleAudio = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    lotteryAudio.setMuted(next);
  };

  // Initialize or re-initialize canvas particles
  const setupParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 440;
    const height = rect.height || 440;

    particlesRef.current = initChamberParticles(width, height, targetWinningNumbers);
  }, [targetWinningNumbers]);

  // Resize canvas according to device pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      setupParticles();
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [setupParticles]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const cx = width / 2;
      const cy = height / 2;
      const chamberRadius = Math.min(width, height) * 0.42;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw outer mechanical pedestal and chrome ring
      ctx.save();
      // Pedestal base
      const baseY = cy + chamberRadius * 0.85;
      const baseGrad = ctx.createLinearGradient(cx - 100, baseY, cx + 100, baseY + 60);
      baseGrad.addColorStop(0, '#0F3E2E');
      baseGrad.addColorStop(0.5, '#1A533E');
      baseGrad.addColorStop(1, '#0A291E');

      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 85, baseY);
      ctx.lineTo(cx + 85, baseY);
      ctx.lineTo(cx + 105, baseY + 45);
      ctx.lineTo(cx - 105, baseY + 45);
      ctx.closePath();
      ctx.fill();

      // Blower air vent grills
      ctx.strokeStyle = '#FE932C';
      ctx.lineWidth = 2.5;
      for (let i = -50; i <= 50; i += 20) {
        ctx.beginPath();
        ctx.moveTo(cx + i, baseY + 12);
        ctx.lineTo(cx + i, baseY + 32);
        ctx.stroke();
      }

      // Air status indicator
      ctx.fillStyle = isSpinning ? '#FE932C' : '#64748B';
      ctx.beginPath();
      ctx.arc(cx, baseY + 22, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Chamber Shadow & Back Layer
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, chamberRadius, 0, Math.PI * 2);
      const chamberBackGrad = ctx.createRadialGradient(
        cx - chamberRadius * 0.2,
        cy - chamberRadius * 0.2,
        chamberRadius * 0.1,
        cx,
        cy,
        chamberRadius
      );
      chamberBackGrad.addColorStop(0, '#FFFFFF');
      chamberBackGrad.addColorStop(0.7, '#F1F5F9');
      chamberBackGrad.addColorStop(1, '#CBD5E1');
      ctx.fillStyle = chamberBackGrad;
      ctx.fill();

      // Inner ambient turbulence glow when spinning
      if (isSpinning) {
        ctx.fillStyle = 'rgba(254, 147, 44, 0.08)';
        ctx.beginPath();
        ctx.arc(cx, cy, chamberRadius * 0.95, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Update & Draw Bouncing Ball Particles inside chamber
      const blowerPower = isSpinning ? 1.45 : 0.08;
      updateChamberPhysics(
        particlesRef.current,
        width,
        height,
        blowerPower,
        currentlyExtractingNum
      );

      particlesRef.current.forEach((p) => {
        if (p.isExtracted) return;

        ctx.save();
        ctx.translate(p.x, p.y);

        // Ball Shadow
        ctx.beginPath();
        ctx.arc(1.5, 2.5, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fill();

        // Ball 3D Spherical Gradient
        const ballGrad = ctx.createRadialGradient(
          -p.radius * 0.35,
          -p.radius * 0.35,
          p.radius * 0.1,
          0,
          0,
          p.radius
        );

        if (p.num === currentlyExtractingNum) {
          // Highlight extracting ball
          ballGrad.addColorStop(0, '#FFFFFF');
          ballGrad.addColorStop(0.3, '#FE932C');
          ballGrad.addColorStop(1, '#B45309');
        } else {
          ballGrad.addColorStop(0, '#FFFFFF');
          ballGrad.addColorStop(0.3, p.color);
          ballGrad.addColorStop(1, '#0F172A');
        }

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // White inner number circle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.58, 0, Math.PI * 2);
        ctx.fill();

        // Number Text
        ctx.fillStyle = '#0F172A';
        ctx.font = `bold ${Math.max(8, p.radius * 0.65)}px "Outfit", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(p.num), 0, 0.5);

        ctx.restore();
      });

      // 4. Extraction Chute at Top of Sphere
      ctx.save();
      const chuteW = 42;
      const chuteH = 50;
      const chuteY = cy - chamberRadius - 20;

      // Acrylic transparent tube
      const chuteGrad = ctx.createLinearGradient(cx - chuteW / 2, chuteY, cx + chuteW / 2, chuteY);
      chuteGrad.addColorStop(0, 'rgba(255,255,255,0.85)');
      chuteGrad.addColorStop(0.3, 'rgba(203,213,225,0.3)');
      chuteGrad.addColorStop(0.7, 'rgba(203,213,225,0.4)');
      chuteGrad.addColorStop(1, 'rgba(255,255,255,0.9)');

      ctx.fillStyle = chuteGrad;
      ctx.fillRect(cx - chuteW / 2, chuteY, chuteW, chuteH);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - chuteW / 2, chuteY, chuteW, chuteH);

      // Extraction tube arrows / pulse
      if (currentlyExtractingNum) {
        ctx.fillStyle = '#FE932C';
        ctx.beginPath();
        ctx.moveTo(cx, chuteY + 12);
        ctx.lineTo(cx - 8, chuteY + 24);
        ctx.lineTo(cx + 8, chuteY + 24);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 5. Glass Reflections, Highlights & Chrome Outer Bezel
      ctx.save();
      // Outer Chrome Rim
      ctx.beginPath();
      ctx.arc(cx, cy, chamberRadius, 0, Math.PI * 2);
      ctx.lineWidth = 10;
      const rimGrad = ctx.createLinearGradient(
        cx - chamberRadius,
        cy - chamberRadius,
        cx + chamberRadius,
        cy + chamberRadius
      );
      rimGrad.addColorStop(0, '#E2E8F0');
      rimGrad.addColorStop(0.25, '#94A3B8');
      rimGrad.addColorStop(0.5, '#F8FAFC');
      rimGrad.addColorStop(0.75, '#64748B');
      rimGrad.addColorStop(1, '#CBD5E1');
      ctx.strokeStyle = rimGrad;
      ctx.stroke();

      // Glass Specular Arc Reflection (Top Left)
      ctx.beginPath();
      ctx.arc(cx, cy, chamberRadius * 0.88, Math.PI * 1.05, Math.PI * 1.55);
      ctx.lineWidth = 14;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glass Lower Arc Reflection
      ctx.beginPath();
      ctx.arc(cx, cy, chamberRadius * 0.88, Math.PI * 0.15, Math.PI * 0.45);
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isSpinning, currentlyExtractingNum]);

  // Extract a single ball step
  const extractNextBall = useCallback(() => {
    if (extractedCount >= 5) return;

    const nextIndex = extractedCount;
    const targetBall = simulationData.winningBalls[nextIndex];
    if (!targetBall) return;

    setCurrentlyExtractingNum(targetBall.num);

    // Audio effect
    lotteryAudio.playBallExtracted();

    // Mark particle as extracted in chamber physics
    const p = particlesRef.current.find((part) => part.num === targetBall.num);
    if (p) {
      p.isExtracted = true;
    }

    const delay = speedMode === 'fast' ? 300 : speedMode === 'instant' ? 80 : 600;

    setTimeout(() => {
      setExtractedCount((prev) => {
        const nextCount = prev + 1;
        if (nextCount === 5) {
          setIsCompleted(true);
          setIsSpinning(false);
          lotteryAudio.stopBlower();
          lotteryAudio.playDrawCompleteFanfare();
        }
        return nextCount;
      });
      setCurrentlyExtractingNum(undefined);
    }, delay);
  }, [extractedCount, simulationData.winningBalls, speedMode]);

  // Automatic draw execution runner
  useEffect(() => {
    if (!isSpinning) return;
    if (extractedCount >= 5) return;

    const intervalTime = speedMode === 'fast' ? 1200 : speedMode === 'instant' ? 350 : 2800;

    const timer = setTimeout(() => {
      extractNextBall();
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [isSpinning, extractedCount, extractNextBall, speedMode]);

  // Start complete automatic simulation
  const handleStartAutoSimulation = () => {
    if (extractedCount === 5) {
      handleResetSimulation();
    }
    setIsSpinning(true);
    lotteryAudio.startBlower();
  };

  // Pause simulation
  const handlePauseSimulation = () => {
    setIsSpinning(false);
    lotteryAudio.stopBlower();
  };

  // Reset simulation
  const handleResetSimulation = () => {
    setIsSpinning(false);
    setIsCompleted(false);
    setExtractedCount(0);
    setCurrentlyExtractingNum(undefined);
    lotteryAudio.stopBlower();
    setupParticles();
  };

  // Handle slot change
  const handleSlotChange = (newSlot: DrawSlot) => {
    setSelectedSlot(newSlot);
    handleResetSimulation();
  };

  // Handle study mode change
  const handleStudyChange = (newMode: SimulationStudyMode) => {
    setStudyMode(newMode);
    handleResetSimulation();
  };

  // Load simulated numbers into virtual ticket
  const handleLoadTicketFromSimulation = () => {
    const winningNums = simulationData.winningBalls.map((b) => b.num);
    setTicketNumbers(winningNums);
  };

  // Calculate virtual ticket hits
  const ticketEvaluation = useMemo(() => {
    if (ticketNumbers.length === 0 || extractedCount === 0) return null;
    const extractedSet = new Set(
      simulationData.winningBalls.slice(0, extractedCount).map((b) => b.num)
    );
    const hits = ticketNumbers.filter((n) => extractedSet.has(n));

    // Lonaci multiplier estimates
    const multipliers: Record<string, number> = {
      '1N': 18,
      '2N': 240,
      '3N': 2100,
      '4N': 18000,
      '5N': 100000,
    };

    const multiplier = multipliers[ticketBetType] || 240;
    const requiredHits =
      ticketBetType === '1N'
        ? 1
        : ticketBetType === '2N'
        ? 2
        : ticketBetType === '3N'
        ? 3
        : ticketBetType === '4N'
        ? 4
        : 5;

    const isWon = hits.length >= requiredHits;
    const estimatedGain = isWon ? ticketStake * multiplier : 0;

    return {
      hits,
      hitsCount: hits.length,
      isWon,
      multiplier,
      estimatedGain,
    };
  }, [ticketNumbers, extractedCount, simulationData.winningBalls, ticketBetType, ticketStake]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Slot / Study Selectors */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-[#0F3E2E] text-white flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#FE932C]" />
                SIMULATEUR STOCHASTIQUE
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                Générateur de Boules & Tirage Virtuel
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Simulation électromécanique du brassage des 90 boules et extraction des 5 numéros gagnants calibrés sur <strong>l’ensemble des études menées</strong> (Fréquences de sortie, Facteur Chance, Rétro-Ingénierie, Matrices Côte d'Ivoire et Pronostics GhanaWeb/Machines).
            </p>
          </div>

          {/* Quick Sound & Speed controls */}
          <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAudioMuted
                  ? 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              }`}
              title={isAudioMuted ? 'Activer le son du boulier' : 'Couper le son'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#0F3E2E]" />}
              <span>{isAudioMuted ? 'Muet' : 'Son On'}</span>
            </button>

            {/* Speed toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSpeedMode('normal')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  speedMode === 'normal'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setSpeedMode('fast')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  speedMode === 'fast'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FastForward className="w-3 h-3" />
                <span>Rapide</span>
              </button>
            </div>
          </div>
        </div>

        {/* Draw Slot & Study Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slot Hour Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0F3E2E]" />
              <span>Créneau Horaire du Tirage Officiel :</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SLOTS_LIST.map((slot) => {
                const isSelected = selectedSlot === slot.slot;
                return (
                  <button
                    key={slot.slot}
                    onClick={() => handleSlotChange(slot.slot)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F3E2E] bg-emerald-50/70 text-slate-900 ring-2 ring-[#0F3E2E]/20 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="text-[11px] font-mono text-slate-400">{slot.time}</div>
                    <div className="text-xs font-heading font-bold text-slate-800 truncate">{slot.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Underlying Study Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0F3E2E]" />
              <span>Fondement Algorithmique du Tirage :</span>
            </label>
            <select
              value={studyMode}
              onChange={(e) => handleStudyChange(e.target.value as SimulationStudyMode)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] cursor-pointer"
            >
              {STUDY_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 italic">
              {STUDY_MODES.find((m) => m.id === studyMode)?.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Main Simulator Arena: Blower Sphere Canvas & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive Canvas Blower Machine (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col items-center space-y-4">
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSpinning ? 'bg-[#FE932C] animate-ping' : 'bg-slate-300'}`}></span>
              <span className="text-slate-800 font-heading font-bold">
                Boulier Électromécanique à Flux Pneumatique
              </span>
            </div>
            <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              90 Boules en Chambre
            </span>
          </div>

          {/* Acrylic Sphere Canvas */}
          <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center bg-radial from-slate-50 to-slate-100/60 rounded-full p-2 shadow-inner border border-slate-200/80">
            <canvas
              ref={canvasRef}
              className="w-full h-full block rounded-full"
              style={{ touchAction: 'none' }}
            />

            {/* Overlay if paused/idle before draw */}
            {!isSpinning && extractedCount === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-[1px] rounded-full text-center p-6 space-y-2">
                <div className="w-14 h-14 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 ml-1 text-[#FE932C]" />
                </div>
                <div className="text-sm font-heading font-extrabold text-white drop-shadow-md">
                  Chambre Prête pour le Tirage
                </div>
                <div className="text-xs text-slate-100 max-w-[240px] drop-shadow-sm font-medium">
                  Cliquez sur « Lancer le Tirage » pour débuter le brassage pneumatique
                </div>
              </div>
            )}
          </div>

          {/* Interactive Blower Action Controls */}
          <div className="w-full flex flex-wrap items-center justify-center gap-3 pt-2">
            {!isSpinning ? (
              <button
                onClick={handleStartAutoSimulation}
                className="px-5 py-2.5 bg-[#0F3E2E] hover:bg-[#0A291E] active:bg-[#00271B] text-white rounded-lg font-heading font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#FE932C] fill-[#FE932C]" />
                <span>
                  {extractedCount === 0
                    ? 'Lancer le Tirage Simulé'
                    : isCompleted
                    ? 'Relancer un Nouveau Tirage'
                    : 'Reprendre le Tirage'}
                </span>
              </button>
            ) : (
              <button
                onClick={handlePauseSimulation}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-heading font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Mettre en Pause le Brassage</span>
              </button>
            )}

            {/* Manual Step Extraction Button */}
            <button
              onClick={extractNextBall}
              disabled={extractedCount >= 5}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronRight className="w-4 h-4 text-[#0F3E2E]" />
              <span>
                {extractedCount >= 5
                  ? 'Tirage Terminé (5/5)'
                  : `Extraire la Boule N°${extractedCount + 1}`}
              </span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetSimulation}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Réinitialiser le boulier"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Right: Official Presentation Podium (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0F3E2E]" />
              <h3 className="font-heading font-bold text-base text-slate-900">
                Râtelier Officiel des 5 Boules Gagnantes
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#0F3E2E]">
              {extractedCount}/5 extraits
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Extraction ordonnée par l'algorithme d'études pour le tirage de <strong>{simulationData.slotName} ({simulationData.timeStr})</strong> :
          </div>

          {/* 5 Ball Presentation Slots */}
          <div className="space-y-3">
            {simulationData.winningBalls.map((ball, idx) => {
              const isExtracted = idx < extractedCount;
              const isCurrentlyExtracting = currentlyExtractingNum === ball.num;

              return (
                <div
                  key={ball.num}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isExtracted
                      ? 'bg-gradient-to-r from-emerald-50/90 to-white border-emerald-300 shadow-xs ring-1 ring-emerald-200'
                      : isCurrentlyExtracting
                      ? 'bg-amber-50 border-amber-300 animate-pulse'
                      : 'bg-slate-50/60 border-slate-200/80 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Position Badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-heading font-black text-xs ${
                        isExtracted
                          ? 'bg-[#0F3E2E] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      P{ball.position}
                    </div>

                    {/* Ball Ball Graphic */}
                    {isExtracted ? (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-extrabold text-lg text-white shadow-md relative"
                        style={{
                          backgroundColor: getBallColor(ball.num),
                          boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.6)',
                        }}
                      >
                        <div className="w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center text-sm font-mono font-black shadow-inner">
                          {ball.num}
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-mono text-sm">
                        ?
                      </div>
                    )}

                    {/* Ball Details */}
                    <div>
                      <div className="text-xs font-heading font-bold text-slate-900">
                        {ball.role}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {ball.endorsingMethods.map((m) => (
                          <span
                            key={m}
                            className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right metadata */}
                  <div className="text-right text-[11px] font-mono text-slate-500">
                    {isExtracted ? (
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#0F3E2E]">{ball.consensusScore} pts</div>
                        <div className="text-[10px] text-emerald-800">{ball.slotFrequency}x à cette heure</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">En attente</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Draw Completion Box */}
          {isCompleted && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg space-y-2 text-xs">
              <div className="flex items-center gap-2 font-heading font-bold text-[#0F3E2E] text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Tirage Complet Validé avec Succès !</span>
              </div>
              <p className="text-emerald-950 leading-relaxed">
                Les 5 boules gagnantes sont extraites conformément aux lois stochastiques du tirage Lonaci et à la synthèse des études. Vous pouvez tester cette combinaison ci-dessous.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <button
                  onClick={handleLoadTicketFromSimulation}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-slate-300"
                >
                  <Ticket className="w-3.5 h-3.5 text-[#FE932C]" />
                  <span>Tester dans le Calculateur ci-dessous</span>
                </button>
                <button
                  onClick={() => setIsTicketModalOpen(true)}
                  className="py-2 px-3 bg-[#0F3E2E] hover:bg-[#0A291E] text-white rounded font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-[#FE932C]" />
                  <span>Enregistrer dans Mes Tickets Virtuels</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Study Concordance Matrix & Technical Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0F3E2E]" />
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
              Concordance Multi-Études des Numéros Gagnants du Simulateur
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Indice de Consensus Global : <strong className="text-emerald-700">{simulationData.consensusStrength}%</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-heading font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3">Numéro</th>
                <th className="py-2.5 px-3">Rôle Assigné</th>
                <th className="py-2.5 px-3 text-center">M1 (Fréq.)</th>
                <th className="py-2.5 px-3 text-center">M2 (Chance)</th>
                <th className="py-2.5 px-3 text-center">M3 (Rétro)</th>
                <th className="py-2.5 px-3 text-center">M4 (Matrices)</th>
                <th className="py-2.5 px-3 text-center">M5 (GhanaWeb)</th>
                <th className="py-2.5 px-3 text-right">Score Consensus</th>
                <th className="py-2.5 px-3 text-right">Fréquence Heure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {simulationData.winningBalls.map((ball) => {
                const hasM1 = ball.endorsingMethods.includes('M1');
                const hasM2 = ball.endorsingMethods.includes('M2');
                const hasM3 = ball.endorsingMethods.includes('M3');
                const hasM4 = ball.endorsingMethods.includes('M4');
                const hasM5 = ball.endorsingMethods.includes('M5');

                return (
                  <tr key={ball.num} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-sans font-bold text-[#0F3E2E]">
                      Position {ball.position}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 font-sans">
                        <span
                          className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-mono shadow-xs"
                          style={{ backgroundColor: getBallColor(ball.num) }}
                        >
                          {ball.num}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                      {ball.role}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasM1 ? <span className="text-emerald-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasM2 ? <span className="text-emerald-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasM3 ? <span className="text-emerald-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasM4 ? <span className="text-emerald-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasM5 ? <span className="text-emerald-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-[#0F3E2E]">
                      {ball.consensusScore}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                      {ball.slotFrequency} sorties
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Secondary Backup Candidates */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="font-heading font-semibold text-slate-800 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Numéros de réserve / Soutien immédiat (Positions 6 à 10) :</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
            {simulationData.backupBalls.map((num) => (
              <span
                key={num}
                className="px-2 py-0.5 rounded bg-white border border-slate-300 font-bold text-slate-800"
              >
                {num}
              </span>
            ))}
            <span className="text-slate-500 font-sans text-[11px] ml-1">
              (Numéros en embuscade avec haute résonance secondaire)
            </span>
          </div>
        </div>
      </div>

      {/* Virtual Ticket Simulator (Calculateur de Gain Lonaci) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#0F3E2E]" />
            <h3 className="font-heading font-bold text-base text-slate-900">
              Simulateur de Ticket & Évaluation de Gain (Grille Officielle Lonaci)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Cotes Loto Bonheur Côte d'Ivoire
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Bet Type */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Formule de Jeu :</label>
            <div className="grid grid-cols-5 gap-1 font-mono font-bold">
              {(['1N', '2N', '3N', '4N', '5N'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTicketBetType(type)}
                  className={`py-1.5 text-center rounded border transition-colors cursor-pointer ${
                    ticketBetType === type
                      ? 'bg-[#0F3E2E] text-white border-[#0F3E2E]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {ticketBetType === '1N'
                ? 'Banker Simple (Cote x18)'
                : ticketBetType === '2N'
                ? 'Two Sure Couplé (Cote x240)'
                : ticketBetType === '3N'
                ? 'Permutation 3 Nombres (Cote x2 100)'
                : ticketBetType === '4N'
                ? 'Permutation 4 Nombres (Cote x18 000)'
                : 'Grand Chelem 5 Nombres (Cote x100 000)'}
            </p>
          </div>

          {/* Ticket Numbers Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Vos Numéros Sélectionnés :</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: 24, 68, 11, 47, 83"
                value={ticketNumbers.join(', ')}
                onChange={(e) => {
                  const parsed = e.target.value
                    .split(',')
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => !isNaN(n) && n >= 1 && n <= 90);
                  setTicketNumbers(parsed);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800 font-mono font-bold focus:ring-1 focus:ring-[#0F3E2E]"
              />
              <button
                onClick={handleLoadTicketFromSimulation}
                className="shrink-0 px-2.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-semibold text-[11px] cursor-pointer"
                title="Copier les numéros simulés"
              >
                Simulateur
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {ticketNumbers.length} numéro(s) enregistré(s)
            </p>
          </div>

          {/* Stake Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Mise (FCFA) :</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="100"
                min="100"
                value={ticketStake}
                onChange={(e) => setTicketStake(Math.max(100, parseInt(e.target.value, 10) || 100))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800 font-mono font-bold focus:ring-1 focus:ring-[#0F3E2E]"
              />
              <span className="font-mono font-bold text-slate-600">FCFA</span>
            </div>
            <div className="flex gap-1.5 pt-0.5">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTicketStake(amt)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket Results Evaluation */}
        {ticketEvaluation && (
          <div
            className={`p-4 rounded-xl border mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              ticketEvaluation.isWon
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="space-y-1 text-xs">
              <div className="font-heading font-bold text-sm flex items-center gap-1.5">
                {ticketEvaluation.isWon ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-900">Ticket Gagnant sur le Tirage Simulé !</span>
                  </>
                ) : (
                  <span>Résultat du Ticket en Cours :</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 font-mono">
                <span>Numéros trouvés ({ticketEvaluation.hitsCount}) :</span>
                {ticketEvaluation.hits.length > 0 ? (
                  ticketEvaluation.hits.map((h) => (
                    <span key={h} className="px-1.5 py-0.5 rounded bg-white border border-emerald-300 font-bold text-emerald-900">
                      {h}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">Aucun pour le moment</span>
                )}
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[11px] text-slate-500 block font-sans">Gain Potentiel Estimé</span>
              <div className="text-lg sm:text-xl font-extrabold text-[#0F3E2E]">
                {ticketEvaluation.estimatedGain.toLocaleString('fr-FR')} FCFA
              </div>
              <span className="text-[10px] text-slate-400">
                (Cote officielle x{ticketEvaluation.multiplier})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Ticket Creation Modal */}
      {isTicketModalOpen && (
        <CreateTicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          initialNumbers={targetWinningNumbers}
          initialSlot={selectedSlot}
          initialSlotTime={currentSlotInfo.time}
          initialGameName={currentSlotInfo.name}
          initialDate={new Date().toISOString().split('T')[0]}
          sourceMethodName={`Simulateur (${STUDY_MODES.find((m) => m.id === studyMode)?.label || 'Synthèse'})`}
        />
      )}
    </div>
  );
};
