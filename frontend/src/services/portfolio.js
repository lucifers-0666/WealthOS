import { request } from './api.js';

export const getProfile = () => request('GET', '/profile');
export const updateProfile = (updates) => request('PATCH', '/profile', updates);

export const getHoldings = () => request('GET', '/holdings');
export const getPortfolio = () => request('GET', '/portfolio');
export const createHolding = (data) => request('POST', '/holdings', data);
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
