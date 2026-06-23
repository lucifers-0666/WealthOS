import React, { useState, useEffect } from 'react';
import { X, FloppyDisk, CircleNotch } from '@phosphor-icons/react';
import '../styles/portfolio.css';

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

  const errStyle = { fontSize: 11, color: 'var(--status-loss)', marginTop: 4 };
  const fieldStyle = { marginBottom: 16 };

  return (
    <div className="arca-modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="arca-modal-container">
        <div className="arca-modal-header-row">
          <h3 className="arca-modal-title">
            {holding?.id ? 'Edit holding' : 'Add holding'}
          </h3>
          <button onClick={onClose} className="arca-modal-close" aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label className="arca-modal-label">Ticker *</label>
              <input
                className="arca-modal-input"
                style={errors.ticker ? { borderColor: 'var(--status-loss)' } : {}}
                value={form.ticker}
                onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                placeholder="RELIANCE"
              />
              {errors.ticker && <div style={errStyle}>{errors.ticker}</div>}
            </div>
            <div style={fieldStyle}>
              <label className="arca-modal-label">Exchange</label>
              <select
                className="arca-modal-input"
                value={form.exchange}
                onChange={(e) => handleChange('exchange', e.target.value)}
              >
                {EXCHANGES.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label className="arca-modal-label">Quantity *</label>
              <input
                type="number" min="0" step="any"
                className="arca-modal-input"
                style={errors.quantity ? { borderColor: 'var(--status-loss)' } : {}}
                value={form.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="10"
              />
              {errors.quantity && <div style={errStyle}>{errors.quantity}</div>}
            </div>
            <div style={fieldStyle}>
              <label className="arca-modal-label">Avg buy price *</label>
              <input
                type="number" min="0" step="any"
                className="arca-modal-input"
                style={errors.avg_buy_price ? { borderColor: 'var(--status-loss)' } : {}}
                value={form.avg_buy_price}
                onChange={(e) => handleChange('avg_buy_price', e.target.value)}
                placeholder="2450.00"
              />
              {errors.avg_buy_price && <div style={errStyle}>{errors.avg_buy_price}</div>}
            </div>
          </div>

          <div style={fieldStyle}>
            <label className="arca-modal-label">Asset class</label>
            <select
              className="arca-modal-input"
              value={form.asset_class}
              onChange={(e) => handleChange('asset_class', e.target.value)}
            >
              {ASSET_CLASSES.map((ac) => <option key={ac} value={ac}>{ac}</option>)}
            </select>
          </div>

          <div style={fieldStyle}>
            <label className="arca-modal-label">Sector</label>
            <input
              className="arca-modal-input"
              value={form.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              placeholder="Technology, FMCG, Banking…"
            />
          </div>

          <div style={fieldStyle}>
            <label className="arca-modal-label">Notes</label>
            <textarea
              rows={2}
              className="arca-modal-input arca-modal-textarea"
              style={{ resize: 'vertical' }}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Optional internal notes…"
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button" onClick={onClose}
              className="arca-modal-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className={`arca-btn-primary ${loading ? 'loading' : ''}`}
            >
              {loading ? <CircleNotch size={14} weight="bold" className="icon" style={{ animation: 'spin 1s linear infinite' }} /> : <FloppyDisk size={14} weight="bold" />}
              {loading ? 'SAVING...' : 'SAVE HOLDING'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
