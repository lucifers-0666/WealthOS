import React, { useRef, useEffect } from 'react';
import { useChat } from '../lib/useChat.js';
import SectionHeader from '../components/SectionHeader.jsx';

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
    <div className={`chat-msg ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="chat-avatar">
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="#7DD3FC" strokeWidth="1.5"/>
            <path d="M8 22L13 12L18 18L22 10" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div className={`chat-bubble ${isTyping ? 'typing' : ''}`}>
        {isTyping ? (
          <span className="typing-dots"><span/><span/><span/></span>
        ) : (
          <div className="chat-text" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
        )}
        {msg.ts && !isTyping && (
          <span className="chat-ts">
            {new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AIAdvisor() {
  const { messages, loading, error, sendMessage, clearChat } = useChat();
  const [input, setInput] = React.useState('');
  const bottomRef = useRef();

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
    <div className="page advisor-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI CFO Advisor</h1>
          <p className="page-subtitle">Powered by Gemini 1.5 Pro — your personal financial intelligence</p>
        </div>
        <button className="btn-ghost" onClick={clearChat}>Clear Session</button>
      </div>

      <div className="advisor-layout">
        {/* Chat panel */}
        <div className="chat-panel">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="2" y="2" width="28" height="28" rx="6" stroke="#7DD3FC" strokeWidth="1.5"/>
                    <path d="M8 22L13 12L18 18L22 10" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="22" cy="10" r="2" fill="#A78BFA"/>
                  </svg>
                </div>
                <h3>Your AI CFO is ready</h3>
                <p>Ask anything about your portfolio, tax planning, rebalancing, or market strategy.</p>
                <div className="suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="suggestion-chip" onClick={() => handleSend(s)}>{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => <Message key={i} msg={m} />)
            )}
            {error && <div className="chat-error">{error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="chat-input-bar">
            <textarea
              className="chat-input"
              placeholder="Ask your CFO anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
            />
            <button
              className={`chat-send ${loading ? 'disabled' : ''}`}
              onClick={() => handleSend()}
              disabled={loading}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Suggestion sidebar */}
        <aside className="advisor-sidebar">
          <SectionHeader title="Quick Prompts" subtitle="Common advisory questions" />
          <div className="advisor-chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="advisor-chip" onClick={() => handleSend(s)}>{s}</button>
            ))}
          </div>

          <div className="advisor-info">
            <SectionHeader title="CFO Context" subtitle="What the AI knows" />
            <ul className="advisor-context-list">
              <li>Live portfolio positions</li>
              <li>Transaction history</li>
              <li>Target allocation</li>
              <li>Indian tax rules (LTCG / STCG)</li>
              <li>NSE / BSE market data</li>
              <li>Latest financial news via RAG</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
