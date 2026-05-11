import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ExternalLink, RefreshCw, Search, Signal } from 'lucide-react'
import { NEWS } from '../lib/data'

const CATS = ['All', ...new Set(NEWS.map((n) => n.cat))]
const SENT_CFG = {
  positive: { cls: 'badge-green', label: 'Bullish' },
  negative: { cls: 'badge-red', label: 'Bearish' },
  neutral: { cls: 'badge-gray', label: 'Neutral' },
}

const ticker = ['NIFTY +0.62%', 'BANKNIFTY -0.14%', 'GOLD -0.80%', 'USDINR 83.41', 'VIX 12.8']

export default function News() {
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')
  const filtered = NEWS.filter((n) => (cat === 'All' || n.cat === cat) && (n.title + n.summary).toLowerCase().includes(query.toLowerCase()))
  const lead = filtered[0] || NEWS[0]

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className="lux-card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 22 }}>
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 16 }}>Market Intelligence Feed</div>
          <h2 className="editorial-title" style={{ fontSize: 39, lineHeight: 1.04, maxWidth: 760 }}>Editorial finance signals distilled for portfolio decisions.</h2>
          <p style={{ color: '#94A3B8', marginTop: 13, maxWidth: 640 }}>Track macro, earnings, flows, and watchlist-linked events through sentiment-aware cards with analyst summaries.</p>
        </div>
        <div style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(2,6,23,0.36)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#D6C7A1', fontWeight: 800 }}>
            <Signal size={16} /> Live Ticker
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            {ticker.map((t) => <span key={t} className="badge badge-blue mono" style={{ letterSpacing: 0, textTransform: 'none', justifyContent: 'center' }}>{t}</span>)}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 14 }}>
        <motion.article className="lux-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 24, minHeight: 240 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <span className="badge badge-gold">Lead Signal</span>
            <span className={`badge ${SENT_CFG[lead.sent]?.cls || 'badge-gray'}`}>{SENT_CFG[lead.sent]?.label || 'Neutral'}</span>
          </div>
          <h3 className="editorial-title" style={{ fontSize: 30, lineHeight: 1.08, maxWidth: 780 }}>{lead.title}</h3>
          <p style={{ color: '#94A3B8', marginTop: 14, maxWidth: 720, fontSize: 15 }}>{lead.summary}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
            <div className="mono" style={{ color: '#64748B', fontSize: 12 }}>{lead.source} · {lead.time}</div>
            <a href="#" style={{ color: '#7DD3FC', display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: 13 }}>Open Brief <ArrowUpRight size={14} /></a>
          </div>
        </motion.article>

        <div className="lux-card" style={{ padding: 18 }}>
          <div className="section-label">Sentiment Stack</div>
          <div style={{ display: 'grid', gap: 11, marginTop: 15 }}>
            {['Macro neutral', 'IT earnings bullish', 'Banking risk elevated', 'FII flows positive'].map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 11, borderBottom: i === 3 ? 0 : '1px solid rgba(148,163,184,0.09)' }}>
                <span style={{ color: '#94A3B8', fontSize: 13 }}>{item}</span>
                <span className="mono" style={{ color: i === 2 ? '#FDA4AF' : i === 0 ? '#64748B' : '#86EFAC', fontSize: 12 }}>{i === 2 ? 'watch' : i === 0 ? 'hold' : 'long'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lux-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={14} color="#64748B" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input className="input" style={{ paddingLeft: 38 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search market notes, tickers, sources..." />
          </div>
          <div className="tab-strip">
            {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`tab ${cat === c ? 'active' : ''}`}>{c}</button>)}
          </div>
          <button className="btn-icon" aria-label="Refresh"><RefreshCw size={14} /></button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.map((n, i) => {
          const sc = SENT_CFG[n.sent] || SENT_CFG.neutral
          return (
            <motion.article key={n.id} className="lux-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }} style={{ padding: 19, minHeight: 226, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span className="badge badge-blue">{n.cat}</span>
                <span className={`badge ${sc.cls}`}>{sc.label}</span>
              </div>
              <h3 className="editorial-title" style={{ fontSize: 18, lineHeight: 1.2 }}>{n.title}</h3>
              <p style={{ color: '#94A3B8', lineHeight: 1.65, fontSize: 13 }}>{n.summary}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                <div className="mono" style={{ fontSize: 11, color: '#64748B' }}>{n.source} · {n.time}</div>
                <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7DD3FC', fontWeight: 800 }}>
                  Read <ExternalLink size={12} />
                </a>
              </div>
            </motion.article>
          )
        })}
      </section>
      {filtered.length === 0 && <div className="lux-card" style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>No market notes match the current filters.</div>}
    </div>
  )
}
