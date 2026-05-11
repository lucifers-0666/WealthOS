import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

export default function KpiCard({ label, value, delta, up, sub, delay = 0 }) {
  const Icon = up ? TrendingUp : TrendingDown

  return (
    <motion.div
      className="lux-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: 20, minHeight: 132, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <span className="section-label">{label}</span>
        <span
          className={`badge ${up ? 'badge-green' : 'badge-red'}`}
          style={{ letterSpacing: 0, textTransform: 'none', fontFamily: 'IBM Plex Mono', fontSize: 11 }}
        >
          <Icon size={12} /> {delta}
        </span>
      </div>
      <div>
        <div className="editorial-title" style={{ fontSize: 27, lineHeight: 1, color: up ? '#F3F4F6' : '#F3F4F6' }}>{value}</div>
        <div style={{ marginTop: 9, color: '#64748B', fontSize: 12 }}>{sub}</div>
      </div>
    </motion.div>
  )
}
