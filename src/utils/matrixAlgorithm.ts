import {
  Draw,
  DrawSlot,
  MatrixItem,
  Method4Result,
  MethodRankingItem,
  PositionStat,
  MethodMatchRecord,
  HourlySlotRanking,
} from '../types/lottery';
import { computeNumberStatistics } from './probability';
import { runMethod1, runMethod2, runMethod3 } from './algorithms';
import { runMethod5, normalizeDrawHour } from './ghanaWebAlgorithm';
import rawMatrices from '../data/lottoMatricePlus_ci_matrices.json';


const MATRICES_BY_DATE = rawMatrices as Record<string, MatrixItem[]>;

/**
 * Decomposes a 12-digit matrix or clavier key into direct 2-digit pairs and triplet modulo sums.
 */
export function decomposeMatrixKey(keyStr: string): {
  directPairs: number[];
  tripletSums: number[];
} {
  if (!keyStr) return { directPairs: [], tripletSums: [] };
  const clean = keyStr.replace(/[^0-9\s]/g, '').trim();
  const triplets = clean.split(/\s+/).filter((t) => /^[0-9]{3}$/.test(t));
  const directPairs: number[] = [];
  const tripletSums: number[] = [];

  for (const t of triplets) {
    const p1 = parseInt(t.slice(0, 2), 10);
    const p2 = parseInt(t.slice(1, 3), 10);
    const sum = ((parseInt(t, 10) - 1) % 90) + 1;

    [p1, p2].forEach((p) => {
      const v = p > 90 ? ((p - 1) % 90) + 1 : p === 0 ? 90 : p;
      if (v >= 1 && v <= 90) directPairs.push(v);
    });
    if (sum >= 1 && sum <= 90) tripletSums.push(sum);
  }

  return { directPairs, tripletSums };
}

/**
 * Decodes code digits into valid numbers [1..90].
 */
export function decodeCodeNumbers(codeStr: string): number[] {
  if (!codeStr) return [];
  const clean = codeStr.replace(/[^0-9]/g, '');
  if (!clean) return [];
  const results: number[] = [];

  const val = parseInt(clean, 10);
  if (val >= 1 && val <= 90) results.push(val);
  else if (val > 90) {
    results.push(((val - 1) % 90) + 1);
  }

  // Cross pairs if 3 digits (e.g. 193 -> 19, 93%90=3)
  if (clean.length === 3) {
    const p1 = parseInt(clean.slice(0, 2), 10);
    const p2 = parseInt(clean.slice(1, 3), 10);
    if (p1 >= 1 && p1 <= 90) results.push(p1);
    const v2 = ((p2 - 1) % 90) + 1;
    if (v2 >= 1 && v2 <= 90) results.push(v2);

    // Sum of digits (1 + 9 + 3 = 13)
    const sumDigits = parseInt(clean[0], 10) + parseInt(clean[1], 10) + parseInt(clean[2], 10);
    if (sumDigits >= 1 && sumDigits <= 90) results.push(sumDigits);
  }

  return Array.from(new Set(results));
}

/**
 * Decodes event number into valid numbers [1..90].
 */
export function decodeEventNumbers(eventStr: string): number[] {
  if (!eventStr) return [];
  const clean = eventStr.replace(/[^0-9]/g, '');
  if (!clean) return [];
  const results: number[] = [];

  const val = parseInt(clean, 10);
  if (val >= 1 && val <= 90) {
    results.push(val);
    // Complement to 90
    results.push(90 - val === 0 ? 90 : 90 - val);
  } else if (val > 90) {
    const modVal = ((val - 1) % 90) + 1;
    results.push(modVal);
  }

  // Mirror inversion if 2 digits (e.g. 26 -> 62)
  if (clean.length === 2 && clean[0] !== clean[1]) {
    const mirror = parseInt(clean[1] + clean[0], 10);
    if (mirror >= 1 && mirror <= 90) results.push(mirror);
  }

  return Array.from(new Set(results));
}

