/**
 * CSV parsing service.
 * Accepts a file path and returns normalised holdings array.
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { normaliseSymbol, detectExchange } = require('../utils/stockSymbols');
const logger = require('../utils/logger');

/**
 * Column name aliases — maps common broker export headers to our schema.
 */
const HEADER_MAP = {
  // Symbol
  symbol: 'ticker', scrip: 'ticker', stock: 'ticker', instrument: 'ticker', ticker: 'ticker',
  'trading symbol': 'ticker', 'scrip code': 'ticker',
  // Quantity
  qty: 'quantity', quantity: 'quantity', shares: 'quantity', units: 'quantity',
  'net qty': 'quantity', 'net quantity': 'quantity',
  // Price
  'avg price': 'avg_buy_price', 'average price': 'avg_buy_price', 'buy price': 'avg_buy_price',
  'avg buy price': 'avg_buy_price', 'average buy price': 'avg_buy_price', ltp: 'avg_buy_price',
  'purchase price': 'avg_buy_price', cost: 'avg_buy_price',
  // Exchange
  exchange: 'exchange', market: 'exchange',
  // Name
  name: 'company_name', 'company name': 'company_name', 'scrip name': 'company_name',
  // Sector
  sector: 'sector', industry: 'sector',
};

function normaliseHeader(h) {
  return (h || '').toString().toLowerCase().trim().replace(/[_\-]+/g, ' ');
}

/**
 * Parse a CSV file and return an array of holding objects.
 * @param {string} filePath
 * @returns {Array<Object>}
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  let rows;
  try {
    rows = parse(content, {
      columns: (headers) => headers.map(normaliseHeader),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new Error(`CSV parse error: ${err.message}`);
  }

  if (!rows || rows.length === 0) throw new Error('CSV is empty or could not be parsed');

  // Remap columns
  const holdings = [];
  for (const row of rows) {
    const mapped = {};
    for (const [rawKey, value] of Object.entries(row)) {
      const canonical = HEADER_MAP[rawKey];
      if (canonical) mapped[canonical] = value;
    }

    if (!mapped.ticker) {
      logger.debug(`Skipping row — no ticker found: ${JSON.stringify(row)}`);
      continue;
    }

    const exchange = detectExchange(mapped.exchange || '');
    const norm = normaliseSymbol(mapped.ticker, exchange);
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

  if (holdings.length === 0) throw new Error('No valid holdings found in CSV');
  return holdings;
}

module.exports = { parseCSV };
