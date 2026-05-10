import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

export default function KpiCard({ label, value, delta, up, sub, delay=0 }) {
  return (
    <motion.div
      className="card p-5 flex flex-col gap-2"
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.45, ease:[0.16,1,0.3,1] }}
    >
      <p className="section-label">{label}</p>
      <p className="font-display font-bold text-xl" style={{color:'var(--text-1)'}}>{value}</p>
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1 text-xs font-semibold ${up ? 'pos':'neg'}`}>
          {up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
          {delta}
        </span>
        <span className="text-xs" style={{color:'var(--text-3)'}}>{sub}</span>
      </div>
    </motion.div>
  )
}