/**
 * Finds the MatrixItem for a specific date and slot/hour from Lotto Matrice Plus dataset.
 */
export function findMatrixForDateAndSlot(
  targetDate: string,
  targetSlot: DrawSlot,
  targetHourStr?: string,
  drawName?: string
): MatrixItem | null {
  const targetHour = targetHourStr ? parseInt(targetHourStr.split(':')[0], 10) : 10;
  const list = MATRICES_BY_DATE[targetDate];

  if (list && list.length > 0) {
    // 1. Try matching draw name
    if (drawName) {
      const byName = list.find(
        (m) =>
          m.drawName.toLowerCase().includes(drawName.toLowerCase()) ||
          drawName.toLowerCase().includes(m.drawName.toLowerCase())
      );
      if (byName) return byName;
    }

    // 2. Try matching hour
    const byHour = list.find((m) => parseInt(m.hour, 10) === targetHour);
    if (byHour) return byHour;

    // 3. Return closest or first
    return list[0];
  }

  // Fallback: look for the most recent date with a matrix for this slot/hour
  const allDates = Object.keys(MATRICES_BY_DATE).sort().reverse();
  for (const d of allDates) {
    const dList = MATRICES_BY_DATE[d];
    if (dList && dList.length > 0) {
      if (drawName) {
        const byName = dList.find((m) =>
          m.drawName.toLowerCase().includes(drawName.toLowerCase())
        );
        if (byName) return byName;
      }
      const byHour = dList.find((m) => parseInt(m.hour, 10) === targetHour);
      if (byHour) return byHour;
    }
  }

  return allDates.length > 0 && MATRICES_BY_DATE[allDates[0]]?.length > 0
    ? MATRICES_BY_DATE[allDates[0]][0]
    : null;
}

/**
 * METHOD 4: Matrices Côte d'Ivoire (Loto Matrice Plus)
 */
