import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { useAnimatedNumber, flashClass } from '../lib/useAnimatedNumber.js';
import { PageLoadingState, PageErrorState } from '../components/PageStates.jsx';
import EditHoldingModal from '../components/EditHoldingModal.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import {
  ArrowsClockwise, Plus, ArrowUp, ArrowDown,
  PencilSimple, Trash, Warning, X, ChartLine
} from '@phosphor-icons/react';
import '../styles/portfolio.css';

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
  const { value, direction } = useAnimatedNumber(rawValue || 0, 800);
  
  let accentClass = 'neutral';
  if (label === 'Portfolio value') accentClass = 'gold';
  else if (label === 'Day change') accentClass = 'blue';
  else if (tone === 'positive') accentClass = 'gain';
  else if (tone === 'negative') accentClass = 'loss';

  let valueClass = '';
  if (tone === 'positive' && label !== 'Portfolio value') valueClass = 'gain';
  if (tone === 'negative' && label !== 'Portfolio value') valueClass = 'loss';
  
  const [flash, setFlash] = useState(false);
  const prevVal = useRef(rawValue);
  useEffect(() => {
    if (rawValue !== prevVal.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 400);
      prevVal.current = rawValue;
      return () => clearTimeout(t);
    }
  }, [rawValue]);

  return (
    <div className={`arca-kpi-card ${accentClass}`}>
      <div className="arca-kpi-accent" />
      {live && <div className="arca-kpi-live-badge">Live</div>}
      <div className="arca-kpi-label">{label}</div>
      <div className={`arca-kpi-value ${valueClass} ${flash ? 'flash' : ''}`}>
        {prefix}{compact(value)}
      </div>
      <div className="arca-kpi-sublabel">{sub}</div>
      
      {/* Optional sparkline logic could go here, omitting for now unless needed */}
    </div>
  );
}

