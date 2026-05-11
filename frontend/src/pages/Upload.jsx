import React, { useState, useRef } from 'react';
import { uploadHoldingsCSV, uploadTransactionsCSV, uploadScreenshot } from '../lib/api.js';
import SectionHeader from '../components/SectionHeader.jsx';

function DropZone({ label, accept, onFile, status, result, icon }) {
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
      className={`dropzone ${dragging ? 'dragging' : ''} ${status}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}
      aria-label={`Upload ${label}`}
    >
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }} />

      <div className="dropzone-icon">{icon}</div>
      <div className="dropzone-label">{label}</div>
      <div className="dropzone-hint">
        {status === 'idle' && 'Drag & drop or click to browse'}
        {status === 'loading' && 'Processing...'}
        {status === 'success' && result && `${result.imported || result.recognized || 0} records imported`}
        {status === 'error' && result}
      </div>

      {status === 'loading' && <div className="dropzone-progress"><div className="dropzone-bar" /></div>}
      {status === 'success' && <div className="dropzone-check">Import complete</div>}
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

  async function handleHoldings(file) {
    setHoldingsStatus('loading');
    try {
      const res = await uploadHoldingsCSV(file);
      setHoldingsResult(res);
      setHoldingsStatus('success');
    } catch (err) {
      setHoldingsResult(err.message);
      setHoldingsStatus('error');
    }
  }

  async function handleTxn(file) {
    setTxnStatus('loading');
    try {
      const res = await uploadTransactionsCSV(file);
      setTxnResult(res);
      setTxnStatus('success');
    } catch (err) {
      setTxnResult(err.message);
      setTxnStatus('error');
    }
  }

  async function handleImage(file) {
    setImgStatus('loading');
    setPreview(URL.createObjectURL(file));
    try {
      const res = await uploadScreenshot(file);
      setImgResult(res);
      setImgStatus('success');
    } catch (err) {
      setImgResult(err.message);
      setImgStatus('error');
    }
  }

  const csvIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );

  const imgIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Import Portfolio</h1>
          <p className="page-subtitle">Upload broker exports or screenshots — AI parses and imports automatically</p>
        </div>
      </div>

      <div className="upload-grid">
        <div className="upload-section">
          <SectionHeader title="Holdings CSV" subtitle="Broker holdings export (.csv / .xlsx)" />
          <DropZone
            label="Holdings Export"
            accept=".csv,.xlsx"
            onFile={handleHoldings}
            status={holdingsStatus}
            result={holdingsResult}
            icon={csvIcon}
          />
          <p className="upload-hint">Columns needed: Ticker, Quantity, Avg Buy Price. Exchange optional.</p>
        </div>

        <div className="upload-section">
          <SectionHeader title="Transactions CSV" subtitle="Trade history export (.csv / .xlsx)" />
          <DropZone
            label="Transaction History"
            accept=".csv,.xlsx"
            onFile={handleTxn}
            status={txnStatus}
            result={txnResult}
            icon={csvIcon}
          />
          <p className="upload-hint">Columns needed: Ticker, Action (BUY/SELL), Qty, Price, Date.</p>
        </div>

        <div className="upload-section">
          <SectionHeader title="Screenshot" subtitle="AI vision reads your broker app screenshot" />
          <DropZone
            label="Portfolio Screenshot"
            accept="image/*"
            onFile={handleImage}
            status={imgStatus}
            result={typeof imgResult === 'string' ? imgResult : imgResult?.recognized}
            icon={imgIcon}
          />
          {preview && (
            <div className="img-preview">
              <img src={preview} alt="Uploaded screenshot" width="100%" height="auto" loading="lazy" />
              {imgStatus === 'success' && imgResult?.holdings && (
                <div className="img-result">
                  <p className="img-result-label">Recognised Holdings</p>
                  <ul className="img-result-list">
                    {imgResult.holdings.map((h, i) => (
                      <li key={i}>
                        <span className="ticker-badge">{h.ticker}</span>
                        <span>{h.quantity} units @ {h.avg_buy_price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <p className="upload-hint">Supports Zerodha, Groww, Upstox, Angel One screenshots.</p>
        </div>
      </div>

      {/* Format guide */}
      <div className="format-guide">
        <SectionHeader title="CSV Format Reference" subtitle="Column names accepted by WealthOS parser" />
        <div className="format-tables">
          <div className="format-table">
            <p className="format-table-label">Holdings CSV</p>
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
          <div className="format-table">
            <p className="format-table-label">Transactions CSV</p>
            <table className="data-table">
              <thead><tr><th>Column</th><th>Required</th><th>Example</th></tr></thead>
              <tbody>
                <tr><td>ticker / symbol</td><td>Yes</td><td>INFY.NS</td></tr>
                <tr><td>action / type</td><td>Yes</td><td>BUY / SELL</td></tr>
                <tr><td>quantity / qty</td><td>Yes</td><td>5</td></tr>
                <tr><td>price</td><td>Yes</td><td>1800.50</td></tr>
                <tr><td>date</td><td>Yes</td><td>2024-01-15</td></tr>
                <tr><td>broker</td><td>No</td><td>Zerodha</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
