import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Target } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import { HOLDINGS, TARGET, ALLOC } from '../lib/data'

const PL_DATA = HOLDINGS.map(h => ({ name:h.symbol, pl:h.pl, plp:h.plp, color: h.plp>=0 ? '#34D399' : '#F87171' }))

const METRICS = [
  { label:'CAGR (2Y)',    value:'18.4%', up:true  },
  { label:'Sharpe',      value:'1.42',  up:true  },
  { label:'Beta',        value:'0.87',  up:true  },
  { label:'Volatility',  value:'14.2%', up:false },
  { label:'Alpha',       value:'+3.8%', up:true  },
]

export default function Portfolio() {
  const [sort, setSort] = useState('plp')
  const sorted = [...HOLDINGS].sort((a,b) => sort==='plp' ? b.plp-a.plp : b.wt-a.wt)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Metrics strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
        {METRICS.map((m,i) => (
          <motion.div key={m.label} className="card" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
            style={{ padding:'14px 16px', textAlign:'center' }}>
            <div className="section-label" style={{ marginBottom:8 }}>{m.label}</div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:20, color: m.up ? '#34D399' : '#F87171' }}>{m.value}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* P&L Chart */}
        <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} style={{ padding:'22px' }}>
          <SectionHeader title="Unrealised P&L by Position" sub="Green = profit, Red = loss" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PL_DATA} layout="vertical" margin={{ left:10, right:10 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.07)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v>=0?'+':''}${(v/1000).toFixed(0)}k`} tick={{ fontSize:10, fill:'#475569' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#60A5FA', fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'P&L']} contentStyle={{ background:'rgba(11,17,32,0.95)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="pl" radius={[0,4,4,0]}>
                {PL_DATA.map((e,i) => <rect key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Target vs Actual */}
        <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} style={{ padding:'22px' }}>
          <SectionHeader title="Target vs Actual Allocation" right={<Target size={14} color="#3B82F6" />} />
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {TARGET.map(t => {
              const dev = (t.actual - t.target).toFixed(1)
              const over = parseFloat(dev) > 1
              const under = parseFloat(dev) < -1
              return (
                <div key={t.name}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:'#94A3B8' }}>{t.name}</span>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:11, color:'#475569', fontFamily:'JetBrains Mono' }}>Target {t.target}%</span>
                      <span style={{ fontSize:11, fontFamily:'JetBrains Mono', fontWeight:600,
                        color: over ? '#FBBF24' : under ? '#22D3EE' : '#34D399' }}>
                        {dev > 0 ? '+' : ''}{dev}%
                      </span>
                    </div>
                  </div>
                  <div style={{ position:'relative', height:8, background:'rgba(148,163,184,0.1)', borderRadius:99 }}>
                    <div style={{ position:'absolute', left:0, top:0, height:'100%', borderRadius:99, background:'rgba(148,163,184,0.2)', width:`${t.target}%`, transition:'width 600ms' }} />
                    <div style={{ position:'absolute', left:0, top:0, height:'100%', borderRadius:99,
                      background: over ? 'linear-gradient(90deg,#3B82F6,#FBBF24)' : under ? 'linear-gradient(90deg,#3B82F6,#22D3EE)' : '#3B82F6',
                      width:`${t.actual}%`, transition:'width 600ms' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Full Holdings Table */}
      <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} style={{ padding:'22px' }}>
        <SectionHeader title="All Positions" sub="Live prices via yfinance" right={
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setSort('plp')} className={`btn ${sort==='plp'?'btn-primary':'btn-ghost'}`} style={{ fontSize:11, padding:'5px 12px' }}>Sort by P&L%</button>
            <button onClick={() => setSort('wt')} className={`btn ${sort==='wt'?'btn-primary':'btn-ghost'}`} style={{ fontSize:11, padding:'5px 12px' }}>Sort by Weight</button>
          </div>} />
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:'1px solid rgba(148,163,184,0.12)' }}>
              {['Symbol','Exchange','Qty','Avg Cost','LTP','Invested','Curr. Val','P&L (₹)','P&L %','Weight'].map(h => (
                <th key={h} style={{ padding:'8px 12px', fontSize:10, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap', textAlign:'left' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sorted.map(h => (
                <tr key={h.symbol} style={{ borderBottom:'1px solid rgba(148,163,184,0.07)', transition:'background 150ms' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.04)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, fontWeight:700, color:'#60A5FA' }}>{h.symbol}</td>
                  <td style={{ padding:'10px 12px' }}><span className="badge badge-blue">{h.exch}</span></td>
                  <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, color:'#94A3B8' }}>{h.qty}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, color:'#94A3B8' }}>₹{h.avg.toLocaleString()}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, color:'#F8FAFC', fontWeight:600 }}>₹{h.ltp.toLocaleString()}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, color:'#94A3B8' }}>₹{(h.qty*h.avg).toLocaleString()}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, color:'#F8FAFC' }}>₹{(h.qty*h.ltp).toLocaleString()}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, color: h.pl>=0?'#34D399':'#F87171', fontWeight:600 }}>{h.pl>=0?'+':''}₹{Math.abs(h.pl).toLocaleString()}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'JetBrains Mono', fontSize:12, color: h.plp>=0?'#34D399':'#F87171', fontWeight:600 }}>{h.plp>=0?'+':''}{h.plp}%</td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div className="progress-track" style={{ width:64 }}><div className="progress-fill" style={{ width:`${h.wt*2.4}%`, background:'linear-gradient(90deg,#3B82F6,#22D3EE)' }} /></div>
                      <span style={{ fontSize:11, color:'#475569', fontFamily:'JetBrains Mono' }}>{h.wt}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
