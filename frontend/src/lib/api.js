/**
 * WealthOS — Typed API client
 * All calls go through this module — never call fetch() directly in components.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let _token = null;

export function setAuthToken(token) {
  _token = token;
}

export function clearAuthToken() {
  _token = null;
}

async function request(method, path, body = null, params = null) {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  }

  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url.toString(), opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function upload(path, formData) {
  const headers = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Health ────────────────────────────────────────────────────
export const health = () => request('GET', '/health');

// ── Profile ──────────────────────────────────────────────────
export const getProfile = () => request('GET', '/profile');
export const updateProfile = (updates) => request('PATCH', '/profile', updates);

// ── Holdings ─────────────────────────────────────────────────
export const getHoldings = () => request('GET', '/holdings');
export const getPortfolio = () => request('GET', '/portfolio');
export const createHolding = (data) => request('POST', '/holdings', data);
export const deleteHolding = (id) => request('DELETE', `/holdings/${id}`);

// ── Transactions ─────────────────────────────────────────────
export const getTransactions = (ticker = null, action = null) =>
  request('GET', '/transactions', null, { ticker, action });
export const createTransaction = (data) => request('POST', '/transactions', data);

// ── Prices ───────────────────────────────────────────────────
export const getPrices = (tickers) =>
  request('GET', '/prices', null, { tickers: tickers.join(',') });

// ── Target Allocation ────────────────────────────────────────
export const getTargetAllocation = () => request('GET', '/target-allocation');
export const setTargetAllocation = (allocations) =>
  request('POST', '/target-allocation', { allocations });

// ── Watchlist ────────────────────────────────────────────────
export const getWatchlist = () => request('GET', '/watchlist');
export const addToWatchlist = (data) => request('POST', '/watchlist', data);
export const removeFromWatchlist = (ticker) => request('DELETE', `/watchlist/${ticker}`);

// ── Uploads ──────────────────────────────────────────────────
export const uploadHoldingsCSV = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/holdings-csv', fd);
};

export const uploadTransactionsCSV = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/transactions-csv', fd);
};

export const uploadScreenshot = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return upload('/upload/image', fd);
};

// ── AI Chat ───────────────────────────────────────────────────
export const sendChatMessage = (message, sessionId = null) =>
  request('POST', '/ai/chat', { message, session_id: sessionId });
export const getChatHistory = (sessionId) =>
  request('GET', '/ai/history', null, { session_id: sessionId });
