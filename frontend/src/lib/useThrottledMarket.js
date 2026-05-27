/**
 * useThrottledMarket — consume MarketDataContext with throttled rerenders
 * Components that need live prices but don't need 100ms refresh rates
 * should use this hook instead of useMarketData() directly.
 *
 * Default throttle: 500ms (2fps for prices, plenty for UI)
 * Chart throttle: 2000ms
 */
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useMarketData } from './MarketDataContext.jsx';

const DEFAULT_THROTTLE = 500;

export function useThrottledMarket(throttleMs = DEFAULT_THROTTLE) {
  const ctx = useMarketData();
  const [snapshot, setSnapshot] = useState(() => ctx.prices);
  const lastFlushRef = useRef(0);
  const pendingRef = useRef(null);
  const pricesRef = useRef(ctx.prices);

  // Keep pricesRef always current without triggering renders
  pricesRef.current = ctx.prices;

  useEffect(() => {
    const flush = () => {
      lastFlushRef.current = Date.now();
      pendingRef.current = null;
      setSnapshot({ ...pricesRef.current });
    };

    const now = Date.now();
    const elapsed = now - lastFlushRef.current;

    if (elapsed >= throttleMs) {
      flush();
    } else {
      if (!pendingRef.current) {
        pendingRef.current = setTimeout(flush, throttleMs - elapsed);
      }
    }

    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
        pendingRef.current = null;
      }
    };
  }, [ctx.prices, throttleMs]);

  const getPrice = useCallback((ticker) => {
    if (!ticker) return null;
    const key = ticker.toUpperCase().replace(/\.NS$|\.BO$/, '');
    return snapshot[key] || snapshot[ticker] || null;
  }, [snapshot]);

  const getLTP = useCallback((ticker) => {
    const p = getPrice(ticker);
    return p?.current_price ?? p?.ltp ?? null;
  }, [getPrice]);

  const getChangePct = useCallback((ticker) => {
    const p = getPrice(ticker);
    return p?.change_pct ?? p?.day_change_pct ?? 0;
  }, [getPrice]);

  return {
    prices: snapshot,
    status: ctx.status,
    isConnected: ctx.isConnected,
    lastUpdate: ctx.lastUpdate,
    getPrice,
    getLTP,
    getChangePct,
  };
}

/**
 * useMemoizedPortfolioValues — stable memoized portfolio calculations
 * Only recomputes when holdings or prices actually change (deep equality on tickers).
 */
export function useMemoizedPortfolioValues(holdings, prices) {
  const tickerPricesRef = useRef({});

  // Build a lightweight price signature to avoid unnecessary recomputes
  const priceSignature = useMemo(() => {
    if (!holdings?.length || !prices) return '';
    return holdings
      .map((h) => {
        const ticker = h.ticker || h.symbol;
        const key = ticker?.toUpperCase().replace(/\.NS$|\.BO$/, '');
        const p = prices[key] || prices[ticker];
        return `${key}:${p?.current_price ?? p?.ltp ?? 0}`;
      })
      .join('|');
  }, [holdings, prices]);

  return useMemo(() => {
    if (!holdings?.length) {
      return { totalInvested: 0, totalCurrent: 0, totalPnL: 0, totalPnLPct: 0, dayChange: 0, dayChangePct: 0, enriched: [] };
    }

    let totalInvested = 0;
    let totalCurrent = 0;
    let totalDayChange = 0;

    const enriched = holdings.map((h) => {
      const ticker = (h.ticker || h.symbol || '').toUpperCase();
      const key = ticker.replace(/\.NS$|\.BO$/, '');
      const p = prices?.[key] || prices?.[ticker] || {};

      const ltp = p.current_price ?? p.ltp ?? h.current_price ?? h.ltp ?? h.avg_buy_price ?? 0;
      const qty = Number(h.quantity || h.qty || 0);
      const avg = Number(h.avg_buy_price || h.avg_price || 0);
      const invested = qty * avg;
      const current = qty * ltp;
      const pnl = current - invested;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
      const prevClose = p.previous_close ?? p.prev_close ?? ltp;
      const dayChange = qty * (ltp - prevClose);
      const dayChangePct = prevClose > 0 ? ((ltp - prevClose) / prevClose) * 100 : 0;

      totalInvested += invested;
      totalCurrent += current;
      totalDayChange += dayChange;

      return {
        ...h,
        ltp,
        invested,
        current_value: current,
        pnl,
        pnl_pct: pnlPct,
        day_change: dayChange,
        day_change_pct: dayChangePct,
        stale: p.stale_price ?? false,
        last_updated: p.last_updated_at ?? null,
        source: p.source ?? null,
      };
    });

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const openValue = totalInvested + totalDayChange; // approx previous day value
    const dayChangePct = openValue > 0 ? (totalDayChange / openValue) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalPnL,
      totalPnLPct,
      dayChange: totalDayChange,
      dayChangePct,
      enriched,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceSignature, holdings]);
}