export function runMethod4(
  allDraws: Draw[],
  targetSlot: DrawSlot,
  targetDate: string,
  targetHourStr: string = '10:00',
  drawName?: string
): Method4Result {
  const matrixData = findMatrixForDateAndSlot(targetDate, targetSlot, targetHourStr, drawName);

  const stats = computeNumberStatistics(allDraws.filter((d) => d.slot === targetSlot));
  const statsMap = new Map(stats.map((s) => [s.num, s]));
  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  if (!matrixData || !matrixData.matriceKey) {
    // Robust fallback if no matrix key is available
    const fallbackTop = [14, 28, 42, 63, 77];
    return {
      recommended5: fallbackTop.map((num) => ({
        num,
        origin: 'Paire Clé Matrice',
        freqCount: statsMap.get(num)?.count || 0,
        currentGap: statsMap.get(num)?.currentGap || 0,
      })),
      matrixData: null,
      rawPairs: fallbackTop,
      clavierPairs: [],
      codeNumbers: [],
      eventNumbers: [],
      tripletSums: [],
    };
  }

  const { directPairs: rawPairs, tripletSums } = decomposeMatrixKey(matrixData.matriceKey);
  const { directPairs: clavierPairs } = decomposeMatrixKey(matrixData.clavier || '');
  const codeNumbers = decodeCodeNumbers(matrixData.code || '');
  const eventNumbers = decodeEventNumbers(matrixData.event || '');

  // Intersection: numbers in both matriceKey AND clavier get highest resonance
  const clavierSet = new Set(clavierPairs);
  const commonMatriceClavier = new Set(rawPairs.filter((n) => clavierSet.has(n)));

  // Score candidate numbers
  const candidateScores = new Map<number, { score: number; origin: string }>();

  // 1. Pivot Matrice-Clavier (Strongest Resonance)
  commonMatriceClavier.forEach((n) => {
    candidateScores.set(n, { score: 60, origin: 'Pivot Matrice-Clavier' });
  });

  // 2. Code numbers
  codeNumbers.forEach((n) => {
    const cur = candidateScores.get(n);
    if (!cur) {
      candidateScores.set(n, { score: 45, origin: 'Décodage Code' });
    } else {
      cur.score += 25;
    }
  });

  // 3. Event numbers
  eventNumbers.forEach((n) => {
    const cur = candidateScores.get(n);
    if (!cur) {
      candidateScores.set(n, { score: 40, origin: 'Résonance Event' });
    } else {
      cur.score += 20;
    }
  });

  // 4. Direct matrix pairs
  rawPairs.forEach((n) => {
    const cur = candidateScores.get(n);
    if (!cur) {
      candidateScores.set(n, { score: 30, origin: 'Paire Clé Matrice' });
    } else {
      cur.score += 15;
    }
  });

  // 5. Triplet sums
  tripletSums.forEach((n) => {
    const cur = candidateScores.get(n);
    if (!cur) {
      candidateScores.set(n, { score: 25, origin: 'Somme Triplet' });
    } else {
      cur.score += 10;
    }
  });

  // 6. Clavier pairs
  clavierPairs.forEach((n) => {
    const cur = candidateScores.get(n);
    if (!cur) {
      candidateScores.set(n, { score: 20, origin: 'Résonance Clavier' });
    }
  });

  // Add historical slot frequency weight
  const sortedCandidates = Array.from(candidateScores.entries()).map(([num, data]) => {
    const stat = statsMap.get(num);
    const freqBonus = stat ? (stat.count / maxCount) * 15 : 0;
    const gapBonus = stat && stat.currentGap > 10 ? 5 : 0;
    return {
      num,
      origin: data.origin,
      totalScore: data.score + freqBonus + gapBonus,
      freqCount: stat?.count || 0,
      currentGap: stat?.currentGap || 0,
    };
  });

  sortedCandidates.sort((a, b) => b.totalScore - a.totalScore || a.num - b.num);

  // Pick top 5
  let selected = sortedCandidates.slice(0, 5);

  // Complete to 5 if matrix was short
  if (selected.length < 5) {
    const byFreq = [...stats].sort((a, b) => b.count - a.count);
    for (const f of byFreq) {
      if (!selected.some((s) => s.num === f.num)) {
        selected.push({
          num: f.num,
          origin: 'Top-Fréquence Matrice',
          totalScore: 10,
          freqCount: f.count,
          currentGap: f.currentGap,
        });
        if (selected.length === 5) break;
      }
    }
  }

  return {
    recommended5: selected.slice(0, 5).map((s) => ({
      num: s.num,
      origin: s.origin,
      freqCount: s.freqCount,
      currentGap: s.currentGap,
    })),
    matrixData,
    rawPairs,
    clavierPairs,
    codeNumbers,
    eventNumbers,
    tripletSums,
  };
}

/**
 * Evaluates and ranks all 4 methods against historical draws,
 * tracking exact winning numbers matched and their positions during predictions.
 */
