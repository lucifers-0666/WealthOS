import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ImportUploader from '../components/ImportUploader.jsx';
import ImportPreview from '../components/ImportPreview.jsx';
import PortfolioInsights from '../components/PortfolioInsights.jsx';
import { CheckCircle2 } from 'lucide-react';
import { Robot, Warning } from '@phosphor-icons/react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ImportPortfolio() {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // upload | processing | preview | confirming | done
  const [uploadResult, setUploadResult] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [mergeStrategy, setMergeStrategy] = useState('skip');
  const [confirmResult, setConfirmResult] = useState(null);
  const [error, setError] = useState(null);
  const [confirmErrors, setConfirmErrors] = useState(false);

  const handleUpload = useCallback(async (file) => {
    setError(null);
    setStep('processing');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token') || '';
      const res = await fetch(`${API_BASE}/api/import/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await res.json();
      setUploadResult(data);
      setHoldings(data.holdings || []);
      setStep('preview');
    } catch (e) {
      setError(e.message);
      setStep('upload');
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    setStep('confirming');
    try {
      const token = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token') || '';
      const res = await fetch(`${API_BASE}/api/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          holdings,
          merge_strategy: mergeStrategy,
          broker: uploadResult?.broker,
          file_hash: uploadResult?.file_hash,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Confirm failed');
      }
      const result = await res.json();
      setConfirmResult(result);
      setStep('done');
    } catch (e) {
      setError(e.message);
      setStep('preview');
    }
  }, [holdings, mergeStrategy, uploadResult]);

  if (step === 'done') {
    return (
      <div className="flex flex-col min-h-0 h-full p-6 items-center justify-center animate-[fadeSlideUp_0.4s_ease-out]">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-8 max-w-md w-full flex flex-col items-center text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="w-16 h-16 rounded-full bg-[rgba(111,174,141,0.1)] border border-[var(--color-gain)] flex items-center justify-center text-[var(--color-gain)] mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-[var(--color-text)] mb-2">Portfolio Imported!</h2>
          <p className="font-inter text-[13px] text-[var(--color-text-muted)] mb-6">
            {confirmResult?.message || `Imported ${confirmResult?.total_saved} holdings successfully.`}
          </p>
          <div className="flex gap-4 mb-8">
            <div className="flex flex-col gap-1 items-center bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[2px] px-4 py-2">
              <span className="font-mono text-[16px] text-[var(--color-gain)] font-bold">{confirmResult?.saved?.length || 0}</span>
              <span className="font-inter text-[9px] uppercase text-[var(--color-text-faint)]">Added</span>
            </div>
            <div className="flex flex-col gap-1 items-center bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[2px] px-4 py-2">
              <span className="font-mono text-[16px] text-[var(--color-blue)] font-bold">{confirmResult?.updated?.length || 0}</span>
              <span className="font-inter text-[9px] uppercase text-[var(--color-text-faint)]">Updated</span>
            </div>
            <div className="flex flex-col gap-1 items-center bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[2px] px-4 py-2">
              <span className="font-mono text-[16px] text-[var(--color-text-faint)] font-bold">{confirmResult?.skipped?.length || 0}</span>
              <span className="font-inter text-[9px] uppercase text-[var(--color-text-faint)]">Skipped</span>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button className="flex-1 bg-[var(--color-gold)] text-[var(--color-bg)] rounded-[3px] py-2.5 font-inter text-[12px] font-bold hover:brightness-110 transition-all" onClick={() => navigate('/app/portfolio')}>
              View Portfolio
            </button>
            <button className="flex-1 border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-[3px] py-2.5 font-inter text-[12px] hover:text-[var(--color-text)] hover:border-[rgba(200,179,142,0.3)] transition-colors" onClick={() => { setStep('upload'); setUploadResult(null); setHoldings([]); }}>
              Import Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const errorsCount = holdings.filter(h => !h._deleted && !h.ticker_valid).length;
  const validCount = holdings.filter(h => !h._deleted).length;
  const errorRate = validCount > 0 ? errorsCount / validCount : 0;
  const needsErrorConfirm = errorRate > 0.3;
  const canConfirm = validCount > 0 && (!needsErrorConfirm || confirmErrors);

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out] overflow-y-auto">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-8">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="max-w-[740px]">
            <h1 className="font-cinzel text-xl font-bold text-[var(--color-text)] tracking-wide flex items-center gap-2">
              <span className="text-xl"><Robot size={24} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /></span> AI Portfolio Import
            </h1>
            <p className="font-inter text-[12px] text-[var(--color-text-faint)] mt-1">Upload a screenshot, PDF, CSV or Excel file — AI extracts your holdings instantly.</p>
          </div>
          <div className="flex items-center gap-2">
            {['Upload', 'Preview', 'Confirm'].map((label, i) => {
              const stepMap = { 0: 'upload', 1: 'preview', 2: 'confirming' };
              const isActive = step === stepMap[i] || (step === 'processing' && i === 0);
              const isDone = (i === 0 && ['preview', 'confirming', 'done'].includes(step)) ||
                             (i === 1 && ['confirming', 'done'].includes(step));
              return (
                <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-[3px] border font-inter text-[11px] font-bold uppercase tracking-wide transition-all ${isActive ? 'bg-[rgba(200,179,142,0.1)] border-[var(--color-gold)] text-[var(--color-gold)]' : isDone ? 'bg-[rgba(111,174,141,0.1)] border-[var(--color-gain)] text-[var(--color-gain)]' : 'border-[var(--color-border)] text-[var(--color-text-faint)]'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${isActive ? 'bg-[var(--color-gold)] text-[var(--color-bg)]' : isDone ? 'bg-[var(--color-gain)] text-[var(--color-bg)]' : 'border border-[var(--color-text-faint)]'}`}>
                    {isDone ? '✓' : i + 1}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-[rgba(182,106,106,0.15)] border border-[var(--color-loss)] rounded-[3px] p-3 flex justify-between items-center text-[var(--color-loss)] font-inter text-[12px]">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Warning size={16} weight="bold" /> {error}</span>
            <button onClick={() => setError(null)} className="hover:text-[var(--color-text)]">✕</button>
          </div>
        )}

        {/* Step: Upload / Processing */}
        {(step === 'upload' || step === 'processing') && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-6 min-h-[300px]">
            <ImportUploader onUpload={handleUpload} isProcessing={step === 'processing'} />
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && uploadResult && (
          <div className="flex gap-6 min-h-0 flex-1">
            <div className="flex-1 flex flex-col gap-4">
              {/* Meta bar */}
              <div className="flex gap-3">
                <span className="px-2 py-1 bg-[rgba(200,179,142,0.1)] border border-[var(--color-gold)] text-[var(--color-gold)] rounded-[2px] font-inter text-[10px] uppercase tracking-wide">{uploadResult.broker}</span>
                <span className="px-2 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-faint)] rounded-[2px] font-inter text-[10px] uppercase tracking-wide">{uploadResult.parser_used?.toUpperCase()} parser</span>
                {uploadResult.ocr_confidence > 0 && (
                  <span className={`px-2 py-1 border rounded-[2px] font-inter text-[10px] uppercase tracking-wide ${uploadResult.ocr_confidence >= 70 ? 'bg-[rgba(111,174,141,0.1)] border-[var(--color-gain)] text-[var(--color-gain)]' : 'bg-[rgba(182,106,106,0.1)] border-[var(--color-loss)] text-[var(--color-loss)]'}`}>
                    OCR {uploadResult.ocr_confidence}% confidence
                  </span>
                )}
                <span className="px-2 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-[2px] font-inter text-[10px] uppercase tracking-wide">{uploadResult.count} holdings detected</span>
                {errorsCount > 0 && (
                  <span className="px-2 py-1 bg-[rgba(182,106,106,0.1)] border border-[var(--color-loss)] text-[var(--color-loss)] rounded-[2px] font-inter text-[10px] uppercase tracking-wide">{errorsCount} errors found</span>
                )}
              </div>

              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-0 flex-1 overflow-hidden flex flex-col min-h-[400px]">
                <ImportPreview holdings={holdings} onChange={setHoldings} />
              </div>

              {/* Merge strategy & Actions */}
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-6 flex justify-between items-center mt-2">
                <div className="flex flex-col gap-2">
                  <span className="font-inter text-[11px] uppercase tracking-wide text-[var(--color-text-faint)]">If stock already exists:</span>
                  <div className="flex gap-4">
                    {[
                      { val: 'skip', label: 'Skip duplicates' },
                      { val: 'update', label: 'Update quantity' },
                      { val: 'always_add', label: 'Always add new row' },
                    ].map(opt => (
                      <label key={opt.val} className={`flex items-center gap-2 cursor-pointer font-inter text-[12px] ${mergeStrategy === opt.val ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-muted)]'}`}>
                        <input type="radio" name="merge" value={opt.val} checked={mergeStrategy === opt.val} onChange={() => setMergeStrategy(opt.val)} className="accent-[var(--color-gold)]" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  {needsErrorConfirm && (
                    <label className="flex items-center gap-2 cursor-pointer font-inter text-[11px] text-[var(--color-loss)]">
                      <input type="checkbox" checked={confirmErrors} onChange={e => setConfirmErrors(e.target.checked)} className="accent-[var(--color-loss)]" />
                      I acknowledge the high error rate
                    </label>
                  )}
                  <button className="border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-[3px] px-6 py-2.5 font-inter text-[12px] hover:text-[var(--color-text)] hover:border-[rgba(200,179,142,0.3)] transition-colors" onClick={() => { setStep('upload'); setUploadResult(null); setHoldings([]); setConfirmErrors(false); }}>
                    ← Re-upload
                  </button>
                  <button className="bg-[var(--color-gold)] text-[var(--color-bg)] rounded-[3px] px-6 py-2.5 font-inter text-[12px] font-bold hover:brightness-110 transition-all disabled:opacity-50" onClick={handleConfirm} disabled={!canConfirm}>
                    Import {validCount} Holdings →
                  </button>
                </div>
              </div>
            </div>

            {/* Insights sidebar */}
            {uploadResult.insights && (
              <div className="w-[300px] shrink-0 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-6 self-start">
                <PortfolioInsights insights={uploadResult.insights} />
              </div>
            )}
          </div>
        )}

        {/* Confirming spinner */}
        {step === 'confirming' && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-12 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-8 h-8 rounded-full border-2 border-[rgba(200,179,142,0.2)] border-t-[var(--color-gold)] animate-spin" />
            <p className="font-inter text-[13px] text-[var(--color-text-muted)]">Saving your portfolio…</p>
          </div>
        )}
      </div>
    </div>
  );
}
