/**
 * PortfolioIntelligence — Institutional-grade portfolio advisor panel.
 * Actionable insights, not generic summaries.
 * Uses analytics.js for all calculations.
 */
import { useMemo } from 'react';
import {
  concentrationScore,
  sectorExposure,
  portfolioHealthScore,
  rebalanceSuggestions,
  allocationDrift,
} from '../lib/analytics.js';

const RISK_COLOURS = {
  low:    { bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.3)',   text: '#16a34a' },
  medium: { bg: 'rgba(202,138,4,0.1)',   border: 'rgba(202,138,4,0.3)',   text: '#ca8a04' },
  high:   { bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.3)',   text: '#dc2626' },
};

function InsightCard({ title, children, accent }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.625rem',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        {accent && (
          <span style={{ width: 3, height: 14, borderRadius: 2, background: accent, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', letterSpacing: '0.01em' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>{children}</div>
    </div>
  );
}

function RiskBadge({ level, label }) {
  const c = RISK_COLOURS[level] || RISK_COLOURS.medium;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: '0.25rem',
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
    }}>
      {label || level}
    </span>
  );
}

function HealthGauge({ score, grade }) {
  const colour = score >= 80 ? '#16a34a' : score >= 65 ? '#4f98a3' : score >= 50 ? '#ca8a04' : score >= 35 ? '#dc7000' : '#dc2626';
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-surface-offset)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke={colour}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 1,
        }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: colour, lineHeight: 1 }}>{grade}</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>{score}/100</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>Portfolio Health</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {score >= 80 ? 'Well-diversified and balanced.' :
           score >= 65 ? 'Good structure, minor adjustments recommended.' :
           score >= 50 ? 'Moderate risk. Review sector concentration.' :
           'High concentration risk. Rebalancing advised.'}
        </div>
      </div>
    </div>
  );
}

function SectorBar({ sector, pct, isOverweight }) {
  const colour = isOverweight ? '#dc2626' : pct > 25 ? '#ca8a04' : 'var(--color-primary)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '7rem 1fr 3.5rem', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sector}</span>
      <div style={{ height: 5, borderRadius: 9999, background: 'var(--color-surface-offset)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 9999, background: colour, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isOverweight ? '#dc2626' : 'var(--color-text)', textAlign: 'right' }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

export function PortfolioIntelligence({ holdings, summary }) {
  const health = useMemo(() => portfolioHealthScore(holdings, summary), [holdings, summary]);
  const sectors = useMemo(() => sectorExposure(holdings), [holdings]);
  const suggestions = useMemo(() => rebalanceSuggestions(holdings), [holdings]);
  const concScore = useMemo(() => concentrationScore(holdings), [holdings]);

  const maxSectorPct = sectors[0]?.pct ?? 0;
  const concentrationRisk = maxSectorPct > 40 ? 'high' : maxSectorPct > 25 ? 'medium' : 'low';

  if (!holdings.length) return null;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>

      {/* Health Score */}
      <InsightCard title="Portfolio Intelligence" accent="var(--color-primary)">
        <HealthGauge score={health.score} grade={health.grade} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
          {health.components.map(c => (
            <div key={c.label} style={{ background: 'var(--color-surface-offset)', borderRadius: '0.375rem', padding: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{c.value}<span style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)' }}>/{c.max}</span></div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.3 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </InsightCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Sector Exposure */}
        <InsightCard title="Sector Exposure" accent="var(--color-blue)">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Concentration</span>
            <RiskBadge level={concentrationRisk} />
          </div>
          {sectors.slice(0, 6).map(s => (
            <SectorBar key={s.sector} sector={s.sector} pct={s.pct} isOverweight={s.pct > 40} />
          ))}
        </InsightCard>

        {/* Concentration Risk */}
        <InsightCard title="Diversification" accent="var(--color-gold)">
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Diversification score</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: concScore >= 70 ? '#16a34a' : concScore >= 45 ? '#ca8a04' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{concScore}</span>
            </div>
            <div style={{ height: 6, borderRadius: 9999, background: 'var(--color-surface-offset)' }}>
              <div style={{ height: '100%', width: `${concScore}%`, borderRadius: 9999, background: concScore >= 70 ? '#16a34a' : concScore >= 45 ? '#ca8a04' : '#dc2626', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {concScore >= 70
              ? 'Portfolio is well-diversified across holdings.'
              : concScore >= 45
              ? 'Moderate concentration. Consider spreading across more assets.'
              : 'High concentration risk. A few holdings dominate the portfolio.'}
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Holdings</span>
              <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{holdings.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Sectors</span>
              <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{sectors.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Top sector weight</span>
              <span style={{ color: maxSectorPct > 40 ? '#dc2626' : 'var(--color-text)', fontWeight: 600 }}>{maxSectorPct.toFixed(1)}%</span>
            </div>
          </div>
        </InsightCard>
      </div>

      {/* Rebalance Suggestions */}
      {suggestions.length > 0 && (
        <InsightCard title="Rebalance Suggestions" accent="var(--color-warning)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {suggestions.map(s => (
              <div key={s.symbol} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                background: s.action === 'REDUCE'
                  ? 'rgba(220,38,38,0.05)'
                  : 'rgba(22,163,74,0.05)',
                border: `1px solid ${s.action === 'REDUCE' ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                    color: s.action === 'REDUCE' ? '#dc2626' : '#16a34a',
                    background: s.action === 'REDUCE' ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)',
                  }}>{s.action}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{s.symbol}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.driftPct}% drift</span>
                  <RiskBadge level={s.urgency} />
                </div>
              </div>
            ))}
          </div>
        </InsightCard>
      )}
    </div>
  );
}

export default PortfolioIntelligence;
