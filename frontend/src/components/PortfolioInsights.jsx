/**
 * PortfolioInsights.jsx — AI insights sidebar after import.
 * Shows diversification, risk score, top holdings, P&L summary.
 */

import React from 'react';

export default function PortfolioInsights({ insights }) {
  if (!insights || insights.stock_count === 0) return null;

  const {
    stock_count, total_invested, total_current_value, total_pnl,
    pnl_percent, diversification, risk_score, top_holdings, ai_summary,
  } = insights;

  const pnlPositive = total_pnl >= 0;
  const riskColor = risk_score <= 3 ? 'var(--aegean-green)' : risk_score <= 6 ? 'var(--greek-gold)' : 'var(--terracotta)';
  const riskLabel = risk_score <= 3 ? 'Low Risk' : risk_score <= 6 ? 'Moderate Risk' : 'High Risk';

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <span className="insights-icon">✨</span>
        <h3>AI Insights</h3>
      </div>

      {/* P&L Summary */}
      <div className="insight-card pnl-card">
        <div className="insight-row">
          <span>Portfolio Value</span>
          <strong>₹{(total_current_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
        </div>
        <div className="insight-row">
          <span>Total Invested</span>
          <strong>₹{(total_invested || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
        </div>
        <div className={`insight-row pnl-row ${pnlPositive ? 'positive' : 'negative'}`}>
          <span>Overall P&amp;L</span>
          <strong>
            {pnlPositive ? '+' : ''}₹{Math.abs(total_pnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            <span className="pnl-pct"> ({pnlPositive ? '+' : ''}{(pnl_percent || 0).toFixed(1)}%)</span>
          </strong>
        </div>
      </div>

      {/* Risk & Diversification */}
      <div className="insight-card">
        <div className="insight-row">
          <span>Diversification</span>
          <strong className="text-primary">{diversification}</strong>
        </div>
        <div className="insight-row">
          <span>Stocks</span>
          <strong>{stock_count}</strong>
        </div>
        <div className="insight-row">
          <span>Risk Score</span>
          <span className="risk-badge" style={{ color: riskColor, borderColor: riskColor }}>
            {risk_score}/10 — {riskLabel}
          </span>
        </div>
        {/* Risk bar */}
        <div className="risk-bar-wrap">
          <div className="risk-bar" style={{ width: `${risk_score * 10}%`, background: riskColor }} />
        </div>
      </div>

      {/* Top Holdings */}
      {top_holdings?.length > 0 && (
        <div className="insight-card">
          <div className="insight-section-title">Top Holdings</div>
          {top_holdings.map((h, i) => (
            <div key={i} className="top-holding-row">
              <span className="top-holding-rank">#{i + 1}</span>
              <span className="top-holding-ticker">{h.ticker}</span>
              <span className="top-holding-value">₹{(h.value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI Summary */}
      {ai_summary && (
        <div className="insight-card ai-summary-card">
          <div className="insight-section-title">🤖 Gemini Analysis</div>
          <p className="ai-summary-text">{ai_summary}</p>
        </div>
      )}
    </div>
  );
}
