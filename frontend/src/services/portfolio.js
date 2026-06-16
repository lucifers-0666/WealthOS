import { request } from './api.js';

export const getProfileBundle = () => request('GET', '/api/user/profile');
export const getProfile = async () => {
  const data = await getProfileBundle();
  return data?.profile || data || {};
};
export const getProfileMetrics = async () => {
  const data = await getProfileBundle();
  return data?.metrics || {};
};
export const updateProfile = async (updates) => {
  const data = await request('PUT', '/api/user/profile', updates);
  return data?.profile || data || {};
};

export const getPreferences = () => request('GET', '/api/user/preferences');
export const updatePreferences = (payload) => request('PUT', '/api/user/preferences', payload);
export const getActivity = (limit = 50) => request('GET', '/api/user/activity', null, { limit });

export const getHoldings = () => request('GET', '/holdings');
export const getPortfolio = () => request('GET', '/portfolio');
export const createHolding = (data) => request('POST', '/holdings', data);
export const updateHolding = (id, payload) => request('PUT', `/portfolio/holdings/${id}`, payload);
export const deleteHolding = (id) => request('DELETE', `/holdings/${id}`);

export const getTransactions = (ticker = null, action = null) =>
  request('GET', '/transactions', null, { ticker, action });
export const createTransaction = (data) => request('POST', '/transactions', data);

export const getPrices = (tickers) => request('GET', '/prices', null, { tickers: tickers.join(',') });

export const getTargetAllocation = () => request('GET', '/target-allocation');
export const setTargetAllocation = (allocations) => request('POST', '/target-allocation', { allocations });

export const getWatchlist = () => request('GET', '/watchlist');
export const addToWatchlist = (data) => request('POST', '/watchlist', data);
export const removeFromWatchlist = (ticker) => request('DELETE', `/watchlist/${ticker}`);

export const getMarketStatus = () => request('GET', '/api/market/status');
