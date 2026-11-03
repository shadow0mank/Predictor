const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyDj92vbRFcoaLP5J8NT5ZwTXnZtQtvdBaI';
const PROJECT_ID = 'spotboxlive-music';
const ENDPOINT = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;

function parseShortDateToIso(shortDate, firestoreTime) {
  if (firestoreTime) return firestoreTime.slice(0, 10);
  if (!shortDate) return '2026-01-01';
  const parts = shortDate.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return shortDate;
}

function parseMatrixTextBlock(text) {
  if (!text || typeof text !== 'string') return [];
  const cleaned = text.replace(/✓[A-Z0-9\-_]+/gi, '');
  const parts = cleaned.split(/(?=•[A-ZÉÈÀÂÔÛÎÏËÜÇa-zéèàâôûîïëüç\s_]+-[0-9]{1,2}H)/i);
  const items = [];

  for (const part of parts) {
    if (!part.trim()) continue;
    const headerMatch = part.match(
      /•([A-ZÉÈÀÂÔÛÎÏËÜÇa-zéèàâôûîïëüç\s_]+)-([0-9]{1,2})H?.*?(?:N°([0-9]+))?.*?(?:🇨🇮)?\s+([0-9]{3}\s+[0-9]{3}\s+[0-9]{3}\s+[0-9]{3})/i
    );
    if (headerMatch) {
      const clavierMatch = part.match(/CLAVIER.*?(?:🇨🇮)?\s+([0-9]{3}\s+[0-9]{3}\s+[0-9]{3}\s+[0-9]{3})/i);
      const eventMatch = part.match(/EVENT\s+([0-9]+)/i);
      const codeMatch = part.match(/CODE\s+([0-9]+)/i);
      items.push({
        drawName: headerMatch[1].replace(/🇨🇮/g, '').trim(),
        hour: headerMatch[2],
        tirage: headerMatch[3] || '',
        matriceKey: headerMatch[4].replace(/\s+/g, ' '),
        clavier: clavierMatch ? clavierMatch[1].replace(/\s+/g, ' ') : '',
        event: eventMatch ? eventMatch[1] : '',
        code: codeMatch ? codeMatch[1] : '',
      });
    }
  }
  return items;
}

async function extractMatrices() {
  console.log("=== Extraction des Matrices Côte d'Ivoire depuis Firestore ===");
  const matricesByDate = {};
  let cursor = null;
  let page = 0;

  while (true) {
    page++;
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
                  value: { timestampValue: '2023-01-01T00:00:00Z' },
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
          let b = '';
          r.on('data', (c) => (b += c));
          r.on('end', () => {
            try {
              resolve(JSON.parse(b));
            } catch (e) {
              reject(e);
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

    for (const item of docs) {
      const f = item.document.fields || {};
      const shortDate = f.date?.mapValue?.fields?.shortDate?.stringValue;
      const firestoreTime = f.date?.mapValue?.fields?.firestoreTime?.timestampValue;
      const isoDate = parseShortDateToIso(shortDate, firestoreTime);

      const mArray = f.matricesci?.arrayValue?.values || [];
      const parsedList = [];

      for (const mVal of mArray) {
        const mf = mVal.mapValue?.fields || {};
        const matriceStr = mf.matrice?.stringValue || '';
        const clavierStr = mf.clavier?.stringValue || '';
        const codeStr = mf.code?.stringValue || '';
        const eventStr = mf.event?.stringValue || '';
        const timeVal = mf.time?.integerValue || mf.time?.stringValue || '';

        // If it contains "•", it is a multi-draw text block
        if (matriceStr.includes('•')) {
          const subItems = parseMatrixTextBlock(matriceStr);
          parsedList.push(...subItems);
        } else if (matriceStr.trim()) {
          // Individual matrix
          const matchKey = matriceStr.match(/([0-9]{3}\s+[0-9]{3}\s+[0-9]{3}\s+[0-9]{3})/);
          const nameMatch = matriceStr.match(/^([A-ZÉÈÀÂÔÛÎÏËÜÇa-zéèàâôûîïëüç\s_]+)/i);
          parsedList.push({
            drawName: nameMatch ? nameMatch[1].replace(/🇨🇮/g, '').trim() : 'TIRAGE',
            hour: String(timeVal || '13'),
            tirage: '',
            matriceKey: matchKey ? matchKey[1].replace(/\s+/g, ' ') : matriceStr.trim(),
            clavier: clavierStr !== '.' ? clavierStr : '',
            event: eventStr !== '.' ? eventStr : '',
            code: codeStr !== '.' ? codeStr : '',
          });
        }
      }

      if (parsedList.length > 0) {
        matricesByDate[isoDate] = parsedList;
      }
    }

    const lastDoc = docs[docs.length - 1].document;
    const lastTime = lastDoc.fields.date?.mapValue?.fields?.firestoreTime?.timestampValue;
    console.log(`Page ${page}: ${Object.keys(matricesByDate).length} jours avec matrices. Date: ${lastDoc.fields.date?.mapValue?.fields?.shortDate?.stringValue}`);

    if (docs.length < 100 || !lastTime || lastTime === cursor) break;
    cursor = lastTime;

    // We collect the recent 400 days of matrices
    if (page >= 6) break;
  }

  const outPublic = path.resolve(__dirname, '../public/data/lottoMatricePlus_ci_matrices.json');
  fs.writeFileSync(outPublic, JSON.stringify(matricesByDate, null, 2), 'utf-8');
  console.log(`Fichier matrices enregistré : ${outPublic} (${Object.keys(matricesByDate).length} jours couverts)`);
}

extractMatrices().catch(console.error);
