import React, { useState } from 'react';
import { X, Bell, Loader2 } from 'lucide-react';
import { theme } from '../lib/theme.js';

export default function PriceAlertModal({ ticker, currentPrice, onSave, onClose, loading = false }) {
  const [price, setPrice]       = useState('');
  const [direction, setDir]     = useState('above');
  const [note, setNote]         = useState('');
  const [error, setError]       = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!price || isNaN(+price) || +price <= 0) {
      setError('Enter a valid target price');
      return;
    }
    onSave({ ticker, target_price: parseFloat(price), direction, note });
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1002, backdropFilter: 'blur(6px)',
  };
  const modal = {
    background: theme.colors.surface || '#141414',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 20, padding: 26, width: '100%', maxWidth: 400,
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'modal-in 0.18s cubic-bezier(0.16,1,0.3,1)',
  };
  const inp = {
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.colors.border}`,
    borderRadius: 10, padding: '10px 14px', color: theme.colors.text,
    fontSize: 14, outline: 'none', width: '100%',
  };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} color="var(--color-primary,#4f98a3)" />
            <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-serif)' }}>Set alert — {ticker}</h3>
          </div>
          <button onClick={onClose} style={{ color: theme.colors.textMuted, padding: 4 }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {currentPrice && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: theme.colors.textSoft }}>
            Current price: <strong style={{ color: theme.colors.text }}>
              &#8377;{Number(currentPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </strong>
          </p>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Alert when price is</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['above', 'below'].map((d) => (
                <button
                  key={d} type="button"
                  onClick={() => setDir(d)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 10, cursor: 'pointer', fontWeight: 600,
                    fontSize: 13, border: `1px solid ${direction === d ? 'var(--color-primary,#4f98a3)' : theme.colors.border}`,
                    background: direction === d ? 'rgba(79,152,163,0.12)' : 'transparent',
                    color: direction === d ? 'var(--color-primary,#4f98a3)' : theme.colors.textMuted,
                    transition: 'all 0.15s',
                  }}
                >{d.charAt(0).toUpperCase() + d.slice(1)}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Target price (&#8377;) *</label>
            <input
              type="number" min="0" step="any"
              style={{ ...inp, borderColor: error ? 'var(--color-error,#f87171)' : theme.colors.border }}
              value={price}
              onChange={(e) => { setPrice(e.target.value); setError(''); }}
              placeholder="e.g. 3000"
            />
            {error && <span style={{ fontSize: 12, color: 'var(--color-error,#f87171)' }}>{error}</span>}
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Note (optional)</label>
            <input style={inp} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Breakout level, resistance..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.colors.border}`,
                borderRadius: 10, padding: '10px 18px', color: theme.colors.text, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >Cancel</button>
            <button type="submit" disabled={loading}
              style={{ background: 'var(--color-primary,#01696f)', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1, fontSize: 13 }}
            >
              {loading ? <Loader2 size={14} className="spin" /> : <Bell size={14} />}
              {loading ? 'Setting...' : 'Set alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
