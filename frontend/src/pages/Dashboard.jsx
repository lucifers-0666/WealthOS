import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { ArrowUpRight, Brain, CircleDot, RefreshCw, Shield, Sparkles, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import KpiCard from '../components/KpiCard'
import SectionHeader from '../components/SectionHeader'
import { ALLOC, HOLDINGS, KPI, PERF } from '../lib/data'

const fmtInr = (value) => `INR ${(value / 100000).toFixed(1)}L`

const marketPulse = [
  { label: 'Nifty 50', value: '24,682', delta: '+0.62%' },
  { label: 'S&P 500', value: '5,914', delta: '+0.31%' },
  { label: 'USD/INR', value: '83.41', delta: '-0.08%' },
]

const insights = [
  { title: 'Rebalance drift', body: 'IT exposure is 2.3% above target after TCS momentum. Trim only if tax lots are efficient.', tone: 'gold' },
  { title: 'Risk compression', body: 'Portfolio beta remains under market at 0.87 while 30-day realized volatility declined.', tone: 'cyan' },
  { title: 'Cash optionality', body: 'Cash buffer is below target by 0.8%. Upcoming SIP can restore the allocation without selling.', tone: 'violet' },
]

function PerfTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="lux-card" style={{ padding: '10px 12px', borderRadius: 12, fontSize: 12 }}>
      <div className="section-label" style={{ marginBottom: 7 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="mono" style={{ color: p.color, marginTop: 3 }}>
          {p.name}: {fmtInr(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()
  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section
        className="lux-card"
        style={{
          padding: 24,
          minHeight: 245,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(330px, 0.75fr)',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 22 }}>
          <div>
            <div className="badge badge-gold" style={{ marginBottom: 16 }}>AI Wealth Terminal</div>
            <h2 className="editorial-title" style={{ fontSize: 44, lineHeight: 1.02, maxWidth: 730 }}>
              Private capital intelligence for decisions that cannot feel generic.
            </h2>
            <p style={{ color: '#94A3B8', maxWidth: 660, marginTop: 14, fontSize: 15 }}>
              WealthOS combines portfolio telemetry, market sentiment, allocation drift, and AI reasoning into a calm operating layer for modern investors.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {marketPulse.map((m) => (
              <div key={m.label} style={{ minWidth: 142, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(2,6,23,0.36)' }}>
                <div className="section-label">{m.label}</div>
                <div className="mono" style={{ marginTop: 6, color: '#F3F4F6', fontWeight: 600 }}>{m.value}</div>
                <div className="pos mono" style={{ marginTop: 3, fontSize: 12 }}>{m.delta}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 16, border: '1px solid rgba(125,211,252,0.14)', background: 'rgba(2,6,23,0.42)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="section-label">System Signal</div>
              <div className="editorial-title" style={{ fontSize: 18, marginTop: 5 }}>Analyst Mode Active</div>
            </div>
            <Brain size={20} color="#D6C7A1" />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {insights.map((item) => (
              <div key={item.title} style={{ padding: 13, borderRadius: 13, background: 'rgba(148,163,184,0.045)', border: '1px solid rgba(148,163,184,0.10)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <CircleDot size={12} color={item.tone === 'gold' ? '#D6C7A1' : item.tone === 'violet' ? '#A78BFA' : '#67E8F9'} />
                  <div style={{ color: '#F3F4F6', fontWeight: 700, fontSize: 13 }}>{item.title}</div>
                </div>
                <div style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.55 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))', gap: 14 }}>
        {KPI.map((k, i) => <KpiCard key={k.label} {...k} delay={i * 0.05} />)}
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', gap: 14 }}>
        <motion.div className="lux-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }} style={{ padding: 22 }}>
          <SectionHeader
            eyebrow="Performance"
            title="Portfolio vs benchmark"
            sub="Thirteen-month capital curve with benchmark divergence"
            right={<button onClick={refresh} className="btn-icon" aria-label="Refresh"><RefreshCw size={14} className={refreshing ? 'animate-spin-slow' : ''} /></button>}
          />
          <ResponsiveContainer width="100%" height={286}>
            <AreaChart data={PERF} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7DD3FC" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#7DD3FC" stopOpacity={0.015} />
                </linearGradient>
                <linearGradient id="benchGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D6C7A1" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#D6C7A1" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.075)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtInr} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} width={58} />
              <Tooltip content={<PerfTooltip />} />
              <Area type="monotone" dataKey="value" name="Portfolio" stroke="#7DD3FC" strokeWidth={2.2} fill="url(#portGlow)" dot={false} activeDot={{ r: 4, fill: '#7DD3FC' }} />
              <Area type="monotone" dataKey="benchmark" name="Nifty 50" stroke="#D6C7A1" strokeWidth={1.5} fill="url(#benchGlow)" dot={false} strokeDasharray="4 5" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="lux-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.36 }} style={{ padding: 22 }}>
          <SectionHeader eyebrow="Allocation" title="Capital map" sub="Current exposure by sleeve" right={<Shield size={16} color="#D6C7A1" />} />
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <PieChart width={270} height={220}>
              <Pie data={ALLOC} cx={135} cy={105} innerRadius={62} outerRadius={92} paddingAngle={2} dataKey="value">
                {ALLOC.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="rgba(2,6,23,0.8)" strokeWidth={2} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="lux-card" style={{ padding: 10, borderRadius: 12 }}>
                  <div style={{ color: payload[0].payload.color, fontWeight: 800 }}>{payload[0].name}</div>
                  <div className="mono" style={{ color: '#F3F4F6' }}>{payload[0].value}%</div>
                </div>
              ) : null} />
            </PieChart>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ALLOC.map((a) => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#94A3B8', fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: a.color }} />
                <span style={{ flex: 1 }}>{a.name}</span>
                <span className="mono">{a.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="lux-card" style={{ padding: 22 }}>
        <SectionHeader
          eyebrow="Positions"
          title="Live holdings matrix"
          sub={`${HOLDINGS.length} positions monitored across NSE and US ETFs`}
          right={<button onClick={() => navigate('/portfolio')} className="btn btn-ghost"><ArrowUpRight size={14} /> Full Matrix</button>}
        />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>{['Symbol', 'Name', 'LTP', 'P&L', 'Weight', 'Signal'].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h) => (
                <tr key={h.symbol}>
                  <td className="mono" style={{ color: '#7DD3FC', fontWeight: 700 }}>{h.symbol}</td>
                  <td>{h.name}</td>
                  <td className="mono" style={{ color: '#F3F4F6' }}>INR {h.ltp.toLocaleString()}</td>
                  <td className={`mono ${h.plp >= 0 ? 'pos' : 'neg'}`}>{h.plp >= 0 ? '+' : ''}{h.plp}%</td>
                  <td style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div className="progress-track" style={{ width: 82 }}><div className="progress-fill" style={{ width: `${h.wt * 2.4}%`, background: 'linear-gradient(90deg, #D6C7A1, #7DD3FC)' }} /></div>
                      <span className="mono" style={{ color: '#64748B', fontSize: 11 }}>{h.wt}%</span>
                    </div>
                  </td>
                  <td><span className={`badge ${h.plp >= 0 ? 'badge-green' : 'badge-red'}`}>{h.plp >= 0 ? 'Accumulate' : 'Review'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
        {['Sentiment 68 bullish', 'Drawdown risk contained', 'Tax lots require review'].map((item, i) => (
          <div key={item} className="lux-card" style={{ padding: 18, minHeight: 92 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {i === 0 ? <TrendingUp size={17} color="#86EFAC" /> : <Sparkles size={17} color={i === 1 ? '#7DD3FC' : '#D6C7A1'} />}
              <div className="editorial-title" style={{ fontSize: 15 }}>{item}</div>
            </div>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 9 }}>Updated from portfolio telemetry and market intelligence.</div>
          </div>
        ))}
      </section>
    </div>
  )
}
