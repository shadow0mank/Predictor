import { Draw, DrawSlot, Method5Result } from '../types/lottery';
import { computeNumberStatistics } from './probability';
import {
  GHANA_WEB_FORECASTS,
  GHANA_WEB_SOURCE_URL,
  GhanaWebForecast,
} from '../data/ghanaWebData';

/**
 * Normalizes hour string to one of the 4 daily draw times
 */
export function normalizeDrawHour(timeStr?: string): '10:00' | '13:00' | '16:00' | '18:15' {
  if (!timeStr) return '10:00';
  const clean = timeStr.trim();
  if (clean.startsWith('10')) return '10:00';
  if (clean.startsWith('13')) return '13:00';
  if (clean.startsWith('16')) return '16:00';
  if (clean.startsWith('18') || clean.startsWith('19')) return '18:15';

  const hour = parseInt(clean.split(':')[0], 10);
  if (hour < 12) return '10:00';
  if (hour < 15) return '13:00';
  if (hour < 17) return '16:00';
  return '18:15';
}

/**
 * Core Algorithm for Method 5:
 * Combines GhanaWeb Solutions online forecast (Banker, Two Sure, Permutation)
 * with historical slot frequencies (fréquences de sortie de l'heure de jeu)
 * to calibrate winning candidates into optimal positions 1 to 5.
 */
