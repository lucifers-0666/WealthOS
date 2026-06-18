import React, { useEffect, useRef, useState } from 'react';
import { uploadHoldingsCSV, uploadTransactionsCSV, uploadScreenshot } from '../lib/api.js';
import { savePortfolioHoldings } from '../lib/portfolioStore.js';
import { theme, panelStyle } from '../lib/theme.js';
import { FileSpreadsheet, Image as ImageIcon, UploadCloud, CheckCircle2, Clock3 } from 'lucide-react';
import { EmptyState } from '../components/PageStates.jsx';

function DropZone({ label, accept, onFile, status, result, icon, hint }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}
      aria-label={`Upload ${label}`}
      style={{
        padding: 18,
        borderRadius: 3,
        border: `1px solid ${dragging ? 'var(--greek-gold)' : 'var(--border)'}`,
        background: dragging ? 'rgba(212,160,23,0.06)' : 'rgba(212,160,23,0.02)',
        minHeight: 240,
        display: 'grid',
        alignContent: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
      <div style={{ width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(212,160,23,0.1)', color: 'var(--greek-gold)' }}>
        {icon}
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-serif)' }}>{label}</div>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 13 }}>{hint}</div>
      <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>
        {status === 'idle' && 'Drag & drop or click to browse'}
        {status === 'loading' && 'Processing securely…'}
        {status === 'success' && result && `${result.imported || result.recognized || 0} records processed`}
        {status === 'error' && result}
      </div>
      {status === 'loading' && <div style={{ height: 4, borderRadius: 999, overflow: 'hidden', background: 'rgba(212,160,23,0.06)' }}><div style={{ width: '62%', height: '100%', background: 'var(--greek-gold)', animation: 'pulseLine 1.2s infinite' }} /></div>}
      {status === 'success' && <div style={{ color: 'var(--aegean-green)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> Import complete</div>}
    </div>
  );
}

export default function Upload() {
  const [holdingsStatus, setHoldingsStatus] = useState('idle');
  const [holdingsResult, setHoldingsResult] = useState(null);
  const [txnStatus, setTxnStatus] = useState('idle');
  const [txnResult, setTxnResult] = useState(null);
  const [imgStatus, setImgStatus] = useState('idle');
  const [imgResult, setImgResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const record = (kind, detail) => {
    setHistory((prev) => [{ kind, detail, ts: new Date().toISOString() }, ...prev].slice(0, 6));
  };

  async function handleHoldings(file) {
    setHoldingsStatus('loading');
    try {
      const res = await uploadHoldingsCSV(file);
      if (Array.isArray(res.holdings) && res.holdings.length) savePortfolioHoldings(res.holdings);
      setHoldingsResult(res);
      setHoldingsStatus('success');
      record('Holdings CSV', `${res.imported || 0} rows processed`);
    } catch (err) {
      setHoldingsResult(err.message);
      setHoldingsStatus('error');
      record('Holdings CSV', `Failed · ${err.message}`);
    }
  }

  async function handleTxn(file) {
    setTxnStatus('loading');
    try {
      const res = await uploadTransactionsCSV(file);
      setTxnResult(res);
      setTxnStatus('success');
      record('Transactions CSV', `${res.imported || 0} rows processed`);
    } catch (err) {
      setTxnResult(err.message);
      setTxnStatus('error');
      record('Transactions CSV', `Failed · ${err.message}`);
    }
  }

  async function handleImage(file) {
    setImgStatus('loading');
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    try {
      const res = await uploadScreenshot(file);
      if (Array.isArray(res.holdings) && res.holdings.length) savePortfolioHoldings(res.holdings);
      setImgResult(res);
      setImgStatus('success');
      record('OCR screenshot', `${res.recognized || res.holdings?.length || 0} holdings detected`);
    } catch (err) {
      setImgResult(err.message);
      setImgStatus('error');
      record('OCR screenshot', `Failed · ${err.message}`);
    }
  }

  const csvIcon = <FileSpreadsheet size={18} />;
  const imgIcon = <ImageIcon size={18} />;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ ...panelStyle({ padding: 24 }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 740 }}>
            <div className="section-label" style={{ color: 'var(--text-faint)' }}>Secure ingestion</div>
            <h2 className="editorial-title" style={{ margin: '8px 0 0', fontSize: 'clamp(2rem, 3vw, 3rem)', fontFamily: 'var(--font-serif)', color: 'var(--parchment)' }}>Import holdings with a calm, enterprise-grade workflow.</h2>
            <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', lineHeight: 1.65 }}>Upload broker exports or screenshots. Arca validates, parses, and surfaces the result in a clean preview.</p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 3, border: `1px solid var(--border)`, color: 'var(--text-secondary)' }}>
            <UploadCloud size={15} /> OCR ready
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        <DropZone label="Holdings CSV" accept=".csv,.xlsx" onFile={handleHoldings} status={holdingsStatus} result={holdingsResult} icon={csvIcon} hint="Columns needed: Ticker, Quantity, Avg Buy Price. Exchange optional." />
        <DropZone label="Transactions CSV" accept=".csv,.xlsx" onFile={handleTxn} status={txnStatus} result={txnResult} icon={csvIcon} hint="Columns needed: Ticker, Action, Qty, Price, Date." />
        <DropZone label="Screenshot OCR" accept="image/*" onFile={handleImage} status={imgStatus} result={typeof imgResult === 'string' ? imgResult : imgResult?.recognized} icon={imgIcon} hint="Supports portfolio screenshots from major brokers." />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: 18, alignItems: 'start' }}>
        <div style={{ ...panelStyle({ padding: 20 }) }}>
          <div className="section-label">Reference format</div>
          <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Accepted CSV structure</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Column</th><th>Required</th><th>Example</th></tr></thead>
              <tbody>
                <tr><td>ticker / symbol</td><td>Yes</td><td>RELIANCE.NS</td></tr>
                <tr><td>quantity / qty</td><td>Yes</td><td>10</td></tr>
                <tr><td>avg_buy_price / avg_price</td><td>Yes</td><td>2450.00</td></tr>
                <tr><td>exchange</td><td>No</td><td>NSE</td></tr>
                <tr><td>asset_class</td><td>No</td><td>equity</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Upload history</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Recent actions</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {history.length ? history.map((item) => (
                <div key={`${item.ts}-${item.kind}`} style={{ padding: 14, borderRadius: 3, border: `1px solid var(--border)`, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.kind}</div>
                    <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 4 }}>{item.detail}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-faint)', fontSize: 12 }}>
                    <Clock3 size={13} /> {new Date(item.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )) : <div style={{ color: 'var(--text-faint)' }}>No uploads processed yet.</div>}
            </div>
          </div>

          {preview && (
            <div style={{ ...panelStyle({ padding: 20 }) }}>
              <div className="section-label">Preview</div>
              <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Captured screenshot</h3>
              <img src={preview} alt="Uploaded screenshot" style={{ width: '100%', borderRadius: 3, border: `1px solid var(--border)` }} />
              {imgStatus === 'success' && imgResult?.holdings && (
                <div style={{ marginTop: 14 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>Recognized holdings</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {imgResult.holdings.map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 3, border: `1px solid var(--border)` }}>
                        <span className="badge badge-gold">{h.ticker}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{h.quantity} units @ {h.avg_buy_price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!preview && imgStatus === 'idle' && <EmptyState title="Awaiting screenshot preview" message="Upload a broker screenshot to see holdings extracted here." />}
        </div>
      </section>
    </div>
  );
}
