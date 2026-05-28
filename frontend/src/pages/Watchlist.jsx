import React, { useState, useMemo, useCallback } from 'react';
import { useMarketData } from '../lib/MarketDataContext.jsx';
import { usePortfolio } from '../lib/usePortfolio.js';
import { theme, panelStyle } from '../lib/theme.js';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';
import { PageLoadingState, EmptyState } from '../components/PageStates.jsx';
import LiveIndicator from '../components/LiveIndicator.jsx';
import WatchlistSparkline from '../components/WatchlistSparkline.jsx';
import PriceAlertModal from '../components/PriceAlertModal.jsx';
import {
  Search, Bell, BellOff, Trash2, PlusCircle, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, RefreshCw,
} from 'lucide-react';

function fmt(n) {
  if (n == null || isNaN(n)) return '\u2014';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}
function pct(n) {
  if (n == null || isNaN(n)) return '\u2014';
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
}
function fmtCap(n) {
  if (!n) return '\u2014';
  if (n >= 1e12) return `\u20B9${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e7)  return `\u20B9${(n / 1e7).toFixed(2)}Cr`;
  return `\u20B9${(n / 1e5).toFixed(2)}L`;
}

function LivePrice({ value }) {
  const { value: animated } = useAnimatedNumber(value || 0, 350);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(animated)}</span>;
}

function WatchCard({ item, alerts, onAlert, onRemove }) {
  const isUp  = (item.change_pct || item.day_change_pct || 0) >= 0;
  const chPct = item.change_pct || item.day_change_pct || 0;
  const chAbs = item.change_abs || item.day_change     || 0;
  const spark = item.price_history || item.sparkline   || [];
  const hasAlert = alerts.some((a) => a.ticker === item.ticker);

  return (
    <div style={{
      ...panelStyle({ padding: 18 }),
      display: 'grid', gridTemplateRows: 'auto 1fr auto',
      gap: 12, transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>{item.ticker}</div>
          <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 3 }}>
            {item.exchange || 'NSE'}
            {item.sector ? ` \u00b7 ${item.sector}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onAlert(item)}
            title={hasAlert ? 'Alert set' : 'Set price alert'}
            style={{ padding: '5px 7px', borderRadius: 8,
              border: `1px solid ${hasAlert ? 'var(--color-primary,#4f98a3)' : theme.colors.border}`,
              background: hasAlert ? 'rgba(79,152,163,0.12)' : 'transparent',
              color: hasAlert ? 'var(--color-primary,#4f98a3)' : theme.colors.textMuted,
              cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {hasAlert ? <Bell size={13} /> : <BellOff size={13} />}
          </button>
          <button
            onClick={() => onRemove(item.ticker || item.id)}
            title="Remove from watchlist"
            style={{ padding: '5px 7px', borderRadius: 8, border: `1px solid ${theme.colors.border}`,
              background: 'transparent', color: theme.colors.textMuted,
              cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error,#f87171)'; e.currentTarget.style.borderColor = 'var(--color-error,#f87171)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; e.currentTarget.style.borderColor = theme.colors.border; }}
          ><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Price + sparkline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk,Inter,sans-serif', fontSize: 24, fontWeight: 700,
            letterSpacing: '-0.03em', lineHeight: 1 }}>
            <LivePrice value={item.current_price} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5,
            color: isUp ? 'var(--color-success,#4ade80)' : 'var(--color-error,#f87171)', fontSize: 13, fontWeight: 600 }}>
            {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {pct(chPct)} <span style={{ fontWeight: 400, opacity: 0.8 }}>({fmt(chAbs)})</span>
          </div>
        </div>
        <WatchlistSparkline data={spark} width={80} height={32} positive={isUp} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, paddingTop: 12,
        borderTop: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: 11 }}>
          <div style={{ color: theme.colors.textMuted, marginBottom: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>52W H</div>
          <div style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-success,#4ade80)', fontWeight: 600 }}>
            {item.high_52w ? fmt(item.high_52w) : '\u2014'}
          </div>
        </div>
        <div style={{ fontSize: 11 }}>
          <div style={{ color: theme.colors.textMuted, marginBottom: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>52W L</div>
          <div style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-error,#f87171)', fontWeight: 600 }}>
            {item.low_52w ? fmt(item.low_52w) : '\u2014'}
          </div>
        </div>
        <div style={{ fontSize: 11 }}>
          <div style={{ color: theme.colors.textMuted, marginBottom: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mkt Cap</div>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtCap(item.market_cap)}</div>
        </div>
      </div>

      {/* Target price bar */}
      {item.target_price && item.current_price && (
        <div style={{ paddingTop: 10, borderTop: `1px solid ${theme.colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11,
            color: theme.colors.textMuted, marginBottom: 5 }}>
            <span>Target</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.text }}>{fmt(item.target_price)}</span>
          </div>
          <div style={{ height: 3, borderRadius: 999, background: theme.colors.border, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: item.current_price >= item.target_price
                ? 'var(--color-success,#4ade80)' : 'var(--color-primary,#4f98a3)',
              width: `${Math.min(100, (item.current_price / item.target_price) * 100).toFixed(1)}%`,
              transition: 'width 0.4s',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Watchlist() {
  const { watchlist: liveWatchlist, wsStatus, updatedAt, isLive, forceRefresh } = useMarketData();
  const { portfolio, loading, refresh, addToWatchlist, removeFromWatchlist } = usePortfolio();

  const [search, setSearch]         = useState('');
  const [alertTarget, setAlertTarget] = useState(null);
  const [alerts, setAlerts]         = useState([]);
  const [alertToast, setAlertToast] = useState(null);
  const [addTicker, setAddTicker]   = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Merge live WS watchlist with static portfolio watchlist
  const rawWatchlist = useMemo(() => {
    const liveWatchlistHaveValue = liveWatchlist.some((item) => Number(item?.current_price || item?.ltp || 0) > 0);
    if (liveWatchlistHaveValue) return liveWatchlist;
    return portfolio?.watchlist || [];
  }, [liveWatchlist, portfolio?.watchlist]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rawWatchlist;
    const q = search.toLowerCase();
    return rawWatchlist.filter((item) =>
      (item.ticker || '').toLowerCase().includes(q) ||
      (item.sector || '').toLowerCase().includes(q)
    );
  }, [rawWatchlist, search]);

  const gainers = useMemo(() =>
    [...rawWatchlist].sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0)).slice(0, 3),
    [rawWatchlist]
  );
  const losers = useMemo(() =>
    [...rawWatchlist].sort((a, b) => (a.change_pct || 0) - (b.change_pct || 0)).slice(0, 3),
    [rawWatchlist]
  );

  const handleSetAlert = useCallback((data) => {
    setAlerts((prev) => {
      const filtered = prev.filter((a) => a.ticker !== data.ticker);
      return [...filtered, { ...data, created_at: Date.now() }];
    });
    setAlertToast(`Alert set: ${data.ticker} ${data.direction} \u20B9${data.target_price}`);
    setTimeout(() => setAlertToast(null), 3500);
    setAlertTarget(null);
  }, []);

  const handleRemove = useCallback(async (tickerOrId) => {
    try { await removeFromWatchlist(tickerOrId); refresh(); forceRefresh(); }
    catch (e) { console.error('Remove watchlist failed', e); }
  }, [removeFromWatchlist, refresh, forceRefresh]);

  const handleAdd = useCallback(async () => {
    if (!addTicker.trim()) return;
    setAddLoading(true);
    try {
      await addToWatchlist(addTicker.trim().toUpperCase());
      setAddTicker('');
      refresh();
      forceRefresh();
    } catch (e) {
      console.error('Add watchlist failed', e);
    } finally {
      setAddLoading(false);
    }
  }, [addTicker, addToWatchlist, refresh, forceRefresh]);

  if (loading && !liveWatchlist.length) {
    return <PageLoadingState title="Loading watchlist\u2026" subtitle="Resolving symbols and live prices." />;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={{ ...panelStyle({ padding: '22px 26px' }), display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 6 }}>Market attention set</div>
          <h2 style={{ margin: 0, fontFamily: 'Space Grotesk,Inter,sans-serif', fontSize: 'clamp(1.6rem,2.5vw,2.4rem)', letterSpacing: '-0.04em', lineHeight: 1.05 }}>Watchlist</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LiveIndicator wsStatus={wsStatus} updatedAt={updatedAt} />
          <button onClick={() => { refresh(); forceRefresh(); }}
            style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '10px 14px',
              background: 'transparent', color: theme.colors.text, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}
          ><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      {/* Top movers */}
      {rawWatchlist.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ ...panelStyle({ padding: 18 }) }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 12 }}>Top gainers</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {gainers.map((g) => (
                <div key={g.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <span style={{ fontWeight: 700 }}>{g.ticker}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.textSoft, fontSize: 13 }}>{fmt(g.current_price)}</span>
                    <span style={{ color: 'var(--color-success,#4ade80)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TrendingUp size={12} />{pct(g.change_pct || g.day_change_pct || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...panelStyle({ padding: 18 }) }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 12 }}>Top losers</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {losers.map((l) => (
                <div key={l.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                  <span style={{ fontWeight: 700 }}>{l.ticker}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: theme.colors.textSoft, fontSize: 13 }}>{fmt(l.current_price)}</span>
                    <span style={{ color: 'var(--color-error,#f87171)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TrendingDown size={12} />{pct(l.change_pct || l.day_change_pct || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search + add */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.colors.textMuted, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticker or sector\u2026"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${theme.colors.border}`, borderRadius: 12,
              padding: '11px 14px 11px 36px', color: theme.colors.text,
              fontSize: 14, outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary,#4f98a3)'}
            onBlur={(e) => e.target.style.borderColor = theme.colors.border}
          />
        </div>
        <input
          value={addTicker}
          onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add ticker (e.g. INFY)"
          style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.colors.border}`,
            borderRadius: 12, padding: '11px 14px', color: theme.colors.text,
            fontSize: 14, outline: 'none', width: 180,
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-primary,#4f98a3)'}
          onBlur={(e) => e.target.style.borderColor = theme.colors.border}
        />
        <button
          onClick={handleAdd} disabled={addLoading || !addTicker.trim()}
          style={{
            background: 'var(--color-primary,#01696f)', color: '#fff', border: 'none', borderRadius: 12,
            padding: '11px 18px', fontWeight: 700, cursor: addLoading ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8, opacity: addLoading ? 0.7 : 1,
            fontSize: 14, whiteSpace: 'nowrap',
          }}
        ><PlusCircle size={15} />{addLoading ? 'Adding\u2026' : 'Add'}</button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No results' : 'Watchlist is empty'}
          message={search ? `No symbols match \u201c${search}\u201d.` : 'Add tickers above to start monitoring live prices.'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {filtered.map((item) => (
            <WatchCard
              key={item.id || item.ticker}
              item={item}
              alerts={alerts}
              onAlert={setAlertTarget}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Alert modal */}
      {alertTarget && (
        <PriceAlertModal
          ticker={alertTarget.ticker}
          currentPrice={alertTarget.current_price}
          onSave={handleSetAlert}
          onClose={() => setAlertTarget(null)}
        />
      )}

      {/* Active alerts display */}
      {alerts.length > 0 && (
        <div style={{ ...panelStyle({ padding: 18 }) }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.textMuted, marginBottom: 12 }}>Active alerts</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                border: `1px solid var(--color-primary,#4f98a3)`,
                color: 'var(--color-primary,#4f98a3)',
                background: 'rgba(79,152,163,0.08)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Bell size={11} />
                {a.ticker} {a.direction} \u20B9{a.target_price.toLocaleString('en-IN')}
                <button
                  onClick={() => setAlerts((prev) => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                  aria-label="Remove alert"
                >\u00d7</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {alertToast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 2000,
          background: 'var(--color-primary,#01696f)', color: '#fff',
          padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'modal-in 0.2s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Bell size={15} /> {alertToast}
        </div>
      )}
    </div>
  );
}
