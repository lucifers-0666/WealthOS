import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, BrainCircuit, FileText, LineChart, RefreshCw, Send, Sparkles, User } from 'lucide-react'

const SUGGESTED = [
  'Should I rebalance after the latest IT rally?',
  'Where is my hidden concentration risk?',
  'Estimate my LTCG exposure for FY26.',
  'Which position needs the next analyst memo?',
]

const INIT = [
  {
    role: 'assistant',
    text: 'Portfolio context is loaded. I can reason across holdings, allocation drift, tax lots, drawdown risk, and market signals. Ask for a decision memo, rebalance plan, or risk review.',
  },
]

const contextCards = [
  { label: 'Portfolio Memory', value: '7 positions', icon: FileText },
  { label: 'Reasoning Mode', value: 'CFO analyst', icon: BrainCircuit },
  { label: 'Market Context', value: 'live signals', icon: LineChart },
]

export default function AIAdvisor() {
  const [messages, setMessages] = useState(INIT)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/advisor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', text: data.response || 'The advisor service returned no response. Check the backend configuration and API key.' }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Backend connection is offline. Start the API server with uvicorn api:app --reload --port 8000, then retry the request.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', height: 'calc(100dvh - 124px)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 14 }}>
      <section className="lux-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: 22, borderBottom: '1px solid rgba(148,163,184,0.12)', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 15, display: 'grid', placeItems: 'center', color: '#020617', background: 'linear-gradient(180deg, #D6C7A1, #7DD3FC)' }}>
              <Bot size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="section-label">AI Advisor Terminal</div>
              <div className="editorial-title" style={{ fontSize: 21, marginTop: 4 }}>Private financial analyst</div>
            </div>
          </div>
          <span className="badge badge-green">Context Online</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={`${m.role}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24 }}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center', background: m.role === 'user' ? 'rgba(125,211,252,0.13)' : 'rgba(214,199,161,0.10)', border: `1px solid ${m.role === 'user' ? 'rgba(125,211,252,0.24)' : 'rgba(214,199,161,0.22)'}` }}>
                  {m.role === 'user' ? <User size={15} color="#7DD3FC" /> : <Sparkles size={15} color="#D6C7A1" />}
                </div>
                <div
                  style={{
                    maxWidth: '78%',
                    padding: '14px 16px',
                    borderRadius: m.role === 'user' ? '16px 6px 16px 16px' : '6px 16px 16px 16px',
                    background: m.role === 'user' ? 'rgba(125,211,252,0.08)' : 'rgba(148,163,184,0.055)',
                    border: `1px solid ${m.role === 'user' ? 'rgba(125,211,252,0.20)' : 'rgba(148,163,184,0.12)'}`,
                    color: '#E5E7EB',
                    lineHeight: 1.72,
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 12px 34px rgba(0,0,0,0.22)',
                  }}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: 12, background: 'rgba(214,199,161,0.10)', border: '1px solid rgba(214,199,161,0.22)', display: 'grid', placeItems: 'center' }}>
                <RefreshCw size={14} color="#D6C7A1" className="animate-spin-slow" />
              </div>
              <div style={{ padding: '14px 16px', borderRadius: '6px 16px 16px 16px', background: 'rgba(148,163,184,0.055)', border: '1px solid rgba(148,163,184,0.12)' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map((j) => <span key={j} style={{ width: 6, height: 6, borderRadius: 99, background: '#D6C7A1', animation: `blink 1.2s ${j * 0.18}s ease-in-out infinite` }} />)}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ padding: 18, borderTop: '1px solid rgba(148,163,184,0.12)', background: 'rgba(2,6,23,0.22)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => send(s)} className="btn btn-ghost" style={{ minHeight: 30, fontSize: 12, padding: '6px 10px' }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 42px', gap: 9 }}>
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Ask for a risk memo, rebalance plan, or tax strategy..." />
            <button onClick={() => send()} className="btn btn-primary" disabled={!input.trim() || loading} aria-label="Send"><Send size={15} /></button>
          </div>
        </div>
      </section>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
        <div className="lux-card" style={{ padding: 20 }}>
          <div className="section-label">Analyst Context</div>
          <div className="editorial-title" style={{ fontSize: 24, lineHeight: 1.05, marginTop: 8 }}>Reasoning with portfolio telemetry, not generic advice.</div>
        </div>
        {contextCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="lux-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', color: '#7DD3FC', background: 'rgba(125,211,252,0.08)', border: '1px solid rgba(125,211,252,0.16)' }}><Icon size={17} /></div>
              <div>
                <div className="section-label">{card.label}</div>
                <div style={{ color: '#F3F4F6', fontWeight: 800, marginTop: 4 }}>{card.value}</div>
              </div>
            </div>
          )
        })}
        <div className="lux-card" style={{ padding: 18, flex: 1, minHeight: 160 }}>
          <div className="section-label">Live Reasoning</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {['Load portfolio weights', 'Check tax lots', 'Compare benchmark', 'Draft decision memo'].map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 9, color: i < 2 ? '#D6C7A1' : '#64748B', fontSize: 13 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: i < 2 ? '#D6C7A1' : '#64748B', animation: i === 1 ? 'pulseLine 1.4s ease-in-out infinite' : 'none' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
