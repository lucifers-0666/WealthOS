import { theme } from '../lib/theme.js';
import { request } from './api.js';


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

export async function fetchMarketNews({ query, category = 'All' } = {}) {
  try {
    const data = await request('GET', '/api/news', null, { q: query || '', category });
    return { articles: data.articles || [], error: data.error || null };
  } catch (error) {
    return {
      articles: [],
      error: error.message || 'Failed to load news from backend proxy.',
    };
  }
}
