import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { theme } from '../lib/theme.js';

export default function DeleteConfirmModal({ title, message, onConfirm, onClose, loading = false }) {
  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1001, backdropFilter: 'blur(6px)',
  };
  const modal = {
    background: theme.colors.surface || '#141414',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 20, padding: 28, width: '100%', maxWidth: 400,
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'modal-in 0.18s cubic-bezier(0.16,1,0.3,1)',
  };
  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={22} color="var(--color-error,#f87171)" />
            <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'Space Grotesk, sans-serif' }}>
              {title || 'Confirm delete'}
            </h3>
          </div>
          <button onClick={onClose} style={{ color: theme.colors.textMuted, padding: 4 }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p style={{ margin: '0 0 24px', color: theme.colors.textSoft, fontSize: 14, lineHeight: 1.65 }}>
          {message || 'This action cannot be undone.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 10, padding: '10px 20px', color: theme.colors.text,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={onConfirm} disabled={loading}
            style={{
              background: 'var(--color-error,#f87171)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s', fontSize: 14,
            }}
          >
            <Trash2 size={14} />
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
