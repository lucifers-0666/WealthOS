/**
 * AI Parser Service — uses OpenAI GPT-4o-mini to extract
 * structured holdings from unstructured text (OCR output, PDF text).
 */

const OpenAI = require('openai');
const { normaliseSymbol, detectExchange } = require('../utils/stockSymbols');
const logger = require('../utils/logger');

let openai;
try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (e) {
  logger.warn('OpenAI client init failed — AI parser will be unavailable');
}

const SYSTEM_PROMPT = `You are a financial data extraction assistant. Extract stock holdings from the given text.
Return ONLY a valid JSON array. Each item must have:
- ticker: stock symbol (e.g. RELIANCE, TCS, INFY)
- company_name: full company name if visible, else null
- quantity: number of shares as a number
- avg_buy_price: average buy/purchase price as a number
- exchange: "NSE" or "BSE" (default NSE if unknown)
- sector: sector if visible, else null

Rules:
- Skip non-stock rows (headers, totals, cash balances)
- If quantity or price is missing, use 0
- Return [] if no holdings found
- DO NOT include any explanation, only the JSON array`;

/**
 * Parse unstructured text (from OCR or PDF) into holdings array.
 * @param {string} text
 * @returns {Promise<Array<Object>>}
 */
async function parseHoldingsFromText(text) {
  if (!openai || !process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not set — falling back to regex parser');
    return regexFallbackParser(text);
  }

  // Truncate very long texts to stay within token limits
  const truncated = text.length > 8000 ? text.slice(0, 8000) + '...' : text;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: truncated },
      ],
      temperature: 0,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('AI returned invalid JSON');
    }

    // Handle both {holdings: [...]} and [...] responses
    const arr = Array.isArray(parsed) ? parsed : (parsed.holdings || parsed.stocks || []);

    return arr.map((item) => {
      const exchange = detectExchange(item.exchange || '');
      const norm = normaliseSymbol(item.ticker || '', exchange);
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
    }).filter((h) => h.ticker);
  } catch (err) {
    logger.error(`AI parser error: ${err.message}`);
    return regexFallbackParser(text);
  }
}

/**
 * Regex-based fallback parser for when AI is unavailable.
 * Looks for patterns like: RELIANCE   100   2500.50
 */
function regexFallbackParser(text) {
  const lines = text.split('\n');
  const holdings = [];

  // Pattern: TICKER ... number ... number
  const rowPattern = /^([A-Z][A-Z0-9&-]{1,19})\s+.*?(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)/;

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
          quantity: parseFloat(qty.replace(',', '')) || 0,
          avg_buy_price: parseFloat(price.replace(',', '')) || 0,
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
