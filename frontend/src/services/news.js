import { theme } from '../lib/theme.js';

const NEWSAPI_KEY = import.meta.env.VITE_NEWSAPI_KEY || '';

const CATEGORY_QUERIES = {
  All: 'Indian stock market NSE BSE economy',
  Markets: 'Indian stock market Nifty Sensex NSE BSE',
  Economy: 'India economy RBI inflation GDP',
  Stocks: 'NSE stocks earnings corporate results',
  'Mutual Funds': 'Indian mutual funds SIP portfolio',
  Global: 'global markets Wall Street Fed equities',
};

const RELEVANT_TERMS = [
  'nifty', 'sensex', 'nse', 'bse', 'bank nifty', 'reliance', 'tcs', 'infosys', 'hdfc', 'icici', 'adani', 'sbi',
  'economy', 'rbi', 'inflation', 'rates', 'earnings', 'guidance', 'fund', 'mutual', 'sip', 'global',
];

function scoreArticle(article, portfolioTickers = []) {
  const text = `${article.title || ''} ${article.description || ''} ${article.source?.name || ''}`.toLowerCase();
  let score = 0;

  portfolioTickers.forEach((ticker) => {
    const normalized = ticker.toLowerCase().replace(/\.(ns|bo)$/i, '');
    if (text.includes(normalized)) score += 6;
  });

  RELEVANT_TERMS.forEach((term) => {
    if (text.includes(term)) score += 1;
  });

  if ((article.source?.name || '').toLowerCase().includes('reuters')) score += 1;
  return score;
}

export function classifySentiment(article) {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  const bullish = ['beats', 'growth', 'surge', 'rally', 'upgrade', 'profit', 'buy', 'record', 'strong'];
  const bearish = ['falls', 'cuts', 'downgrade', 'loss', 'slump', 'weak', 'drop', 'concern', 'slow'];
  const bullishScore = bullish.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
  const bearishScore = bearish.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
  if (bullishScore > bearishScore) return 'Bullish';
  if (bearishScore > bullishScore) return 'Bearish';
  return 'Neutral';
}

export async function fetchMarketNews({ query, category = 'All', portfolioTickers = [] } = {}) {
  if (!NEWSAPI_KEY) {
    return {
      articles: [],
      error: 'Add VITE_NEWSAPI_KEY to load live market news.',
    };
  }

  const effectiveQuery = query?.trim() || CATEGORY_QUERIES[category] || CATEGORY_QUERIES.All;
  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', effectiveQuery);
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', '20');
  url.searchParams.set('apiKey', NEWSAPI_KEY);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    const data = await res.json();
    if (!res.ok || data.status !== 'ok') {
      return { articles: [], error: data.message || 'Failed to load news.' };
    }

    const articles = (data.articles || [])
      .map((article) => ({
        ...article,
        sentiment: classifySentiment(article),
        relevanceScore: scoreArticle(article, portfolioTickers),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore || new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    return { articles, error: null };
  } catch (error) {
    return {
      articles: [],
      error: error.name === 'AbortError'
        ? 'Market intelligence feed temporarily unavailable. Attempting reconnect...'
        : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
