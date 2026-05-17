/**
 * Excel (.xlsx / .xls) parsing service.
 * Uses the 'xlsx' library to extract holdings from the first sheet.
 */

const XLSX = require('xlsx');
const { normaliseSymbol, detectExchange } = require('../utils/stockSymbols');
const logger = require('../utils/logger');

/**
 * Same header aliases as csvService.
 */
const HEADER_MAP = {
  symbol: 'ticker', scrip: 'ticker', stock: 'ticker', instrument: 'ticker', ticker: 'ticker',
  'trading symbol': 'ticker', 'scrip code': 'ticker',
  qty: 'quantity', quantity: 'quantity', shares: 'quantity', units: 'quantity',
  'net qty': 'quantity', 'net quantity': 'quantity',
  'avg price': 'avg_buy_price', 'average price': 'avg_buy_price', 'buy price': 'avg_buy_price',
  'avg buy price': 'avg_buy_price', 'purchase price': 'avg_buy_price', cost: 'avg_buy_price',
  exchange: 'exchange', market: 'exchange',
  name: 'company_name', 'company name': 'company_name', 'scrip name': 'company_name',
  sector: 'sector', industry: 'sector',
};

function normaliseHeader(h) {
  return (h || '').toString().toLowerCase().trim().replace(/[_\-]+/g, ' ');
}

/**
 * Parse an Excel file and return an array of holding objects.
 * @param {string} filePath
 * @returns {Array<Object>}
 */
function parseExcel(filePath) {
  let workbook;
  try {
    workbook = XLSX.readFile(filePath, { cellDates: true });
  } catch (err) {
    throw new Error(`Excel read error: ${err.message}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Excel file has no sheets');

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rawRows.length < 2) throw new Error('Excel sheet has insufficient data');

  // First non-empty row is the header
  const headerRow = rawRows[0].map((h) => normaliseHeader(String(h)));
  const dataRows = rawRows.slice(1);

  const holdings = [];
  for (const row of dataRows) {
    if (row.every((cell) => cell === '' || cell == null)) continue;

    const rowObj = {};
    headerRow.forEach((h, i) => { rowObj[h] = row[i]; });

    const mapped = {};
    for (const [rawKey, value] of Object.entries(rowObj)) {
      const canonical = HEADER_MAP[rawKey];
      if (canonical) mapped[canonical] = value;
    }

    if (!mapped.ticker) continue;

    const exchange = detectExchange(mapped.exchange || '');
    const norm = normaliseSymbol(String(mapped.ticker), exchange);
    if (!norm) continue;

    holdings.push({
      ticker: norm.symbol,
      yahooSymbol: norm.yahooSymbol,
      exchange: norm.exchange,
      company_name: mapped.company_name || null,
      quantity: parseFloat(mapped.quantity) || 0,
      avg_buy_price: parseFloat(mapped.avg_buy_price) || 0,
      sector: mapped.sector || null,
      asset_class: 'equity',
      currency: 'INR',
    });
  }

  if (holdings.length === 0) throw new Error('No valid holdings found in Excel file');
  return holdings;
}

module.exports = { parseExcel };
