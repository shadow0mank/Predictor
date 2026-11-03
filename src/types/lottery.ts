/**
 * Types for Loto Bonheur Côte d'Ivoire statistical observatory
 */

export type DrawSlot = 'morning' | 'noon' | 'afternoon' | 'evening';

export interface Draw {
  id: string;
  drawDate: string; // YYYY-MM-DD
  drawTime: string; // HH:MM
  slot: DrawSlot;
  drawIndex: number; // 1, 2, 3, 4 of the day
  drawName: string; // Akwaba, Étoile, Fortune, Diamant, etc.
  numbers: number[]; // 5 winning numbers in [1..90]
  machineNumbers?: number[]; // 5 machine numbers in [1..90]
  tirage?: string; // Tirage official index (e.g. 257)
  source: string; // "Loto Matrice Plus (Historique Côte d'Ivoire)"
  fetchedAt: string; // ISO string
}

export interface SlotDefinition {
  slot: DrawSlot;
  time: string; // "10:00"
  decimalHour: number; // 10.0
  name: string; // "AKWABA"
  label: string; // "Matin · 10h00"
  description: string;
}

export interface NumberStat {
  num: number;
  count: number;
  relativeFreq: number; // e.g. 0.055
  currentGap: number; // number of draws since last appearance
  maxGap: number;
  avgGap: number;
  chi2Value: number;
  pValue: number;
  isSignificant: boolean; // p < 0.01
  slotFrequencies: Record<DrawSlot, number>;
}

export interface Method1Result {
  top5: { num: number; frequency: number; gap: number; score: number }[];
  gap5: { num: number; gap: number; frequency: number }[];
  theoreticalProbAtLeast3: number;
  theoreticalProbAtLeast4: number;
  theoreticalProb5: number;
  pureRandomPick: number[];
}

export interface Method2Result {
  H: number;
  S: number;
  day: number;
  month: number;
  year: number;
  op1: number;
  op3: number;
  successives: number[];
  variantUsed: 'simple' | 'enriched';
  candOp1: number[];
  candOp3: number[];
  candSucc: number[];
  unionCandidates: number[];
  slotTopFreq: number[];
  commonNumbers: number[];
  recommended5: {
    num: number;
    origin: 'chance' | 'freq' | 'both';
    freqCount: number;
    currentGap: number;
  }[];
  rawDecimalsOp1: string;
  rawDecimalsOp3: string;
  rawDecimalsSucc: string[];
}

export interface Method3RevisionTrace {
  targetDate: string;
  targetSlot: string;
  iterations: number;
  chosenT: number;
  chosenL: number;
  weightsCount: number;
  withheldDrawNumbers: number[];
  withheldMatchedCount: number;
  withheldMatchedNumbers: number[];
  simulatedBacktest: {
    evaluatedCount: number;
    pctAtLeast2Correct: number;
    pctAtLeast3Correct: number;
    theoreticalExpectation2: number; // ~2.33%
  };
}

export interface Method3Result {
  recommended5: {
    num: number;
    modelScore: number;
    freqOnT: number;
    gap: number;
    matrixPos: { row: number; col: number };
  }[];
  trace: Method3RevisionTrace;
}

export interface ConsensusSummary {
  consensusNumbers: {
    num: number;
    methods: ('Méthode 1' | 'Méthode 2' | 'Méthode 3')[];
    count: number;
  }[];
  method1Pick: number[];
  method2Pick: number[];
  method3Pick: number[];
}

export interface PairFrequency {
  pair: [number, number];
  count: number;
  relativeFreq: number;
}
