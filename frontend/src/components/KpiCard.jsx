import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KpiCard({ label, value, delta, up, sub }) {
  return (
    <div className="glass" style={{ padding:'20px 22px' }}>
      <p className="label" style={{ marginBottom:10 }}>{label}</p>
      <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:22, color:'#F8FAFC', lineHeight:1.2 }}>{value}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:500, color: up ? '#34D399' : '#F87171' }}>
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {delta}
        </span>
        <span style={{ fontSize:11, color:'#475569' }}>{sub}</span>
      </div>
    </div>
  )
}
