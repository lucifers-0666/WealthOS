/**
 * NSE/BSE stock symbol utilities.
 * Normalises user-supplied tickers to Yahoo Finance format.
 */

// Common aliases: user might type 'RELIANCE' or 'Reliance Industries'
const NSE_ALIASES = {
  'RELIANCE INDUSTRIES': 'RELIANCE',
  'TATA CONSULTANCY': 'TCS',
  'TATA CONSULTANCY SERVICES': 'TCS',
  'INFOSYS': 'INFY',
  'HDFC BANK': 'HDFCBANK',
  'ICICI BANK': 'ICICIBANK',
  'STATE BANK': 'SBIN',
  'STATE BANK OF INDIA': 'SBIN',
  'WIPRO': 'WIPRO',
  'HCL TECHNOLOGIES': 'HCLTECH',
  'AXIS BANK': 'AXISBANK',
  'KOTAK MAHINDRA': 'KOTAKBANK',
  'LARSEN': 'LT',
  'L&T': 'LT',
  'BAJAJ FINANCE': 'BAJFINANCE',
  'BHARTI AIRTEL': 'BHARTIARTL',
  'ASIAN PAINTS': 'ASIANPAINT',
  'HINDUSTAN UNILEVER': 'HINDUNILVR',
  'ITC': 'ITC',
  'MARUTI SUZUKI': 'MARUTI',
  'NESTLE INDIA': 'NESTLEIND',
  'TITAN': 'TITAN',
  'ULTRATECH CEMENT': 'ULTRACEMCO',
  'SUN PHARMA': 'SUNPHARMA',
  'POWER GRID': 'POWERGRID',
  'NTPC': 'NTPC',
  'ONGC': 'ONGC',
  'COAL INDIA': 'COALINDIA',
  'ADANI ENTERPRISES': 'ADANIENT',
  'ADANI PORTS': 'ADANIPORTS',
};

/**
 * Normalise a raw symbol string from a CSV/PDF/image.
 * Returns { symbol, exchange, yahooSymbol }
 */
function normaliseSymbol(raw, exchange = 'NSE') {
  if (!raw) return null;

  let cleaned = raw.toString().trim().toUpperCase()
    .replace(/[^A-Z0-9&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try alias map first
  const alias = NSE_ALIASES[cleaned];
  const symbol = alias || cleaned.split(' ')[0]; // fallback: first word

  // Already has exchange suffix
  if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) {
    return { symbol: symbol.replace(/\.(NS|BO)$/, ''), exchange: symbol.endsWith('.NS') ? 'NSE' : 'BSE', yahooSymbol: symbol };
  }

  const suffix = exchange === 'BSE' ? '.BO' : '.NS';
  return { symbol, exchange, yahooSymbol: `${symbol}${suffix}` };
}

/**
 * Validate that a symbol looks like a real NSE/BSE ticker.
 * Does NOT make an API call — just format checks.
 */
function isValidSymbolFormat(symbol) {
  if (!symbol || typeof symbol !== 'string') return false;
  const clean = symbol.trim().toUpperCase();
  // NSE symbols: 1-20 uppercase letters/numbers/hyphens
  return /^[A-Z0-9][A-Z0-9&-]{0,19}$/.test(clean);
}

/**
 * Detect exchange from context clues in a string.
 */
function detectExchange(text = '') {
  const upper = text.toUpperCase();
  if (upper.includes('BSE') || upper.includes('BOMBAY') || upper.includes('.BO')) return 'BSE';
  if (upper.includes('NSE') || upper.includes('NATIONAL') || upper.includes('.NS')) return 'NSE';
  return 'NSE'; // Default to NSE
}

module.exports = { normaliseSymbol, isValidSymbolFormat, detectExchange, NSE_ALIASES };
