/**
 * WealthOS — usePortfolio hook
 * Single source of truth for portfolio data — wired to the centralized API client
 * and backed by React Query for caching, retries, and background refetches.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api.js';
import { getPortfolioHoldings } from './portfolioStore.js';
import { createReconnectingSocket } from '../services/websocket.js';
import { useAuth } from './useAuth.js';

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

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

async function fetchPortfolioBundle() {
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

    return {
      holdings: normalizedHoldings,
      transactions: Array.isArray(txns) ? txns : [],
      targetAllocation: Array.isArray(target) ? target : [],
      watchlist: Array.isArray(watch) ? watch : [],
      summary: buildSummary(normalizedHoldings),
      source: apiHoldings.length ? 'api' : 'local',
    };
  } catch (error) {
    const fallbackHoldings = getPortfolioHoldings().map(normalizeHolding);
    return {
      holdings: fallbackHoldings,
      transactions: [],
      targetAllocation: [],
      watchlist: [],
      summary: buildSummary(fallbackHoldings),
      source: 'fallback',
      error: error?.message || 'Unable to load portfolio from the server.',
    };
  }
}

export function usePortfolio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const liveSocketRef = useRef(null);
  const previousPricesRef = useRef({});

  const bundleQuery = useQuery({
    queryKey: ['portfolio-bundle'],
    queryFn: fetchPortfolioBundle,
    refetchInterval: 60_000,
  });

  const addHoldingMutation = useMutation({
    mutationFn: api.createHolding,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolio-bundle'] });
    },
  });

  const removeHoldingMutation = useMutation({
    mutationFn: api.deleteHolding,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['portfolio-bundle'] });
      const previous = queryClient.getQueryData(['portfolio-bundle']);
      queryClient.setQueryData(['portfolio-bundle'], (current) => {
        if (!current) return current;
        return {
          ...current,
          holdings: current.holdings.filter((holding) => String(holding.id) !== String(id)),
          summary: buildSummary(current.holdings.filter((holding) => String(holding.id) !== String(id))),
        };
      });
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['portfolio-bundle'], context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolio-bundle'] });
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: api.createTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolio-bundle'] });
    },
  });

  const saveTargetMutation = useMutation({
    mutationFn: api.setTargetAllocation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolio-bundle'] });
    },
  });

  const addWatchMutation = useMutation({
    mutationFn: api.addToWatchlist,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolio-bundle'] });
    },
  });

  const removeWatchMutation = useMutation({
    mutationFn: api.removeFromWatchlist,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolio-bundle'] });
    },
  });

  const portfolio = useMemo(() => ({
    holdings: bundleQuery.data?.holdings || [],
    summary: bundleQuery.data?.summary || buildSummary([]),
    history: [],
    source: bundleQuery.data?.source || 'api',
  }), [bundleQuery.data]);

  const holdings = bundleQuery.data?.holdings || EMPTY_ARRAY;
  const transactions = bundleQuery.data?.transactions || EMPTY_ARRAY;
  const targetAllocation = bundleQuery.data?.targetAllocation || EMPTY_ARRAY;
  const watchlist = bundleQuery.data?.watchlist || EMPTY_ARRAY;
  const loading = bundleQuery.isLoading;
  const error = bundleQuery.data?.source === 'fallback' ? null : (bundleQuery.error?.message || bundleQuery.data?.error || null);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['portfolio-bundle'] });
  };

  useEffect(() => {
    const wsBase = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/^http/i, 'ws');
    const wsRoot = wsBase.replace(/\/$/, '');
    const wsUrl = user?.id ? `${wsRoot}/ws/market-updates?user_id=${encodeURIComponent(user.id)}` : `${wsRoot}/ws/market-updates`;

    liveSocketRef.current = createReconnectingSocket(wsUrl, {
      onMessage: (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload || payload.type !== 'market_update') return;

          queryClient.setQueryData(['portfolio-bundle'], (current) => {
            if (!current) return current;
            const incomingHoldings = Array.isArray(payload.holdings) && payload.holdings.length
              ? payload.holdings.map(normalizeHolding)
              : current.holdings;

            const updatedHoldings = incomingHoldings.map((holding) => {
              const prevPrice = previousPricesRef.current[holding.ticker];
              const nextPrice = holding.current_price;
              let flash = null;
              if (Number.isFinite(prevPrice) && Number.isFinite(nextPrice) && prevPrice !== nextPrice) {
                flash = nextPrice > prevPrice ? 'up' : 'down';
              }
              previousPricesRef.current[holding.ticker] = nextPrice;
              return {
                ...holding,
                price_flash: flash,
                price_source: payload.sources?.[holding.ticker],
                price_stale: payload.stale_tickers?.includes(holding.ticker) || false,
              };
            });

            return {
              ...current,
              holdings: updatedHoldings,
              watchlist: Array.isArray(payload.watchlist) ? payload.watchlist : current.watchlist,
              summary: buildSummary(updatedHoldings),
              market_status: payload.market_status || current.market_status,
              live_updated_at: payload.updated_at || Date.now(),
            };
          });
        } catch {
          // Ignore malformed live updates; polling will keep data fresh.
        }
      },
    });

    return () => liveSocketRef.current?.close();
  }, [queryClient, user?.id]);

  return {
    portfolio,
    holdings,
    transactions,
    targetAllocation,
    watchlist,
    loading,
    error,
    marketStatus: bundleQuery.data?.market_status || null,
    liveUpdatedAt: bundleQuery.data?.live_updated_at || null,
    refresh,
    addHolding: async (data) => addHoldingMutation.mutateAsync(data),
    removeHolding: async (id) => removeHoldingMutation.mutateAsync(id),
    addTransaction: async (data) => addTransactionMutation.mutateAsync(data),
    saveTargetAllocation: async (allocations) => saveTargetMutation.mutateAsync(allocations),
    addWatch: async (data) => addWatchMutation.mutateAsync(data),
    removeWatch: async (ticker) => removeWatchMutation.mutateAsync(ticker),
  };
}