export function evaluateAllMethodsRanking(
  allDraws: Draw[],
  sampleSize: number = 40
): MethodRankingItem[] {
  const evaluatedDraws = allDraws.slice(0, Math.min(sampleSize, allDraws.length));
  const totalDraws = evaluatedDraws.length;

  const initMethodAccumulator = (
    id: 'method1' | 'method2' | 'method3' | 'method4' | 'method5',
    name: string,
    shortName: string
  ) => ({
    id,
    name,
    shortName,
    rank: 0,
    totalHits: 0,
    drawsEvaluated: totalDraws,
    avgHitsPerDraw: 0,
    successRateAtLeast1: 0,
    successRateAtLeast2: 0,
    successRateAtLeast3: 0,
    countAtLeast1: 0,
    countAtLeast2: 0,
    countAtLeast3: 0,
    pos1Hits: 0,
    pos1ExactOrder: 0,
    pos2Hits: 0,
    pos2ExactOrder: 0,
    pos3Hits: 0,
    pos3ExactOrder: 0,
    pos4Hits: 0,
    pos4ExactOrder: 0,
    pos5Hits: 0,
    pos5ExactOrder: 0,
    recentMatches: [] as MethodMatchRecord[],
  });

  const accumulators = {
    method1: initMethodAccumulator('method1', 'Méthode 1 · Fréquences de Sortie', 'M1 · Fréquences'),
    method2: initMethodAccumulator('method2', 'Méthode 2 · Facteur Chance Décimal', 'M2 · Chance'),
    method3: initMethodAccumulator('method3', 'Méthode 3 · Rétro-Ingénierie', 'M3 · Rétro'),
    method4: initMethodAccumulator('method4', 'Méthode 4 · Matrices Côte d’Ivoire', 'M4 · Matrices'),
    method5: initMethodAccumulator('method5', 'Méthode 5 · GhanaWeb & Fréquences', 'M5 · Web & Fréq'),
  };

  const methodKeys = ['method1', 'method2', 'method3', 'method4', 'method5'] as const;

  // Evaluate across sample draws
  evaluatedDraws.forEach((draw, dIdx) => {
    // History available at the time of this draw
    const trainingHistory = allDraws.slice(dIdx + 1);
    if (trainingHistory.length < 15) return;

    // Generate predictions for all 5 methods for this draw's context
    const m1 = runMethod1(trainingHistory, draw.slot, 180);
    const m2 = runMethod2(trainingHistory, draw.slot, draw.drawDate, draw.drawTime, 'enriched');
    const m3 = runMethod3(trainingHistory, draw.slot, draw.drawDate, 10);
    const m4 = runMethod4(trainingHistory, draw.slot, draw.drawDate, draw.drawTime, draw.drawName);
    const m5 = runMethod5(trainingHistory, draw.slot, draw.drawTime);

    const predictions: Record<'method1' | 'method2' | 'method3' | 'method4' | 'method5', number[]> = {
      method1: m1.top5.map((x) => x.num),
      method2: m2.recommended5.map((x) => x.num),
      method3: m3.recommended5.map((x) => x.num),
      method4: m4.recommended5.map((x) => x.num),
      method5: m5.recommended5.map((x) => x.num),
    };

    const realSet = new Set(draw.numbers);

    methodKeys.forEach((mKey) => {
      const predNums = predictions[mKey];
      const acc = accumulators[mKey];

      const matchedDetails: {
        num: number;
        predictedPos: number;
        realPos: number;
        isExactOrder: boolean;
      }[] = [];

      predNums.forEach((pNum, pIdx) => {
        const predPos = pIdx + 1;
        if (realSet.has(pNum)) {
          const realIdx = draw.numbers.indexOf(pNum);
          const realPos = realIdx + 1;
          const isExactOrder = predPos === realPos;

          matchedDetails.push({
            num: pNum,
            predictedPos: predPos,
            realPos,
            isExactOrder,
          });

          // Position stats
          if (predPos === 1) {
            acc.pos1Hits++;
            if (isExactOrder) acc.pos1ExactOrder++;
          } else if (predPos === 2) {
            acc.pos2Hits++;
            if (isExactOrder) acc.pos2ExactOrder++;
          } else if (predPos === 3) {
            acc.pos3Hits++;
            if (isExactOrder) acc.pos3ExactOrder++;
          } else if (predPos === 4) {
            acc.pos4Hits++;
            if (isExactOrder) acc.pos4ExactOrder++;
          } else if (predPos === 5) {
            acc.pos5Hits++;
            if (isExactOrder) acc.pos5ExactOrder++;
          }
        }
      });

      const hitsCount = matchedDetails.length;
      acc.totalHits += hitsCount;

      if (hitsCount >= 1) acc.countAtLeast1++;
      if (hitsCount >= 2) acc.countAtLeast2++;
      if (hitsCount >= 3) acc.countAtLeast3++;

      if (dIdx < 15) {
        acc.recentMatches.push({
          drawDate: draw.drawDate,
          drawTime: draw.drawTime,
          drawName: draw.drawName,
          realNumbers: draw.numbers,
          predictedNumbers: predNums,
          hitsCount,
          matchedDetails,
        });
      }
    });
  });

  const rankingList: MethodRankingItem[] = methodKeys.map((mKey) => {
    const a = accumulators[mKey];
    const validTotal = Math.max(1, totalDraws);

    const makePosStat = (hits: number, exactOrder: number): PositionStat => ({
      totalPredicted: validTotal,
      hits,
      exactOrderHits: exactOrder,
      hitRate: Number(((hits / validTotal) * 100).toFixed(1)),
    });

    return {
      id: a.id,
      name: a.name,
      shortName: a.shortName,
      rank: 1,
      totalHits: a.totalHits,
      drawsEvaluated: validTotal,
      avgHitsPerDraw: Number((a.totalHits / validTotal).toFixed(2)),
      successRateAtLeast1: Number(((a.countAtLeast1 / validTotal) * 100).toFixed(1)),
      successRateAtLeast2: Number(((a.countAtLeast2 / validTotal) * 100).toFixed(1)),
      successRateAtLeast3: Number(((a.countAtLeast3 / validTotal) * 100).toFixed(1)),
      positionStats: {
        pos1: makePosStat(a.pos1Hits, a.pos1ExactOrder),
        pos2: makePosStat(a.pos2Hits, a.pos2ExactOrder),
        pos3: makePosStat(a.pos3Hits, a.pos3ExactOrder),
        pos4: makePosStat(a.pos4Hits, a.pos4ExactOrder),
        pos5: makePosStat(a.pos5Hits, a.pos5ExactOrder),
      },
      recentMatches: a.recentMatches,
    };
  });

  // Sort by totalHits descending, then by successRateAtLeast2
  rankingList.sort((a, b) => b.totalHits - a.totalHits || b.successRateAtLeast2 - a.successRateAtLeast2);

  // Assign ranks
  rankingList.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return rankingList;
}

