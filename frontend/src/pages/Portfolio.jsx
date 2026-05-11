import React, { useState } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import SectionHeader from '../components/SectionHeader.jsx';

const EXCHANGES = ['NSE', 'BSE', 'NYSE', 'NASDAQ', 'LSE'];
const ASSET_CLASSES = ['equity', 'etf', 'gold', 'debt', 'crypto', 'reit'];

export default function Portfolio() {
  const { holdings, loading, error, addHolding, removeHolding, refresh } = usePortfolio();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ticker: '', company_name: '', quantity: '', avg_buy_price: '', exchange: 'NSE', asset_class: 'equity' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })); }

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

  async function handleDelete(id) {
    if (!confirm('Remove this holding?')) return;
    await removeHolding(id);
  }

  function fmt(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Holdings</h1>
          <p className="page-subtitle">{holdings.length} active positions</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={refresh}>Refresh</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Holding'}
          </button>
        </div>
      </div>

      {/* Add holding form */}
      {showForm && (
        <form className="add-holding-form" onSubmit={handleAdd}>
          <SectionHeader title="Add Holding" subtitle="Manually add a position" />
          <div className="form-row">
            <div className="form-field">
              <label>Ticker *</label>
              <input value={form.ticker} onChange={(e) => setField('ticker', e.target.value.toUpperCase())} placeholder="RELIANCE.NS" required />
            </div>
            <div className="form-field">
              <label>Company Name</label>
              <input value={form.company_name} onChange={(e) => setField('company_name', e.target.value)} placeholder="Reliance Industries" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Quantity *</label>
              <input type="number" min={0.0001} step="any" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Avg Buy Price (INR) *</label>
              <input type="number" min={0} step="any" value={form.avg_buy_price} onChange={(e) => setField('avg_buy_price', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Exchange</label>
              <select value={form.exchange} onChange={(e) => setField('exchange', e.target.value)}>
                {EXCHANGES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Asset Class</label>
              <select value={form.asset_class} onChange={(e) => setField('asset_class', e.target.value)}>
                {ASSET_CLASSES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          {formError && <div className="form-error">{formError}</div>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Add Holding'}
          </button>
        </form>
      )}

      {loading && <div className="shimmer-block" style={{ height: 300 }} />}
      {error && <div className="page-error">{error}</div>}

      {!loading && holdings.length > 0 && (
        <div className="table-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th><th>Company</th><th>Exchange</th>
                  <th>Qty</th><th>Avg Price</th><th>LTP</th>
                  <th>Value</th><th>P&amp;L</th><th>P&amp;L%</th><th></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id}>
                    <td><span className="ticker-badge">{h.ticker}</span></td>
                    <td className="text-muted">{h.company_name || '—'}</td>
                    <td className="text-muted">{h.exchange}</td>
                    <td>{h.quantity}</td>
                    <td>{fmt(h.avg_buy_price)}</td>
                    <td>{fmt(h.current_price)}</td>
                    <td>{fmt(h.current_value)}</td>
                    <td className={h.unrealised_pnl >= 0 ? 'text-positive' : 'text-negative'}>{fmt(h.unrealised_pnl)}</td>
                    <td className={h.unrealised_pnl_pct >= 0 ? 'text-positive' : 'text-negative'}>
                      {h.unrealised_pnl_pct != null ? `${h.unrealised_pnl_pct >= 0 ? '+' : ''}${h.unrealised_pnl_pct.toFixed(2)}%` : '—'}
                    </td>
                    <td>
                      <button className="btn-icon-danger" onClick={() => handleDelete(h.id)} aria-label={`Remove ${h.ticker}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && holdings.length === 0 && (
        <div className="empty-state">
          <p>No holdings yet. Upload a CSV or add positions manually.</p>
          <a href="/upload" className="btn-primary" style={{ display: 'inline-block', marginTop: 12 }}>Upload Portfolio</a>
        </div>
      )}
    </div>
  );
}