// ---- Single holding row -----------------------------------------------
function HoldingRow({ holding, totalValue, onEdit, onDelete }) {
  const { value: livePrice } = useAnimatedNumber(holding.current_price || 0, 350);
  const { value: liveValue } = useAnimatedNumber(holding.current_value || 0, 400);
  const { value: livePnl   } = useAnimatedNumber(holding.unrealised_pnl != null ? holding.unrealised_pnl
    : (holding.current_value || 0) - (holding.invested_amount || 0), 400);

  const invested   = holding.invested_amount || 0;
  const pnlVal     = (holding.current_value || 0) - invested;
  const pnlPct     = invested > 0 ? (pnlVal / invested) * 100 : 0;
  const weight     = totalValue > 0 ? ((holding.current_value || 0) / totalValue) * 100 : 0;
  const dayChange  = holding.day_change || 0;
  const dayPct     = holding.day_change_pct || 0;
  
  const isPositive = pnlVal >= 0;
  const isDayUp    = dayChange > 0;
  const isDayDown  = dayChange < 0;

  const tintClass = isPositive ? 'tint-gain' : 'tint-loss';

  return (
    <div className={`arca-tr ${tintClass}`}>
      <div className="arca-tr-hover-bar" />
      
      {/* STOCK */}
      <div className="arca-col-stock">
        <div className="arca-cell-stock-name">{holding.company_name || holding.name || holding.ticker}</div>
        <div className="arca-cell-stock-meta">
          {holding.ticker} · {holding.exchange || 'NSE'} · {holding.asset_class || 'Equity'}
        </div>
      </div>
      
      {/* QTY */}
      <div className="arca-col-qty">
        <div className="arca-cell-qty">{holding.quantity}</div>
      </div>
      
      {/* AVG BUY */}
      <div className="arca-col-avgbuy">
        <div className="arca-cell-avgbuy">
          <span className="arca-cell-avgbuy-prefix">₹</span>{holding.avg_buy_price?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
      </div>
      
      {/* LTP */}
      <div className="arca-col-ltp">
        <div className="arca-cell-main-val">{fmt(livePrice)}</div>
        <div className={`arca-cell-sub-val ${isDayUp ? 'gain' : isDayDown ? 'loss' : 'neutral'}`}>
          {pct(dayPct)}
        </div>
      </div>
      
      {/* VALUE */}
      <div className="arca-col-value">
        <div className="arca-cell-main-val">{compact(liveValue)}</div>
        <div className="arca-cell-sub-text">{weight.toFixed(1)}% of portfolio</div>
      </div>
      
      {/* P&L */}
      <div className="arca-col-pnl">
        <div className={`arca-cell-pnl-main ${isPositive ? 'gain' : 'loss'}`}>
          {isPositive ? <ArrowUp size={10} weight="bold" /> : <ArrowDown size={10} weight="bold" />}
          {compact(Math.abs(livePnl))}
        </div>
        <div className={`arca-cell-sub-val ${isPositive ? 'gain' : 'loss'}`}>
          {pct(pnlPct)}
        </div>
      </div>
      
      {/* ACTIONS */}
      <div className="arca-col-actions">
        <div className="arca-actions-container">
          <button className="arca-action-btn edit" onClick={() => onEdit(holding)}>
            <PencilSimple size={15} />
          </button>
          <button className="arca-action-btn delete" onClick={() => onDelete(holding)}>
            <Trash size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main page --------------------------------------------------------
export default function Portfolio() {
  const { portfolio, loading, error, refresh, updateHolding, deleteHolding } = usePortfolio();
  const { holdings: liveHoldings, wsStatus, isLive, forceRefresh } = useMarketData();

  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [sortKey, setSortKey]           = useState('current_value');
  const [sortDir, setSortDir]           = useState('desc');
  const [filterClass, setFilterClass]   = useState('All');
  const [refreshSpin, setRefreshSpin]   = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const liveHoldingsHaveValue = liveHoldings.some((h) => Number(h?.current_value || h?.current_value_inr || 0) > 0 || Number(h?.ltp || 0) > 0);
  const rawHoldings = liveHoldingsHaveValue ? liveHoldings : (portfolio?.holdings || []);

  const assetClasses = useMemo(() => {
    const s = new Set(rawHoldings.map((h) => h.asset_class || 'Equity'));
    const arr = ['All', ...Array.from(s)];
    if (!arr.includes('ETF')) arr.push('ETF');
    return arr;
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

  // Concentration Check
  const highlyConcentratedHolding = useMemo(() => {
    if (totalValue <= 0) return null;
    return holdings.find(h => ((h.current_value || 0) / totalValue) > 0.25);
  }, [holdings, totalValue]);

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

  const handleRefresh = () => {
    setRefreshSpin(true);
    refresh(); 
    forceRefresh();
    setTimeout(() => setRefreshSpin(false), 600);
  };

  if (loading && !liveHoldings.length) {
    return <PageLoadingState title="Loading portfolio\u2026" subtitle="Resolving holdings and live prices." />;
  }
  if (error && !liveHoldings.length) {
    return <PageErrorState title="Portfolio unavailable" message={error} />;
  }

  const kpis = [
    { label: 'Portfolio value',  rawValue: summary.totalCurrent,  sub: 'Live valuation',        tone: 'neutral',  live: isLive },
    { label: 'Total invested',   rawValue: summary.totalInvested, sub: 'Cost basis',            tone: 'neutral',  live: false  },
    { label: 'Unrealised P&L',   rawValue: summary.totalPnl,      sub: pct(summary.totalPnlPct),tone: (summary.totalPnl  || 0) >= 0 ? 'positive' : 'negative', live: isLive },
    { label: 'Day change',       rawValue: summary.totalDayChange,sub: pct(summary.totalDayChangePct),tone: (summary.totalDayChange || 0) >= 0 ? 'positive' : 'negative', live: isLive },
  ];

  return (
    <div>
      {/* Header Zone */}
      <div className="arca-page-header">
        <div>
          <div className="arca-header-super">Holdings register</div>
          <h2 className="arca-header-title">LIVE PORTFOLIO</h2>
        </div>
        <div className="arca-header-actions">
          <div className="arca-market-status">
            <div className={`arca-market-dot ${wsStatus === 'connected' ? 'open' : 'closed'}`} />
            {wsStatus === 'connected' ? 'Market Open' : 'Market Closed'}
          </div>
          <button className={`arca-btn-refresh ${refreshSpin ? 'spinning' : ''}`} onClick={handleRefresh}>
            <ArrowsClockwise className="icon" size={14} weight="bold" /> REFRESH
          </button>
          <button className="arca-btn-primary" onClick={() => setEditTarget({})}>
            <Plus size={14} weight="bold" /> ADD HOLDING
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="arca-kpi-grid">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Filter Tabs */}
      <div className="arca-filter-tabs">
        {assetClasses.map((ac) => (
          <button
            key={ac}
            className={`arca-tab ${filterClass === ac ? 'active' : ''}`}
            onClick={() => setFilterClass(ac)}
          >
            {ac}
          </button>
        ))}
      </div>

      {/* Concentration Warning Banner */}
      {highlyConcentratedHolding && !dismissedBanner && (
        <div className="arca-concentration-banner">
          <div className="arca-banner-content">
            <Warning size={14} weight="bold" color="var(--status-warning)" />
            <span>
              <strong>{highlyConcentratedHolding.company_name || highlyConcentratedHolding.ticker}</strong> represents <strong>{((highlyConcentratedHolding.current_value / totalValue) * 100).toFixed(1)}%</strong> of your portfolio — above the 25% threshold
            </span>
          </div>
          <button className="arca-banner-close" onClick={() => setDismissedBanner(true)}>
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Holdings Table */}
      {holdings.length === 0 ? (
        <div className="arca-empty-state">
          <ChartLine size={40} color="var(--border-default)" />
          <div className="arca-empty-title">No Holdings Yet</div>
          <div className="arca-empty-subtitle">Add your first holding to begin tracking your portfolio.</div>
          <button className="arca-btn-primary" onClick={() => setEditTarget({})}>
            <Plus size={14} weight="bold" /> ADD HOLDING
          </button>
        </div>
      ) : (
        <div className="arca-table-wrapper">
          {/* Header */}
          <div className="arca-table-header">
            <div className="arca-th arca-col-stock">Stock</div>
            <div className="arca-th arca-col-qty">Qty</div>
            <div className="arca-th arca-col-avgbuy">Avg Buy</div>
            <div className="arca-th arca-col-ltp">LTP</div>
            <div className="arca-th arca-col-value" onClick={() => toggleSort('current_value')}>
              Value {sortKey === 'current_value' && <ArrowDown size={10} weight="bold" className={`arca-sort-icon ${sortDir === 'asc' ? 'asc' : ''}`} />}
            </div>
            <div className="arca-th arca-col-pnl">P&L</div>
            <div className="arca-th arca-col-actions">Actions</div>
          </div>
          
          {/* Body */}
          <div className="arca-table-body">
            {holdings.map((h, idx) => (
              <HoldingRow
                key={`${h.id || h.ticker || 'holding'}-${idx}`}
                holding={h}
                totalValue={totalValue}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
          
          {/* Footer Row */}
          <div className="arca-table-footer">
            <div className="arca-footer-segment">
              <span className="arca-footer-label">{holdings.length} holdings</span>
            </div>
            <div className="arca-footer-separator" />
            <div className="arca-footer-segment">
              <span className="arca-footer-label">Invested:</span>
              <span className="arca-footer-value">{compact(summary.totalInvested)}</span>
            </div>
            <div className="arca-footer-separator" />
            <div className="arca-footer-segment">
              <span className="arca-footer-label">Current:</span>
              <span className="arca-footer-value">{compact(summary.totalCurrent)}</span>
            </div>
            <div className="arca-footer-separator" />
            <div className="arca-footer-segment">
              <span className="arca-footer-label">P&L:</span>
              <span className={`arca-footer-value ${(summary.totalPnl || 0) >= 0 ? 'gain' : 'loss'}`}>
                {compact(summary.totalPnl)} ({pct(summary.totalPnlPct)})
              </span>
            </div>
          </div>
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
