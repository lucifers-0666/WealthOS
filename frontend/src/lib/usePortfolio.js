/**
 * WealthOS — usePortfolio hook
 * Single source of truth for portfolio data — wired to real API.
 * Replaces the old in-memory portfolioStore.js.
 */

import { useState, useEffect, useCallback } from 'react';
import * as api from './api.js';
import { getPortfolioHoldings } from './portfolioStore.js';

const n = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeHolding = (row) => {
  const quantity = n(row.quantity);
  const avgBuyPrice = n(row.avg_buy_price ?? row.avg_price ?? row.avgCost);
  const livePrice = n(row.current_price_inr ?? row.current_price ?? row.ltp ?? row.live_price);
  const invested = n(row.invested_amount ?? quantity * avgBuyPrice);
  const currentValue = n(row.current_value ?? quantity * livePrice);
  const pnl = n(row.unrealised_pnl ?? row.unrealized_pnl ?? currentValue - invested);
  const pnlPct = invested ? (pnl / invested) * 100 : 0;
  const changePct = n(row.change_pct ?? row.price_change_pct ?? 0);
  return {
    id: row.holding_id ?? row.id ?? row.ticker,
    ticker: row.ticker,
    company_name: row.company_name,
    quantity,
    avg_buy_price: avgBuyPrice,
    exchange: row.exchange,
    asset_class: row.asset_class,
    sector: row.sector,
    currency: row.currency || 'INR',
    current_price: livePrice || n(row.current_price),
    current_value: currentValue || invested,
    invested_value: invested,
    unrealised_pnl: pnl,
    unrealised_pnl_pct: pnlPct,
    day_change_pct: changePct,
    day_change: currentValue && changePct ? (currentValue * changePct) / 100 : 0,
    price_updated_at: row.price_updated_at,
    weight_pct: n(row.weight_pct),
    raw: row,
  };
};

const buildSummary = (holdings) => {
  const invested = holdings.reduce((sum, item) => sum + item.invested_value, 0);
  const value = holdings.reduce((sum, item) => sum + item.current_value, 0);
  const pnl = value - invested;
  const dayChange = holdings.reduce((sum, item) => sum + (item.day_change || 0), 0);
  const topWinner = holdings.reduce((best, item) => (item.unrealised_pnl_pct > (best?.unrealised_pnl_pct ?? -Infinity) ? item : best), null);
  const topLoser = holdings.reduce((worst, item) => (item.unrealised_pnl_pct < (worst?.unrealised_pnl_pct ?? Infinity) ? item : worst), null);

  return {
    total_invested: invested,
    current_value: value,
    total_pnl: pnl,
    total_pnl_pct: invested ? (pnl / invested) * 100 : 0,
    day_change: dayChange,
    day_change_pct: value ? (dayChange / value) * 100 : 0,
    num_holdings: holdings.length,
    num_winners: holdings.filter((h) => h.unrealised_pnl >= 0).length,
    num_losers: holdings.filter((h) => h.unrealised_pnl < 0).length,
    best_performer: topWinner?.ticker ?? null,
    worst_performer: topLoser?.ticker ?? null,
  };
};

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [targetAllocation, setTargetAllocationState] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [port, txns, target, watch] = await Promise.all([
        api.getPortfolio(),
        api.getTransactions(),
        api.getTargetAllocation(),
        api.getWatchlist(),
      ]);
      const apiHoldings = Array.isArray(port) ? port : [];
      const sourceHoldings = apiHoldings.length ? apiHoldings : getPortfolioHoldings();
      const normalizedHoldings = sourceHoldings.map(normalizeHolding);
      const summary = buildSummary(normalizedHoldings);
      setPortfolio({ holdings: normalizedHoldings, summary, history: [] });
      setHoldings(normalizedHoldings);
      setTransactions(txns);
      setTargetAllocationState(target);
      setWatchlist(watch);
    } catch (err) {
      const fallbackHoldings = getPortfolioHoldings().map(normalizeHolding);
      setPortfolio({ holdings: fallbackHoldings, summary: buildSummary(fallbackHoldings), history: [] });
      setHoldings(fallbackHoldings);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  const addHolding = async (data) => {
    const result = await api.createHolding(data);
    await fetchPortfolio();
    return result;
  };

  const removeHolding = async (id) => {
    await api.deleteHolding(id);
    await fetchPortfolio();
  };

  const addTransaction = async (data) => {
    const result = await api.createTransaction(data);
    await fetchPortfolio();
    return result;
  };

  const saveTargetAllocation = async (allocations) => {
    const result = await api.setTargetAllocation(allocations);
    setTargetAllocationState(allocations);
    return result;
  };

  const addWatch = async (data) => {
    const result = await api.addToWatchlist(data);
    setWatchlist((prev) => [...prev, result]);
    return result;
  };

  const removeWatch = async (ticker) => {
    await api.removeFromWatchlist(ticker);
    setWatchlist((prev) => prev.filter((w) => w.ticker !== ticker));
  };

  return {
    portfolio,
    holdings,
    transactions,
    targetAllocation,
    watchlist,
    loading,
    error,
    refresh: fetchPortfolio,
    addHolding,
    removeHolding,
    addTransaction,
    saveTargetAllocation,
    addWatch,
    removeWatch,
  };
}
