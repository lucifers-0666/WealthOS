import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KpiCard({ label, value, delta, up, sub, delay=0 }) {
  return (
    <motion.div className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4, ease:[0.16,1,0.3,1] }}
      style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <span className="section-label">{label}</span>
        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:600,
          color: up ? '#34D399' : '#F87171',
          background: up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          border:`1px solid ${up ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
          padding:'2px 7px', borderRadius:99 }}>
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {delta}
        </span>
      </div>
      <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:22, color:'#F8FAFC', letterSpacing:'-0.02em' }}>{value}</div>
      <div style={{ fontSize:11, color:'#475569' }}>{sub}</div>
    </motion.div>
  )
}
