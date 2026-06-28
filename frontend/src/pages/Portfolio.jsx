import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePortfolio } from '../lib/usePortfolio.js';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { PageLoadingState, PageErrorState } from '../components/PageStates.jsx';
import EditHoldingModal from '../components/EditHoldingModal.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import { DotsThree, ArrowUp, ArrowDown } from '@phosphor-icons/react';

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
function pct(n) {
  if (n == null || isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}
function compact(n) {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${n < 0 ? '-' : ''}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${n < 0 ? '-' : ''}₹${(abs / 1e5).toFixed(2)}L`;
  return fmt(n);
}

// ── Donut SVG ────────────────────────────────────────────────────────────────
const DONUT_COLORS = ['var(--color-gold)', 'var(--color-blue)', 'var(--color-gain)', 'var(--color-loss)', 'var(--color-warn)', 'var(--color-text-muted)', 'var(--color-text-faint)'];

function DonutChart({ slices, centerLabel }) {
  const r = 64, cx = 80, cy = 80, strokeW = 20;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = slices.map((s, i) => {
    const dash = (s.pct / 100) * circ;
    const el = (
      <circle
        key={i} cx={cx} cy={cy} r={r} fill="none"
        stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
        strokeWidth={strokeW}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4 - offset}
        style={{ transition: 'all 1s ease-out' }}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(45,60,55,0.4)" strokeWidth={strokeW} />
        {arcs}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{centerLabel}</span>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: 8, fontWeight: 400, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 5 }}>Portfolio</span>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { portfolio, loading, error, refresh, updateHolding, deleteHolding } = usePortfolio();
  const { holdings: liveHoldings, forceRefresh } = useMarketData();

  const [editTarget, setEditTarget]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [saving, setSaving]               = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterClass, setFilterClass]     = useState('All');
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!activeDropdown) return;
    const close = () => setActiveDropdown(null);
    const timer = setTimeout(() => window.addEventListener('click', close), 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', close);
    };
  }, [activeDropdown]);

  const liveHoldingsHaveValue = liveHoldings.some(h =>
    Number(h?.current_value || 0) > 0 || Number(h?.ltp || 0) > 0
  );
  const rawHoldings = liveHoldingsHaveValue ? liveHoldings : (portfolio?.holdings || []);

  const assetClasses = useMemo(() => {
    const s = new Set(rawHoldings.map(h => h.asset_class || 'Equity'));
    return ['All', ...Array.from(s)];
  }, [rawHoldings]);

  const holdings = useMemo(() => {
    let h = filterClass === 'All' ? rawHoldings : rawHoldings.filter(x => (x.asset_class || 'Equity') === filterClass);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      h = h.filter(x => (x.ticker || '').toLowerCase().includes(q) || (x.company_name || '').toLowerCase().includes(q));
    }
    return [...h].sort((a, b) => (b.current_value || 0) - (a.current_value || 0));
  }, [rawHoldings, filterClass, searchQuery]);

  const summary    = portfolio?.summary || {};
  const totalValue = summary.totalCurrent || 0;

  // Sectors
  const sectors = useMemo(() => {
    const bySector = {};
    holdings.forEach(h => {
      const sec = h.sector || 'Others';
      bySector[sec] = (bySector[sec] || 0) + (h.current_value || 0);
    });
    return Object.entries(bySector)
      .map(([name, val]) => ({ name, val, pct: (val / (totalValue || 1)) * 100 }))
      .sort((a, b) => b.val - a.val);
  }, [holdings, totalValue]);

  const handleSave = useCallback(async (data) => {
    setSaving(true);
    try {
      await updateHolding({ id: editTarget?.id, ...data });
      setEditTarget(null);
      refresh(); forceRefresh();
    } catch (e) { console.error('Save holding failed', e); }
    finally { setSaving(false); }
  }, [editTarget, updateHolding, refresh, forceRefresh]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteHolding(deleteTarget.id);
      setDeleteTarget(null);
      refresh(); forceRefresh();
    } catch (e) { console.error('Delete holding failed', e); }
    finally { setDeleting(false); }
  }, [deleteTarget, deleteHolding, refresh, forceRefresh]);

  if (loading && !liveHoldings.length) return <PageLoadingState title="Loading portfolio…" />;
  if (error   && !liveHoldings.length) return <PageErrorState title="Portfolio unavailable" message={error} />;

  const kpis = [
    { label: 'TOTAL VALUE', value: compact(summary.totalCurrent), color: 'var(--color-text)', bar: 'var(--color-gold)' },
    { label: 'INVESTED',    value: compact(summary.totalInvested), color: 'var(--color-text)', bar: 'var(--color-blue)' },
    { label: 'P&L',         value: compact(summary.totalPnl),      color: (summary.totalPnl || 0) >= 0 ? 'var(--color-gain)' : 'var(--color-loss)', bar: (summary.totalPnl || 0) >= 0 ? 'var(--color-gain)' : 'var(--color-loss)' },
    { label: 'XIRR',        value: '14.2%',                        color: 'var(--color-text)', bar: 'var(--color-blue)' },
  ];

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box' }}>

      {/* ── 1. PAGE HEADER ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Portfolio</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: 3, padding: '5px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, background: 'transparent', cursor: 'pointer' }}>
            Export CSV
          </button>
          <button
            onClick={() => setEditTarget({})}
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', borderRadius: 3, padding: '5px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, background: 'transparent', cursor: 'pointer' }}
          >
            + Add Holding
          </button>
        </div>
      </div>

      {/* ── 2. KPI ROW ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={k.label} style={{
            background: 'var(--color-card)', border: '1px solid var(--color-border)', borderLeft: `2px solid ${k.bar}`,
            borderRadius: 3, padding: '18px 20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 108, position: 'relative',
            animation: `fadeSlideUp 0.4s ease-out ${i * 60}ms both`,
          }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-faint)', marginBottom: 10 }}>
              {k.label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', color: k.color, lineHeight: 1, marginTop: 'auto' }}>
              {k.value}
            </div>
            <div style={{ height: 1, background: 'rgba(45,60,55,0.55)', marginTop: 12 }} />
          </div>
        ))}
      </div>

      {/* ── 3. MAIN GRID ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* Holdings Table */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '18px 0 14px', animation: 'fadeSlideUp 0.4s ease-out 300ms both' }}>
          {/* Card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 2, height: 12, background: 'var(--color-gold)', borderRadius: 1 }} />
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-muted)' }}>Holdings</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text" placeholder="Search…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--color-text)', outline: 'none', width: 180 }}
              />
              <select
                value={filterClass} onChange={e => setFilterClass(e.target.value)}
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--color-text)', outline: 'none' }}
              >
                {assetClasses.map(ac => <option key={ac} value={ac}>{ac}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 2 }}>
                  {[
                    { label: 'STOCK',    align: 'left' },
                    { label: 'SECTOR',   align: 'left' },
                    { label: 'QTY',      align: 'right' },
                    { label: 'AVG COST', align: 'right' },
                    { label: 'LTP',      align: 'right' },
                    { label: 'P&L',      align: 'right' },
                    { label: 'P&L%',     align: 'right' },
                    { label: 'WEIGHT',   align: 'left' },
                    { label: 'ACTION',   align: 'center' },
                  ].map(col => (
                    <th key={col.label} style={{
                      textAlign: col.align, padding: '8px 12px', fontFamily: 'Inter, sans-serif',
                      fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em',
                      color: 'var(--color-text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const rowKey     = h.id || h.ticker || i;
                  const invested   = h.invested_amount || 0;
                  const pnl        = (h.current_value || 0) - invested;
                  const pnlPct     = invested > 0 ? (pnl / invested) * 100 : 0;
                  const weight     = totalValue > 0 ? ((h.current_value || 0) / totalValue) * 100 : 0;
                  const isPositive = pnl >= 0;

                  const tdBase = {
                    padding: '10px 12px', whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', verticalAlign: 'middle',
                    borderBottom: '1px solid rgba(45,60,55,0.55)',
                  };

                  return (
                    <tr
                      key={h.id || h.ticker}
                      style={{ minHeight: 44, animation: `fadeSlideUp 0.4s ease-out ${300 + i * 30}ms both` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.018)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* STOCK */}
                      <td style={tdBase}>
                        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {h.company_name || h.ticker}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'var(--color-text-faint)', textTransform: 'uppercase' }}>
                          {h.exchange || 'NSE'}
                        </div>
                      </td>
                      {/* SECTOR */}
                      <td style={{ ...tdBase, fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {h.sector || 'Equity'}
                      </td>
                      {/* QTY */}
                      <td style={{ ...tdBase, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)', textAlign: 'right' }}>
                        {h.quantity}
                      </td>
                      {/* AVG COST */}
                      <td style={{ ...tdBase, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)', textAlign: 'right' }}>
                        {fmt(h.avg_buy_price)}
                      </td>
                      {/* LTP */}
                      <td style={{ ...tdBase, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)', textAlign: 'right' }}>
                        {fmt(h.current_price || h.ltp)}
                      </td>
                      {/* P&L */}
                      <td style={{ ...tdBase, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: isPositive ? 'var(--color-gain)' : 'var(--color-loss)', textAlign: 'right' }}>
                        {fmt(pnl)}
                      </td>
                      {/* P&L% — fixed-width badge */}
                      <td style={{ ...tdBase, textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 72, height: 22,
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                          borderRadius: 3,
                          background: isPositive ? 'rgba(111,174,141,0.12)' : 'rgba(182,106,106,0.12)',
                          border: isPositive ? '1px solid rgba(111,174,141,0.28)' : '1px solid rgba(182,106,106,0.28)',
                          color: isPositive ? 'var(--color-gain)' : 'var(--color-loss)',
                        }}>
                          {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                        </span>
                      </td>
                      {/* WEIGHT */}
                      <td style={tdBase}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 2, background: 'rgba(45,60,55,0.5)', borderRadius: 1, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(weight, 100)}%`, background: 'var(--color-gold)', borderRadius: 1, animation: 'slideRight 0.8s ease-out backwards' }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', minWidth: 36, textAlign: 'right' }}>
                            {weight.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      {/* ACTION */}
                      <td style={{ ...tdBase, overflow: 'visible', textOverflow: 'unset', position: 'relative', textAlign: 'center' }}>
                        <button
                          data-row-key={rowKey}
                          style={{ color: 'var(--color-text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex' }}
                          onClick={e => { e.stopPropagation(); setActiveDropdown(activeDropdown === rowKey ? null : rowKey); }}
                        >
                          <DotsThree size={16} weight="bold" />
                        </button>
                        {activeDropdown === rowKey && (() => {
                          const btn = document.querySelector(`[data-row-key="${rowKey}"]`);
                          const rect = btn ? btn.getBoundingClientRect() : { bottom: 0, right: 0 };
                          return createPortal(
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{
                                position: 'fixed',
                                top: rect.bottom + 4,
                                right: window.innerWidth - rect.right,
                                zIndex: 9999,
                                minWidth: 140,
                                background: 'var(--color-overlay)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 3,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.50)',
                                animation: 'fadeSlideUp 150ms ease-out',
                              }}
                            >
                              <button
                                style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--color-text)', background: 'none', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-card)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                onClick={() => { setActiveDropdown(null); setEditTarget(h); }}
                              >View / Edit</button>
                              <div style={{ height: 1, background: 'rgba(45,60,55,0.55)' }} />
                              <button
                                style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--color-loss)', background: 'none', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(182,106,106,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                onClick={() => { setActiveDropdown(null); setDeleteTarget(h); }}
                              >Remove</button>
                            </div>,
                            document.body
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
                {holdings.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'var(--color-text-faint)' }}>
                      No holdings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right Panel: Donut + Sector Weights ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Allocation Donut */}
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 3, padding: 20, minHeight: 280, animation: 'fadeSlideUp 0.4s ease-out 360ms both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ display: 'inline-block', width: 2, height: 12, background: 'var(--color-gold)', borderRadius: 1 }} />
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-muted)' }}>Allocation</span>
            </div>
            <div style={{ padding: '8px 0 16px' }}>
              <DonutChart slices={sectors.length ? sectors : [{ name: 'Empty', pct: 100 }]} centerLabel={compact(totalValue)} />
            </div>
            {/* Legend */}
            {sectors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {sectors.slice(0, 5).map((s, i) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-faint)', flexShrink: 0 }}>{s.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sector Weights */}
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 3, padding: 20, animation: 'fadeSlideUp 0.4s ease-out 420ms both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ display: 'inline-block', width: 2, height: 12, background: 'var(--color-gold)', borderRadius: 1 }} />
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-muted)' }}>Sector Weights</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sectors.map((sec, i) => (
                <div key={sec.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {sec.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {sec.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(45,60,55,0.5)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: 'var(--color-gold)', borderRadius: 1,
                      /* Cap "Unknown 100%" at 80% visual to avoid looking broken */
                      width: `${Math.min(sec.pct, 80)}%`,
                      animation: `slideRight 0.8s ease-out ${i * 80}ms backwards`,
                    }} />
                  </div>
                </div>
              ))}
              {sectors.length === 0 && (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--color-text-faint)', textAlign: 'center', padding: '16px 0' }}>
                  No sector data
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {editTarget !== null && (
        <EditHoldingModal
          holding={editTarget?.id ? editTarget : null}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          loading={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title={`Delete ${deleteTarget.ticker}?`}
          message={`This will permanently remove ${deleteTarget.ticker} from your portfolio. This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
