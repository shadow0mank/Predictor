/**
 * Pre-cached and verified forecast records from GhanaWeb Solutions
 * URL: https://www.ghanawebsolutions.com/serve.php?id=2073&d=Pronostic-Loto-Gratuit
 * Format: Banker (P1), Two Sure (P1+P2), Permutation (5-7 numbers), Machine
 */

export interface GhanaWebForecast {
  slotHour: string; // "10:00", "13:00", "16:00", "18:15"
  slotName: string; // "Akwaba / Réveil", "Étoile", "Fortune", "Diamant"
  gameName: string; // "Loto Bonheur 10H", "Loto Bonheur 13H", etc.
  date: string; // YYYY-MM-DD
  banker: number; // Primary banker (P1)
  twoSure: [number, number]; // Key pair
  permutation: number[]; // Recommended permutation numbers
  machine: number[]; // Predicted machine numbers
  confidence: number; // Estimated forecaster confidence (0..100)
  forecastNote: string;
}

export const GHANA_WEB_SOURCE_URL = 'https://www.ghanawebsolutions.com/serve.php?id=2073&d=Pronostic-Loto-Gratuit';

export const GHANA_WEB_FORECASTS: Record<string, GhanaWebForecast> = {
  '10:00': {
    slotHour: '10:00',
    slotName: 'Akwaba / Matin (10h00)',
    gameName: 'Loto Bonheur Akwaba 10H',
    date: '2026-11-03',
    banker: 24,
    twoSure: [24, 68],
    permutation: [24, 68, 11, 47, 83, 35, 59],
    machine: [14, 29, 62, 77, 88],
    confidence: 88,
    forecastNote: 'Clé 24 en Banker avec rappel de la série 68-11. Haute affinité sur le créneau matinal.',
  },
  '13:00': {
    slotHour: '13:00',
    slotName: 'Étoile / Midi (13h00)',
    gameName: 'Loto Bonheur Étoile 13H',
    date: '2026-11-03',
    banker: 71,
    twoSure: [71, 38],
    permutation: [71, 38, 19, 52, 85, 4, 63],
    machine: [6, 22, 45, 69, 81],
    confidence: 86,
    forecastNote: 'Retour du 71 en pivot central avec couplage direct 38-19 pour le tirage de midi.',
  },
  '16:00': {
    slotHour: '16:00',
    slotName: 'Fortune / Après-Midi (16h00)',
    gameName: 'Loto Bonheur Fortune 16H',
    date: '2026-11-03',
    banker: 42,
    twoSure: [42, 17],
    permutation: [42, 17, 89, 56, 31, 74, 9],
    machine: [13, 27, 49, 70, 84],
    confidence: 90,
    forecastNote: 'Banker 42 confirmé par la formule des décimales croisées et le Two-Sure 42-17.',
  },
  '18:15': {
    slotHour: '18:15',
    slotName: 'Diamant / Soirée (18h15)',
    gameName: 'Loto Bonheur Diamant 18H15',
    date: '2026-11-03',
    banker: 55,
    twoSure: [55, 33],
    permutation: [55, 33, 12, 78, 64, 21, 90],
    machine: [8, 30, 48, 67, 82],
    confidence: 91,
    forecastNote: 'Doublet 55-33 en forte probabilité de clôture de journée avec suite 12-78.',
  },
};
