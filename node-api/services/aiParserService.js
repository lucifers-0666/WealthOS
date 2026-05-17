/**
 * AI Parser Service — uses Google Gemini to extract
 * structured holdings from unstructured text (OCR output, PDF text).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { normaliseSymbol, detectExchange } = require('../utils/stockSymbols');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

let genAI = null;
let model = null;

if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    logger.info('Gemini AI parser ready (gemini-1.5-flash)');
  } catch (e) {
    logger.warn(`Gemini client init failed: ${e.message}`);
  }
} else {
  logger.warn('GEMINI_API_KEY not set — AI parser will use regex fallback');
}

const PROMPT_TEMPLATE = (text) => `
You are a financial data extraction assistant for Indian stock markets.
Extract all stock holdings from the text below.

Return ONLY a valid JSON array with no explanation, no markdown, no code blocks.
Each object must have exactly these fields:
- "ticker": NSE/BSE stock symbol (e.g. "RELIANCE", "TCS", "INFY")
- "company_name": full company name if visible, else null
- "quantity": number of shares as a number (0 if unknown)
- "avg_buy_price": average buy/purchase price as a number (0 if unknown)
- "exchange": "NSE" or "BSE" (default "NSE" if unknown)
- "sector": sector/industry if visible, else null

Rules:
- Skip header rows, total rows, cash balances, mutual funds
- If quantity or price is not visible, use 0
- Return [] if no stock holdings found
- Output ONLY the JSON array, nothing else

Text to parse:
---
${text.slice(0, 8000)}
---
`;

/**
 * Parse unstructured text into holdings array using Gemini.
 * Falls back to regex parser if Gemini is unavailable.
 * @param {string} text
 * @returns {Promise<Array<Object>>}
 */
async function parseHoldingsFromText(text) {
  if (!model) {
    logger.warn('Gemini unavailable — using regex fallback parser');
    return regexFallbackParser(text);
  }

  try {
    const result = await model.generateContent(PROMPT_TEMPLATE(text));
    const raw = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps in ```json ... ```
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      logger.warn(`Gemini returned non-JSON: ${cleaned.slice(0, 200)}`);
      return regexFallbackParser(text);
    }

    const arr = Array.isArray(parsed) ? parsed : (parsed.holdings || parsed.stocks || []);

    return arr
      .map((item) => {
        if (!item.ticker) return null;
        const exchange = detectExchange(item.exchange || '');
        const norm = normaliseSymbol(item.ticker, exchange);
        return {
          ticker: norm?.symbol || item.ticker,
          yahooSymbol: norm?.yahooSymbol || null,
          exchange: norm?.exchange || 'NSE',
          company_name: item.company_name || null,
          quantity: parseFloat(item.quantity) || 0,
          avg_buy_price: parseFloat(item.avg_buy_price) || 0,
          sector: item.sector || null,
          asset_class: 'equity',
          currency: 'INR',
        };
      })
      .filter(Boolean);
  } catch (err) {
    logger.error(`Gemini parser error: ${err.message}`);
    return regexFallbackParser(text);
  }
}

/**
 * Regex fallback parser — works without any API key.
 * Looks for lines like: RELIANCE   100   2500.50
 */
function regexFallbackParser(text) {
  const lines = text.split('\n');
  const holdings = [];
  const rowPattern = /^([A-Z][A-Z0-9&-]{1,19})\s+.*?(\d[\d,.]*)\s+(\d[\d,.]*)/;

  for (const line of lines) {
    const trimmed = line.trim().toUpperCase();
    const match = trimmed.match(rowPattern);
    if (match) {
      const [, ticker, qty, price] = match;
      const norm = normaliseSymbol(ticker, 'NSE');
      if (norm) {
        holdings.push({
          ticker: norm.symbol,
          yahooSymbol: norm.yahooSymbol,
          exchange: 'NSE',
          company_name: null,
          quantity: parseFloat(qty.replace(/,/g, '')) || 0,
          avg_buy_price: parseFloat(price.replace(/,/g, '')) || 0,
          sector: null,
          asset_class: 'equity',
          currency: 'INR',
        });
      }
    }
  }
  return holdings;
}

module.exports = { parseHoldingsFromText };
