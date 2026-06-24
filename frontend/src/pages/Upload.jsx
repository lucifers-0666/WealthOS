import React, { useEffect, useRef, useState } from 'react';
import { uploadHoldingsCSV, uploadTransactionsCSV, uploadScreenshot } from '../lib/api.js';
import { savePortfolioHoldings } from '../lib/portfolioStore.js';
import { FileSpreadsheet, Image as ImageIcon, UploadCloud, CheckCircle2, Clock3 } from 'lucide-react';
import { EmptyState } from '../components/PageStates.jsx';

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[2px] h-3 bg-[#C8B38E]"></div>
      <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ACA492]">
        {title}
      </h3>
    </div>
  );
}

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
      className={`p-6 rounded-[3px] border ${dragging ? 'border-[#C8B38E] bg-[rgba(200,179,142,0.05)]' : 'border-[#2D3C37] bg-[#172923]'} min-h-[240px] flex flex-col justify-center items-center text-center gap-3 cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.02)]`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
      <div className="w-12 h-12 rounded-[3px] border border-[#C8B38E] bg-[rgba(200,179,142,0.1)] flex items-center justify-center text-[#C8B38E] mb-2">
        {icon}
      </div>
      <div className="font-cinzel text-[16px] font-bold text-[#ECE0CC]">{label}</div>
      <div className="font-inter text-[12px] text-[#ACA492] leading-relaxed max-w-[80%]">{hint}</div>
      <div className="font-mono text-[11px] text-[#7B7C70] mt-2">
        {status === 'idle' && 'Drag & drop or click to browse'}
        {status === 'loading' && 'Processing securely…'}
        {status === 'success' && result && `${result.imported || result.recognized || 0} records processed`}
        {status === 'error' && <span className="text-[#B66A6A]">{result}</span>}
      </div>
      {status === 'loading' && (
        <div className="w-[60%] h-1 rounded-full bg-[#0A201F] overflow-hidden mt-2">
          <div className="h-full bg-[#C8B38E] w-1/2 animate-[pulseLine_1.2s_infinite]" />
        </div>
      )}
      {status === 'success' && (
        <div className="flex items-center gap-1.5 font-inter text-[11px] text-[#6FAE8D] mt-2 font-bold tracking-wide">
          <CheckCircle2 size={14} /> IMPORT COMPLETE
        </div>
      )}
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

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out] overflow-y-auto">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="max-w-[740px]">
            <h1 className="font-cinzel text-xl font-bold text-[#ECE0CC] tracking-wide">Data Ingestion</h1>
            <p className="font-inter text-[12px] text-[#7B7C70] mt-1">Upload broker exports or screenshots. Arca validates, parses, and surfaces the result in a clean preview.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-[#2D3C37] font-inter text-[11px] text-[#ACA492]">
            <UploadCloud size={14} /> OCR Ready
          </div>
        </div>

        {/* DROPZONES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DropZone label="Holdings CSV" accept=".csv,.xlsx" onFile={handleHoldings} status={holdingsStatus} result={holdingsResult} icon={<FileSpreadsheet size={20} />} hint="Columns needed: Ticker, Quantity, Avg Buy Price." />
          <DropZone label="Transactions CSV" accept=".csv,.xlsx" onFile={handleTxn} status={txnStatus} result={txnResult} icon={<FileSpreadsheet size={20} />} hint="Columns needed: Ticker, Action, Qty, Price, Date." />
          <DropZone label="Screenshot OCR" accept="image/*" onFile={handleImage} status={imgStatus} result={typeof imgResult === 'string' ? imgResult : imgResult?.recognized} icon={<ImageIcon size={20} />} hint="Supports portfolio screenshots from major brokers." />
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.9fr] gap-6 items-start mt-2">
          
          <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6">
            <SectionHeader title="ACCEPTED CSV STRUCTURE" />
            <div className="w-full overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2D3C37] font-inter text-[9px] uppercase tracking-[0.14em] text-[#7B7C70]">
                    <th className="py-3 font-normal">Column</th>
                    <th className="py-3 font-normal">Required</th>
                    <th className="py-3 font-normal">Example</th>
                  </tr>
                </thead>
                <tbody className="font-inter text-[12px] text-[#ECE0CC]">
                  <tr className="border-b border-[rgba(45,60,55,0.4)]">
                    <td className="py-3">ticker / symbol</td><td className="py-3">Yes</td><td className="py-3 font-mono text-[11px]">RELIANCE.NS</td>
                  </tr>
                  <tr className="border-b border-[rgba(45,60,55,0.4)]">
                    <td className="py-3">quantity / qty</td><td className="py-3">Yes</td><td className="py-3 font-mono text-[11px]">10</td>
                  </tr>
                  <tr className="border-b border-[rgba(45,60,55,0.4)]">
                    <td className="py-3">avg_buy_price / avg_price</td><td className="py-3">Yes</td><td className="py-3 font-mono text-[11px]">2450.00</td>
                  </tr>
                  <tr className="border-b border-[rgba(45,60,55,0.4)]">
                    <td className="py-3">exchange</td><td className="py-3 text-[#7B7C70]">No</td><td className="py-3 font-mono text-[11px]">NSE</td>
                  </tr>
                  <tr>
                    <td className="py-3">asset_class</td><td className="py-3 text-[#7B7C70]">No</td><td className="py-3 font-mono text-[11px]">equity</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6">
              <SectionHeader title="UPLOAD HISTORY" />
              <div className="flex flex-col gap-3 mt-4">
                {history.length ? history.map((item) => (
                  <div key={`${item.ts}-${item.kind}`} className="p-3 rounded-[3px] border border-[#2D3C37] bg-[#0A201F] flex justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="font-inter text-[12px] font-bold text-[#ECE0CC]">{item.kind}</div>
                      <div className="font-inter text-[11px] text-[#7B7C70]">{item.detail}</div>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#7B7C70]">
                      <Clock3 size={12} /> {new Date(item.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )) : <div className="font-inter text-[12px] text-[#7B7C70]">No uploads processed yet.</div>}
              </div>
            </div>

            {preview && (
              <div className="bg-[#172923] border border-[#2D3C37] rounded-[3px] p-6">
                <SectionHeader title="CAPTURED SCREENSHOT" />
                <img src={preview} alt="Uploaded screenshot" className="w-full rounded-[2px] border border-[#2D3C37] mt-4" />
                {imgStatus === 'success' && imgResult?.holdings && (
                  <div className="mt-6">
                    <SectionHeader title="RECOGNIZED HOLDINGS" />
                    <div className="flex flex-col gap-2 mt-4">
                      {imgResult.holdings.map((h, i) => (
                        <div key={i} className="flex justify-between items-center py-2 px-3 rounded-[2px] border border-[rgba(45,60,55,0.4)] bg-[#0A201F]">
                          <span className="font-inter text-[10px] uppercase tracking-wide text-[#C8B38E] border border-[#C8B38E] px-1.5 py-0.5 rounded-[2px] bg-[rgba(200,179,142,0.1)]">{h.ticker}</span>
                          <span className="font-inter text-[11px] text-[#ACA492]">{h.quantity} units @ {h.avg_buy_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!preview && imgStatus === 'idle' && (
              <div className="h-full">
                <EmptyState title="Awaiting screenshot preview" message="Upload a broker screenshot to see holdings extracted here." />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
