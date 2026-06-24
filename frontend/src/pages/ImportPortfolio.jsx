import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ImportUploader from '../components/ImportUploader.jsx';
import ImportPreview from '../components/ImportPreview.jsx';
import PortfolioInsights from '../components/PortfolioInsights.jsx';
import { CheckCircle2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ImportPortfolio() {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // upload | processing | preview | confirming | done
  const [uploadResult, setUploadResult] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [mergeStrategy, setMergeStrategy] = useState('skip');
  const [confirmResult, setConfirmResult] = useState(null);
  const [error, setError] = useState(null);

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
        <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-8 max-w-md w-full flex flex-col items-center text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="w-16 h-16 rounded-full bg-[rgba(111,174,141,0.1)] border border-[#6FAE8D] flex items-center justify-center text-[#6FAE8D] mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-[#ECE0CC] mb-2">Portfolio Imported!</h2>
          <p className="font-inter text-[13px] text-[#ACA492] mb-6">
            {confirmResult?.message || `Imported ${confirmResult?.total_saved} holdings successfully.`}
          </p>
          <div className="flex gap-4 mb-8">
            <div className="flex flex-col gap-1 items-center bg-[#0A201F] border border-[#2D3C37] rounded-[2px] px-4 py-2">
              <span className="font-mono text-[16px] text-[#6FAE8D] font-bold">{confirmResult?.saved?.length || 0}</span>
              <span className="font-inter text-[9px] uppercase text-[#7B7C70]">Added</span>
            </div>
            <div className="flex flex-col gap-1 items-center bg-[#0A201F] border border-[#2D3C37] rounded-[2px] px-4 py-2">
              <span className="font-mono text-[16px] text-[#869FC4] font-bold">{confirmResult?.updated?.length || 0}</span>
              <span className="font-inter text-[9px] uppercase text-[#7B7C70]">Updated</span>
            </div>
            <div className="flex flex-col gap-1 items-center bg-[#0A201F] border border-[#2D3C37] rounded-[2px] px-4 py-2">
              <span className="font-mono text-[16px] text-[#7B7C70] font-bold">{confirmResult?.skipped?.length || 0}</span>
              <span className="font-inter text-[9px] uppercase text-[#7B7C70]">Skipped</span>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button className="flex-1 bg-[#C8B38E] text-[#0A201F] rounded-[3px] py-2.5 font-inter text-[12px] font-bold hover:brightness-110 transition-all" onClick={() => navigate('/app/portfolio')}>
              View Portfolio
            </button>
            <button className="flex-1 border border-[#2D3C37] text-[#ACA492] rounded-[3px] py-2.5 font-inter text-[12px] hover:text-[#ECE0CC] hover:border-[rgba(200,179,142,0.3)] transition-colors" onClick={() => { setStep('upload'); setUploadResult(null); setHoldings([]); }}>
              Import Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out] overflow-y-auto">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-8">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="max-w-[740px]">
            <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC] tracking-wide flex items-center gap-2">
              <span className="text-xl">🤖</span> AI Portfolio Import
            </h1>
            <p className="font-inter text-[12px] text-[#7B7C70] mt-1">Upload a screenshot, PDF, CSV or Excel file — AI extracts your holdings instantly.</p>
          </div>
          <div className="flex items-center gap-2">
            {['Upload', 'Preview', 'Confirm'].map((label, i) => {
              const stepMap = { 0: 'upload', 1: 'preview', 2: 'confirming' };
              const isActive = step === stepMap[i] || (step === 'processing' && i === 0);
              const isDone = (i === 0 && ['preview', 'confirming', 'done'].includes(step)) ||
                             (i === 1 && ['confirming', 'done'].includes(step));
              return (
                <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-[3px] border font-inter text-[11px] font-bold uppercase tracking-wide transition-all ${isActive ? 'bg-[rgba(200,179,142,0.1)] border-[#C8B38E] text-[#C8B38E]' : isDone ? 'bg-[rgba(111,174,141,0.1)] border-[#6FAE8D] text-[#6FAE8D]' : 'border-[#2D3C37] text-[#7B7C70]'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${isActive ? 'bg-[#C8B38E] text-[#0A201F]' : isDone ? 'bg-[#6FAE8D] text-[#0A201F]' : 'border border-[#7B7C70]'}`}>
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
          <div className="bg-[rgba(182,106,106,0.15)] border border-[#B66A6A] rounded-[3px] p-3 flex justify-between items-center text-[#B66A6A] font-inter text-[12px]">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="hover:text-[#ECE0CC]">✕</button>
          </div>
        )}

        {/* Step: Upload / Processing */}
        {(step === 'upload' || step === 'processing') && (
          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 min-h-[300px]">
            <ImportUploader onUpload={handleUpload} isProcessing={step === 'processing'} />
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && uploadResult && (
          <div className="flex gap-6 min-h-0 flex-1">
            <div className="flex-1 flex flex-col gap-4">
              {/* Meta bar */}
              <div className="flex gap-3">
                <span className="px-2 py-1 bg-[rgba(200,179,142,0.1)] border border-[#C8B38E] text-[#C8B38E] rounded-[2px] font-inter text-[10px] uppercase tracking-wide">{uploadResult.broker}</span>
                <span className="px-2 py-1 bg-[#0A201F] border border-[#2D3C37] text-[#7B7C70] rounded-[2px] font-inter text-[10px] uppercase tracking-wide">{uploadResult.parser_used?.toUpperCase()} parser</span>
                {uploadResult.ocr_confidence > 0 && (
                  <span className={`px-2 py-1 border rounded-[2px] font-inter text-[10px] uppercase tracking-wide ${uploadResult.ocr_confidence >= 70 ? 'bg-[rgba(111,174,141,0.1)] border-[#6FAE8D] text-[#6FAE8D]' : 'bg-[rgba(182,106,106,0.1)] border-[#B66A6A] text-[#B66A6A]'}`}>
                    OCR {uploadResult.ocr_confidence}% confidence
                  </span>
                )}
                <span className="px-2 py-1 bg-[#0A201F] border border-[#2D3C37] text-[#ACA492] rounded-[2px] font-inter text-[10px] uppercase tracking-wide">{uploadResult.count} holdings detected</span>
              </div>

              <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-0 flex-1 overflow-hidden flex flex-col min-h-[400px]">
                <ImportPreview holdings={holdings} onChange={setHoldings} />
              </div>

              {/* Merge strategy & Actions */}
              <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 flex justify-between items-center mt-2">
                <div className="flex flex-col gap-2">
                  <span className="font-inter text-[11px] uppercase tracking-wide text-[#7B7C70]">If stock already exists:</span>
                  <div className="flex gap-4">
                    {[
                      { val: 'skip', label: 'Skip duplicates' },
                      { val: 'update', label: 'Update quantity' },
                      { val: 'always_add', label: 'Always add new row' },
                    ].map(opt => (
                      <label key={opt.val} className={`flex items-center gap-2 cursor-pointer font-inter text-[12px] ${mergeStrategy === opt.val ? 'text-[#C8B38E]' : 'text-[#ACA492]'}`}>
                        <input type="radio" name="merge" value={opt.val} checked={mergeStrategy === opt.val} onChange={() => setMergeStrategy(opt.val)} className="accent-[#C8B38E]" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="border border-[#2D3C37] text-[#ACA492] rounded-[3px] px-6 py-2.5 font-inter text-[12px] hover:text-[#ECE0CC] hover:border-[rgba(200,179,142,0.3)] transition-colors" onClick={() => { setStep('upload'); setUploadResult(null); setHoldings([]); }}>
                    ← Re-upload
                  </button>
                  <button className="bg-[#C8B38E] text-[#0A201F] rounded-[3px] px-6 py-2.5 font-inter text-[12px] font-bold hover:brightness-110 transition-all disabled:opacity-50" onClick={handleConfirm} disabled={holdings.filter(h => !h._deleted).length === 0}>
                    Import {holdings.filter(h => !h._deleted).length} Holdings →
                  </button>
                </div>
              </div>
            </div>

            {/* Insights sidebar */}
            {uploadResult.insights && (
              <div className="w-[300px] shrink-0 bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6 self-start">
                <PortfolioInsights insights={uploadResult.insights} />
              </div>
            )}
          </div>
        )}

        {/* Confirming spinner */}
        {step === 'confirming' && (
          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-12 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-8 h-8 rounded-full border-2 border-[rgba(200,179,142,0.2)] border-t-[#C8B38E] animate-spin" />
            <p className="font-inter text-[13px] text-[#ACA492]">Saving your portfolio…</p>
          </div>
        )}
      </div>
    </div>
  );
}
