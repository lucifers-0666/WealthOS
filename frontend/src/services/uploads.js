import { upload } from './api.js';
import { isDemoMode } from '../lib/auth.js';

const COMPANY_TO_TICKER = {
  'SUZLON ENERGY': 'SUZLON',
  'BHARAT COKING COAL': 'BCCL',
  'EMMVEE PHOTOVOLTAIC': 'EMMVEE',
  'ASHOK LEYLAND': 'ASHOKLEY',
  'IOCL': 'IOC',
  'BHARAT ELECTRONICS': 'BEL',
  'NTPC': 'NTPC',
  'ADANI POWER': 'ADANIPOWER',
  'AURI GROW INDIA': 'AURIGROW',
  'SBISENSEX': 'SBISENSEX',
  'SBI MF - SBI GOLD': 'SETFGOLD',
  'NIPPON ETF HANGSENG': 'HNGSNGBEES',
  'MONQ50': 'MONQ50',
  'MODEFENCE': 'MODEFENCE',
  'TATAGOLD': 'TATAGOLD',
  'GROWW NIFTY INDIA RAILWAY': 'RAILWAY',
  'MIRAE ASSET NYSE FANG+': 'MAFANG',
};

function normalizeHeader(header = '') {
  return String(header).trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function cleanNumber(value) {
  if (value == null || value === '') return null;
  const numeric = String(value).replace(/[^0-9.-]/g, '');
  if (!numeric || numeric === '-' || numeric === '.' || numeric === '-.') return null;
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveTickerFromCompany(raw = '') {
  const cleaned = String(raw).trim().toUpperCase();
  if (!cleaned) return '';
  if (COMPANY_TO_TICKER[cleaned]) return COMPANY_TO_TICKER[cleaned];
  const canonical = cleaned.replace(/[^A-Z0-9+&-]+/g, '');
  if (COMPANY_TO_TICKER[canonical]) return COMPANY_TO_TICKER[canonical];
  return canonical;
}

async function parseHoldingsCsvLocally(file) {
  const text = await file.text();
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV has fewer than 2 rows');
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });

  const holdings = rows.map((row) => {
    const companyName = row.company || row.company_name || row.name || row.symbol || row.ticker || '';
    const tickerSource = row.ticker || row.symbol || row.stock || row.scrip || row.instrument || row.isin || companyName;
    const ticker = resolveTickerFromCompany(tickerSource);
    const quantity = cleanNumber(row.quantity || row.qty || row.shares || row.units);
    const avgBuyPrice = cleanNumber(row.avg_buy_price || row.avg_price || row.average_price || row.buy_price || row.purchase_price || row.cost);
    const currentPrice = cleanNumber(row.market_price || row.current_price || row.ltp || row.cmp || row.last_price) ?? avgBuyPrice;

    if (!ticker || !quantity || quantity <= 0 || !avgBuyPrice) return null;

    return {
      ticker,
      company_name: companyName,
      quantity,
      avg_buy_price: avgBuyPrice,
      current_price: currentPrice,
      exchange: row.exchange || 'NSE',
      asset_class: row.asset_class || 'equity',
      currency: row.currency || 'INR',
      sector: row.sector || '',
    };
  }).filter(Boolean);

  return {
    imported: holdings.length,
    holdings,
    persisted: false,
    broker: 'CSV Export',
    parser_used: 'csv',
    file_type: 'csv',
    count: holdings.length,
  };
}

export const uploadHoldingsCSV = (file) => {
  if (isDemoMode) {
    return parseHoldingsCsvLocally(file);
  }
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/holdings-csv', fd);
};

export const uploadTransactionsCSV = (file) => {
  if (isDemoMode) {
    return Promise.resolve({
      imported: 0,
      transactions: [],
      persisted: false,
      broker: 'CSV Export',
      parser_used: 'csv',
      file_type: 'csv',
      count: 0,
      message: 'Transactions upload is not available in demo mode.',
    });
  }
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/transactions-csv', fd);
};

export const uploadScreenshot = (file) => {
  if (isDemoMode) {
    return Promise.resolve({
      recognized: 0,
      holdings: [],
      persisted: false,
      parser_used: 'demo',
      file_type: 'image',
      message: 'Screenshot OCR is not available in demo mode.',
    });
  }
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/image', fd);
};
