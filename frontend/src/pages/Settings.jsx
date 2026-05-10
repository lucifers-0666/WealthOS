import { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, Save, Eye, EyeOff, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import SectionHeader from '../components/SectionHeader'
import { TARGET } from '../lib/data'

function ApiField({ label, placeholder, hint }) {
  const [show, setShow] = useState(false)
  const [val, setVal]   = useState('')
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:12, fontWeight:500, color:'#94A3B8' }}>{label}</label>
      <div style={{ position:'relative' }}>
        <Key size={12} color="#475569" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
        <input className="input" type={show?'text':'password'} value={val} onChange={e=>setVal(e.target.value)} placeholder={placeholder} style={{ paddingLeft:32, paddingRight:40, fontFamily:'JetBrains Mono', fontSize:12 }} />
        <button onClick={() => setShow(s=>!s)} className="btn-icon" style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', border:'none', background:'none', padding:6 }}>
          {show ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>
      <div style={{ fontSize:11, color:'#475569' }}>{hint}</div>
    </div>
  )
}

export default function Settings() {
  const [targets, setTargets] = useState(TARGET)
  const total = targets.reduce((s,t) => s+t.target, 0)

  const save = () => {
    if (Math.abs(total-100) > 0.5) { toast.error(`Targets must sum to 100% (currently ${total}%)`); return }
    toast.success('Settings saved')
  }

  return (
    <div style={{ maxWidth:680, display:'flex', flexDirection:'column', gap:24 }}>
      <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} style={{ padding:'24px' }}>
        <SectionHeader title="API Keys" sub="Stored in .env — never sent to frontend" right={<Key size={14} color="#475569" />} />
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <ApiField label="Google Gemini API Key" placeholder="AIza..." hint="aistudio.google.com/app/apikey — Gemini 1.5 Pro for AI CFO" />
          <ApiField label="NewsAPI Key" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" hint="newsapi.org — free tier: 100 req/day" />
          <ApiField label="Alpha Vantage Key" placeholder="DEMO or your key" hint="alphavantage.co — fallback price source" />
        </div>
        <button onClick={save} className="btn btn-primary" style={{ marginTop:20 }}><Save size={13} /> Save Keys</button>
      </motion.div>

      <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} style={{ padding:'24px' }}>
        <SectionHeader title="Target Allocation" sub={`Total: ${total}% ${Math.abs(total-100)>0.5 ? '\u26a0\ufe0f must equal 100%' : '\u2713'}`} right={<RefreshCw size={14} color="#475569" />} />
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {targets.map((t,i) => (
            <div key={t.name}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <label style={{ fontSize:13, color:'#94A3B8' }}>{t.name}</label>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:600, color:'#60A5FA' }}>{t.target}%</span>
              </div>
              <input type="range" min={0} max={60} step={1} value={t.target}
                onChange={e => setTargets(ts => ts.map((x,j) => j===i ? {...x,target:+e.target.value} : x))}
                style={{ width:'100%', accentColor:'#3B82F6' }} />
            </div>
          ))}
        </div>
        <button onClick={save} className="btn btn-primary" style={{ marginTop:20 }}><Save size={13} /> Save Targets</button>
      </motion.div>
    </div>
  )
}
