/**
 * useAnalytics — computes all portfolio analytics from live holdings.
 *
 * Memoised heavily: only recomputes when holdings or summary change.
 * Does NOT maintain its own data-fetching layer — consumes usePortfolio output.
 */
import { useMemo } from 'react';
import {
  xirrFromHoldings,
  cagr,
  sharpeRatio,
  annualisedVolatility,
  maxDrawdown,
  concentrationScore,
  sectorExposure,
  portfolioHealthScore,
  rebalanceSuggestions,
  allocationDrift,
} from './analytics.js';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function portfolioAgeYears(holdings) {
  const dates = holdings
    .map(h => h.buy_date ? new Date(h.buy_date).getTime() : null)
    .filter(Boolean);
  if (!dates.length) return null;
  const earliest = Math.min(...dates);
  return (Date.now() - earliest) / MS_PER_YEAR;
}

export function useAnalytics(holdings, summary, historicalDailyReturns = []) {
  // XIRR — transaction-aware, recomputes when holdings change
  const xirr = useMemo(() => xirrFromHoldings(holdings), [holdings]);

  // CAGR — total invested -> total current over portfolio age
  const cagrResult = useMemo(() => {
    if (!summary?.totalInvested || !summary?.totalCurrent) return null;
    const years = portfolioAgeYears(holdings);
    if (!years || years < 0.1) return null;
    return cagr(summary.totalInvested, summary.totalCurrent, years);
  }, [holdings, summary]);

  // Sharpe — requires 30+ daily returns
  const sharpe = useMemo(() => {
    if (historicalDailyReturns.length < 30) return null;
    return sharpeRatio(historicalDailyReturns);
  }, [historicalDailyReturns]);

  // Volatility
  const volatility = useMemo(() => {
    if (historicalDailyReturns.length < 2) return null;
    return annualisedVolatility(historicalDailyReturns);
  }, [historicalDailyReturns]);

  // Max drawdown
  const drawdown = useMemo(() => {
    // Build synthetic NAV series from holdings if no historical data
    if (historicalDailyReturns.length < 2) return null;
    let nav = 100;
    const navSeries = [nav];
    for (const r of historicalDailyReturns) {
      nav *= (1 + r);
      navSeries.push(nav);
    }
    return maxDrawdown(navSeries);
  }, [historicalDailyReturns]);

  // Health score
  const health = useMemo(
    () => portfolioHealthScore(holdings, summary),
    [holdings, summary]
  );

  // Concentration
  const concentration = useMemo(() => concentrationScore(holdings), [holdings]);

  // Sector exposure
  const sectors = useMemo(() => sectorExposure(holdings), [holdings]);

  // Allocation drift (no target weights set = informational drift only)
  const drift = useMemo(() => allocationDrift(holdings, {}), [holdings]);

  // Rebalance suggestions
  const rebalance = useMemo(() => rebalanceSuggestions(holdings, {}), [holdings]);

  return {
    xirr,
    cagr: cagrResult,
    sharpe,
    volatility,
    drawdown,
    health,
    concentration,
    sectors,
    drift,
    rebalance,
  };
}
