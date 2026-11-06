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

export interface MatrixItem {
  drawName: string;
  hour: string;
  tirage?: string;
  matriceKey: string; // e.g. "218 627 202 943"
  clavier?: string; // e.g. "305 424 262 413"
  event?: string; // e.g. "803" or "07"
  code?: string; // e.g. "65" or "193"
}

export interface Method1Result {
  top5: { num: number; frequency: number; gap: number; score: number }[];
  gap5: { num: number; gap: number; frequency: number }[];
  theoreticalProbAtLeast3: number;
  theoreticalProbAtLeast4: number;
  theoreticalProb5: number;
  pureRandomPick: number[];
  caseStudyDetails?: {
    targetGameName: string;
    gameSpecificDrawsCount: number;
    hourlyDrawsCount: number;
    gameTopNumbers: { num: number; count: number; gap: number }[];
    hourlyTopNumbers: { num: number; count: number; gap: number }[];
    hierarchyWeights: { specificGame: number; hourlySlot: number; global: number };
    anchorTwoSure?: [number, number];
    twoSureTargetNote?: string;
  };
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

export interface CaseStudyTransition {
  pairId: string;
  prevDrawName: string;
  prevDate: string;
  prevNumbers: number[];
  prevMachines: number[];
  currDrawName: string;
  currDate: string;
  currNumbers: number[];
  positionFormulas: {
    position: number;
    winningNumber: number;
    formulaName: string;
    formulaExpr: string;
    sourceOperand: string;
  }[];
}

export interface PositionSynthesizedFormula {
  position: number;
  predictedNum: number;
  formulaName: string;
  formulaExpr: string;
  sourceOperand: string;
  confidenceScore: number;
  consistencyRate: string;
}

export interface Method3CaseStudy {
  targetGameName: string;
  duosAnalyzedCount: number;
  transitions: CaseStudyTransition[];
  synthesizedFormulas: PositionSynthesizedFormula[];
  twoSureAnchor?: [number, number];
}

export interface Method3Result {
  recommended5: {
    num: number;
    modelScore: number;
    freqOnT: number;
    gap: number;
    matrixPos: { row: number; col: number };
    formula?: string;
    formulaName?: string;
    sourceOrigin?: string;
  }[];
  trace: Method3RevisionTrace;
  caseStudy?: Method3CaseStudy;
}

export interface Method4Result {
  recommended5: {
    num: number;
    origin: string; // "Paire Clé Matrice", "Croisement Clavier", "Décodage Code", "Résonance Event", "Somme Triplet"
    freqCount: number;
    currentGap: number;
  }[];
  matrixData: MatrixItem | null;
  rawPairs: number[];
  clavierPairs: number[];
  codeNumbers: number[];
  eventNumbers: number[];
  tripletSums: number[];
}

export interface Method5Result {
  recommended5: {
    num: number;
    origin: string;
    category: 'Prédiction' | 'Machine' | 'Mixte';
    score: number;
    slotFrequency: number;
    globalFrequency: number;
    currentGap: number;
  }[];
  sourceUrl: string;
  slotHour: string;
  slotName: string;
  gameName: string;
  banker: number;
  twoSure: [number, number];
  permutationPool: number[];
  machineNumbers: number[];
  forecastConfidence: number;
  forecastNote: string;
  fetchedAt: string;
  synergyDetails: {
    num: number;
    origin: string;
    category: 'Prédiction' | 'Machine' | 'Mixte';
    baseWeight: number;
    ghanaWeight?: number;
    slotFreqBonus: number;
    gapBonus: number;
    globalBonus: number;
    totalScore: number;
    slotFrequency: number;
    globalFrequency: number;
    currentGap: number;
  }[];
}

export interface ConsensusSummary {
  consensusNumbers: {
    num: number;
    methods: string[];
    count: number;
  }[];
  method1Pick: number[];
  method2Pick: number[];
  method3Pick: number[];
  method4Pick: number[];
  method5Pick?: number[];
}

export interface PairFrequency {
  pair: [number, number];
  count: number;
  relativeFreq: number;
}

export interface PositionStat {
  totalPredicted: number;
  hits: number; // how many times this position was a winning number
  exactOrderHits: number; // how many times this position matched the exact draw position
  hitRate: number; // %
}

export interface MethodMatchRecord {
  drawDate: string;
  drawTime: string;
  drawName: string;
  realNumbers: number[];
  predictedNumbers: number[];
  hitsCount: number;
  matchedDetails: {
    num: number;
    predictedPos: number; // 1..5
    realPos: number; // 1..5
    isExactOrder: boolean;
  }[];
}

export interface MethodRankingItem {
  id: 'method1' | 'method2' | 'method3' | 'method4' | 'method5';
  name: string;
  shortName: string;
  rank: number;
  totalHits: number;
  drawsEvaluated: number;
  avgHitsPerDraw: number;
  successRateAtLeast1: number; // %
  successRateAtLeast2: number; // %
  successRateAtLeast3: number; // %
  positionStats: {
    pos1: PositionStat;
    pos2: PositionStat;
    pos3: PositionStat;
    pos4: PositionStat;
    pos5: PositionStat;
  };
  recentMatches: MethodMatchRecord[];
}

export interface HourlySlotRanking {
  hour: string; // "10:00", "13:00", "16:00", "18:15"
  slotName: string; // "10H · Akwaba (Matin)", etc.
  drawsEvaluated: number;
  bestMethodId: 'method1' | 'method2' | 'method3' | 'method4' | 'method5';
  bestMethodName: string;
  bestMethodHitRate: number;
  rankings: MethodRankingItem[];
}

export type SimulationStudyMode =
  | 'consensus'
  | 'method1'
  | 'method2'
  | 'method3'
  | 'method4'
  | 'method5';

export interface SimulatedWinningBall {
  position: number; // 1 to 5
  num: number;
  role: string;
  endorsingMethods: ('M1' | 'M2' | 'M3' | 'M4' | 'M5')[];
  consensusScore: number;
  slotFrequency: number;
  currentGap: number;
  extracted: boolean;
}

export interface SimulationResult {
  slot: DrawSlot;
  timeStr: string;
  slotName: string;
  studyMode: SimulationStudyMode;
  winningBalls: SimulatedWinningBall[];
  backupBalls: number[];
  consensusStrength: number;
  totalStudiesCount: number;
}

export type TicketBetType = '1N' | '2N' | '3N' | '4N' | '5N';

export interface VirtualTicket {
  id: string;
  createdAt: string; // ISO
  targetDate: string; // YYYY-MM-DD
  targetSlot: DrawSlot;
  targetTime: string; // e.g. "10:00"
  targetGameName: string; // e.g. "AKWABA", "ÉTOILE", etc.
  numbers: number[]; // [24, 68] or [24, 68, 11, ...]
  betType: TicketBetType;
  stakeFCFA: number; // e.g. 1000
  sourceMethod: string; // "M1 (Fréquences)", "M4 (Matrices CI)", "Consensus", "Simulateur"
  status: 'En attente' | 'Gagnant' | 'Non gagnant';
  matchedNumbers?: number[];
  officialDrawNumbers?: number[];
  gainFCFA?: number;
  multiplier?: number;
}

