import React from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { panelStyle } from '../lib/theme.js';
import { ArrowLeftRight, PlusCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLoadingState, PageErrorState } from '../components/PageStates.jsx';

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

export default function Transactions() {
  const { transactions, loading, error, refresh } = usePortfolio();
  const navigate = useNavigate();

  if (loading) {
    return <PageLoadingState title="Loading transactions…" subtitle="Retrieving ledger data." />;
  }
  if (error) {
    return <PageErrorState title="Transactions unavailable" message={error} />;
  }

  const sortedTxns = [...(transactions || [])].sort((a, b) => {
    const da = new Date(a.transaction_date || a.date || 0);
    const db = new Date(b.transaction_date || b.date || 0);
    return db - da; // most recent first
  });

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Header */}
      <div style={{ ...panelStyle({ padding: '22px 26px' }), display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>
            Ledger Register
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem,2.5vw,2.4rem)', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
            Transactions Log
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/upload')}
            style={{
              background: 'var(--greek-gold, #C8B38E)', color: '#1a1206', border: '1px solid rgba(212,160,23,0.5)', borderRadius: 3,
              padding: '10px 16px', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14
            }}
          >
            <PlusCircle size={15} /> Import Transactions CSV
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {!sortedTxns.length ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ArrowLeftRight size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)' }}>No transactions recorded</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Add manual trade activities or import a portfolio file to generate logs.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Date</th>
                  <th>Action</th>
                  <th>Symbol</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {sortedTxns.map((txn, idx) => {
                  const dateStr = txn.transaction_date || txn.date || '';
                  const action = (txn.action || 'buy').toUpperCase();
                  const qty = Number(txn.quantity || 0);
                  const price = Number(txn.price || 0);
                  const total = qty * price;
                  
                  return (
                    <tr
                      key={`${txn.id || idx}`}
                      style={{ transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,160,23,0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ paddingLeft: 20, color: 'var(--text-secondary)' }}>
                        {dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <div className={action === 'BUY' ? 'badge-buy' : 'badge-sell'}>
                          {action === 'BUY' ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                          {action}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                        {txn.ticker}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(price)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', paddingRight: 20 }}>
                        {fmt(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