export function runMethod5(
  allDraws: Draw[],
  targetSlot: DrawSlot,
  timeStr: string = '10:00'
): Method5Result {
  const normHour = normalizeDrawHour(timeStr);
  const forecast: GhanaWebForecast =
    GHANA_WEB_FORECASTS[normHour] || GHANA_WEB_FORECASTS['10:00'];

  // Filter historical draws by slot/hour for slot-specific frequencies
  const slotDraws = allDraws.filter(
    (d) => d.slot === targetSlot || normalizeDrawHour(d.drawTime) === normHour
  );
  const activeDraws = slotDraws.length >= 10 ? slotDraws : allDraws;
  const slotStats = computeNumberStatistics(activeDraws);
  const slotStatsMap = new Map(slotStats.map((s) => [s.num, s]));
  const maxSlotCount = Math.max(...slotStats.map((s) => s.count), 1);

  // Global stats for fallback & momentum
  const globalStats = computeNumberStatistics(allDraws);
  const globalStatsMap = new Map(globalStats.map((s) => [s.num, s]));
  const maxGlobalCount = Math.max(...globalStats.map((s) => s.count), 1);

  // Equal baseline weight for all candidate numbers (predictions and machines taken au même degré)
  const EQUAL_BASE_WEIGHT = 25.0;

  // Build pool of candidates from GhanaWeb Solutions (Both Predictions AND Machines on equal footing)
  const candidatePool = new Map<
    number,
    {
      origin: string;
      category: 'Prédiction' | 'Machine' | 'Mixte';
      isBanker: boolean;
      isTwoSure: boolean;
      isPermutation: boolean;
      isMachine: boolean;
    }
  >();

  // 1. Gather all numbers from Predictions (Banker, Two Sure, Permutation)
  const predictionNumbers = new Set<number>();
  predictionNumbers.add(forecast.banker);
  forecast.twoSure.forEach((n) => predictionNumbers.add(n));
  forecast.permutation.forEach((n) => predictionNumbers.add(n));

  // 2. Gather all numbers from Machines
  const machineNumbers = new Set<number>(forecast.machine);

  // 3. Union of all candidate numbers with equal consideration
  const allCandidateNums = new Set<number>([...predictionNumbers, ...machineNumbers]);

  allCandidateNums.forEach((num) => {
    const inPred = predictionNumbers.has(num);
    const inMach = machineNumbers.has(num);
    const isBanker = num === forecast.banker;
    const isTwoSure = forecast.twoSure.includes(num);

    let origin = '';
    let category: 'Prédiction' | 'Machine' | 'Mixte' = 'Prédiction';

    if (inPred && inMach) {
      category = 'Mixte';
      origin = isBanker
        ? 'Banker & Machine (GhanaWeb)'
        : isTwoSure
        ? 'Two Sure & Machine (GhanaWeb)'
        : 'Permutation & Machine (GhanaWeb)';
    } else if (inMach) {
      category = 'Machine';
      origin = 'Machine (GhanaWeb)';
    } else {
      category = 'Prédiction';
      origin = isBanker
        ? 'Prédiction · Banker Phare'
        : isTwoSure
        ? 'Prédiction · Two Sure Couplé'
        : 'Prédiction · Permutation';
    }

    candidatePool.set(num, {
      origin,
      category,
      isBanker,
      isTwoSure,
      isPermutation: inPred && !isBanker && !isTwoSure,
      isMachine: inMach,
    });
  });

  // 4. Compute synergy scores with draw-hour frequencies (L'opération de filtrage horaire)
  const synergyDetails: {
    num: number;
    origin: string;
    category: 'Prédiction' | 'Machine' | 'Mixte';
    baseWeight: number;
    ghanaWeight: number;
    slotFreqBonus: number;
    gapBonus: number;
    globalBonus: number;
    totalScore: number;
    slotFrequency: number;
    globalFrequency: number;
    currentGap: number;
  }[] = [];

  candidatePool.forEach((item, num) => {
    const sStat = slotStatsMap.get(num);
    const gStat = globalStatsMap.get(num);

    const slotFreq = sStat?.count || 0;
    const globalFreq = gStat?.count || 0;
    const currentGap = sStat?.currentGap ?? gStat?.currentGap ?? 0;

    // Slot frequency bonus for the specific draw hour (up to 35 pts)
    const slotFreqBonus = Number(((slotFreq / maxSlotCount) * 35).toFixed(2));

    // Gap / Harmonic return cycle bonus (up to 15 pts)
    let gapBonus = 0;
    if (currentGap >= 5 && currentGap <= 35) {
      gapBonus = 15; // Optimal active harmonic return window
    } else if (currentGap > 35 && currentGap <= 60) {
      gapBonus = 10; // Medium overdue
    } else if (currentGap > 60) {
      gapBonus = 6;  // Long overdue
    } else {
      gapBonus = 8;  // Immediate recurrence potential (< 5 draws)
    }

    // Global cadence bonus (up to 10 pts)
    const globalBonus = Number(((globalFreq / maxGlobalCount) * 10).toFixed(2));

    // Combined score: All candidates start with the equal baseline weight (25 pts)
    const totalScore = Number(
      (EQUAL_BASE_WEIGHT + slotFreqBonus + gapBonus + globalBonus).toFixed(2)
    );

    synergyDetails.push({
      num,
      origin: item.origin,
      category: item.category,
      baseWeight: EQUAL_BASE_WEIGHT,
      ghanaWeight: EQUAL_BASE_WEIGHT,
      slotFreqBonus,
      gapBonus,
      globalBonus,
      totalScore,
      slotFrequency: slotFreq,
      globalFrequency: globalFreq,
      currentGap,
    });
  });

  // Sort candidates strictly by total calibrated score in descending order
  synergyDetails.sort((a, b) => b.totalScore - a.totalScore);

  // Take top 5 candidates across all predictions and machines
  const finalTop5: {
    num: number;
    origin: string;
    category: 'Prédiction' | 'Machine' | 'Mixte';
    score: number;
    slotFrequency: number;
    globalFrequency: number;
    currentGap: number;
  }[] = [];

  for (const item of synergyDetails) {
    finalTop5.push({
      num: item.num,
      origin: item.origin,
      category: item.category,
      score: item.totalScore,
      slotFrequency: item.slotFrequency,
      globalFrequency: item.globalFrequency,
      currentGap: item.currentGap,
    });
    if (finalTop5.length === 5) break;
  }

  // Fallback if less than 5 candidates
  if (finalTop5.length < 5) {
    const topBySlot = [...slotStats].sort((a, b) => b.count - a.count);
    for (const s of topBySlot) {
      if (!finalTop5.some((f) => f.num === s.num)) {
        finalTop5.push({
          num: s.num,
          origin: 'Fréquence Heure (Complément)',
          category: 'Prédiction',
          score: 20,
          slotFrequency: s.count,
          globalFrequency: globalStatsMap.get(s.num)?.count || s.count,
          currentGap: s.currentGap,
        });
        if (finalTop5.length === 5) break;
      }
    }
  }

  return {
    recommended5: finalTop5.slice(0, 5),
    sourceUrl: GHANA_WEB_SOURCE_URL,
    slotHour: normHour,
    slotName: forecast.slotName,
    gameName: forecast.gameName,
    banker: forecast.banker,
    twoSure: forecast.twoSure,
    permutationPool: forecast.permutation,
    machineNumbers: forecast.machine,
    forecastConfidence: forecast.confidence,
    forecastNote: forecast.forecastNote,
    fetchedAt: new Date().toISOString(),
    synergyDetails: synergyDetails.map((s) => ({
      num: s.num,
      origin: s.origin,
      category: s.category,
      baseWeight: s.baseWeight,
      ghanaWeight: s.ghanaWeight,
      slotFreqBonus: s.slotFreqBonus,
      gapBonus: s.gapBonus,
      globalBonus: s.globalBonus,
      totalScore: s.totalScore,
      slotFrequency: s.slotFrequency,
      globalFrequency: s.globalFrequency,
      currentGap: s.currentGap,
    })),
  };
}
