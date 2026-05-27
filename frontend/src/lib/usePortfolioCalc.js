/**
 * Pure calculation helpers that work on either static or live holdings.
 * All functions are deterministic — no side effects.
 */

export function calcSummary(holdings) {
  if (!holdings || !holdings.length) return null;
  const current_value  = holdings.reduce((s, h) => s + (h.current_value   || 0), 0);
  const total_invested = holdings.reduce((s, h) => s + (h.invested_amount || 0), 0);
  const total_pnl      = current_value - total_invested;
  const total_pnl_pct  = total_invested > 0 ? (total_pnl / total_invested) * 100 : 0;
  const day_change     = holdings.reduce((s, h) => s + (h.day_change      || 0), 0);
  const day_change_pct = current_value > 0 ? (day_change / current_value) * 100 : 0;
  return { current_value, total_invested, total_pnl, total_pnl_pct, day_change, day_change_pct };
}

export function calcAllocation(holdings) {
  const groups = {};
  holdings.forEach((h) => {
    const key = h.asset_class || h.sector || 'Other';
    groups[key] = (groups[key] || 0) + (h.current_value || 0);
  });
  return Object.entries(groups).map(([name, value]) => ({ name, value }));
}

export function calcConcentration(holdings) {
  const total = holdings.reduce((s, h) => s + (h.current_value || 0), 0);
  if (!total) return [];
  return holdings
    .map((h) => ({ ...h, weight: ((h.current_value || 0) / total) * 100 }))
    .sort((a, b) => b.weight - a.weight);
}

/** XIRR approximation using Newton-Raphson, returns annualised %. */
export function calcXIRR(cashflows) {
  // cashflows: [{amount, date}]
  if (!cashflows || cashflows.length < 2) return null;
  const dates = cashflows.map((cf) => new Date(cf.date).getTime() / (1000 * 60 * 60 * 24 * 365));
  const amounts = cashflows.map((cf) => cf.amount);
  const t0 = dates[0];
  let rate = 0.1;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (let i = 0; i < amounts.length; i++) {
      const t = dates[i] - t0;
      npv  += amounts[i] / Math.pow(1 + rate, t);
      dnpv -= t * amounts[i] / Math.pow(1 + rate, t + 1);
    }
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-7) { rate = newRate; break; }
    rate = newRate;
  }
  return isFinite(rate) ? rate * 100 : null;
}

/** Simple Sharpe ratio: (return - rf) / stddev  (rf = 6% annualised for India) */
export function calcSharpe(returnsArr, rf = 0.06) {
  if (!returnsArr || returnsArr.length < 2) return null;
  const mean = returnsArr.reduce((s, r) => s + r, 0) / returnsArr.length;
  const variance = returnsArr.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returnsArr.length;
  const stddev = Math.sqrt(variance);
  return stddev === 0 ? null : ((mean - rf / 252) / stddev) * Math.sqrt(252);
}

/** Diversification score 0-100 based on HHI (Herfindahl-Hirschman Index). */
export function calcDiversificationScore(holdings) {
  const total = holdings.reduce((s, h) => s + (h.current_value || 0), 0);
  if (!total) return 0;
  const hhi = holdings.reduce((s, h) => {
    const w = (h.current_value || 0) / total;
    return s + w * w;
  }, 0);
  // HHI=1 → fully concentrated → score 0; HHI=1/n → perfectly diversified → score 100
  const n = holdings.length || 1;
  const minHHI = 1 / n;
  const score = Math.max(0, Math.min(100, ((1 - hhi) / (1 - minHHI)) * 100));
  return Math.round(score);
}
