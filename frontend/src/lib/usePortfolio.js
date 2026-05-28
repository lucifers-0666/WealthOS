/**
 * usePortfolio — consumes ONLY MarketDataContext for live prices.
 * No duplicate WebSocket. No own polling. Single source of truth.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMarketData } from './MarketDataContext.jsx';
import { isDemoMode } from './auth.js';
import { getPortfolioHoldings, savePortfolioHoldings, upsertPortfolioHolding, removePortfolioHolding } from './portfolioStore.js';
import {
  getHoldings,
  getPortfolio,
  getTransactions,
  getTargetAllocation,
  getWatchlist,
  createHolding as createHoldingApi,
  deleteHolding as deleteHoldingApi,
  addToWatchlist as addToWatchlistApi,
  removeFromWatchlist as removeFromWatchlistApi,
  setTargetAllocation as setTargetAllocationApi,
} from '../services/portfolio.js';
import { request } from '../services/api.js';

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
  const quantity = safeParse(raw.quantity ?? raw.qty ?? raw.shares ?? raw.units);
  const avgPrice = safeParse(raw.avg_price || raw.average_price || raw.avg_buy_price || raw.avg);
  const ltp = raw.ltp != null ? safeParse(raw.ltp, avgPrice) : (raw.current_price != null ? safeParse(raw.current_price, avgPrice) : avgPrice);
  const invested = raw.invested_amount != null ? safeParse(raw.invested_amount) : quantity * avgPrice;
  const currentValue = raw.current_value != null ? safeParse(raw.current_value) : quantity * ltp;
  const unrealisedPnl = raw.unrealised_pnl != null ? safeParse(raw.unrealised_pnl) : (currentValue - invested);
  const unrealisedPct = raw.unrealised_pct != null ? safeParse(raw.unrealised_pct) : (invested > 0 ? (unrealisedPnl / invested) * 100 : 0);
  const dayChange = raw.day_change != null ? safeParse(raw.day_change) : safeParse(raw.change, 0);
  const dayChangePct = raw.day_change_pct != null ? safeParse(raw.day_change_pct) : safeParse(raw.change_pct, 0);

  return {
    id: raw.id,
    symbol: normalizeSymbol(raw.symbol || raw.ticker || raw.stock || raw.scrip || raw.instrument),
    name: raw.name || raw.company_name || raw.symbol || '',
    quantity,
    avg_price: avgPrice,
    avg_buy_price: avgPrice,
    exchange: raw.exchange || raw.exch || 'NSE',
    sector: raw.sector || 'Unknown',
    notes: raw.notes || '',
    buy_date: raw.buy_date || raw.created_at || null,
    // realtime fields — will be populated from MarketDataContext
    ltp,
    change: raw.change != null ? safeParse(raw.change) : dayChange,
    change_pct: raw.change_pct != null ? safeParse(raw.change_pct) : dayChangePct,
    previous_close: raw.previous_close != null ? safeParse(raw.previous_close) : ltp,
    stale_price: raw.stale_price ?? true,
    source: raw.source ?? 'local',
    last_updated_at: null,
    invested,
    invested_amount: invested,
    current_value: currentValue,
    current_value_inr: currentValue,
    current_price: ltp,
    unrealised_pnl: unrealisedPnl,
    unrealised_pct: unrealisedPct,
    day_change: dayChange,
    day_change_pct: dayChangePct,
  };
}

function mergeWithLivePrice(holding, priceData) {
  if (!priceData) return holding;
  const rawLtp = priceData.ltp ?? priceData.price ?? priceData.c ?? priceData.last_price;
  const ltp = Number(rawLtp) > 0 ? safeParse(rawLtp, holding.ltp ?? holding.avg_price) : (holding.ltp ?? holding.avg_price);
  const rawPrevClose = priceData.previous_close ?? priceData.close ?? priceData.prev_close ?? priceData.pc;
  const prevClose = Number(rawPrevClose) > 0 ? safeParse(rawPrevClose, ltp) : ltp;
  const invested = holding.quantity * holding.avg_price;
  const currentValue = holding.quantity * ltp;
  const unrealisedPnl = currentValue - invested;
  const unrealisedPct = invested > 0 ? (unrealisedPnl / invested) * 100 : 0;
  const dayChange = holding.quantity * (ltp - prevClose);
  const dayChangePct = prevClose > 0 ? ((ltp - prevClose) / prevClose) * 100 : 0;

  return {
    ...holding,
    ltp,
    current_price: ltp,
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
    invested_amount: invested,
    current_value: currentValue,
    current_value_inr: currentValue,
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
  const [transactions, setTransactions] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [targetAllocation, setTargetAllocationState] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Fetch all portfolio-related data from backend
  const refresh = useCallback(async () => {
    try {
      if (isDemoMode) {
        const demoHoldings = getPortfolioHoldings();
        const nextHoldings = demoHoldings.map(normalizeHolding);
        if (mountedRef.current) {
          setRawHoldings(nextHoldings);
          setTransactions([]);
          setWatchlist([]);
          setTargetAllocationState([]);
          setHistory([]);
          setError(null);
        }
        return;
      }

      const [holdingsRes, txnsRes, watchlistRes, targetRes, historyRes] = await Promise.allSettled([
        getHoldings(),
        getTransactions(),
        getWatchlist(),
        getTargetAllocation(),
        request('GET', '/portfolio/history', null, { days: 90 }),
      ]);

      const holdingsRaw = holdingsRes.status === 'fulfilled'
        ? (Array.isArray(holdingsRes.value) ? holdingsRes.value : (holdingsRes.value?.holdings ?? holdingsRes.value?.data ?? holdingsRes.value ?? []))
        : [];
      const transactionsRaw = txnsRes.status === 'fulfilled'
        ? (Array.isArray(txnsRes.value) ? txnsRes.value : (txnsRes.value?.transactions ?? txnsRes.value?.data ?? txnsRes.value ?? []))
        : [];
      const watchlistRaw = watchlistRes.status === 'fulfilled'
        ? (Array.isArray(watchlistRes.value) ? watchlistRes.value : (watchlistRes.value?.watchlist ?? watchlistRes.value?.data ?? watchlistRes.value ?? []))
        : [];
      const targetRaw = targetRes.status === 'fulfilled'
        ? (Array.isArray(targetRes.value) ? targetRes.value : (targetRes.value?.allocations ?? targetRes.value?.data ?? targetRes.value ?? []))
        : [];
      const historyRaw = historyRes.status === 'fulfilled'
        ? (historyRes.value?.history ?? historyRes.value?.points ?? historyRes.value ?? [])
        : [];

      const nextHoldings = holdingsRaw.map(normalizeHolding);
      const nextTransactions = Array.isArray(transactionsRaw) ? transactionsRaw : [];
      const nextWatchlist = Array.isArray(watchlistRaw) ? watchlistRaw : [];
      const nextTargetAllocation = Array.isArray(targetRaw) ? targetRaw : [];
      const nextHistory = Array.isArray(historyRaw) ? historyRaw : [];

      if (mountedRef.current) {
        setRawHoldings(nextHoldings);
        setTransactions(nextTransactions);
        setWatchlist(nextWatchlist);
        setTargetAllocationState(nextTargetAllocation);
        setHistory(nextHistory);
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
    refresh();
    return () => { mountedRef.current = false; };
  }, [refresh]);

  // Merge live prices — recomputes whenever prices Map or rawHoldings changes
  const holdings = useMemo(() => {
    return rawHoldings.map(h => {
      const priceData = prices.get(h.symbol);
      return mergeWithLivePrice(h, priceData);
    });
  }, [rawHoldings, prices]);

  const summary = useMemo(() => buildSummary(holdings), [holdings]);
  const portfolio = useMemo(() => ({
    holdings,
    summary,
    transactions,
    watchlist,
    targetAllocation,
    history,
  }), [holdings, summary, transactions, watchlist, targetAllocation, history]);

  // CRUD operations
  const addHolding = useCallback(async (payload) => {
    if (isDemoMode) {
      const next = upsertPortfolioHolding(payload);
      if (mountedRef.current) setRawHoldings(next.map(normalizeHolding));
      return payload;
    }
    const res = await createHoldingApi(payload);
    await refresh();
    return res;
  }, [refresh]);

  const updateHolding = useCallback(async (id, payload) => {
    // Optimistic update
    setRawHoldings(prev => prev.map(h => h.id === id ? { ...h, ...payload } : h));
    try {
      if (isDemoMode) {
        const current = getPortfolioHoldings();
        const next = current.map((holding) => {
          const key = String(holding.id ?? holding.holding_id ?? holding.ticker ?? holding.symbol);
          if (key !== String(id)) return holding;
          return { ...holding, ...payload };
        });
        savePortfolioHoldings(next);
        if (mountedRef.current) setRawHoldings(next.map(normalizeHolding));
        return { id, ...payload };
      }
      const res = await createHoldingApi({ id, ...payload });
      await refresh();
      return res;
    } catch (err) {
      // Revert on failure
      await refresh();
      throw err;
    }
  }, [refresh]);

  const deleteHolding = useCallback(async (id) => {
    // Optimistic remove
    setRawHoldings(prev => prev.filter(h => h.id !== id));
    try {
      if (isDemoMode) {
        const next = removePortfolioHolding(id);
        if (mountedRef.current) setRawHoldings(next.map(normalizeHolding));
        return { id };
      }
      const res = await deleteHoldingApi(id);
      await refresh();
      return res;
    } catch (err) {
      await refresh();
      throw err;
    }
  }, [refresh]);

  const addToWatchlistFn = useCallback(async (tickerOrItem) => {
    const payload = typeof tickerOrItem === 'string' ? { ticker: tickerOrItem } : tickerOrItem;
    const res = await addToWatchlistApi(payload);
    await refresh();
    return res;
  }, [refresh]);

  const removeFromWatchlistFn = useCallback(async (ticker) => {
    const res = await removeFromWatchlistApi(ticker);
    await refresh();
    return res;
  }, [refresh]);

  const saveTargetAllocationFn = useCallback(async (allocations) => {
    const res = await setTargetAllocationApi(allocations);
    await refresh();
    return res;
  }, [refresh]);

  return {
    portfolio,
    holdings,
    summary,
    transactions,
    watchlist,
    targetAllocation,
    history,
    loading,
    error,
    isConnected,
    isStale,
    refresh,
    refetch: refresh,
    addHolding,
    updateHolding,
    deleteHolding,
    addToWatchlist: addToWatchlistFn,
    removeFromWatchlist: removeFromWatchlistFn,
    saveTargetAllocation: saveTargetAllocationFn,
  };
}

export { normalizeHolding, mergeWithLivePrice, buildSummary };
export default usePortfolio;
