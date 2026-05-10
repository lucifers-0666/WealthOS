import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload as UploadIcon, FileText, CheckCircle, X, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import SectionHeader from '../components/SectionHeader'

function DropZone({ label, sub, accept, onFile, file, onClear }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(f => f[0] && onFile(f[0]), [onFile]),
    accept, maxFiles:1, maxSize:10*1024*1024
  })
  return (
    <div {...getRootProps()} style={{ border:`2px dashed ${isDragActive ? '#3B82F6' : file ? 'rgba(52,211,153,0.4)' : 'rgba(148,163,184,0.2)'}`, borderRadius:12, padding:'32px 24px', textAlign:'center', cursor:'pointer', transition:'all 220ms', background: isDragActive ? 'rgba(59,130,246,0.05)' : file ? 'rgba(52,211,153,0.04)' : 'rgba(11,17,32,0.3)' }}>
      <input {...getInputProps()} />
      {file ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <CheckCircle size={28} color="#34D399" />
          <div style={{ fontSize:13, fontWeight:600, color:'#34D399' }}>{file.name}</div>
          <div style={{ fontSize:11, color:'#475569' }}>{(file.size/1024).toFixed(1)} KB</div>
          <button onClick={e => { e.stopPropagation(); onClear() }} className="btn-icon" style={{ marginTop:4 }}><X size={12} /></button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <UploadIcon size={20} color="#3B82F6" />
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:'#F8FAFC' }}>{label}</div>
          <div style={{ fontSize:12, color:'#475569' }}>{sub}</div>
          <div style={{ fontSize:10, color:'#3B82F6', marginTop:4 }}>CSV or XLSX · max 10 MB</div>
        </div>
      )}
    </div>
  )
}

const COLS = {
  holdings:     ['Symbol','Exchange','Qty','Avg_Cost','Current_Price','Investment'],
  transactions: ['Date','Symbol','Type','Qty','Price','Amount','Brokerage'],
}

export default function Upload() {
  const [hFile, setHFile] = useState(null)
  const [tFile, setTFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = () => {
    if (!hFile && !tFile) { toast.error('Select at least one file'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Portfolio updated successfully')
    }, 1600)
  }

  const loadDemo = () => {
    toast.success('Demo portfolio loaded — 7 positions across NSE + NYSE')
  }

  return (
    <div style={{ maxWidth:780, display:'flex', flexDirection:'column', gap:24 }}>
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
        <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:22, color:'#F8FAFC', marginBottom:6 }}>Import Data</div>
        <div style={{ fontSize:13, color:'#475569' }}>Upload your broker exports. Supports Zerodha, Groww, HDFC Securities, ICICI Direct, Kite CSV/XLSX.</div>
      </motion.div>

      <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} style={{ padding:'24px' }}>
        <SectionHeader title="Upload Files" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <DropZone label="Holdings Export" sub="Snapshot of current positions" accept={{ 'text/csv':['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'] }} onFile={setHFile} file={hFile} onClear={() => setHFile(null)} />
          <DropZone label="Transaction History" sub="Buy/sell log for P&L tracking" accept={{ 'text/csv':['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx'] }} onFile={setTFile} file={tFile} onClear={() => setTFile(null)} />
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={handleUpload} className="btn btn-primary" disabled={loading}>
            {loading ? <RefreshCw size={13} className="animate-spin-slow" /> : <UploadIcon size={13} />}
            {loading ? 'Processing...' : 'Upload & Refresh'}
          </button>
          <button onClick={loadDemo} className="btn btn-ghost">Load Demo Portfolio</button>
        </div>
      </motion.div>

      {['holdings','transactions'].map((type,i) => (
        <motion.div key={type} className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2+i*0.08 }} style={{ padding:'22px' }}>
          <SectionHeader title={`Expected ${type.charAt(0).toUpperCase()+type.slice(1)} Format`} right={<FileText size={14} color="#475569" />} />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {COLS[type].map(c => <span key={c} className="badge badge-blue" style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>{c}</span>)}
          </div>
          <p style={{ marginTop:12, fontSize:12, color:'#475569', lineHeight:1.7 }}>
            {type==='holdings' ? 'Export from Zerodha: Console → Holdings → Download CSV. Groww: Investments → Portfolio → Export.' : 'Export from Zerodha: Console → Reports → Tradebook. Date range: last 2 years for full LTCG visibility.'}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
