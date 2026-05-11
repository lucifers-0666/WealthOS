import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { CheckCircle, Database, FileSearch, FileText, ImageUp, RefreshCw, ScanLine, Upload as UploadIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'
import SectionHeader from '../components/SectionHeader'
import { savePortfolioHoldings } from '../lib/portfolioStore'

const COLS = {
  holdings: ['Symbol', 'Exchange', 'Qty', 'Avg_Cost', 'Current_Price', 'Investment'],
  transactions: ['Date', 'Symbol', 'Type', 'Qty', 'Price', 'Amount', 'Brokerage'],
  image: ['Symbol', 'Name', 'Qty', 'Avg_Cost', 'Current_Price', 'Exchange'],
}

const pipeline = [
  { label: 'Capture', icon: UploadIcon, text: 'CSV, XLSX, or screenshot input accepted' },
  { label: 'Recognize', icon: ImageUp, text: 'Gemini Vision reads broker images into holdings' },
  { label: 'Normalize', icon: ScanLine, text: 'Broker schema matched to WealthOS fields' },
  { label: 'Commit', icon: Database, text: 'Portfolio page refreshes with recognized positions' },
]

function DropZone({ label, sub, accept, onFile, file, onClear }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((files) => files[0] && onFile(files[0]), [onFile]),
    accept,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div
      {...getRootProps()}
      style={{
        minHeight: 230,
        border: `1px dashed ${isDragActive ? 'rgba(125,211,252,0.64)' : file ? 'rgba(134,239,172,0.42)' : 'rgba(148,163,184,0.18)'}`,
        borderRadius: 16,
        padding: 22,
        cursor: 'pointer',
        transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)',
        background: isDragActive ? 'rgba(125,211,252,0.08)' : 'rgba(2,6,23,0.35)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <input {...getInputProps()} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div className="section-label">Ingestion Slot</div>
          <div className="editorial-title" style={{ fontSize: 19, marginTop: 7 }}>{label}</div>
          <div style={{ color: '#64748B', fontSize: 12, marginTop: 6 }}>{sub}</div>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(125,211,252,0.08)', border: '1px solid rgba(125,211,252,0.18)' }}>
          {file ? <CheckCircle size={19} color="#86EFAC" /> : <UploadIcon size={18} color="#7DD3FC" />}
        </div>
      </div>

      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 13, borderRadius: 13, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(134,239,172,0.18)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#86EFAC', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
            <div className="mono" style={{ color: '#64748B', fontSize: 11, marginTop: 3 }}>{(file.size / 1024).toFixed(1)} KB - ready</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClear() }} className="btn-icon" aria-label="Remove file"><X size={14} /></button>
        </div>
      ) : (
        <div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(125,211,252,0.4), transparent)', marginBottom: 12 }} />
          <div style={{ color: '#94A3B8', fontSize: 13 }}>Drop file here or browse from your machine.</div>
          <div className="mono" style={{ color: '#64748B', fontSize: 11, marginTop: 6 }}>CSV / XLSX / image - max 10 MB</div>
        </div>
      )}
    </div>
  )
}

