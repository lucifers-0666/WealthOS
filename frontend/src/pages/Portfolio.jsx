import React, { useMemo, useState, useEffect } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';
import { Plus, Trash2, RefreshCw, AlertTriangle, X, Undo2 } from 'lucide-react';
import { PageLoadingState, PageErrorState, EmptyState } from '../components/PageStates.jsx';

const EXCHANGES = ['NSE', 'BSE', 'NYSE', 'NASDAQ', 'LSE'];
const ASSET_CLASSES = ['equity', 'etf', 'gold', 'debt', 'crypto', 'reit'];

const labelStyle = {
  display: 'block',
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: theme.colors.textMuted,
  marginBottom: 8,
};

const flashStyle = (flash) => {
  if (flash === 'up') {
    return { animation: 'price-flash-up 1.2s ease' };
  }
  if (flash === 'down') {
    return { animation: 'price-flash-down 1.2s ease' };
  }
  return {};
};

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function Portfolio() {
  const { holdings, loading, error, addHolding, removeHolding, refresh } = usePortfolio();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ticker: '', company_name: '', quantity: '', avg_buy_price: '', exchange: 'NSE', asset_class: 'equity' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [undoHolding, setUndoHolding] = useState(null);

  const stats = useMemo(() => {
    const invested = holdings.reduce((sum, h) => sum + (h.invested_value || 0), 0);
    const value = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    return { invested, value, pnl: value - invested };
  }, [holdings]);

  useEffect(() => {
    if (!undoHolding) return undefined;
    const timer = window.setTimeout(() => setUndoHolding(null), 6000);
    return () => window.clearTimeout(timer);
  }, [undoHolding]);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await addHolding({ ...form, quantity: Number(form.quantity), avg_buy_price: Number(form.avg_buy_price) });
      setForm({ ticker: '', company_name: '', quantity: '', avg_buy_price: '', exchange: 'NSE', asset_class: 'equity' });
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const snapshot = pendingDelete;
    setPendingDelete(null);
    await removeHolding(snapshot.id);
    setUndoHolding(snapshot);
  }

  async function handleUndo() {
    if (!undoHolding) return;
    const snapshot = undoHolding;
    setUndoHolding(null);
    await addHolding({
      ticker: snapshot.ticker,
      company_name: snapshot.company_name,
      quantity: snapshot.quantity,
      avg_buy_price: snapshot.avg_buy_price,
      exchange: snapshot.exchange,
      asset_class: snapshot.asset_class,
      currency: snapshot.currency,
      sector: snapshot.sector,
    });
  }

  if (loading) {
    return <PageLoadingState title="Loading portfolio matrix…" subtitle="Resolving live holdings, allocations, and activity." />;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ ...panelStyle({ padding: 24 }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <div className="section-label">Portfolio registry</div>
            <h2 className="editorial-title" style={{ margin: '8px 0 0', fontSize: 'clamp(2rem, 3vw, 3rem)' }}>Holdings with institutional clarity.</h2>
            <p style={{ margin: '10px 0 0', color: theme.colors.textSoft, maxWidth: 680 }}>Maintain positions manually, review live valuations, and keep your allocation table clean.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={refresh} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '10px 14px', background: 'transparent', color: theme.colors.text, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}><RefreshCw size={15} /> Refresh</button>
            <button onClick={() => setShowForm((v) => !v)} style={{ border: '0', borderRadius: 12, padding: '10px 14px', background: theme.colors.text, color: '#0A201F', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>{showForm ? 'Close' : <><Plus size={15} /> Add holding</>}</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
          <div style={panelStyle({ padding: 16 })}><div className="section-label">Positions</div><div style={{ fontSize: 30, fontFamily: 'Space Grotesk, Inter, sans-serif', marginTop: 8 }}>{holdings.length}</div></div>
          <div style={panelStyle({ padding: 16 })}><div className="section-label">Invested</div><div style={{ fontSize: 30, fontFamily: 'Space Grotesk, Inter, sans-serif', marginTop: 8 }}>{fmt(stats.invested)}</div></div>
          <div style={panelStyle({ padding: 16 })}><div className="section-label">Unrealised P&L</div><div style={{ fontSize: 30, fontFamily: 'Space Grotesk, Inter, sans-serif', marginTop: 8, color: stats.pnl >= 0 ? theme.colors.success : theme.colors.error }}>{fmt(stats.pnl)}</div></div>
        </div>
      </section>

      {showForm && (
        <form onSubmit={handleAdd} style={{ ...panelStyle({ padding: 22 }), display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <div>
              <div className="section-label">Add holding</div>
              <h3 className="editorial-title" style={{ margin: '6px 0 0', fontSize: 18 }}>Manual position entry</h3>
            </div>
            <div style={{ color: theme.colors.textMuted, fontSize: 12 }}>Required fields: ticker, quantity, average price</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <div><label style={labelStyle}>Ticker</label><input value={form.ticker} onChange={(e) => setField('ticker', e.target.value.toUpperCase())} placeholder="RELIANCE.NS" required style={fieldStyle()} /></div>
            <div><label style={labelStyle}>Company name</label><input value={form.company_name} onChange={(e) => setField('company_name', e.target.value)} placeholder="Reliance Industries" style={fieldStyle()} /></div>
            <div><label style={labelStyle}>Quantity</label><input type="number" min={0.0001} step="any" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} required style={fieldStyle()} /></div>
            <div><label style={labelStyle}>Average buy price</label><input type="number" min={0} step="any" value={form.avg_buy_price} onChange={(e) => setField('avg_buy_price', e.target.value)} required style={fieldStyle()} /></div>
            <div><label style={labelStyle}>Exchange</label><select value={form.exchange} onChange={(e) => setField('exchange', e.target.value)} style={fieldStyle()}>{EXCHANGES.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label style={labelStyle}>Asset class</label><select value={form.asset_class} onChange={(e) => setField('asset_class', e.target.value)} style={fieldStyle()}>{ASSET_CLASSES.map((a) => <option key={a}>{a}</option>)}</select></div>
          </div>

          {formError && <div style={{ color: theme.colors.error, fontSize: 13 }}>{formError}</div>}
          <button type="submit" disabled={saving} style={{ border: '0', borderRadius: 12, padding: '12px 16px', background: theme.colors.text, color: '#0A201F', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save holding'}</button>
        </form>
      )}

      {error && <PageErrorState title="Portfolio data unavailable" message={error} />}

      {holdings.length > 0 && (
        <div style={{ ...panelStyle({ padding: 20 }) }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th><th>Company</th><th>Exchange</th><th>Qty</th><th>Avg Price</th><th>LTP</th><th>Value</th><th>P&L</th><th>P&L%</th><th></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id}>
                    <td><span className="badge badge-gold">{h.ticker}</span></td>
                    <td>{h.company_name || '—'}</td>
                    <td>{h.exchange || '—'}</td>
                    <td>{h.quantity}</td>
                    <td>{fmt(h.avg_buy_price)}</td>
                    <td style={flashStyle(h.price_flash)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{fmt(h.current_price)}</span>
                        {h.price_stale && <span style={{ fontSize: 10, color: theme.colors.textMuted }}>stale</span>}
                      </div>
                    </td>
                    <td style={flashStyle(h.price_flash)}>{fmt(h.current_value)}</td>
                    <td style={{ ...flashStyle(h.price_flash), color: h.unrealised_pnl >= 0 ? theme.colors.success : theme.colors.error }}>{fmt(h.unrealised_pnl)}</td>
                    <td style={{ color: h.unrealised_pnl_pct >= 0 ? theme.colors.success : theme.colors.error }}>{h.unrealised_pnl_pct != null ? `${h.unrealised_pnl_pct >= 0 ? '+' : ''}${h.unrealised_pnl_pct.toFixed(2)}%` : '—'}</td>
                    <td>
                      <button onClick={() => setPendingDelete(h)} aria-label={`Remove ${h.ticker}`} style={{ border: '0', background: 'transparent', color: theme.colors.textMuted, cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {holdings.length === 0 && <EmptyState title="No holdings yet" message="Upload a CSV or add positions manually to populate your portfolio matrix." />}

      {pendingDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,14,13,0.58)', display: 'grid', placeItems: 'center', zIndex: 80, padding: 18 }}>
          <div style={{ ...panelStyle({ padding: 22, maxWidth: 520, width: '100%' }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.colors.warning, marginBottom: 12 }}>
              <AlertTriangle size={18} />
              <strong>Delete holding?</strong>
            </div>
            <p style={{ margin: 0, color: theme.colors.textSoft, lineHeight: 1.7 }}>
              Remove <strong style={{ color: theme.colors.text }}>{pendingDelete.ticker}</strong> from the portfolio registry.
              You can undo this for a short time after confirmation.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={() => setPendingDelete(null)} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '10px 14px', background: 'transparent', color: theme.colors.text, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <X size={14} /> Cancel
              </button>
              <button onClick={confirmDelete} style={{ border: '0', borderRadius: 12, padding: '10px 14px', background: theme.colors.error, color: '#0A201F', fontWeight: 800, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {undoHolding && (
        <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 90, ...panelStyle({ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }) }}>
          <div style={{ color: theme.colors.textSoft, fontSize: 13 }}>
            Deleted <strong style={{ color: theme.colors.text }}>{undoHolding.ticker}</strong>
          </div>
          <button onClick={handleUndo} style={{ border: '0', borderRadius: 10, padding: '8px 12px', background: theme.colors.text, color: '#0A201F', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
            <Undo2 size={14} /> Undo
          </button>
        </div>
      )}

      <style>{`
        @keyframes price-flash-up {
          0% { background: rgba(111, 174, 141, 0.18); }
          100% { background: transparent; }
        }
        @keyframes price-flash-down {
          0% { background: rgba(244, 63, 94, 0.18); }
          100% { background: transparent; }
        }
      `}</style>
    </div>
  );
}
