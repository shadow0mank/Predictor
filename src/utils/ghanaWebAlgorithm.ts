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

  // Global stats for fallback
  const globalStats = computeNumberStatistics(allDraws);
  const globalStatsMap = new Map(globalStats.map((s) => [s.num, s]));

  // Build pool of candidates from GhanaWeb Solutions
  const candidatePool = new Map<
    number,
    {
      origin: 'Banker (P1)' | 'Two Sure (P2)' | 'Permutation Top' | 'Permutation Secondaire';
      ghanaWeight: number;
    }
  >();

  // 1. Banker (Highest priority anchor)
  candidatePool.set(forecast.banker, {
    origin: 'Banker (P1)',
    ghanaWeight: 42,
  });

  // 2. Two Sure Partner
  const twoSurePartner = forecast.twoSure.find((n) => n !== forecast.banker) || forecast.twoSure[1];
  if (twoSurePartner && !candidatePool.has(twoSurePartner)) {
    candidatePool.set(twoSurePartner, {
      origin: 'Two Sure (P2)',
      ghanaWeight: 34,
    });
  }

  // 3. Permutation pool
  forecast.permutation.forEach((n, idx) => {
    if (!candidatePool.has(n)) {
      candidatePool.set(n, {
        origin: idx < 3 ? 'Permutation Top' : 'Permutation Secondaire',
        ghanaWeight: idx < 3 ? 26 : 20,
      });
    }
  });

  // 4. Compute synergy scores with slot frequencies
  const synergyDetails: {
    num: number;
    origin: 'Banker (P1)' | 'Two Sure (P2)' | 'Permutation Top' | 'Permutation Secondaire';
    ghanaWeight: number;
    slotFreqBonus: number;
    gapBonus: number;
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

    // Slot frequency bonus (up to 20 pts)
    const slotFreqBonus = Number(((slotFreq / maxSlotCount) * 20).toFixed(2));

    // Gap bonus: numbers within normal return cycle (5 to 35 draws) get bonus
    let gapBonus = 0;
    if (currentGap >= 6 && currentGap <= 35) {
      gapBonus = 8;
    } else if (currentGap > 35) {
      gapBonus = 4;
    } else {
      gapBonus = 2; // recently drawn
    }

    const totalScore = Number((item.ghanaWeight + slotFreqBonus + gapBonus).toFixed(2));

    synergyDetails.push({
      num,
      origin: item.origin,
      ghanaWeight: item.ghanaWeight,
      slotFreqBonus,
      gapBonus,
      totalScore,
      slotFrequency: slotFreq,
      globalFrequency: globalFreq,
      currentGap,
    });
  });

  // Sort candidates by total score descending
  synergyDetails.sort((a, b) => b.totalScore - a.totalScore);

  // Position calibration:
  // Position 1: The Banker (or highest synergistic candidate)
  // Position 2: The Two Sure partner
  // Positions 3..5: The best permutation numbers
  const finalTop5: {
    num: number;
    origin: 'Banker (P1)' | 'Two Sure (P2)' | 'Permutation Top' | 'Permutation Secondaire';
    score: number;
    slotFrequency: number;
    globalFrequency: number;
    currentGap: number;
  }[] = [];

  const bankerItem = synergyDetails.find((s) => s.origin === 'Banker (P1)') || synergyDetails[0];
  if (bankerItem) {
    finalTop5.push({
      num: bankerItem.num,
      origin: bankerItem.origin,
      score: bankerItem.totalScore,
      slotFrequency: bankerItem.slotFrequency,
      globalFrequency: bankerItem.globalFrequency,
      currentGap: bankerItem.currentGap,
    });
  }

  const twoSureItem = synergyDetails.find(
    (s) => s.origin === 'Two Sure (P2)' && s.num !== bankerItem?.num
  ) || synergyDetails.find((s) => s.num !== bankerItem?.num);

  if (twoSureItem) {
    finalTop5.push({
      num: twoSureItem.num,
      origin: twoSureItem.origin,
      score: twoSureItem.totalScore,
      slotFrequency: twoSureItem.slotFrequency,
      globalFrequency: twoSureItem.globalFrequency,
      currentGap: twoSureItem.currentGap,
    });
  }

  // Add remaining 3 numbers from highest synergy scores
  for (const item of synergyDetails) {
    if (finalTop5.some((f) => f.num === item.num)) continue;
    finalTop5.push({
      num: item.num,
      origin: item.origin,
      score: item.totalScore,
      slotFrequency: item.slotFrequency,
      globalFrequency: item.globalFrequency,
      currentGap: item.currentGap,
    });
    if (finalTop5.length === 5) break;
  }

  // Fallback if less than 5
  if (finalTop5.length < 5) {
    const topBySlot = [...slotStats].sort((a, b) => b.count - a.count);
    for (const s of topBySlot) {
      if (!finalTop5.some((f) => f.num === s.num)) {
        finalTop5.push({
          num: s.num,
          origin: 'Permutation Secondaire',
          score: 15,
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
      ghanaWeight: s.ghanaWeight,
      slotFreqBonus: s.slotFreqBonus,
      gapBonus: s.gapBonus,
      totalScore: s.totalScore,
    })),
  };
}
