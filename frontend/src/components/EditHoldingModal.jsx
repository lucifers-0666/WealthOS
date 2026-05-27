import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { theme } from '../lib/theme.js';

const EXCHANGES = ['NSE', 'BSE', 'NASDAQ', 'NYSE', 'CRYPTO', 'OTHER'];
const ASSET_CLASSES = ['Equity', 'Mutual Fund', 'ETF', 'Bond', 'Gold', 'Crypto', 'Other'];

export default function EditHoldingModal({ holding, onSave, onClose, loading = false }) {
  const [form, setForm] = useState({
    ticker:          holding?.ticker          || '',
    quantity:        holding?.quantity         || '',
    avg_buy_price:   holding?.avg_buy_price    || '',
    exchange:        holding?.exchange         || 'NSE',
    asset_class:     holding?.asset_class      || 'Equity',
    sector:          holding?.sector           || '',
    notes:           holding?.notes            || '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (holding) {
      setForm({
        ticker:        holding.ticker          || '',
        quantity:      holding.quantity         || '',
        avg_buy_price: holding.avg_buy_price    || '',
        exchange:      holding.exchange         || 'NSE',
        asset_class:   holding.asset_class      || 'Equity',
        sector:        holding.sector           || '',
        notes:         holding.notes            || '',
      });
    }
  }, [holding]);

  function validate() {
    const e = {};
    if (!form.ticker.trim())             e.ticker        = 'Ticker required';
    if (!form.quantity || isNaN(+form.quantity) || +form.quantity <= 0)
                                          e.quantity      = 'Positive quantity required';
    if (!form.avg_buy_price || isNaN(+form.avg_buy_price) || +form.avg_buy_price <= 0)
                                          e.avg_buy_price = 'Valid buy price required';
    return e;
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      quantity:      parseFloat(form.quantity),
      avg_buy_price: parseFloat(form.avg_buy_price),
    });
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(6px)',
  };
  const modal = {
    background: theme.colors.surface || '#141414',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 20, padding: 28, width: '100%', maxWidth: 480,
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'modal-in 0.18s cubic-bezier(0.16,1,0.3,1)',
  };
  const field = { display: 'grid', gap: 6 };
  const label = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.textMuted };
  const input = {
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.colors.border}`,
    borderRadius: 10, padding: '10px 14px', color: theme.colors.text,
    fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
  };
  const errStyle = { fontSize: 12, color: 'var(--color-error,#f87171)', marginTop: 2 };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Space Grotesk, sans-serif' }}>
            {holding?.id ? 'Edit holding' : 'Add holding'}
          </h3>
          <button onClick={onClose} style={{ color: theme.colors.textMuted, padding: 4 }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={field}>
              <label style={label}>Ticker *</label>
              <input
                style={{ ...input, borderColor: errors.ticker ? 'var(--color-error,#f87171)' : theme.colors.border }}
                value={form.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                placeholder="RELIANCE"
              />
              {errors.ticker && <span style={errStyle}>{errors.ticker}</span>}
            </div>
            <div style={field}>
              <label style={label}>Exchange</label>
              <select
                style={{ ...input, cursor: 'pointer' }}
                value={form.exchange}
                onChange={(e) => handleChange('exchange', e.target.value)}
              >
                {EXCHANGES.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={field}>
              <label style={label}>Quantity *</label>
              <input
                type="number" min="0" step="any"
                style={{ ...input, borderColor: errors.quantity ? 'var(--color-error,#f87171)' : theme.colors.border }}
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="10"
              />
              {errors.quantity && <span style={errStyle}>{errors.quantity}</span>}
            </div>
            <div style={field}>
              <label style={label}>Avg buy price *</label>
              <input
                type="number" min="0" step="any"
                style={{ ...input, borderColor: errors.avg_buy_price ? 'var(--color-error,#f87171)' : theme.colors.border }}
                value={form.avg_buy_price}
                onChange={(e) => handleChange('avg_buy_price', e.target.value)}
                placeholder="2450.00"
              />
              {errors.avg_buy_price && <span style={errStyle}>{errors.avg_buy_price}</span>}
            </div>
          </div>

          <div style={field}>
            <label style={label}>Asset class</label>
            <select
              style={{ ...input, cursor: 'pointer' }}
              value={form.asset_class}
              onChange={(e) => handleChange('asset_class', e.target.value)}
            >
              {ASSET_CLASSES.map((ac) => <option key={ac} value={ac}>{ac}</option>)}
            </select>
          </div>

          <div style={field}>
            <label style={label}>Sector</label>
            <input
              style={input}
              value={form.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              placeholder="Technology, FMCG, Banking…"
            />
          </div>

          <div style={field}>
            <label style={label}>Notes</label>
            <textarea
              rows={2}
              style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Optional internal notes…"
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button" onClick={onClose}
              style={{ ...input, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              style={{
                background: 'var(--color-primary,#01696f)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '10px 22px',
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
              {loading ? 'Saving…' : 'Save holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
