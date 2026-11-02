import { Draw, DrawSlot, NumberStat, PairFrequency } from '../types/lottery';

// Combinations nCr
export function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let c = 1;
  for (let i = 1; i <= r; i++) {
    c = (c * (n - (r - i))) / i;
  }
  return c;
}

// Total possible 5-number combinations from 90: C(90, 5) = 43,949,268
export const TOTAL_COMBINATIONS = combinations(90, 5); // 43,949,268

// Theoretical probabilities for 5/90 game
export const THEORETICAL_ODDS = {
  fiveCorrect: 1 / TOTAL_COMBINATIONS, // 1 in 43,949,268
  atLeastFour: (combinations(5, 4) * combinations(85, 1) + 1) / TOTAL_COMBINATIONS, // ~1 in 103,167
  atLeastThree: (combinations(5, 3) * combinations(85, 2) + combinations(5, 4) * combinations(85, 1) + 1) / TOTAL_COMBINATIONS, // ~1 in 1,217
  atLeastTwo: (combinations(5, 2) * combinations(85, 3) + combinations(5, 3) * combinations(85, 2) + combinations(5, 4) * combinations(85, 1) + 1) / TOTAL_COMBINATIONS, // ~2.33%
  singleNumberPerDraw: 5 / 90, // 5.5555%
};

/**
 * Calculates Chi-square statistic and approximation of p-value for 1 degree of freedom.
 * Compares observed occurrences O against expected E = N * (5/90).
 */
export function calculateChiSquare(observed: number, totalDraws: number): { chi2: number; pValue: number; isSignificant: boolean } {
  if (totalDraws <= 0) return { chi2: 0, pValue: 1, isSignificant: false };
  const expected = totalDraws * (5 / 90);
  const observedNot = totalDraws - observed;
  const expectedNot = totalDraws - expected;

  const chi2 = Math.pow(observed - expected, 2) / expected + Math.pow(observedNot - expectedNot, 2) / expectedNot;

  // Approximate p-value using complementary error function for df=1 (chi2 = Z^2)
  const z = Math.sqrt(Math.max(0, chi2));
  const pValue = erfc(z / Math.SQRT2);

  // Critical value for alpha = 0.01 with df = 1 is 6.635
  const isSignificant = chi2 > 6.634897;

  return { chi2, pValue, isSignificant };
}

// Complementary error function approximation (Abramowitz & Stegun 7.1.26)
function erfc(x: number): number {
  if (x < 0) return 2 - erfc(-x);
  const t = 1.0 / (1.0 + 0.3275911 * x);
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return poly * Math.exp(-x * x);
}

/**
 * Compute exhaustive statistics for all 90 numbers across given draws.
 */
export function computeNumberStatistics(draws: Draw[]): NumberStat[] {
  const totalDraws = draws.length;
  // Initialize counts for 1..90
  const counts: Record<number, number> = {};
  const currentGaps: Record<number, number> = {};
  const maxGaps: Record<number, number> = {};
  const gapLists: Record<number, number[]> = {};
  const slotCounts: Record<number, Record<DrawSlot, number>> = {};

  for (let n = 1; n <= 90; n++) {
    counts[n] = 0;
    currentGaps[n] = 0;
    maxGaps[n] = 0;
    gapLists[n] = [];
    slotCounts[n] = { morning: 0, noon: 0, afternoon: 0, evening: 0 };
  }

  // Iterate chronologically to calculate accurate gap and max gap
  // draws array is newest first, so we reverse for sequential timeline tracking
  const chronological = [...draws].reverse();

  const lastSeenIndex: Record<number, number> = {};
  for (let n = 1; n <= 90; n++) {
    lastSeenIndex[n] = -1;
  }

  chronological.forEach((draw, dIdx) => {
    draw.numbers.forEach((num) => {
      if (num >= 1 && num <= 90) {
        counts[num]++;
        slotCounts[num][draw.slot]++;

        // Gap calculation
        const prevIdx = lastSeenIndex[num];
        const gap = prevIdx === -1 ? dIdx : dIdx - prevIdx - 1;
        gapLists[num].push(gap);
        if (gap > maxGaps[num]) {
          maxGaps[num] = gap;
        }
        lastSeenIndex[num] = dIdx;
      }
    });
  });

  // Calculate current gap (from last seen to end of history)
  for (let n = 1; n <= 90; n++) {
    const lastIdx = lastSeenIndex[n];
    currentGaps[n] = lastIdx === -1 ? totalDraws : totalDraws - 1 - lastIdx;
    if (currentGaps[n] > maxGaps[n]) {
      maxGaps[n] = currentGaps[n];
    }
  }

  const results: NumberStat[] = [];

  for (let n = 1; n <= 90; n++) {
    const c = counts[n];
    const rel = totalDraws > 0 ? c / totalDraws : 0;
    const gaps = gapLists[n];
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : totalDraws;
    const { chi2, pValue, isSignificant } = calculateChiSquare(c, totalDraws);

    results.push({
      num: n,
      count: c,
      relativeFreq: rel,
      currentGap: currentGaps[n],
      maxGap: maxGaps[n],
      avgGap: Number(avgGap.toFixed(1)),
      chi2Value: Number(chi2.toFixed(3)),
      pValue: Number(pValue.toFixed(4)),
      isSignificant,
      slotFrequencies: slotCounts[n],
    });
  }

  return results;
}

/**
 * Computes frequency of pairs (numbers drawn together).
 */
export function computeTopPairs(draws: Draw[], limit = 20): PairFrequency[] {
  const pairCounts = new Map<string, number>();

  draws.forEach((d) => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = `${sorted[i]}-${sorted[j]}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  });

  const total = draws.length;
  const list: PairFrequency[] = [];

  pairCounts.forEach((count, key) => {
    const [a, b] = key.split('-').map(Number);
    list.push({
      pair: [a, b],
      count,
      relativeFreq: total > 0 ? count / total : 0,
    });
  });

  list.sort((x, y) => y.count - x.count);
  return list.slice(0, limit);
}
