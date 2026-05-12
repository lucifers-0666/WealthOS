import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../lib/useChat.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';
import { Send, Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';

const SUGGESTIONS = [
  'Analyse my current portfolio and give me a health score',
  'Which holdings should I rebalance based on my target allocation?',
  'Calculate LTCG tax exposure on my equity holdings',
  'Suggest a SIP plan to reach ₹1 crore in 10 years',
  'What is my biggest concentration risk right now?',
  'Compare my returns vs Nifty 50 benchmark',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  const isTyping = msg._typing;
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{ maxWidth: '82%', display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, display: 'grid', placeItems: 'center', background: isUser ? 'rgba(200,179,142,0.12)' : 'rgba(134,159,196,0.12)', color: isUser ? theme.colors.gold : theme.colors.accent, flexShrink: 0 }}>
          <MessageCircle size={15} />
        </div>
        <div style={{ ...panelStyle({ padding: 16, maxWidth: '100%' }), borderColor: isUser ? 'rgba(200,179,142,0.22)' : theme.colors.border }}>
          {isTyping ? (
            <div style={{ color: theme.colors.textMuted }}>Thinking…</div>
          ) : (
            <div style={{ color: theme.colors.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          )}
          {msg.ts && !isTyping && <div style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 10 }}>{new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>}
        </div>
      </div>
    </div>
  );
}

export default function AIAdvisor() {
  const { messages, loading, error, sendMessage, clearChat, restoreHistory } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef();

  useEffect(() => {
    restoreHistory();
  }, [restoreHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(text) {
    const t = text || input;
    if (!t.trim()) return;
    setInput('');
    sendMessage(t);
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ ...panelStyle({ padding: 24 }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 720 }}>
            <div className="section-label">AI advisory desk</div>
            <h2 className="editorial-title" style={{ margin: '8px 0 0', fontSize: 'clamp(2rem, 3vw, 3rem)' }}>An institutional AI analyst for rebalancing, tax, and risk decisions.</h2>
            <p style={{ margin: '10px 0 0', color: theme.colors.textSoft, lineHeight: 1.65 }}>Ask the advisor about exposure, portfolio health, tax planning, and strategy — with your holdings as context.</p>
          </div>
          <button onClick={clearChat} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '10px 14px', background: 'transparent', color: theme.colors.text, cursor: 'pointer' }}>
            Clear session
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, alignItems: 'start' }}>
        <div style={{ ...panelStyle({ padding: 18, minHeight: 700, display: 'flex', flexDirection: 'column' }) }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {messages.length === 0 ? (
              <div style={{ minHeight: 560, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 30 }}>
                <div style={{ maxWidth: 520 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 18, display: 'grid', placeItems: 'center', margin: '0 auto 16px', background: 'rgba(200,179,142,0.12)', color: theme.colors.gold }}>
                    <Sparkles size={22} />
                  </div>
                  <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 28 }}>Your AI CFO is ready.</h3>
                  <p style={{ margin: '10px 0 0', color: theme.colors.textSoft, lineHeight: 1.7 }}>Use the suggested prompts below or ask a custom question about your portfolio. Responses stay contextual and calm.</p>
                </div>
              </div>
            ) : (
              messages.map((m, i) => <Message key={i} msg={m} />)
            )}
            {error && <div style={{ color: theme.colors.error, marginTop: 12 }}>{error}</div>}
            <div ref={bottomRef} />
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Ask your CFO anything…"
              style={{ ...fieldStyle({ minHeight: 62, resize: 'vertical', flex: 1, lineHeight: 1.6 }) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button onClick={() => handleSend()} disabled={loading} style={{ border: '0', borderRadius: 12, minHeight: 62, width: 62, background: theme.colors.text, color: '#0A201F', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Send size={16} />
            </button>
          </div>
        </div>

        <aside style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Quick prompts</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Common advisory requests</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => handleSend(s)} style={{ textAlign: 'left', border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.01)', color: theme.colors.textSoft, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', lineHeight: 1.5 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Context pack</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>What the AI sees</h3>
            <div style={{ display: 'grid', gap: 10, color: theme.colors.textSoft, lineHeight: 1.7, fontSize: 14 }}>
              <div>Live portfolio positions</div>
              <div>Transaction history</div>
              <div>Target allocation</div>
              <div>Indian tax rules (LTCG / STCG)</div>
              <div>NSE / BSE market data</div>
              <div>Latest financial news via retrieval</div>
            </div>
          </div>

          <div style={{ ...panelStyle({ padding: 20 }) }}>
            <div className="section-label">Session status</div>
            <h3 className="editorial-title" style={{ margin: '6px 0 14px', fontSize: 18 }}>Conversation state</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.colors.textSoft }}><span>Responses</span><span>{messages.filter((m) => m.role === 'assistant').length}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.colors.textSoft }}><span>Typing</span><span>{loading ? 'Live' : 'Idle'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.colors.textSoft }}><span>Security</span><span style={{ color: theme.colors.success }}><ShieldCheck size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Protected</span></div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
