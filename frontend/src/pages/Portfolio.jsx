import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Crosshair, Target } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import { TARGET } from '../lib/data'
import { getPortfolioHoldings } from '../lib/portfolioStore'


const METRICS = [
  { label: 'CAGR 2Y', value: '18.4%', up: true },
  { label: 'Sharpe', value: '1.42', up: true },
  { label: 'Beta', value: '0.87', up: true },
  { label: 'Volatility', value: '14.2%', up: false },
  { label: 'Alpha', value: '+3.8%', up: true },
]

export default function Portfolio() {
  const [sort, setSort] = useState('plp')
  const [holdings, setHoldings] = useState(() => getPortfolioHoldings())
  const sorted = useMemo(() => [...holdings].sort((a, b) => sort === 'plp' ? b.plp - a.plp : b.wt - a.wt), [holdings, sort])
  const plData = useMemo(() => holdings.map((h) => ({ name: h.symbol, pl: h.pl, plp: h.plp, fill: h.plp >= 0 ? '#86EFAC' : '#FDA4AF' })), [holdings])

  useEffect(() => {
    const onUpdate = (event) => setHoldings(event.detail || getPortfolioHoldings())
    window.addEventListener('wealthos:portfolio-updated', onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener('wealthos:portfolio-updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className="lux-card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 22 }}>
        <div>
          <span className="badge badge-gold">Risk Matrix</span>
          <h2 className="editorial-title" style={{ fontSize: 38, lineHeight: 1.05, marginTop: 16, maxWidth: 760 }}>Portfolio architecture with allocation drift, risk texture, and tax-aware position control.</h2>
          <p style={{ color: '#94A3B8', marginTop: 13, maxWidth: 640 }}>A quieter Bloomberg-inspired matrix for monitoring concentration, winners, laggards, and target deviations.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {METRICS.map((m, i) => (
            <motion.div key={m.label} className="lux-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ padding: 15 }}>
              <div className="section-label">{m.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
                {m.up ? <ArrowUp size={14} color="#86EFAC" /> : <ArrowDown size={14} color="#FDA4AF" />}
                <div className="editorial-title" style={{ color: m.up ? '#86EFAC' : '#FDA4AF', fontSize: 23 }}>{m.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.8fr)', gap: 14 }}>
        <motion.div className="lux-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 22 }}>
          <SectionHeader eyebrow="P&L" title="Unrealised profit map" sub="Position-level contribution, positive and negative" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={plData} layout="vertical" margin={{ left: 10, right: 16, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.075)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#7DD3FC', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`INR ${v.toLocaleString()}`, 'P&L']} contentStyle={{ background: '#07111F', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 12, color: '#F3F4F6' }} />
              <Bar dataKey="pl" radius={[0, 6, 6, 0]}>
                {plData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="lux-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ padding: 22 }}>
          <SectionHeader eyebrow="Targets" title="Target vs actual" sub="Allocation drift thresholds" right={<Target size={16} color="#D6C7A1" />} />
          <div style={{ display: 'grid', gap: 14 }}>
            {TARGET.map((t) => {
              const dev = +(t.actual - t.target).toFixed(1)
              const over = dev > 1
              const under = dev < -1
              return (
                <div key={t.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
                    <span style={{ color: '#F3F4F6', fontWeight: 700, fontSize: 13 }}>{t.name}</span>
                    <span className="mono" style={{ color: over ? '#D6C7A1' : under ? '#67E8F9' : '#86EFAC', fontSize: 12 }}>{dev > 0 ? '+' : ''}{dev}% drift</span>
                  </div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 99, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${t.target}%`, background: 'rgba(148,163,184,0.18)' }} />
                    <div style={{ position: 'absolute', inset: 0, width: `${t.actual}%`, background: `linear-gradient(90deg, ${over ? '#D6C7A1' : '#7DD3FC'}, ${under ? '#67E8F9' : '#A78BFA'})` }} />
                  </div>
                  <div className="mono" style={{ color: '#64748B', fontSize: 11, marginTop: 5 }}>target {t.target}% · actual {t.actual}%</div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </section>

      <section className="lux-card" style={{ padding: 22 }}>
        <SectionHeader
          eyebrow="Holdings"
          title="All positions"
          sub="Sortable operating table with live exposure"
          right={<div className="tab-strip"><button onClick={() => setSort('plp')} className={`tab ${sort === 'plp' ? 'active' : ''}`}>P&L</button><button onClick={() => setSort('wt')} className={`tab ${sort === 'wt' ? 'active' : ''}`}>Weight</button></div>}
        />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>{['Symbol', 'Exchange', 'Qty', 'Avg Cost', 'LTP', 'Invested', 'Current', 'P&L', 'P&L %', 'Weight', 'Action'].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr key={h.symbol}>
                  <td className="mono" style={{ color: '#7DD3FC', fontWeight: 800 }}>{h.symbol}</td>
                  <td><span className="badge badge-blue">{h.exch}</span></td>
                  <td className="mono">{h.qty}</td>
                  <td className="mono">INR {h.avg.toLocaleString()}</td>
                  <td className="mono" style={{ color: '#F3F4F6' }}>INR {h.ltp.toLocaleString()}</td>
                  <td className="mono">INR {(h.qty * h.avg).toLocaleString()}</td>
                  <td className="mono" style={{ color: '#F3F4F6' }}>INR {(h.qty * h.ltp).toLocaleString()}</td>
                  <td className={`mono ${h.pl >= 0 ? 'pos' : 'neg'}`}>{h.pl >= 0 ? '+' : '-'}INR {Math.abs(h.pl).toLocaleString()}</td>
                  <td className={`mono ${h.plp >= 0 ? 'pos' : 'neg'}`}>{h.plp >= 0 ? '+' : ''}{h.plp}%</td>
                  <td style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-track" style={{ width: 78 }}><div className="progress-fill" style={{ width: `${h.wt * 2.4}%`, background: 'linear-gradient(90deg, #D6C7A1, #7DD3FC)' }} /></div>
                      <span className="mono" style={{ fontSize: 11, color: '#64748B' }}>{h.wt}%</span>
                    </div>
                  </td>
                  <td><span className={`badge ${h.plp >= 18 ? 'badge-green' : h.plp < 0 ? 'badge-red' : 'badge-gold'}`}><Crosshair size={11} /> {h.plp >= 18 ? 'Harvest' : h.plp < 0 ? 'Review' : 'Hold'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