/**
 * Evaluates method rankings broken down by draw hour (Tranches Horaires de la Journée)
 * Allows users to see which method is historically the most accurate for each hour of play.
 */
export function evaluateHourlyMethodsRanking(
  allDraws: Draw[],
  sampleSizePerSlot: number = 35
): HourlySlotRanking[] {
  const targetSlots: { hour: string; slotName: string }[] = [
    { hour: '10:00', slotName: '10H00 · Akwaba / Réveil (Matin)' },
    { hour: '13:00', slotName: '13H00 · Étoile / Espoir (Midi)' },
    { hour: '16:00', slotName: '16H00 · Fortune / Akwaba (Après-Midi)' },
    { hour: '18:15', slotName: '18H15 · Diamant / Afterwork (Soirée)' },
  ];

  return targetSlots.map((slot) => {
    // Filter draws matching this slot hour
    const filteredDraws = allDraws.filter(
      (d) => normalizeDrawHour(d.drawTime) === slot.hour
    );
    const activeSubDraws = filteredDraws.length > 5 ? filteredDraws : allDraws;
    const rankings = evaluateAllMethodsRanking(activeSubDraws, sampleSizePerSlot);

    const best = rankings[0];

    return {
      hour: slot.hour,
      slotName: slot.slotName,
      drawsEvaluated: Math.min(sampleSizePerSlot, activeSubDraws.length),
      bestMethodId: best?.id || 'method1',
      bestMethodName: best?.name || 'Méthode 1',
      bestMethodHitRate: best?.successRateAtLeast1 || 0,
      rankings,
    };
  });
}

