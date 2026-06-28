import React from 'react';
import { Warning, Trash, X, CircleNotch } from '@phosphor-icons/react';
import '../styles/portfolio.css';

export default function DeleteConfirmModal({ title, message, onConfirm, onClose, loading = false }) {
  return (
    <div className="arca-modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="arca-modal-container" style={{ maxWidth: 400 }}>
        <div className="arca-modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Warning size={20} weight="bold" color="var(--status-loss)" />
            <h3 className="arca-modal-title">
              {title || 'Confirm delete'}
            </h3>
          </div>
          <button onClick={onClose} className="arca-modal-close" aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>
        
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6 }}>
          {message || 'This action cannot be undone.'}
        </p>
        
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="arca-modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm} disabled={loading}
            className={`arca-btn-primary ${loading ? 'loading' : ''}`}
            style={{ background: 'var(--status-loss)', color: 'var(--color-text)' }}
          >
            {loading ? <CircleNotch size={14} weight="bold" className="icon" style={{ animation: 'spin 1s linear infinite' }} /> : <Trash size={14} weight="bold" />}
            {loading ? 'DELETING...' : 'DELETE HOLDING'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