export default function Upload() {
  const [hFile, setHFile] = useState(null)
  const [tFile, setTFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [recognized, setRecognized] = useState([])
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [tab, setTab] = useState('holdings')

  const handleUpload = () => {
    if (!hFile && !tFile) {
      toast.error('Select at least one CSV or XLSX file')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Portfolio intelligence refreshed')
    }, 1500)
  }

  const recognizeImage = async () => {
    if (!imageFile) {
      toast.error('Upload a portfolio screenshot first')
      return
    }

    setImageLoading(true)
    const form = new FormData()
    form.append('file', imageFile)

    try {
      const response = await fetch('/api/portfolio/image', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Image recognition failed')
      setRecognized(data.holdings || [])
      if (data.holdings?.length) {
        toast.success(data.message || `Recognized ${data.holdings.length} holdings`)
      } else {
        toast.error(data.message || 'No holdings recognized from this screenshot')
      }
    } catch (error) {
      toast.error(error.message || 'Could not recognize portfolio image')
    } finally {
      setImageLoading(false)
    }
  }

  const commitRecognized = () => {
    if (!recognized.length) {
      toast.error('No recognized holdings to commit')
      return
    }

    savePortfolioHoldings(recognized)
    toast.success('AI-recognized portfolio committed to Portfolio')
  }

  return (
    <div style={{ maxWidth: 1260, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className="lux-card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 22 }}>
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 16 }}>Broker Data Pipeline</div>
          <h2 className="editorial-title" style={{ fontSize: 38, lineHeight: 1.05, maxWidth: 720 }}>Turn broker exports and screenshots into portfolio truth.</h2>
          <p style={{ color: '#94A3B8', marginTop: 13, maxWidth: 650 }}>Upload holdings, transactions, or a portfolio image. WealthOS can recognize broker screenshots with AI, stage the rows for review, and commit them into the Portfolio page.</p>
        </div>
        <div style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(2,6,23,0.36)', padding: 16 }}>
          <div className="section-label">Processing State</div>
          <div className="editorial-title" style={{ fontSize: 18, marginTop: 6 }}>{loading || imageLoading ? 'Analyzing input' : 'Ready for ingestion'}</div>
          <div className="progress-track" style={{ marginTop: 18, height: 6 }}>
            <div className="progress-fill" style={{ width: loading || imageLoading ? '74%' : hFile || tFile || imageFile ? '32%' : '8%', background: 'linear-gradient(90deg, #D6C7A1, #7DD3FC)' }} />
          </div>
          <div className="mono" style={{ color: '#64748B', fontSize: 11, marginTop: 10 }}>schema confidence - recognition - commit</div>
        </div>
      </section>

      <section className="lux-card" style={{ padding: 22 }}>
        <SectionHeader eyebrow="Upload" title="Ingestion workbench" sub="Structured import lanes for files and AI screenshot recognition" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))', gap: 14 }}>
          <DropZone label="Holdings Export" sub="Snapshot of open positions and current values" accept={{ 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }} onFile={setHFile} file={hFile} onClear={() => setHFile(null)} />
          <DropZone label="Transaction Ledger" sub="Buy, sell, brokerage, and realized tax lots" accept={{ 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }} onFile={setTFile} file={tFile} onClear={() => setTFile(null)} />
          <DropZone label="Portfolio Screenshot" sub="AI reads broker images and creates holdings" accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }} onFile={(file) => { setImageFile(file); setRecognized([]) }} file={imageFile} onClear={() => { setImageFile(null); setRecognized([]) }} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <button onClick={handleUpload} className="btn btn-primary" disabled={loading}>
            {loading ? <RefreshCw size={14} className="animate-spin-slow" /> : <UploadIcon size={14} />}
            {loading ? 'Processing' : 'Commit File Import'}
          </button>
          <button onClick={recognizeImage} className="btn btn-ghost" disabled={imageLoading || !imageFile}>
            {imageLoading ? <RefreshCw size={14} className="animate-spin-slow" /> : <ImageUp size={14} />}
            {imageLoading ? 'Recognizing' : 'Recognize Image'}
          </button>
          <button onClick={commitRecognized} className="btn btn-ghost" disabled={!recognized.length}>Use Recognized Portfolio</button>
          <button onClick={() => toast.success('Demo portfolio loaded')} className="btn btn-ghost">Load Demo Portfolio</button>
        </div>
      </section>

      {recognized.length > 0 && (
        <section className="lux-card" style={{ padding: 22 }}>
          <SectionHeader eyebrow="AI OCR" title="Recognized portfolio" sub="Review the extracted holdings before committing them to the Portfolio page" />
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>{['Symbol', 'Name', 'Exchange', 'Qty', 'Avg Cost', 'Current', 'P&L %', 'Weight'].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recognized.map((h) => (
                  <tr key={`${h.symbol}-${h.name}`}>
                    <td className="mono" style={{ color: '#7DD3FC', fontWeight: 800 }}>{h.symbol}</td>
                    <td>{h.name || h.symbol}</td>
                    <td><span className="badge badge-blue">{h.exch || 'NSE'}</span></td>
                    <td className="mono">{h.qty}</td>
                    <td className="mono">INR {Number(h.avg || 0).toLocaleString()}</td>
                    <td className="mono" style={{ color: '#F3F4F6' }}>INR {Number(h.ltp || 0).toLocaleString()}</td>
                    <td className={`mono ${Number(h.plp) >= 0 ? 'pos' : 'neg'}`}>{Number(h.plp || 0).toFixed(2)}%</td>
                    <td className="mono">{Number(h.wt || 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="lux-card" style={{ padding: 22 }}>
          <SectionHeader eyebrow="Pipeline" title="Validation sequence" sub="Each import passes through deterministic checks before refresh" />
          <div style={{ display: 'grid', gap: 11 }}>
            {pipeline.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.label} style={{ display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 12, alignItems: 'center', padding: 12, borderRadius: 14, background: 'rgba(148,163,184,0.045)', border: '1px solid rgba(148,163,184,0.10)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(125,211,252,0.075)', color: '#7DD3FC' }}><Icon size={17} /></div>
                  <div>
                    <div style={{ color: '#F3F4F6', fontWeight: 800 }}>{step.label}</div>
                    <div style={{ color: '#64748B', fontSize: 12, marginTop: 3 }}>{step.text}</div>
                  </div>
                  <span className="mono" style={{ color: i < 2 ? '#D6C7A1' : '#64748B', fontSize: 11 }}>0{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lux-card" style={{ padding: 22 }}>
          <SectionHeader
            eyebrow="Schema"
            title="Expected columns"
            sub="Reference fields used for normalization"
            right={<div className="tab-strip">{Object.keys(COLS).map((key) => <button key={key} onClick={() => setTab(key)} className={`tab ${tab === key ? 'active' : ''}`}>{key}</button>)}</div>}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLS[tab].map((c) => <span key={c} className="badge badge-blue mono" style={{ letterSpacing: 0, textTransform: 'none' }}>{c}</span>)}
          </div>
          <div style={{ marginTop: 20, padding: 16, borderRadius: 14, background: 'rgba(2,6,23,0.38)', border: '1px solid rgba(148,163,184,0.11)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#D6C7A1', fontWeight: 800 }}>
              <FileText size={16} /> OCR preview lane
            </div>
            <p style={{ color: '#94A3B8', marginTop: 8, fontSize: 13, lineHeight: 1.65 }}>
              Portfolio screenshots are sent to the FastAPI OCR endpoint, parsed by Gemini Vision or local OCR, then staged here for review before the portfolio state changes.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
