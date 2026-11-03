import { Draw, SlotDefinition } from '../types/lottery';
import { RECENT_LMP_CI_DRAWS } from './recentLottoMatricePlusDraws';

export const SLOTS_CONFIG: SlotDefinition[] = [
  {
    slot: 'morning',
    time: '10:00',
    decimalHour: 10.0,
    name: 'AKWABA / RÉVEIL',
    label: '10h00 · Tirage Matin (Akwaba / Soutra / Cash)',
    description: 'Tirage matinal officiel Lonaci sur Loto Matrice Plus',
  },
  {
    slot: 'noon',
    time: '13:00',
    decimalHour: 13.0,
    name: 'ÉTOILE / PRESTIGE',
    label: '13h00 · Tirage Midi (Étoile / Solution / Prestige)',
    description: 'Tirage du milieu de journée Lonaci sur Loto Matrice Plus',
  },
  {
    slot: 'afternoon',
    time: '16:00',
    decimalHour: 16.0,
    name: 'FORTUNE / AWALE',
    label: '16h00 · Tirage Après-Midi (Fortune / Wari / Awale)',
    description: 'Tirage de l’après-midi Lonaci sur Loto Matrice Plus',
  },
  {
    slot: 'evening',
    time: '18:15',
    decimalHour: 18.25,
    name: 'DIAMANT / AFTERWORK',
    label: '18h15 · Tirage Soirée (Diamant / Afterwork / Espoir)',
    description: 'Tirage officiel de soirée Lonaci sur Loto Matrice Plus',
  },
];

const STORAGE_KEY = 'loto_bonheur_ci_draws_lmp_v2';
const BIAS_STORAGE_KEY = 'loto_bonheur_ci_bias_active';

export function getStoredDraws(): Draw[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  // Initial real draws from Loto Matrice Plus
  const initial = RECENT_LMP_CI_DRAWS;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // quota limit fallback
  }
  return initial;
}

export function saveStoredDraws(draws: Draw[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draws.slice(0, 1500)));
  } catch (err) {
    console.warn('LocalStorage save warning (size limit)', err);
  }
}

/**
 * Loads the complete 14,433 draws from Loto Matrice Plus (2020-2026)
 */
export async function loadFullLottoMatricePlusHistory(): Promise<Draw[]> {
  try {
    const res = await fetch('/data/lottoMatricePlus_ci_draws.json');
    if (res.ok) {
      const allDraws: Draw[] = await res.json();
      if (Array.isArray(allDraws) && allDraws.length > 0) {
        return allDraws;
      }
    }
  } catch (err) {
    console.error('Erreur de chargement du fichier complet des tirages:', err);
  }
  return getStoredDraws();
}

/**
 * Queries the live Firestore API of Loto Matrice Plus for the very latest draws.
 */
