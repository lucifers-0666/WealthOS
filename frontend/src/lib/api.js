/**
 * WealthOS — API Client
 * All frontend API calls go through these helpers.
 * Automatically attaches Supabase JWT to every request.
 */

import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Get auth header with current Supabase JWT */
async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function authHeadersFormData() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return { 'Authorization': `Bearer ${session.access_token}` };
}

/** Generic fetch wrapper */
async function apiFetch(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }
  return res.json();
}

// ── Portfolio & Holdings ─────────────────────────────────────
export const getPortfolio      = ()         => apiFetch('/portfolio');
export const getHoldings       = ()         => apiFetch('/holdings');
export const addHolding        = (data)     => apiFetch('/holdings', { method: 'POST', body: JSON.stringify(data) });
export const deleteHolding     = (id)       => apiFetch(`/holdings/${id}`, { method: 'DELETE' });

// ── Transactions ─────────────────────────────────────────────
export const getTransactions   = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/transactions${qs ? '?' + qs : ''}`);
};
export const addTransaction    = (data)     => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) });

// ── Prices ───────────────────────────────────────────────────
export const getPrices         = (tickers)  => apiFetch(`/prices?tickers=${tickers.join(',')}`);

// ── Target Allocation ────────────────────────────────────────
export const getTargetAlloc    = ()         => apiFetch('/target-allocation');
export const setTargetAlloc    = (allocs)   => apiFetch('/target-allocation', { method: 'POST', body: JSON.stringify({ allocations: allocs }) });

// ── Watchlist ────────────────────────────────────────────────
export const getWatchlist      = ()         => apiFetch('/watchlist');
export const addWatchlist      = (data)     => apiFetch('/watchlist', { method: 'POST', body: JSON.stringify(data) });
export const removeWatchlist   = (ticker)   => apiFetch(`/watchlist/${ticker}`, { method: 'DELETE' });

// ── Uploads ──────────────────────────────────────────────────
export async function uploadHoldingsCSV(file) {
  const headers = await authHeadersFormData();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/upload/holdings-csv`, { method: 'POST', headers, body: form });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
}

export async function uploadTransactionsCSV(file) {
  const headers = await authHeadersFormData();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/upload/transactions-csv`, { method: 'POST', headers, body: form });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
}

export async function uploadScreenshot(file) {
  const headers = await authHeadersFormData();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/upload/image`, { method: 'POST', headers, body: form });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
}

// ── AI CFO ───────────────────────────────────────────────────
export const sendChatMessage = (message, sessionId) =>
  apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ message, session_id: sessionId }) });

export const getChatHistory = (sessionId) => apiFetch(`/ai/history?session_id=${sessionId}`);

// ── Profile ──────────────────────────────────────────────────
export const getProfile    = ()       => apiFetch('/profile');
export const updateProfile = (data)   => apiFetch('/profile', { method: 'PATCH', body: JSON.stringify(data) });
