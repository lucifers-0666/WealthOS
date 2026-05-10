import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const SUGGESTED = [
  'Should I rebalance my portfolio today?',
  'What is my LTCG tax exposure for FY26?',
  'How much SIP to reach ₹1 Crore in 10 years?',
  'Which positions should I exit now?',
]

const INIT = [{ role:'assistant', text:'Hello! I am your AI CFO powered by Gemini 1.5 Pro. I have your live portfolio loaded \u2014 7 positions totalling \u20b924.8L across NSE equities and international ETFs. Ask me anything about your investments, tax strategy, or rebalancing. How can I help you today?' }]

export default function AIAdvisor() {
  const [messages, setMessages] = useState(INIT)
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(m => [...m, { role:'user', text:q }])
    setLoading(true)
    try {
      const res = await fetch('/api/advisor', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query:q }) })
      const data = await res.json()
      setMessages(m => [...m, { role:'assistant', text: data.response || 'I could not fetch a response. Please check your GOOGLE_API_KEY in .env.' }])
    } catch {
      setMessages(m => [...m, { role:'assistant', text: '\u26a0\ufe0f Backend not running. Start with: `uvicorn api:app --reload --port 8000`' }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth:820, height:'calc(100vh - 144px)', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center' }}><Bot size={18} color="#fff" /></div>
        <div>
          <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:16, color:'#F8FAFC' }}>AI CFO Advisor</div>
          <div style={{ fontSize:12, color:'#34D399', display:'flex', alignItems:'center', gap:4 }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#34D399', display:'inline-block' }} />Gemini 1.5 Pro · Portfolio context loaded</div>
        </div>
      </div>

      <div className="card" style={{ flex:1, display:'flex', flexDirection:'column', padding:0, overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:14 }}>
          <AnimatePresence initial={false}>
            {messages.map((m,i) => (
              <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}
                style={{ display:'flex', gap:10, alignItems:'flex-start', flexDirection: m.role==='user' ? 'row-reverse' : 'row' }}>
                <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                  background: m.role==='user' ? 'linear-gradient(135deg,#3B82F6,#2563EB)' : 'rgba(139,92,246,0.15)', border: m.role!=='user' ? '1px solid rgba(139,92,246,0.25)' : 'none' }}>
                  {m.role==='user' ? <User size={12} color="#fff" /> : <Sparkles size={12} color="#8B5CF6" />}
                </div>
                <div style={{ maxWidth:'78%', padding:'12px 16px', borderRadius: m.role==='user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  background: m.role==='user' ? 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(37,99,235,0.15))' : 'rgba(148,163,184,0.06)',
                  border:`1px solid ${m.role==='user' ? 'rgba(59,130,246,0.25)' : 'rgba(148,163,184,0.12)'}`,
                  fontSize:13, color:'#E2E8F0', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <RefreshCw size={12} color="#8B5CF6" className="animate-spin-slow" />
              </div>
              <div style={{ padding:'12px 16px', borderRadius:'4px 12px 12px 12px', background:'rgba(148,163,184,0.06)', border:'1px solid rgba(148,163,184,0.12)' }}>
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(j => <span key={j} style={{ width:5, height:5, borderRadius:'50%', background:'#8B5CF6', animation:`blink 1.2s ${j*0.3}s step-start infinite`, display:'inline-block' }} />)}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ borderTop:'1px solid rgba(148,163,184,0.12)', padding:'12px 16px' }}>
          <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
            {SUGGESTED.map(s => (
              <button key={s} onClick={() => send(s)} style={{ fontSize:11, color:'#60A5FA', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:99, padding:'4px 12px', cursor:'pointer', whiteSpace:'nowrap', transition:'all 180ms' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(59,130,246,0.08)'}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input className="input" style={{ flex:1 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()} placeholder="Ask your AI CFO anything..." />
            <button onClick={() => send()} className="btn btn-primary" disabled={!input.trim() || loading} style={{ padding:'9px 16px' }}><Send size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
