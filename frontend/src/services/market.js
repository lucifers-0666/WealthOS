import { request } from './api.js';

export const getMarketStatus = () => request('GET', '/api/market/status');

export async function getLivePrices(tickers = []) {
  if (!Array.isArray(tickers) || tickers.length === 0) return {};
  return request('GET', '/prices', null, { tickers: tickers.join(',') });
}
