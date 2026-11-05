/**
 * Simulator Engine for Loto Bonheur Côte d'Ivoire
 * Generates official winning numbers and full chamber ball physics data
 * based on all studies conducted (M1 Fréquences, M2 Chance, M3 Rétro-ingénierie, M4 Matrices, M5 GhanaWeb/Machine).
 */

import {
  Draw,
  DrawSlot,
  SimulatedWinningBall,
  SimulationResult,
  SimulationStudyMode,
} from '../types/lottery';
import { runMethod1, runMethod2, runMethod3 } from './algorithms';
import { runMethod4 } from './matrixAlgorithm';
import { runMethod5 } from './ghanaWebAlgorithm';
import { computeNumberStatistics } from './probability';

export interface ChamberBallParticle {
  id: number;
  num: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isExtracted: boolean;
  isWinningCandidate: boolean;
  winningPosition?: number;
}

const BALL_COLORS = [
  '#0F3E2E', // Deep Emerald
  '#FE932C', // Warm Amber Gold
  '#2563EB', // Royal Blue
  '#DC2626', // Crimson Ruby
  '#7C3AED', // Vivid Violet
  '#059669', // Mint Jade
  '#D97706', // Ochre
  '#0284C7', // Sky Azure
];

/**
 * Returns a stable color for a ball number [1..90]
 */
export function getBallColor(num: number): string {
  return BALL_COLORS[(num - 1) % BALL_COLORS.length];
}

const SLOT_META: Record<DrawSlot, { name: string; time: string }> = {
  morning: { name: 'Akwaba (Matin)', time: '10:00' },
  noon: { name: 'Étoile (Midi)', time: '13:00' },
  afternoon: { name: 'Fortune (Après-Midi)', time: '16:00' },
  evening: { name: 'Diamant (Soirée)', time: '18:15' },
};

/**
 * Computes winning numbers based on all studies conducted
 */
export function generateSimulatedDraw(
  draws: Draw[],
  slot: DrawSlot,
  studyMode: SimulationStudyMode = 'consensus',
  targetDate?: string
): SimulationResult {
  const meta = SLOT_META[slot] || SLOT_META.morning;
  const todayStr = targetDate || new Date().toISOString().split('T')[0];

  // 1. Execute all 5 foundational studies
  const m1 = runMethod1(draws, slot, 365);
  const m2 = runMethod2(draws, slot, todayStr, meta.time, 'enriched');
  const m3 = runMethod3(draws, slot, todayStr, 20);
  const m4 = runMethod4(draws, slot, todayStr, meta.time, meta.name);
  const m5 = runMethod5(draws, slot, meta.time);

  // Historical statistics for the slot
  const slotDraws = draws.filter((d) => d.slot === slot);
  const slotStats = computeNumberStatistics(slotDraws.length >= 10 ? slotDraws : draws);
  const slotStatsMap = new Map(slotStats.map((s) => [s.num, s]));
  const maxSlotFreq = Math.max(...slotStats.map((s) => s.count), 1);

  // Map numbers to endorsing methods
  const methodPicks: Record<'M1' | 'M2' | 'M3' | 'M4' | 'M5', number[]> = {
    M1: m1.top5.map((x) => x.num),
    M2: m2.recommended5.map((x) => x.num),
    M3: m3.recommended5.map((x) => x.num),
    M4: m4.recommended5.map((x) => x.num),
    M5: m5.recommended5.map((x) => x.num),
  };

  const candidateScores = new Map<
    number,
    {
      score: number;
      endorsingMethods: ('M1' | 'M2' | 'M3' | 'M4' | 'M5')[];
      rankSum: number;
    }
  >();

  const studyKeys: ('M1' | 'M2' | 'M3' | 'M4' | 'M5')[] = ['M1', 'M2', 'M3', 'M4', 'M5'];

  studyKeys.forEach((key) => {
    const list = methodPicks[key];
    list.forEach((num, rankIdx) => {
      const cur = candidateScores.get(num) || {
        score: 0,
        endorsingMethods: [],
        rankSum: 0,
      };

      // Base weight inversely proportional to position in each method
      const posWeight = 50 - rankIdx * 7; // 50, 43, 36, 29, 22
      cur.score += posWeight;
      cur.endorsingMethods.push(key);
      cur.rankSum += rankIdx + 1;

      candidateScores.set(num, cur);
    });
  });

  // Calculate final ranking
  let rankedCandidates: {
    num: number;
    score: number;
    endorsingMethods: ('M1' | 'M2' | 'M3' | 'M4' | 'M5')[];
  }[] = [];

  if (studyMode === 'consensus') {
    // Grand Synthesis: Boost candidates supported by multiple independent studies
    candidateScores.forEach((data, num) => {
      const sStat = slotStatsMap.get(num);
      const slotFreq = sStat?.count || 0;
      const currentGap = sStat?.currentGap || 0;

      // Multi-study consensus multiplier: Exponential resonance
      const consensusBonus = Math.pow(data.endorsingMethods.length, 2) * 22; // 22 for 1, 88 for 2, 198 for 3, 352 for 4, 550 for 5

      // Slot frequency calibration
      const freqBonus = (slotFreq / maxSlotFreq) * 35;

      // Harmonic gap bonus
      let gapBonus = 0;
      if (currentGap >= 5 && currentGap <= 35) gapBonus = 18;
      else if (currentGap > 35 && currentGap <= 60) gapBonus = 10;
      else gapBonus = 5;

      const finalScore = Number((data.score + consensusBonus + freqBonus + gapBonus).toFixed(1));
      rankedCandidates.push({
        num,
        score: finalScore,
        endorsingMethods: data.endorsingMethods,
      });
    });

    rankedCandidates.sort((a, b) => b.score - a.score || a.num - b.num);
  } else {
    // Single study chosen by user
    const targetKey =
      studyMode === 'method1'
        ? 'M1'
        : studyMode === 'method2'
        ? 'M2'
        : studyMode === 'method3'
        ? 'M3'
        : studyMode === 'method4'
        ? 'M4'
        : 'M5';

    const chosenList = methodPicks[targetKey];
    rankedCandidates = chosenList.map((num, idx) => {
      const data = candidateScores.get(num);
      return {
        num,
        score: 100 - idx * 10,
        endorsingMethods: data ? data.endorsingMethods : [targetKey],
      };
    });
  }

  // Define the roles for each position
  const ROLE_TITLES = [
    'Position 1 · Banker d’Ancrage',
    'Position 2 · Two Sure Partenaire',
    'Position 3 · Pivot Central',
    'Position 4 · Permutation Majeure',
    'Position 5 · Clôture Combinatoire',
  ];

  const top5 = rankedCandidates.slice(0, 5);
  const backup5 = rankedCandidates.slice(5, 10).map((r) => r.num);

  const winningBalls: SimulatedWinningBall[] = top5.map((item, idx) => {
    const sStat = slotStatsMap.get(item.num);
    return {
      position: idx + 1,
      num: item.num,
      role: ROLE_TITLES[idx] || `Position ${idx + 1}`,
      endorsingMethods: item.endorsingMethods,
      consensusScore: item.score,
      slotFrequency: sStat?.count || 0,
      currentGap: sStat?.currentGap || 0,
      extracted: false,
    };
  });

  // Calculate consensus strength
  const multiMethodHits = winningBalls.filter((b) => b.endorsingMethods.length >= 2).length;
  const consensusStrength = Math.min(98, Math.max(76, 75 + multiMethodHits * 5));

  return {
    slot,
    timeStr: meta.time,
    slotName: meta.name,
    studyMode,
    winningBalls,
    backupBalls: backup5,
    consensusStrength,
    totalStudiesCount: 5,
  };
}

