import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { theme, panelStyle } from '../lib/theme.js';
import { useAnimatedNumber, flashClass } from '../lib/useAnimatedNumber.js';
import { PageLoadingState, PageErrorState, EmptyState } from '../components/PageStates.jsx';
import LiveIndicator from '../components/LiveIndicator.jsx';
import EditHoldingModal from '../components/EditHoldingModal.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import {
  RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Pencil, Trash2, PlusCircle, WifiOff,
} from 'lucide-react';

// ---- formatters -------------------------------------------------------
function fmt(n) {
  if (n == null || isNaN(n)) return '\u2014';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
function pct(n) {
  if (n == null || isNaN(n)) return '\u2014';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}
function compact(n) {
  if (n == null || isNaN(n)) return '\u2014';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${n < 0 ? '-' : ''}\u20B9${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${n < 0 ? '-' : ''}\u20B9${(abs / 1e5).toFixed(2)}L`;
  return fmt(n);
}

// ---- Animated KPI card ------------------------------------------------
function KpiCard({ label, rawValue, sub, tone = 'neutral', live = false, prefix = '' }) {
  const { value, direction } = useAnimatedNumber(rawValue || 0, 500);
  const color = tone === 'positive' ? 'var(--aegean-green)'
              : tone === 'negative' ? 'var(--terracotta)'
              : 'var(--text-primary)';
  return (
    <div style={{ ...panelStyle({ padding: 18, minHeight: 110 }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
          {label}
        </div>
        {live && (
          <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--aegean-green)', border: '1px solid var(--aegean-green)',
            borderRadius: 999, padding: '1px 6px' }}>LIVE</span>
        )}
      </div>
      <div
        className={flashClass(direction)}
        style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontVariantNumeric: 'tabular-nums',
          lineHeight: 1, color, marginBottom: 6 }}
      >
        {prefix}{compact(value)}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sub}</div>
    </div>
  );
}

// ---- Single holding row -----------------------------------------------
function HoldingRow({ holding, totalValue, onEdit, onDelete }) {
  const prevPriceRef = useRef(holding.current_price);
  const [flash, setFlash] = useState('');
  const { value: livePrice } = useAnimatedNumber(holding.current_price || 0, 350);
  const { value: liveValue } = useAnimatedNumber(holding.current_value || 0, 400);
  const { value: livePnl   } = useAnimatedNumber(holding.unrealised_pnl != null ? holding.unrealised_pnl
    : (holding.current_value || 0) - (holding.invested_amount || 0), 400);

  useEffect(() => {
    if (holding.current_price !== prevPriceRef.current) {
      const dir = holding.current_price > prevPriceRef.current ? 'up' : 'down';
      setFlash(dir);
      prevPriceRef.current = holding.current_price;
      const t = setTimeout(() => setFlash(''), 1400);
      return () => clearTimeout(t);
    }
  }, [holding.current_price]);

  const invested   = holding.invested_amount || 0;
  const pnlVal     = (holding.current_value || 0) - invested;
  const pnlPct     = invested > 0 ? (pnlVal / invested) * 100 : 0;
  const weight     = totalValue > 0 ? ((holding.current_value || 0) / totalValue) * 100 : 0;
  const dayChange  = holding.day_change || 0;
  const dayPct     = holding.day_change_pct || 0;
  const isPositive = pnlVal >= 0;
  const isDayUp    = dayChange >= 0;

  const cell = { padding: '14px 12px', fontSize: 13, verticalAlign: 'middle', borderBottom: `1px solid var(--border)` };

  return (
    <tr style={{ transition: 'background 0.15s' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,160,23,0.05)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      {/* Ticker + Company name */}
      <td style={{ ...cell, fontWeight: 600, paddingLeft: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>{holding.company_name || holding.name || holding.ticker}</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 400 }}>
            {holding.ticker} · {holding.exchange || 'NSE'} · {holding.asset_class || 'Equity'}
          </span>
        </div>
      </td>
      {/* Qty */}
      <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
        {holding.quantity}
      </td>
      {/* Avg buy */}
      <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
        {fmt(holding.avg_buy_price)}
      </td>
      {/* LTP */}
      <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        <span className={flash === 'up' ? 'price-flash-up' : flash === 'down' ? 'price-flash-down' : ''}>
          {fmt(livePrice)}
        </span>
        <div style={{
          fontSize: 11, marginTop: 2,
          color: Math.abs(dayPct) > 0.01
            ? (isDayUp ? 'var(--aegean-green)' : 'var(--terracotta)')
            : 'var(--text-faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
          {Math.abs(dayPct) > 0.01 ? (isDayUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />) : null}
          {pct(dayPct)}
        </div>
      </td>
      {/* Current value */}
      <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
        {compact(liveValue)}
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
          {weight.toFixed(1)}% of portfolio
        </div>
      </td>
      {/* P&L */}
      <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ color: isPositive ? 'var(--aegean-green)' : 'var(--terracotta)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontWeight: 600 }}>
          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {compact(livePnl)}
        </div>
        <div style={{ fontSize: 11, color: isPositive ? 'var(--aegean-green)' : 'var(--terracotta)',
          textAlign: 'right', marginTop: 2 }}>
          {pct(pnlPct)}
        </div>
      </td>
      {/* Actions */}
      <td style={{ ...cell, textAlign: 'right', paddingRight: 16 }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            onClick={() => onEdit(holding)}
            style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid var(--border)`,
              background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s' }}
            title="Edit holding" aria-label="Edit holding"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-faint)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          ><Pencil size={13} /></button>
          <button
            onClick={() => onDelete(holding)}
            style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid var(--border)`,
              background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s' }}
            title="Delete holding" aria-label="Delete holding"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--terracotta)'; e.currentTarget.style.borderColor = 'var(--terracotta)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          ><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

// ---- Main page --------------------------------------------------------
export default function Portfolio() {
  const { portfolio, transactions, loading, error, refresh, updateHolding, deleteHolding } = usePortfolio();
  const { holdings: liveHoldings, wsStatus, updatedAt, isLive, forceRefresh } = useMarketData();

  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [sortKey, setSortKey]           = useState('current_value');
  const [sortDir, setSortDir]           = useState('desc');
  const [filterClass, setFilterClass]   = useState('All');

  const liveHoldingsHaveValue = liveHoldings.some((h) => Number(h?.current_value || h?.current_value_inr || 0) > 0 || Number(h?.ltp || 0) > 0);

  // Prefer meaningful live holdings from WS; fall back to static
  const rawHoldings = liveHoldingsHaveValue ? liveHoldings : (portfolio?.holdings || []);

  const assetClasses = useMemo(() => {
    const s = new Set(rawHoldings.map((h) => h.asset_class || 'Equity'));
    return ['All', ...Array.from(s)];
  }, [rawHoldings]);

  const holdings = useMemo(() => {
    let h = filterClass === 'All' ? rawHoldings : rawHoldings.filter((x) => (x.asset_class || 'Equity') === filterClass);
    return [...h].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [rawHoldings, filterClass, sortKey, sortDir]);

  const summary = portfolio?.summary || {};
  const totalValue = summary.totalCurrent || 0;

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const handleSave = useCallback(async (data) => {
    setSaving(true);
    try {
      await updateHolding({ id: editTarget?.id, ...data });
      setEditTarget(null);
      refresh();
      forceRefresh();
    } catch (e) {
      console.error('Save holding failed', e);
    } finally {
      setSaving(false);
    }
  }, [editTarget, updateHolding, refresh, forceRefresh]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteHolding(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
      forceRefresh();
    } catch (e) {
      console.error('Delete holding failed', e);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, deleteHolding, refresh, forceRefresh]);

  const handleRefresh = () => { refresh(); forceRefresh(); };

  const thStyle = (key) => ({
    padding: '10px 12px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: sortKey === key ? 'var(--text-primary)' : 'var(--text-faint)',
    textAlign: key === 'ticker' ? 'left' : 'right',
    paddingLeft: key === 'ticker' ? 20 : 12,
    cursor: 'pointer', userSelect: 'none',
    borderBottom: `1px solid var(--border)`,
    whiteSpace: 'nowrap',
  });

  if (loading && !liveHoldings.length) {
    return <PageLoadingState title="Loading portfolio\u2026" subtitle="Resolving holdings and live prices." />;
  }
  if (error && !liveHoldings.length) {
    return <PageErrorState title="Portfolio unavailable" message={error} />;
  }

  const kpis = [
    { label: 'Portfolio value',  rawValue: summary.totalCurrent,  sub: 'Live valuation',        tone: 'neutral',  live: isLive },
    { label: 'Total invested',   rawValue: summary.totalInvested,  sub: 'Cost basis',            tone: 'neutral',  live: false  },
    { label: 'Unrealised P&L',  rawValue: summary.totalPnl,       sub: pct(summary.totalPnlPct),   tone: (summary.totalPnl  || 0) >= 0 ? 'positive' : 'negative', live: isLive },
    { label: 'Day change',       rawValue: summary.totalDayChange,      sub: pct(summary.totalDayChangePct),  tone: (summary.totalDayChange || 0) >= 0 ? 'positive' : 'negative', live: isLive },
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={{ ...panelStyle({ padding: '22px 26px' }), display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>
            Holdings register
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem,2.5vw,2.4rem)', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
            Live portfolio
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {wsStatus === 'disconnected' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--terracotta)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--terracotta)' }}>
              <WifiOff size={13} /> No live feed
            </div>
          )}
          <LiveIndicator wsStatus={wsStatus} updatedAt={updatedAt} />
          <button
            onClick={() => setEditTarget({})}
            style={{ background: 'var(--greek-gold)', color: '#1a1206', border: '1px solid rgba(212,160,23,0.5)', borderRadius: 12,
              padding: '10px 16px', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}
          ><PlusCircle size={15} /> Add holding</button>
          <button
            onClick={handleRefresh}
            style={{ border: `1px solid var(--border)`, borderRadius: 12, padding: '10px 14px',
              background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}
          ><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {assetClasses.map((ac) => (
          <button
            key={ac}
            onClick={() => setFilterClass(ac)}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${filterClass === ac ? 'var(--greek-gold)' : 'var(--border)'}`,
              background: filterClass === ac ? 'rgba(212,160,23,0.12)' : 'transparent',
              color: filterClass === ac ? 'var(--greek-gold)' : 'var(--text-faint)',
              transition: 'all 0.15s',
            }}
          >{ac}</button>
        ))}
      </div>

      {/* Holdings table */}
      <div style={{ ...panelStyle({ padding: 0, overflow: 'hidden' }) }}>
        {holdings.length === 0 ? (
          <EmptyState
            title="No holdings yet"
            message="Add your first holding or import a portfolio to get started."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: 'rgba(212,160,23,0.02)' }}>
                  {[['ticker','Stock'],['quantity','Qty'],['avg_buy_price','Avg buy'],
                    ['current_price','LTP'],['current_value','Value'],
                    ['unrealised_pnl','P&L']].map(([key, label]) => (
                    <th key={key} style={thStyle(key)} onClick={() => toggleSort(key)}>
                      {label} {sortKey === key ? (sortDir === 'asc' ? '\u2191' : '\u2193') : ''}
                    </th>
                  ))}
                  <th style={{ ...thStyle('actions'), cursor: 'default' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, idx) => (
                  <HoldingRow
                    key={`${h.id || h.ticker || 'holding'}-${idx}`}
                    holding={h}
                    totalValue={totalValue}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary footer */}
      {holdings.length > 0 && (
        <div style={{ ...panelStyle({ padding: '14px 22px' }), display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
            {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
            Invested: <strong>{compact(summary.totalInvested)}</strong>
          </span>
          <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
            Current: <strong>{compact(summary.totalCurrent)}</strong>
          </span>
          <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums',
            color: (summary.totalPnl || 0) >= 0 ? 'var(--aegean-green)' : 'var(--terracotta)' }}>
            P&L: <strong>{compact(summary.totalPnl)} ({pct(summary.totalPnlPct)})</strong>
          </span>
        </div>
      )}

      {/* Modals */}
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