export async function syncLatestFromLottoMatricePlus(currentDraws: Draw[]): Promise<{
  updatedDraws: Draw[];
  newCount: number;
  latestDraw: Draw;
}> {
  const API_KEY = 'AIzaSyDj92vbRFcoaLP5J8NT5ZwTXnZtQtvdBaI';
  const PROJECT_ID = 'spotboxlive-music';
  const ENDPOINT = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;

  const query = {
    structuredQuery: {
      from: [{ collectionId: 'results' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'country.short_name' },
          op: 'EQUAL',
          value: { stringValue: 'ci' },
        },
      },
      orderBy: [
        {
          field: { fieldPath: 'date.firestoreTime' },
          direction: 'DESCENDING',
        },
      ],
      limit: 5,
    },
  };

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Erreur réseau HTTP ${response.status}`);
    }

    const data = await response.json();
    const fetchedDraws: Draw[] = [];
    const seenIds = new Set(currentDraws.map((d) => d.id));

    if (Array.isArray(data)) {
      for (const item of data) {
        if (!item || !item.document) continue;
        const f = item.document.fields || {};
        const shortDate = f.date?.mapValue?.fields?.shortDate?.stringValue;
        const firestoreTime = f.date?.mapValue?.fields?.firestoreTime?.timestampValue;
        
        let isoDate = '2026-11-03';
        if (firestoreTime) {
          isoDate = firestoreTime.slice(0, 10);
        } else if (shortDate && shortDate.includes('/')) {
          const parts = shortDate.split('/');
          isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        const resultsArr = f.resultats?.arrayValue?.values || [];

        resultsArr.forEach((r: any, idx: number) => {
          const rf = r.mapValue?.fields || {};
          const rawName = (rf.name?.stringValue || '').trim().replace(/🇨🇮/g, '').trim();
          const rawTime = String(rf.time?.integerValue || rf.time?.stringValue || '').trim();
          const tirage = (rf.tirage?.stringValue || '').trim().replace(/🇨🇮/g, '').trim();

          const winStrings = (rf.win?.arrayValue?.values || []).map((v: any) =>
            String(v.stringValue || '').trim()
          );
          const macStrings = (rf.mac?.arrayValue?.values || []).map((v: any) =>
            String(v.stringValue || '').trim()
          );

          const winNums = winStrings
            .map((s: string) => parseInt(s, 10))
            .filter((n: number) => !isNaN(n) && n >= 1 && n <= 90);

          const macNums = macStrings
            .map((s: string) => parseInt(s, 10))
            .filter((n: number) => !isNaN(n) && n >= 1 && n <= 90);

          if (winNums.length === 5) {
            const hourFormatted = rawTime ? (rawTime.length === 1 ? `0${rawTime}:00` : `${rawTime}:00`) : '10:00';
            const drawId = `lmp-ci-${isoDate}-${rawTime || idx}-${rawName.replace(/\s+/g, '_')}`;

            let slot: 'morning' | 'noon' | 'afternoon' | 'evening' = 'morning';
            const hourNum = parseInt(rawTime, 10);
            if (hourNum >= 12 && hourNum < 15) slot = 'noon';
            else if (hourNum >= 15 && hourNum < 18) slot = 'afternoon';
            else if (hourNum >= 18) slot = 'evening';

            if (!seenIds.has(drawId)) {
              seenIds.add(drawId);
              fetchedDraws.push({
                id: drawId,
                drawDate: isoDate,
                drawTime: hourFormatted,
                slot,
                drawIndex: idx + 1,
                drawName: rawName || 'Tirage CI',
                numbers: winNums,
                machineNumbers: macNums.length === 5 ? macNums : undefined,
                tirage: tirage !== '.' ? tirage : undefined,
                source: "Loto Matrice Plus (Historique Côte d'Ivoire)",
                fetchedAt: firestoreTime || new Date().toISOString(),
              });
            }
          }
        });
      }
    }

    const updated = [...fetchedDraws, ...currentDraws];
    updated.sort((a, b) => {
      if (a.drawDate !== b.drawDate) {
        return b.drawDate.localeCompare(a.drawDate);
      }
      return b.drawTime.localeCompare(a.drawTime);
    });

    saveStoredDraws(updated);

    return {
      updatedDraws: updated,
      newCount: fetchedDraws.length,
      latestDraw: updated[0],
    };
  } catch (err) {
    console.error('Erreur live sync Loto Matrice Plus:', err);
    return {
      updatedDraws: currentDraws,
      newCount: 0,
      latestDraw: currentDraws[0],
    };
  }
}

export function isArtificialBiasActive(): boolean {
  try {
    return localStorage.getItem(BIAS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setArtificialBias(active: boolean, draws: Draw[]): Draw[] {
  try {
    localStorage.setItem(BIAS_STORAGE_KEY, active ? 'true' : 'false');
  } catch {
    // ignore
  }

  const BIASED_NUM_1 = 42;
  const BIASED_NUM_2 = 77;

  if (active) {
    return draws.map((d, idx) => {
      if (idx < 150) {
        const newNumbers = [...d.numbers];
        if (idx % 3 === 0 && !newNumbers.includes(BIASED_NUM_1)) {
          newNumbers[0] = BIASED_NUM_1;
          newNumbers.sort((a, b) => a - b);
        }
        if (idx % 4 === 0 && !newNumbers.includes(BIASED_NUM_2)) {
          newNumbers[1] = BIASED_NUM_2;
          newNumbers.sort((a, b) => a - b);
        }
        return { ...d, numbers: newNumbers };
      }
      return d;
    });
  } else {
    return getStoredDraws();
  }
}
