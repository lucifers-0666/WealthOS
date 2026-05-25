import React, { useState } from 'react';
import { Plus, Trash2, Eye, Loader2 } from 'lucide-react';
import { panelStyle, fieldStyle, theme } from '../lib/theme.js';
import { usePortfolio } from '../lib/usePortfolio.js';
import { EmptyState, PageLoadingState } from '../components/PageStates.jsx';
import api from '../lib/api.js';

function fmt(n, d = 2) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
}

const inputStyle = (extra = {}) =>
  fieldStyle({ fontSize: 13, minHeight: 38, padding: '8px 12px', ...extra });

export default function Watchlist() {
  const { watchlist, addWatch, removeWatch, loading } = usePortfolio();
  const [ticker, setTicker] = useState('');
  const [company, setCompany] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setAdding(true);
    setError('');
    try {
      await addWatch({
        ticker: t,
        company_name: company.trim() || undefined,
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
      });
      setTicker('');
      setCompany('');
      setTargetPrice('');
    } catch (err) {
      setError(err?.message || 'Failed to add to watchlist.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(t) {
    setRemoving(t);
    try {
      await removeWatch(t);
    } finally {
      setRemoving(null);
    }
  }

  if (loading) return <PageLoadingState title="Loading watchlist…" subtitle="Fetching tracked symbols." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* ── Add form ── */}
      <div style={{ ...panelStyle({ padding: '18px 16px' }) }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Add to Watchlist</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Ticker *</label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="RELIANCE"
              required
              style={inputStyle({ width: 130 })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Reliance Industries"
              style={inputStyle({ width: 200 })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Target ₹</label>
            <input
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="3200"
              type="number"
              step="0.01"
              style={inputStyle({ width: 120 })}
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
              borderRadius: 12, border: `1px solid rgba(200,179,142,0.32)`,
              background: 'rgba(200,179,142,0.1)', color: theme.colors.gold,
              fontWeight: 700, fontSize: 13, cursor: adding ? 'not-allowed' : 'pointer',
              opacity: adding ? 0.6 : 1,
            }}
          >
            {adding ? <Loader2 size={14} className="animate-spin-slow" /> : <Plus size={14} />}
            Add
          </button>
        </form>
        {error && <div style={{ color: theme.colors.error, fontSize: 12, marginTop: 10 }}>{error}</div>}
      </div>

      {/* ── List ── */}
      {!watchlist.length ? (
        <EmptyState
          title="Watchlist is empty"
          message="Add tickers above to track them here. You'll see live prices alongside your targets."
        />
      ) : (
        <div style={{ ...panelStyle({ padding: '16px' }) }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Tracked Symbols — {watchlist.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {watchlist.map((item) => (
              <div
                key={item.ticker}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 10px', borderRadius: 12,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  transition: 'background 180ms ease',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(134,159,196,0.1)', border: `1px solid rgba(134,159,196,0.22)`, flexShrink: 0 }}>
                  <Eye size={15} color={theme.colors.accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: theme.colors.text, fontWeight: 700, fontSize: 14 }}>{item.ticker}</div>
                  {item.company_name && <div style={{ color: theme.colors.textMuted, fontSize: 12 }}>{item.company_name}</div>}
                </div>
                {item.ltp != null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: theme.colors.text, fontWeight: 700, fontSize: 13 }}>₹{fmt(item.ltp)}</div>
                    {item.day_change_pct != null && (
                      <div style={{ color: item.day_change_pct >= 0 ? theme.colors.success : theme.colors.error, fontSize: 11 }}>
                        {item.day_change_pct >= 0 ? '+' : ''}{fmt(item.day_change_pct, 2)}%
                      </div>
                    )}
                  </div>
                )}
                {item.target_price != null && (
                  <div style={{ textAlign: 'right', minWidth: 72 }}>
                    <div style={{ color: theme.colors.textMuted, fontSize: 11 }}>Target</div>
                    <div style={{ color: theme.colors.gold, fontWeight: 700, fontSize: 13 }}>₹{fmt(item.target_price)}</div>
                  </div>
                )}
                <button
                  onClick={() => handleRemove(item.ticker)}
                  disabled={removing === item.ticker}
                  aria-label={`Remove ${item.ticker} from watchlist`}
                  style={{ padding: 8, borderRadius: 10, border: 0, background: 'transparent', color: theme.colors.textMuted, cursor: 'pointer', opacity: removing === item.ticker ? 0.4 : 1 }}
                >
                  {removing === item.ticker ? <Loader2 size={14} className="animate-spin-slow" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
