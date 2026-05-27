/**
 * usePortfolio — consumes ONLY MarketDataContext for live prices.
 * No duplicate WebSocket. No own polling. Single source of truth.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from './auth.js';
import { useMarketData } from './MarketDataContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function normalizeSymbol(s) {
  if (!s) return '';
  return s.toUpperCase().replace(/\.NS$|\.BO$/, '');
}

function safeParse(v, fallback = 0) {
  const n = parseFloat(v);
  return isFinite(n) ? n : fallback;
}

function normalizeHolding(raw) {
  return {
    id: raw.id,
    symbol: normalizeSymbol(raw.symbol || raw.ticker),
    name: raw.name || raw.company_name || raw.symbol || '',
    quantity: safeParse(raw.quantity),
    avg_price: safeParse(raw.avg_price || raw.average_price || raw.avg_buy_price),
    exchange: raw.exchange || 'NSE',
    sector: raw.sector || 'Unknown',
    notes: raw.notes || '',
    buy_date: raw.buy_date || raw.created_at || null,
    // realtime fields — will be populated from MarketDataContext
    ltp: null,
    change: null,
    change_pct: null,
    previous_close: null,
    stale_price: true,
    source: null,
    last_updated_at: null,
  };
}

function mergeWithLivePrice(holding, priceData) {
  if (!priceData) return holding;
  const ltp = safeParse(priceData.ltp, holding.ltp ?? holding.avg_price);
  const prevClose = safeParse(priceData.previous_close || priceData.close, ltp);
  const invested = holding.quantity * holding.avg_price;
  const currentValue = holding.quantity * ltp;
  const unrealisedPnl = currentValue - invested;
  const unrealisedPct = invested > 0 ? (unrealisedPnl / invested) * 100 : 0;
  const dayChange = holding.quantity * (ltp - prevClose);
  const dayChangePct = prevClose > 0 ? ((ltp - prevClose) / prevClose) * 100 : 0;

  return {
    ...holding,
    ltp,
    open: safeParse(priceData.open),
    high: safeParse(priceData.high),
    low: safeParse(priceData.low),
    previous_close: prevClose,
    change: safeParse(priceData.change),
    change_pct: safeParse(priceData.change_pct),
    volume: priceData.volume,
    market_cap: priceData.market_cap,
    week_52_high: priceData.week_52_high,
    week_52_low: priceData.week_52_low,
    source: priceData.source,
    fetch_source: priceData.fetch_source,
    last_updated_at: priceData.last_updated_at,
    stale_price: priceData.stale_price ?? false,
    confidence: priceData.confidence ?? 'medium',
    latency_ms: priceData.latency_ms,
    // calculated
    invested,
    current_value: currentValue,
    unrealised_pnl: unrealisedPnl,
    unrealised_pct: unrealisedPct,
    day_change: dayChange,
    day_change_pct: dayChangePct,
  };
}

function buildSummary(enrichedHoldings) {
  const totalInvested = enrichedHoldings.reduce((s, h) => s + (h.invested || 0), 0);
  const totalCurrent = enrichedHoldings.reduce((s, h) => s + (h.current_value || 0), 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalDayChange = enrichedHoldings.reduce((s, h) => s + (h.day_change || 0), 0);
  const totalDayChangePct = totalCurrent > 0 ? (totalDayChange / totalCurrent) * 100 : 0;

  // Sector allocation
  const sectorMap = {};
  for (const h of enrichedHoldings) {
    const sec = h.sector || 'Unknown';
    sectorMap[sec] = (sectorMap[sec] || 0) + (h.current_value || 0);
  }
  const sectorAllocation = Object.entries(sectorMap).map(([sector, value]) => ({
    sector,
    value,
    pct: totalCurrent > 0 ? (value / totalCurrent) * 100 : 0,
  })).sort((a, b) => b.value - a.value);

  // Concentration risk: Herfindahl-Hirschman Index
  const weights = enrichedHoldings.map(h => totalCurrent > 0 ? (h.current_value || 0) / totalCurrent : 0);
  const hhi = weights.reduce((s, w) => s + w * w, 0);
  const concentrationScore = Math.round((1 - hhi) * 100); // 0=fully concentrated, 100=perfectly diversified

  // Top sector concentration
  const maxSectorPct = sectorAllocation.length > 0 ? sectorAllocation[0].pct : 0;
  const concentrationRisk = maxSectorPct > 40 ? 'high' : maxSectorPct > 25 ? 'medium' : 'low';

  return {
    totalInvested,
    totalCurrent,
    totalPnl,
    totalPnlPct,
    totalDayChange,
    totalDayChangePct,
    sectorAllocation,
    concentrationScore,
    concentrationRisk,
    holdingCount: enrichedHoldings.length,
  };
}

export function usePortfolio() {
  const { prices, isConnected, isStale } = useMarketData();
  const [rawHoldings, setRawHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Fetch holdings from backend
  const fetchHoldings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setRawHoldings([]); setLoading(false); return; }

      const res = await fetch(`${API}/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.holdings ?? json.data ?? json ?? []).map(normalizeHolding);
      if (mountedRef.current) {
        setRawHoldings(items);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchHoldings();
    return () => { mountedRef.current = false; };
  }, [fetchHoldings]);

  // Merge live prices — recomputes whenever prices Map or rawHoldings changes
  const holdings = useMemo(() => {
    return rawHoldings.map(h => {
      const priceData = prices.get(h.symbol);
      return mergeWithLivePrice(h, priceData);
    });
  }, [rawHoldings, prices]);

  const summary = useMemo(() => buildSummary(holdings), [holdings]);

  // CRUD operations
  const addHolding = useCallback(async (payload) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API}/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchHoldings();
    return res.json();
  }, [fetchHoldings]);

  const updateHolding = useCallback(async (id, payload) => {
    // Optimistic update
    setRawHoldings(prev => prev.map(h => h.id === id ? { ...h, ...payload } : h));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/portfolio/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      // Revert on failure
      await fetchHoldings();
      throw err;
    }
  }, [fetchHoldings]);

  const deleteHolding = useCallback(async (id) => {
    // Optimistic remove
    setRawHoldings(prev => prev.filter(h => h.id !== id));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/portfolio/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      await fetchHoldings();
      throw err;
    }
  }, [fetchHoldings]);

  return {
    holdings,
    summary,
    loading,
    error,
    isConnected,
    isStale,
    refetch: fetchHoldings,
    addHolding,
    updateHolding,
    deleteHolding,
  };
}

export { normalizeHolding, mergeWithLivePrice, buildSummary };
export default usePortfolio;
