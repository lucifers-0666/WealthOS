import { theme } from '../lib/theme.js';

const NEWSAPI_KEY = import.meta.env.VITE_NEWSAPI_KEY || '';
const NEWS_CACHE_KEY = 'arca:market-news-cache';

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
  const readCache = () => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = JSON.parse(window.localStorage.getItem(NEWS_CACHE_KEY) || '[]');
      return Array.isArray(cached) ? cached : [];
    } catch {
      window.localStorage.removeItem(NEWS_CACHE_KEY);
      return [];
    }
  };

  const writeCache = (articles) => {
    if (typeof window === 'undefined' || !Array.isArray(articles) || !articles.length) return;
    window.localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(articles.slice(0, 40)));
  };

  if (!NEWSAPI_KEY) {
    const cached = readCache();
    return {
      articles: cached,
      error: cached.length ? 'Live news key is missing. Showing cached intelligence.' : 'Add VITE_NEWSAPI_KEY to load live market news.',
      cached: cached.length > 0,
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

    writeCache(articles);
    return { articles, error: null };
  } catch (error) {
    const cached = readCache();
    return {
      articles: cached,
      error: error.name === 'AbortError'
        ? 'Market intelligence feed is delayed. Showing cached intelligence while reconnecting.'
        : error.message,
      cached: cached.length > 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}
