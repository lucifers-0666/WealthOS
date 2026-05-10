import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { RefreshCw, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import KpiCard from '../components/KpiCard'
import SectionHeader from '../components/SectionHeader'
import { KPI, HOLDINGS, PERF, ALLOC } from '../lib/data'

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'rgba(11,17,32,0.95)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'#94A3B8', marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, margin:'2px 0' }}>{p.name}: <b style={{ fontFamily:'JetBrains Mono' }}>₹{(p.value/100000).toFixed(1)}L</b></p>
      ))}
    </div>
  )
}

const DT = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{ background:'rgba(11,17,32,0.95)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:p.payload.color, fontWeight:600 }}>{p.name}</p>
      <p style={{ color:'#F8FAFC', fontFamily:'JetBrains Mono', marginTop:4 }}>{p.value}%</p>
    </div>
  )
}

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  const refresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1200) }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {KPI.map((k,i) => <KpiCard key={k.label} {...k} delay={i*0.06} />)}
      </div>

      {/* Performance chart */}
      <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28, duration:0.4 }} style={{ padding:'22px 22px 16px' }}>
        <SectionHeader title="Portfolio Performance" sub="Last 13 months vs Nifty 50"
          right={
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={refresh} className="btn-icon"><RefreshCw size={13} className={refreshing ? 'animate-spin-slow' : ''} /></button>
            </div>
          } />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={PERF} margin={{ top:4, right:4, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="gPort" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gBench" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.07)" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize:11, fill:'#475569' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v/100000).toFixed(0)}L`} tick={{ fontSize:10, fill:'#475569' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<TT />} />
            <Area type="monotone" dataKey="value"     name="Portfolio" stroke="#3B82F6" strokeWidth={2} fill="url(#gPort)"  dot={false} />
            <Area type="monotone" dataKey="benchmark" name="Nifty 50"  stroke="#8B5CF6" strokeWidth={1.5} fill="url(#gBench)" dot={false} strokeDasharray="4 3" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Allocation + Holdings */}
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:14 }}>
        <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.36, duration:0.4 }} style={{ padding:'22px' }}>
          <SectionHeader title="Allocation" />
          <PieChart width={276} height={200}>
            <Pie data={ALLOC} cx={138} cy={95} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
              {ALLOC.map((e,i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
            </Pie>
            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize:11, color:'#94A3B8' }}>{v}</span>} />
            <Tooltip content={<DT />} />
          </PieChart>
        </motion.div>

        <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.42, duration:0.4 }} style={{ padding:'22px' }}>
          <SectionHeader title="Holdings" sub={`${HOLDINGS.length} positions`}
            right={<button onClick={() => navigate('/portfolio')} className="btn btn-ghost" style={{ fontSize:12, padding:'5px 12px' }}><ArrowUpRight size={12} /> Full View</button>} />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(148,163,184,0.12)' }}>
                  {['Symbol','Name','LTP','P&L','Wt%'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontSize:10, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOLDINGS.map((h,i) => (
                  <tr key={h.symbol} style={{ borderBottom:'1px solid rgba(148,163,184,0.07)', transition:'background 150ms' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'9px 10px', fontFamily:'JetBrains Mono', fontSize:11, fontWeight:600, color:'#60A5FA' }}>{h.symbol}</td>
                    <td style={{ padding:'9px 10px', fontSize:12, color:'#94A3B8', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.name}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'JetBrains Mono', fontSize:12, color:'#F8FAFC' }}>₹{h.ltp.toLocaleString()}</td>
                    <td style={{ padding:'9px 10px', fontFamily:'JetBrains Mono', fontSize:12, color: h.plp >= 0 ? '#34D399' : '#F87171' }}>{h.plp >= 0 ? '+' : ''}{h.plp}%</td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div className="progress-track" style={{ width:56 }}><div className="progress-fill" style={{ width:`${h.wt*2.4}%`, background:'linear-gradient(90deg,#3B82F6,#22D3EE)' }} /></div>
                        <span style={{ fontSize:11, color:'#475569', fontFamily:'JetBrains Mono', minWidth:30 }}>{h.wt}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
