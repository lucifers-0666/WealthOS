/**
 * WealthOS — usePortfolio hook
 * Single source of truth for portfolio data — wired to real API.
 * Replaces the old in-memory portfolioStore.js.
 */

import { useState, useEffect, useCallback } from 'react';
import * as api from './api.js';

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
      setPortfolio(port);
      setHoldings(port.holdings || []);
      setTransactions(txns);
      setTargetAllocationState(target);
      setWatchlist(watch);
    } catch (err) {
      setError(err.message);
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
