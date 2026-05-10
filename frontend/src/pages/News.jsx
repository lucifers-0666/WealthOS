import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ExternalLink, RefreshCw } from 'lucide-react'
import { NEWS } from '../lib/data'

const CATS = ['All', ...new Set(NEWS.map(n => n.cat))]
const SENT_CFG = { positive:{ cls:'badge-green', label:'Bullish' }, negative:{ cls:'badge-red', label:'Bearish' }, neutral:{ cls:'badge-gray', label:'Neutral' } }

export default function News() {
  const [cat, setCat]     = useState('All')
  const [query, setQuery] = useState('')
  const filtered = NEWS.filter(n => (cat==='All' || n.cat===cat) && (n.title+n.summary).toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 240px' }}>
          <Search size={13} color="#475569" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
          <input className="input" style={{ paddingLeft:34 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search news..." />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ fontSize:11, fontWeight:500, padding:'6px 14px', borderRadius:8, cursor:'pointer', transition:'all 180ms',
                background: cat===c ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.06)',
                border:`1px solid ${cat===c ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.15)'}`,
                color: cat===c ? '#60A5FA' : '#94A3B8' }}>{c}</button>
          ))}
        </div>
        <button className="btn-icon"><RefreshCw size={13} /></button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
        {filtered.map((n,i) => {
          const sc = SENT_CFG[n.sent] || SENT_CFG.neutral
          return (
            <motion.div key={n.id} className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <span className="badge badge-blue" style={{ fontSize:10, flexShrink:0 }}>{n.cat}</span>
                <span className={`badge ${sc.cls}`} style={{ fontSize:10, flexShrink:0 }}>{sc.label}</span>
              </div>
              <div style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:13, color:'#F8FAFC', lineHeight:1.45 }}>{n.title}</div>
              <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6 }}>{n.summary}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', paddingTop:8, borderTop:'1px solid rgba(148,163,184,0.1)' }}>
                <div style={{ fontSize:11, color:'#475569' }}>{n.source} · {n.time}</div>
                <a href="#" target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#3B82F6', textDecoration:'none' }}>
                  Read <ExternalLink size={10} />
                </a>
              </div>
            </motion.div>
          )
        })}
      </div>
      {filtered.length === 0 && <div style={{ textAlign:'center', padding:'48px 0', color:'#475569' }}>No news matching your filters.</div>}
    </div>
  )
}
