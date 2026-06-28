/**
 * ImportModal — Intelligent portfolio import UI
 * Supports CSV broker exports with broker auto-detection,
 * confidence scoring, duplicate warnings, preview table, and rollback.
 */
import React, { useState, useCallback } from 'react';
import { parseImport, recordImportAudit } from '../lib/importEngine.js';
import { theme, panelStyle } from '../lib/theme.js';
import { Upload, CheckCircle, AlertTriangle, XCircle, FileText, RotateCcw, X } from 'lucide-react';
import { Warning } from '@phosphor-icons/react';
const confColor = { high: 'var(--color-success,#4ade80)', medium: 'var(--color-gold,#fbbf24)', low: 'var(--color-error,#f87171)' };

export default function ImportModal({ existingHoldings = [], onImport, onClose }) {
  const [stage, setStage] = useState('upload'); // upload | preview | done
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseImport(file, existingHoldings);
      setResult(parsed);
      setSelected(parsed.rows.filter((r) => !r.isDuplicate && r._confidence !== 'low').map((_, i) => i));
      setStage('preview');
    } catch (e) {
      setError(e.message || 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }, [existingHoldings]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleRow = (i) => {
    setSelected((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  const handleConfirmImport = () => {
    const toImport = result.rows.filter((_, i) => selected.includes(i)).map(({ _score, _confidence, _warnings, isDuplicate, ...rest }) => rest);
    recordImportAudit({ broker: result.broker, count: toImport.length, snapshotBefore: existingHoldings });
    onImport(toImport);
    setStage('done');
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 };
  const modal = { ...panelStyle({ padding: 0 }), width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${theme.colors.border}` };
  const header = { padding: '20px 24px', borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const body = { flex: 1, overflow: 'auto', padding: 24 };
  const footer = { padding: '16px 24px', borderTop: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12 };
  const btn = (variant = 'primary') => ({ padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: variant === 'primary' ? 'var(--color-primary,#4f98a3)' : theme.colors.surface2,
    color: variant === 'primary' ? '#fff' : theme.colors.text, transition: 'opacity 0.15s' });

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={header}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Import Holdings</div>
            {stage === 'preview' && result && (
              <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 3 }}>
                Detected broker: <span style={{ color: 'var(--color-primary,#4f98a3)', fontWeight: 600 }}>{result.broker}</span>
                {' · '}{result.totalRows} rows · {result.highConfidence} high-confidence
                {result.duplicates > 0 && <span style={{ color: 'var(--color-gold,#fbbf24)' }}> · {result.duplicates} duplicates</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ ...btn('ghost'), padding: '6px 8px', background: 'transparent', color: theme.colors.textMuted }}><X size={18} /></button>
        </div>

        <div style={body}>
          {/* Upload stage */}
          {stage === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{ border: `2px dashed ${theme.colors.border}`, borderRadius: 3, padding: '48px 24px',
                textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => document.getElementById('import-file-input').click()}
            >
              <Upload size={40} style={{ color: theme.colors.textMuted, margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Drop CSV or click to browse</div>
              <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                Supports: Zerodha, Groww, Upstox, Angel, HDFC Sec, or any generic CSV
              </div>
              {error && (
                <div style={{ marginTop: 16, color: 'var(--color-error,#f87171)', fontSize: 13 }}>
                  <XCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{error}
                </div>
              )}
              <input id="import-file-input" type="file" accept=".csv,.txt" style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          )}

          {/* Loading */}
          {loading && <div style={{ textAlign: 'center', padding: 48, color: theme.colors.textMuted, fontSize: 14 }}>Parsing file...</div>}

          {/* Preview stage */}
          {stage === 'preview' && result && (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.textMuted, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', width: 36 }}>
                        <input type="checkbox" checked={selected.length === result.rows.length}
                          onChange={(e) => setSelected(e.target.checked ? result.rows.map((_, i) => i) : [])} />
                      </th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Symbol</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Avg Buy</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Exchange</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Confidence</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${theme.colors.border}`,
                        opacity: selected.includes(i) ? 1 : 0.45, transition: 'opacity 0.15s',
                        background: row.isDuplicate ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                        <td style={{ padding: '9px 10px' }}>
                          <input type="checkbox" checked={selected.includes(i)} onChange={() => toggleRow(i)} />
                        </td>
                        <td style={{ padding: '9px 10px', fontWeight: 700 }}>{row.ticker}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.quantity}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{Number(row.avg_buy_price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '9px 10px', color: theme.colors.textMuted }}>{row.exchange}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600,
                            background: `${confColor[row._confidence]}22`, color: confColor[row._confidence] }}>
                            {row._confidence}
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px', fontSize: 11, color: theme.colors.textMuted }}>
                          {row.isDuplicate && <span style={{ color: 'var(--color-gold,#fbbf24)', marginRight: 6 }}><Warning size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} weight="bold" />Duplicate</span>}
                          {row._warnings.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Done */}
          {stage === 'done' && (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <CheckCircle size={48} style={{ color: 'var(--color-success,#4ade80)', margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Import successful</div>
              <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{selected.length} holdings imported</div>
              <button onClick={onClose} style={{ ...btn('ghost'), marginTop: 24 }}>Close</button>
            </div>
          )}
        </div>

        {stage === 'preview' && (
          <div style={footer}>
            <button onClick={() => setStage('upload')} style={btn('ghost')}>
              <RotateCcw size={13} style={{ marginRight: 6 }} />Back
            </button>
            <button onClick={handleConfirmImport} disabled={selected.length === 0}
              style={{ ...btn('primary'), opacity: selected.length === 0 ? 0.4 : 1 }}>
              Import {selected.length} holdings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