/**
 * Initializes particles inside the chamber for 2D Canvas physics
 */
export function initChamberParticles(
  canvasWidth: number,
  canvasHeight: number,
  winningNumbers: number[]
): ChamberBallParticle[] {
  const particles: ChamberBallParticle[] = [];
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const chamberRadius = Math.min(canvasWidth, canvasHeight) * 0.42;
  const ballRadius = Math.max(10, Math.min(16, chamberRadius / 9));

  for (let num = 1; num <= 90; num++) {
    // Position randomly inside the lower 2/3 of the sphere
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (chamberRadius - ballRadius * 2.2);

    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist * 0.8 + 20; // slightly weighted downward

    const isWinning = winningNumbers.includes(num);
    const winPos = isWinning ? winningNumbers.indexOf(num) + 1 : undefined;

    particles.push({
      id: num,
      num,
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      radius: ballRadius,
      color: getBallColor(num),
      isExtracted: false,
      isWinningCandidate: isWinning,
      winningPosition: winPos,
    });
  }

  return particles;
}

/**
 * Physics tick for the tumbling chamber
 */
export function updateChamberPhysics(
  particles: ChamberBallParticle[],
  canvasWidth: number,
  canvasHeight: number,
  blowerPower: number = 1.0, // 0 = idle, 1.0 = normal, 1.5 = turbo
  targetExtractingNum?: number
): void {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const chamberRadius = Math.min(canvasWidth, canvasHeight) * 0.42;

  const gravity = 0.38;
  const drag = 0.982;

  for (const p of particles) {
    if (p.isExtracted) continue;

    // 1. Air blower upward jet concentrated in bottom-center
    const distFromCenterX = p.x - cx;
    const jetWidth = chamberRadius * 0.75;
    if (Math.abs(distFromCenterX) < jetWidth && p.y > cy - chamberRadius * 0.3) {
      const jetStrength = (1 - Math.abs(distFromCenterX) / jetWidth) * blowerPower * 2.4;
      p.vy -= jetStrength;
      p.vx += (Math.random() - 0.5) * 1.8 * blowerPower;
    }

    // 2. Swirling vortex airflow
    const dx = p.x - cx;
    const dy = p.y - cy;
    const swirlAngle = Math.atan2(dy, dx);
    p.vx += -Math.sin(swirlAngle) * 0.45 * blowerPower;
    p.vy += Math.cos(swirlAngle) * 0.3 * blowerPower;

    // 3. Gravity
    p.vy += gravity;

    // 4. Special attraction if this specific ball is currently being extracted
    if (targetExtractingNum && p.num === targetExtractingNum) {
      const chuteX = cx;
      const chuteY = cy - chamberRadius + 15;
      const toChuteX = chuteX - p.x;
      const toChuteY = chuteY - p.y;
      p.vx += toChuteX * 0.08;
      p.vy += toChuteY * 0.08;
    }

    // 5. Apply velocity with drag
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx;
    p.y += p.vy;

    // 6. Boundary collision with circular sphere
    const curDx = p.x - cx;
    const curDy = p.y - cy;
    const curDist = Math.sqrt(curDx * curDx + curDy * curDy);
    const maxDist = chamberRadius - p.radius;

    if (curDist > maxDist) {
      const nx = curDx / curDist;
      const ny = curDy / curDist;

      // Push back inside
      p.x = cx + nx * maxDist;
      p.y = cy + ny * maxDist;

      // Reflect velocity along normal with restitution
      const dot = p.vx * nx + p.vy * ny;
      if (dot > 0) {
        p.vx -= (1 + 0.82) * dot * nx;
        p.vy -= (1 + 0.82) * dot * ny;
      }
    }
  }
}
