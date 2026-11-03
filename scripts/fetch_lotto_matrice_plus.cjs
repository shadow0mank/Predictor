const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyDj92vbRFcoaLP5J8NT5ZwTXnZtQtvdBaI';
const PROJECT_ID = 'spotboxlive-music';
const ENDPOINT = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;

function formatSlot(timeStr) {
  const hour = parseInt(timeStr, 10);
  if (isNaN(hour)) return 'morning';
  if (hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'noon';
  if (hour >= 15 && hour < 18) return 'afternoon';
  return 'evening';
}

function parseShortDateToIso(shortDate, firestoreTime) {
  if (firestoreTime) {
    return firestoreTime.slice(0, 10);
  }
  if (!shortDate) return '2026-01-01';
  // format DD/MM/YYYY
  const parts = shortDate.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return shortDate;
}

async function fetchAllCIDraws() {
  console.log("=== Début de récupération de l'historique Côte d'Ivoire depuis Loto Matrice Plus ===");
  const allDraws = [];
  let cursor = null;
  let pageCount = 0;
  let totalDocs = 0;
  const seenIds = new Set();

  while (true) {
    pageCount++;
    const query = {
      structuredQuery: {
        from: [{ collectionId: 'results' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: 'country.short_name' },
                  op: 'EQUAL',
                  value: { stringValue: 'ci' },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'date.firestoreTime' },
                  op: 'GREATER_THAN_OR_EQUAL',
                  value: { timestampValue: '2020-01-01T00:00:00Z' },
                },
              },
            ],
          },
        },
        orderBy: [
          {
            field: { fieldPath: 'date.firestoreTime' },
            direction: 'DESCENDING',
          },
        ],
        limit: 100,
      },
    };

    if (cursor) {
      query.structuredQuery.startAt = {
        values: [{ timestampValue: cursor }],
      };
    }

    const data = JSON.stringify(query);
    const res = await new Promise((resolve, reject) => {
      const req = https.request(
        ENDPOINT,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
        },
        (r) => {
          let body = '';
          r.on('data', (c) => (body += c));
          r.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });

    const docs = (Array.isArray(res) ? res : []).filter((r) => r && r.document);
    if (docs.length === 0) break;

    totalDocs += docs.length;

    for (const item of docs) {
      const doc = item.document;
      const docId = doc.name ? doc.name.split('/').pop() : '';
      const f = doc.fields || {};
      const shortDate = f.date?.mapValue?.fields?.shortDate?.stringValue;
      const firestoreTime = f.date?.mapValue?.fields?.firestoreTime?.timestampValue;
      const isoDate = parseShortDateToIso(shortDate, firestoreTime);

      const resultsArr = f.resultats?.arrayValue?.values || [];

      resultsArr.forEach((r, idx) => {
        const rf = r.mapValue?.fields || {};
        const rawName = (rf.name?.stringValue || '').trim().replace(/🇨🇮/g, '').trim();
        const rawTime = String(rf.time?.integerValue || rf.time?.stringValue || '').trim();
        const tirage = (rf.tirage?.stringValue || '').trim().replace(/🇨🇮/g, '').trim();

        const winStrings = (rf.win?.arrayValue?.values || []).map((v) =>
          String(v.stringValue || '').trim()
        );
        const macStrings = (rf.mac?.arrayValue?.values || []).map((v) =>
          String(v.stringValue || '').trim()
        );

        const winNums = winStrings
          .map((s) => parseInt(s, 10))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 90);

        const macNums = macStrings
          .map((s) => parseInt(s, 10))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 90);

        // Require exactly 5 winning numbers in [1..90]
        if (winNums.length === 5) {
          const hourFormatted = rawTime ? (rawTime.length === 1 ? `0${rawTime}:00` : `${rawTime}:00`) : '10:00';
          const drawId = `lmp-ci-${isoDate}-${rawTime || idx}-${rawName.replace(/\s+/g, '_')}`;

          if (!seenIds.has(drawId)) {
            seenIds.add(drawId);
            allDraws.push({
              id: drawId,
              drawDate: isoDate,
              drawTime: hourFormatted,
              slot: formatSlot(rawTime),
              drawIndex: idx + 1,
              drawName: rawName || 'Tirage CI',
              numbers: winNums,
              machineNumbers: macNums.length === 5 ? macNums : undefined,
              tirage: tirage !== '.' ? tirage : undefined,
              source: "Loto Matrice Plus (Historique Côte d'Ivoire)",
              fetchedAt: firestoreTime || `${isoDate}T${hourFormatted}:00Z`,
            });
          }
        }
      });
    }

    const lastDoc = docs[docs.length - 1].document;
    const lastTime = lastDoc.fields.date?.mapValue?.fields?.firestoreTime?.timestampValue;
    console.log(`Page ${pageCount}: ${totalDocs} jours traités, ${allDraws.length} tirages extraits. Date courante: ${lastDoc.fields.date?.mapValue?.fields?.shortDate?.stringValue}`);

    if (docs.length < 100 || !lastTime || lastTime === cursor) {
      break;
    }
    cursor = lastTime;
  }

  // Sort descending by date and time
  allDraws.sort((a, b) => {
    if (a.drawDate !== b.drawDate) {
      return b.drawDate.localeCompare(a.drawDate);
    }
    return b.drawTime.localeCompare(a.drawTime);
  });

  console.log(`\n=== Terminé : ${allDraws.length} tirages réels Loto Bonheur CI extraits avec succès ! ===`);
  console.log(`Du ${allDraws[allDraws.length - 1]?.drawDate} au ${allDraws[0]?.drawDate} (Dernier tirage: ${allDraws[0]?.drawName} ${allDraws[0]?.drawTime} ${allDraws[0]?.numbers.join(', ')})`);

  const outPath = path.resolve(__dirname, '../src/data/lottoMatricePlus_ci_draws.json');
  fs.writeFileSync(outPath, JSON.stringify(allDraws, null, 2), 'utf-8');
  console.log(`Fichier enregistré : ${outPath}`);
}

fetchAllCIDraws().catch((err) => {
  console.error("Erreur d'extraction:", err);
  process.exit(1);
});
