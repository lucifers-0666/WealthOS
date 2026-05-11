import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Key, LockKeyhole, RefreshCw, Save, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import SectionHeader from '../components/SectionHeader'
import { TARGET } from '../lib/data'

function ApiField({ label, placeholder, hint }) {
  const [show, setShow] = useState(false)
  const [val, setVal] = useState('')

  return (
    <div style={{ display: 'grid', gap: 7 }}>
      <label className="section-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <Key size={14} color="#64748B" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input className="input mono" type={show ? 'text' : 'password'} value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} style={{ paddingLeft: 38, paddingRight: 42 }} />
        <button onClick={() => setShow((s) => !s)} className="btn-icon" style={{ position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent' }} aria-label="Toggle secret visibility">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <div style={{ color: '#64748B', fontSize: 12 }}>{hint}</div>
    </div>
  )
}

export default function Settings() {
  const [targets, setTargets] = useState(TARGET)
  const [apiHealth, setApiHealth] = useState(null)
  const total = targets.reduce((sum, item) => sum + item.target, 0)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setApiHealth)
      .catch(() => setApiHealth({ status: 'offline' }))
  }, [])

  const save = () => {
    if (Math.abs(total - 100) > 0.5) {
      toast.error(`Targets must sum to 100%. Current total is ${total}%.`)
      return
    }
    toast.success('System settings saved')
  }

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className="lux-card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 22 }}>
        <div>
          <span className="badge badge-gold">System Control</span>
          <h2 className="editorial-title" style={{ fontSize: 36, lineHeight: 1.06, marginTop: 16, maxWidth: 720 }}>Private configuration for market data, AI reasoning, and allocation policy.</h2>
          <p style={{ color: '#94A3B8', marginTop: 13, maxWidth: 650 }}>A restrained control surface for credentials and portfolio targets without breaking the terminal aesthetic.</p>
        </div>
        <div style={{ borderRadius: 16, border: '1px solid rgba(134,239,172,0.16)', background: 'rgba(34,197,94,0.055)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#86EFAC', fontWeight: 800 }}><LockKeyhole size={16} /> Local Secret Boundary</div>
          <p style={{ color: '#94A3B8', marginTop: 9, fontSize: 13, lineHeight: 1.6 }}>Keys are intended for environment configuration and should never be committed or exposed through frontend bundles.</p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 14 }}>
        <motion.div className="lux-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 22 }}>
          <SectionHeader eyebrow="Credentials" title="API key vault" sub="Premium terminal fields with controlled visibility" right={<Key size={16} color="#D6C7A1" />} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
            {[
              ['Gemini', apiHealth?.gemini_configured],
              ['NewsAPI', apiHealth?.news_configured],
              ['Alpha Vantage', apiHealth?.alpha_vantage_configured],
            ].map(([label, ok]) => (
              <div key={label} style={{ padding: 12, borderRadius: 13, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(2,6,23,0.34)' }}>
                <div className="section-label">{label}</div>
                <div style={{ marginTop: 7 }}><span className={`badge ${ok ? 'badge-green' : 'badge-red'}`}>{apiHealth ? ok ? 'Loaded' : 'Missing' : 'Checking'}</span></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 18 }}>
            <ApiField label="Google Gemini API Key" placeholder="AIza..." hint="Used by the AI analyst for portfolio-aware reasoning." />
            <ApiField label="NewsAPI Key" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" hint="Used for editorial market intelligence ingestion." />
            <ApiField label="Alpha Vantage Key" placeholder="DEMO or your key" hint="Fallback price and market data source." />
          </div>
          <button onClick={save} className="btn btn-primary" style={{ marginTop: 20 }}><Save size={14} /> Save Keys</button>
        </motion.div>

        <motion.div className="lux-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ padding: 22 }}>
          <SectionHeader
            eyebrow="Policy"
            title="Target allocation"
            sub={`Current total: ${total}%`}
            right={<SlidersHorizontal size={16} color={Math.abs(total - 100) > 0.5 ? '#FDA4AF' : '#86EFAC'} />}
          />
          <div style={{ display: 'grid', gap: 16 }}>
            {targets.map((t, i) => (
              <div key={t.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <label style={{ color: '#F3F4F6', fontWeight: 700, fontSize: 13 }}>{t.name}</label>
                  <span className="mono" style={{ color: '#7DD3FC', fontWeight: 700 }}>{t.target}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={t.target}
                  onChange={(e) => setTargets((items) => items.map((x, j) => j === i ? { ...x, target: +e.target.value } : x))}
                  style={{ width: '100%', accentColor: '#7DD3FC' }}
                />
                <div className="progress-track" style={{ marginTop: 7 }}>
                  <div className="progress-fill" style={{ width: `${t.target}%`, background: 'linear-gradient(90deg, #D6C7A1, #7DD3FC)' }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={save} className="btn btn-primary" style={{ marginTop: 20 }}><RefreshCw size={14} /> Save Targets</button>
        </motion.div>
      </section>
    </div>
  )
}
