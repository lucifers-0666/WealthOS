/**
 * Stock Validator Service.
 * Validates tickers against Yahoo Finance — confirms the symbol is real
 * and enriches holdings with company name, sector, and current price.
 */

const axios = require('axios');
const { normaliseSymbol, isValidSymbolFormat } = require('../utils/stockSymbols');
const logger = require('../utils/logger');

// Simple in-memory cache to avoid hammering Yahoo Finance
const cache = new Map(); // key: yahooSymbol → { data, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch quote data from Yahoo Finance v8 API.
 * @param {string} yahooSymbol e.g. "RELIANCE.NS"
 * @returns {Promise<Object|null>}
 */
async function fetchYahooQuote(yahooSymbol) {
  // Check cache
  const cached = cache.get(yahooSymbol);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`;
    const response = await axios.get(url, {
      params: { interval: '1d', range: '1d' },
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      timeout: 8000,
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const data = {
      symbol: meta.symbol,
      shortName: meta.shortName || meta.longName || null,
      currency: meta.currency || 'INR',
      exchange: meta.exchangeName || null,
      currentPrice: meta.regularMarketPrice || null,
      previousClose: meta.chartPreviousClose || null,
      valid: true,
    };

    cache.set(yahooSymbol, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 400) {
      // Symbol doesn't exist
      cache.set(yahooSymbol, { data: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }
    logger.warn(`Yahoo Finance error for ${yahooSymbol}: ${err.message}`);
    return null; // Don't throw — validation failure is non-fatal
  }
}

/**
 * Validate and enrich a single holding.
 * @param {{ ticker: string, exchange?: string, [key: string]: any }} holding
 * @returns {Promise<{ holding: Object, valid: boolean, error?: string }>}
 */
async function validateHolding(holding) {
  if (!holding.ticker) {
    return { holding, valid: false, error: 'Missing ticker' };
  }

  if (!isValidSymbolFormat(holding.ticker)) {
    return { holding, valid: false, error: `Invalid symbol format: ${holding.ticker}` };
  }

  const norm = normaliseSymbol(holding.ticker, holding.exchange || 'NSE');
  if (!norm) {
    return { holding, valid: false, error: `Could not normalise symbol: ${holding.ticker}` };
  }

  const quote = await fetchYahooQuote(norm.yahooSymbol);

  if (!quote) {
    // Symbol not found on Yahoo — might still be valid (delisted, newly listed, etc.)
    return {
      holding: { ...holding, ticker: norm.symbol, exchange: norm.exchange, yahooSymbol: norm.yahooSymbol },
      valid: false,
      warning: `Symbol ${norm.yahooSymbol} not found on Yahoo Finance — please verify manually`,
    };
  }

  // Enrich holding with live data
  return {
    holding: {
      ...holding,
      ticker: norm.symbol,
      exchange: norm.exchange,
      yahooSymbol: norm.yahooSymbol,
      company_name: holding.company_name || quote.shortName || null,
      current_price: quote.currentPrice || null,
      currency: quote.currency || 'INR',
    },
    valid: true,
  };
}

/**
 * Validate and enrich an array of holdings.
 * Returns { valid: [], invalid: [], warnings: [] }
 * @param {Array<Object>} holdings
 * @returns {Promise<Object>}
 */
async function validateHoldings(holdings) {
  const results = await Promise.allSettled(
    holdings.map((h) => validateHolding(h))
  );

  const valid = [];
  const invalid = [];
  const warnings = [];

  for (const result of results) {
    if (result.status === 'rejected') {
      invalid.push({ error: result.reason?.message || 'Unknown error' });
      continue;
    }
    const { holding, valid: isValid, error, warning } = result.value;
    if (isValid) {
      valid.push(holding);
    } else if (warning) {
      warnings.push({ holding, warning });
      valid.push(holding); // Include with warning — let user decide
    } else {
      invalid.push({ holding, error });
    }
  }

  return { valid, invalid, warnings };
}

module.exports = { validateHolding, validateHoldings, fetchYahooQuote };
