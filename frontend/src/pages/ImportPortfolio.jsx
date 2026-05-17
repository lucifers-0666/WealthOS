/**
 * ImportPortfolio.jsx — AI Portfolio Import page (/app/upload)
 * Replaces the old Upload page with a full-featured AI import experience.
 *
 * Flow: Upload file → AI processing → Preview & edit → Confirm → Done
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ImportUploader from '../components/ImportUploader.jsx';
import ImportPreview from '../components/ImportPreview.jsx';
import PortfolioInsights from '../components/PortfolioInsights.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ImportPortfolio() {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // upload | processing | preview | confirming | done
  const [uploadResult, setUploadResult] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [mergeStrategy, setMergeStrategy] = useState('skip');
  const [confirmResult, setConfirmResult] = useState(null);
  const [error, setError] = useState(null);

  // ── Handle file upload ────────────────────────────────────────────────
  const handleUpload = useCallback(async (file) => {
    setError(null);
    setStep('processing');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('sb-access-token') ||
        sessionStorage.getItem('sb-access-token') || '';

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

  // ── Handle confirm ────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    setStep('confirming');
    try {
      const token = localStorage.getItem('sb-access-token') ||
        sessionStorage.getItem('sb-access-token') || '';

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

  // ── Step: Done ────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="import-done">
        <div className="import-done-card">
          <div className="import-done-icon">✅</div>
          <h2>Portfolio Imported!</h2>
          <p className="import-done-sub">
            {confirmResult?.message || `Imported ${confirmResult?.total_saved} holdings successfully.`}
          </p>
          <div className="import-done-stats">
            <span className="stat-chip saved">{confirmResult?.saved?.length || 0} Added</span>
            <span className="stat-chip updated">{confirmResult?.updated?.length || 0} Updated</span>
            <span className="stat-chip skipped">{confirmResult?.skipped?.length || 0} Skipped</span>
          </div>
          <div className="import-done-actions">
            <button className="btn-primary" onClick={() => navigate('/app/portfolio')}>
              View Portfolio
            </button>
            <button className="btn-ghost" onClick={() => { setStep('upload'); setUploadResult(null); setHoldings([]); }}>
              Import Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="import-page">
      {/* Header */}
      <div className="import-header">
        <div className="import-header-left">
          <h1 className="import-title">
            <span className="import-title-icon">🤖</span>
            AI Portfolio Import
          </h1>
          <p className="import-subtitle">
            Upload a screenshot, PDF, CSV or Excel file — AI extracts your holdings instantly.
          </p>
        </div>
        <div className="import-step-pills">
          {['Upload', 'Preview', 'Confirm'].map((label, i) => {
            const stepMap = { 0: 'upload', 1: 'preview', 2: 'confirming' };
            const isActive = step === stepMap[i] || (step === 'processing' && i === 0);
            const isDone = (i === 0 && ['preview', 'confirming', 'done'].includes(step)) ||
                           (i === 1 && ['confirming', 'done'].includes(step));
            return (
              <div key={label} className={`step-pill ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                <span className="step-pill-num">{isDone ? '✓' : i + 1}</span>
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="import-error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Step: Upload / Processing */}
      {(step === 'upload' || step === 'processing') && (
        <ImportUploader onUpload={handleUpload} isProcessing={step === 'processing'} />
      )}

      {/* Step: Preview */}
      {step === 'preview' && uploadResult && (
        <div className="import-preview-layout">
          <div className="import-preview-main">
            {/* Meta bar */}
            <div className="import-meta-bar">
              <span className="meta-chip broker">{uploadResult.broker}</span>
              <span className="meta-chip parser">{uploadResult.parser_used?.toUpperCase()} parser</span>
              {uploadResult.ocr_confidence > 0 && (
                <span className={`meta-chip conf ${uploadResult.ocr_confidence >= 70 ? 'good' : 'warn'}`}>
                  OCR {uploadResult.ocr_confidence}% confidence
                </span>
              )}
              <span className="meta-chip count">{uploadResult.count} holdings detected</span>
            </div>

            <ImportPreview
              holdings={holdings}
              onChange={setHoldings}
            />

            {/* Merge strategy */}
            <div className="merge-strategy">
              <span className="merge-label">If stock already exists:</span>
              <div className="merge-options">
                {[
                  { val: 'skip',       label: 'Skip duplicates' },
                  { val: 'update',     label: 'Update quantity' },
                  { val: 'always_add', label: 'Always add new row' },
                ].map(opt => (
                  <label key={opt.val} className={`merge-option ${mergeStrategy === opt.val ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="merge"
                      value={opt.val}
                      checked={mergeStrategy === opt.val}
                      onChange={() => setMergeStrategy(opt.val)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="preview-actions">
              <button className="btn-ghost" onClick={() => { setStep('upload'); setUploadResult(null); setHoldings([]); }}>
                ← Re-upload
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={holdings.filter(h => !h._deleted).length === 0}
              >
                Import {holdings.filter(h => !h._deleted).length} Holdings →
              </button>
            </div>
          </div>

          {/* Insights sidebar */}
          {uploadResult.insights && (
            <div className="import-insights-panel">
              <PortfolioInsights insights={uploadResult.insights} />
            </div>
          )}
        </div>
      )}

      {/* Confirming spinner */}
      {step === 'confirming' && (
        <div className="import-confirming">
          <div className="spinner-ring" />
          <p>Saving your portfolio…</p>
        </div>
      )}
    </div>
  );
}
