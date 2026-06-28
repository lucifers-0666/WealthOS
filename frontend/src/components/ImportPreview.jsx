/**
 * ImportPreview.jsx — Editable table showing extracted holdings before import.
 * Users can edit ticker, quantity, buy price, and delete rows.
 */

import React, { useState } from 'react';
import { Warning, Trash, ArrowUUpLeft } from '@phosphor-icons/react';

export default function ImportPreview({ holdings, onChange }) {
  const [editingIdx, setEditingIdx] = useState(null);

  const update = (idx, field, value) => {
    const updated = holdings.map((h, i) =>
      i === idx ? { ...h, [field]: value } : h
    );
    onChange(updated);
  };

  const deleteRow = (idx) => {
    const updated = holdings.map((h, i) =>
      i === idx ? { ...h, _deleted: true } : h
    );
    onChange(updated);
  };

  const restoreRow = (idx) => {
    const updated = holdings.map((h, i) =>
      i === idx ? { ...h, _deleted: false } : h
    );
    onChange(updated);
  };

  const visible = holdings.filter(h => !h._deleted);
  const deleted = holdings.filter(h => h._deleted);

  return (
    <div className="import-preview">
      <div className="preview-header">
        <h3 className="preview-title">Extracted Holdings</h3>
        <span className="preview-count">{visible.length} stocks ready to import</span>
      </div>

      <div className="preview-table-wrap">
        <table className="preview-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ticker</th>
              <th>Company</th>
              <th>Qty</th>
              <th>Avg Buy ₹</th>
              <th>Current ₹</th>
              <th>P&amp;L</th>
              <th>Confidence</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {holdings.slice(0, 10).map((h, idx) => {
              if (h._deleted) return null;
              const isEditing = editingIdx === idx;
              const pnl = h.pnl !== null && h.pnl !== undefined ? h.pnl :
                (h.avg_buy_price && h.current_price && h.quantity
                  ? (h.current_price - h.avg_buy_price) * h.quantity
                  : null);
              const confClass = h.ocr_confidence >= 80 ? 'conf-high' : h.ocr_confidence >= 50 ? 'conf-mid' : 'conf-low';

              return (
                <tr key={idx} className={`preview-row ${!h.ticker_valid ? 'row-warn' : ''}`}>
                  <td className="row-num">{idx + 1}</td>

                  <td className="row-ticker">
                    {isEditing ? (
                      <input
                        className="cell-input ticker-input"
                        value={h.ticker}
                        onChange={e => update(idx, 'ticker', e.target.value.toUpperCase())}
                        onBlur={() => setEditingIdx(null)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`ticker-badge ${!h.ticker_valid ? 'ticker-invalid' : ''}`}
                        onClick={() => setEditingIdx(idx)}
                        title={!h.ticker_valid ? 'Unrecognised ticker — click to edit' : ''}
                      >
                        {h.ticker}
                        {!h.ticker_valid && <span className="warn-dot"><Warning size={12} weight="bold" /></span>}
                      </span>
                    )}
                  </td>

                  <td className="row-name">
                    {isEditing ? (
                      <input
                        className="cell-input"
                        value={h.company_name || ''}
                        onChange={e => update(idx, 'company_name', e.target.value)}
                        placeholder="Company name"
                      />
                    ) : (
                      <span className="company-name" onClick={() => setEditingIdx(idx)}>
                        {h.company_name || <span className="text-faint">—</span>}
                      </span>
                    )}
                  </td>

                  <td className="row-qty">
                    {isEditing ? (
                      <input
                        className="cell-input num-input"
                        type="number"
                        value={h.quantity}
                        min="0"
                        onChange={e => update(idx, 'quantity', parseFloat(e.target.value))}
                      />
                    ) : (
                      <span onClick={() => setEditingIdx(idx)}>{h.quantity}</span>
                    )}
                  </td>

                  <td className="row-price">
                    {isEditing ? (
                      <input
                        className="cell-input num-input"
                        type="number"
                        value={h.avg_buy_price || ''}
                        placeholder="0"
                        onChange={e => update(idx, 'avg_buy_price', parseFloat(e.target.value))}
                      />
                    ) : (
                      <span onClick={() => setEditingIdx(idx)}>
                        {h.avg_buy_price ? `₹${h.avg_buy_price.toLocaleString('en-IN')}` : <span className="text-faint">—</span>}
                      </span>
                    )}
                  </td>

                  <td className="row-price">
                    {isEditing ? (
                      <input
                        className="cell-input num-input"
                        type="number"
                        value={h.current_price || ''}
                        placeholder="0"
                        onChange={e => update(idx, 'current_price', parseFloat(e.target.value))}
                      />
                    ) : (
                      <span onClick={() => setEditingIdx(idx)}>
                        {h.current_price ? `₹${h.current_price.toLocaleString('en-IN')}` : <span className="text-faint">—</span>}
                      </span>
                    )}
                  </td>

                  <td className={`row-pnl ${pnl > 0 ? 'pnl-pos' : pnl < 0 ? 'pnl-neg' : ''}`}>
                    {pnl !== null ? (
                      <span>{pnl > 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    ) : <span className="text-faint">—</span>}
                  </td>

                  <td className="row-conf">
                    <span className={`conf-badge ${confClass}`}>
                      {h.ocr_confidence != null ? `${h.ocr_confidence}%` : 'CSV'}
                    </span>
                  </td>

                  <td className="row-action">
                    <button className="row-delete" onClick={() => deleteRow(idx)} title="Remove row">
                      <Trash size={16} weight="bold" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {holdings.length > 10 && (
          <div className="p-3 text-center text-[var(--color-text-faint)] font-inter text-[11px] border-t border-[var(--color-border)]">
            + {holdings.length - 10} more rows (only previewing first 10)
          </div>
        )}
      </div>

      {/* Deleted rows restore section */}
      {deleted.length > 0 && (
        <div className="deleted-rows">
          <span className="deleted-label">{deleted.length} removed</span>
          {holdings.map((h, idx) => h._deleted ? (
            <button key={idx} className="restore-btn" onClick={() => restoreRow(idx)}>
              <ArrowUUpLeft size={14} weight="bold" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> {h.ticker}
            </button>
          ) : null)}
        </div>
      )}
    </div>
  );
}
