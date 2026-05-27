/**
 * ImportEngine — Intelligent import normalization for WealthOS
 * Supports: CSV, broker exports (Zerodha, Groww, Upstox, Angel, HDFC Sec)
 * Features: symbol mapping, duplicate detection, confidence scoring, audit log, rollback
 */

// ---- Broker fingerprinting patterns ----
const BROKER_PATTERNS = [
  {
    name: 'Zerodha',
    headers: ['tradingsymbol', 'quantity', 'average_price', 'last_price', 'pnl'],
    required: ['tradingsymbol', 'quantity', 'average_price'],
    map: (row) => ({
      ticker: row.tradingsymbol,
      quantity: Number(row.quantity),
      avg_buy_price: Number(row.average_price),
      current_price: Number(row.last_price) || null,
      exchange: row.exchange || 'NSE',
      broker: 'Zerodha',
    }),
  },
  {
    name: 'Groww',
    headers: ['symbol', 'qty', 'avg cost', 'ltp', 'returns'],
    required: ['symbol', 'qty', 'avg cost'],
    map: (row) => ({
      ticker: (row.symbol || '').toUpperCase().trim(),
      quantity: Number(row.qty),
      avg_buy_price: Number(row['avg cost'] || row['avg_cost'] || row.avg),
      current_price: Number(row.ltp) || null,
      exchange: 'NSE',
      broker: 'Groww',
    }),
  },
  {
    name: 'Upstox',
    headers: ['instrument_token', 'tradingsymbol', 'quantity', 'average_price'],
    required: ['tradingsymbol', 'quantity', 'average_price'],
    map: (row) => ({
      ticker: row.tradingsymbol,
      quantity: Number(row.quantity),
      avg_buy_price: Number(row.average_price),
      exchange: row.exchange || 'NSE',
      broker: 'Upstox',
    }),
  },
  {
    name: 'Angel',
    headers: ['scripname', 'qty', 'avgcost', 'lastrate'],
    required: ['scripname', 'qty', 'avgcost'],
    map: (row) => ({
      ticker: normalizeSymbol(row.scripname || ''),
      quantity: Number(row.qty),
      avg_buy_price: Number(row.avgcost),
      current_price: Number(row.lastrate) || null,
      exchange: 'NSE',
      broker: 'Angel',
    }),
  },
  {
    name: 'Generic',
    headers: [],
    required: [],
    map: (row, headers) => genericMap(row, headers),
  },
];

// Common symbol corrections & aliases
const SYMBOL_ALIASES = {
  'BAJAJ-AUTO': 'BAJAJ_AUTO',
  'M&M': 'M_M',
  'L&T': 'LT',
  'HDFCBANK': 'HDFC BANK',
  'ICICIBANK': 'ICICI BANK',
  'TCS': 'TCS',
  'RELIANCE': 'RELIANCE',
  'NIFTY BEES': 'NIFTYBEES',
  'NIFTY50': 'NIFTYBEES',
};

function normalizeSymbol(raw = '') {
  const clean = raw.toUpperCase().trim().replace(/\s+/g, ' ');
  return SYMBOL_ALIASES[clean] || clean.replace(/\s/g, '');
}

function genericMap(row, headers) {
  // Try to guess columns by common patterns
  const h = headers.map((x) => x.toLowerCase());
  const find = (...candidates) => {
    for (const c of candidates) {
      const idx = h.findIndex((x) => x.includes(c));
      if (idx >= 0) return row[headers[idx]];
    }
    return null;
  };

  return {
    ticker: normalizeSymbol(find('symbol', 'ticker', 'script', 'stock', 'name', 'isin') || ''),
    quantity: Number(find('qty', 'quantity', 'shares', 'units') || 0),
    avg_buy_price: Number(find('avg', 'average', 'cost', 'buy price', 'purchase') || 0),
    current_price: Number(find('ltp', 'last price', 'current', 'market price', 'cmp') || 0) || null,
    exchange: find('exchange', 'exch', 'segment') || 'NSE',
    broker: 'Unknown',
  };
}

// ---- CSV parser (no dep) ----
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV has fewer than 2 rows');
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return {
    headers,
    rows: lines.slice(1).map((line) => {
      const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    }),
  };
}

// ---- Broker detection ----
function detectBroker(headers) {
  const hLower = headers.map((x) => x.toLowerCase());
  let bestMatch = { broker: BROKER_PATTERNS[BROKER_PATTERNS.length - 1], score: 0 };

  for (const pattern of BROKER_PATTERNS.slice(0, -1)) {
    const matches = pattern.headers.filter((h) => hLower.includes(h)).length;
    const score = pattern.headers.length > 0 ? matches / pattern.headers.length : 0;
    if (score > bestMatch.score) bestMatch = { broker: pattern, score };
  }

  return bestMatch;
}

// ---- Confidence scoring ----
function scoreRow(mapped) {
  let score = 0;
  const warnings = [];

  if (mapped.ticker && mapped.ticker.length >= 2) score += 30;
  else warnings.push('Invalid or missing symbol');

  if (mapped.quantity > 0) score += 25;
  else warnings.push('Zero or missing quantity');

  if (mapped.avg_buy_price > 0) score += 25;
  else warnings.push('Zero or missing avg buy price');

  if (mapped.exchange) score += 10;
  if (mapped.current_price > 0) score += 10;

  return { score, confidence: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low', warnings };
}

// ---- Duplicate detection ----
function detectDuplicates(incoming, existing = []) {
  const existingTickers = new Set((existing || []).map((h) => (h.ticker || h.symbol || '').toUpperCase()));
  return incoming.map((row) => ({
    ...row,
    isDuplicate: existingTickers.has((row.ticker || '').toUpperCase()),
  }));
}

// ---- Main import parse function ----
export async function parseImport(file, existingHoldings = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const { headers, rows } = parseCSV(text);
        const { broker, score: brokerScore } = detectBroker(headers);

        const mapped = rows
          .map((row) => broker.map(row, headers))
          .filter((r) => r.ticker && r.ticker.length >= 1);

        const scored = mapped.map((r) => {
          const { score, confidence, warnings } = scoreRow(r);
          return { ...r, _score: score, _confidence: confidence, _warnings: warnings };
        });

        const withDupes = detectDuplicates(scored, existingHoldings);

        resolve({
          broker: broker.name,
          brokerConfidence: brokerScore,
          headers,
          rows: withDupes,
          totalRows: withDupes.length,
          highConfidence: withDupes.filter((r) => r._confidence === 'high').length,
          duplicates: withDupes.filter((r) => r.isDuplicate).length,
          warnings: withDupes.filter((r) => r._warnings.length > 0),
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}

// ---- Audit log ----
const AUDIT_KEY = 'wealthos_import_audit';

export function recordImportAudit(entry) {
  try {
    const existing = getImportAudit();
    const updated = [
      { ...entry, timestamp: new Date().toISOString(), id: `imp_${Date.now()}` },
      ...existing,
    ].slice(0, 50); // keep last 50
    // Use in-memory fallback since localStorage is blocked in sandboxed iframes
    window.__wealthos_import_audit = updated;
  } catch {}
}

export function getImportAudit() {
  return window.__wealthos_import_audit || [];
}

export function rollbackImport(importId, currentHoldings, setHoldings) {
  const audit = getImportAudit();
  const entry = audit.find((a) => a.id === importId);
  if (!entry || !entry.snapshotBefore) return false;
  setHoldings(entry.snapshotBefore);
  return true;
}
