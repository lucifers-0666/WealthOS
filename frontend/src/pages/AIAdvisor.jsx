import { useState, useRef, useEffect, useCallback } from 'react';
import { usePortfolio } from '../lib/usePortfolio';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SMART_PROMPTS = [
  { label: 'REBALANCE', text: 'Analyze my current allocation and suggest a rebalancing plan.' },
  { label: 'CONCENTRATION RISK', text: 'Identify concentration risks in my portfolio and suggest fixes.' },
  { label: 'VS NIFTY', text: 'Compare my portfolio performance against NIFTY 50 benchmark.' },
  { label: 'SIP PLAN', text: 'Suggest a monthly SIP plan based on my current holdings and risk profile.' },
  { label: 'TAX HARVESTING', text: 'Identify tax loss harvesting opportunities in my portfolio.' },
  { label: 'STRESS TEST 10%', text: 'What happens to my portfolio if NIFTY falls 10%? Show sector impact.' },
  { label: 'IT SECTOR -15%', text: 'Simulate a 15% drop in IT sector — what is my estimated portfolio impact?' },
];

const FALLBACK_MSG = 'Advisor systems are temporarily under elevated load. Your portfolio context is preserved — please try again in a moment.';

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to Arca AI Advisor. I have full context of your portfolio. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef(null);
  const abortRef = useRef(null);
  const { portfolio, holdings } = usePortfolio();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const buildPortfolioContext = useCallback(() => {
    if (!portfolio && !holdings?.length) return '';
    const h = holdings || [];
    const topHoldings = h
      .slice(0, 8)
      .map(hh => `${hh.symbol || hh.ticker}: ${hh.quantity} @ ₹${hh.avg_price || hh.avg_buy_price}, P&L: ${hh.pnl_pct ? hh.pnl_pct.toFixed(1) : 0}%`)
      .join('; ');
    const totalValue = portfolio?.total_value || h.reduce((s, hh) => s + (hh.current_value || 0), 0);
    const totalInvested = portfolio?.total_invested || h.reduce((s, hh) => s + (hh.invested_value || 0), 0);
    const totalPnl = totalValue - totalInvested;
    const pnlPct = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : 0;
    return `[PORTFOLIO CONTEXT] Total Value: ₹${Math.round(totalValue).toLocaleString('en-IN')} | Invested: ₹${Math.round(totalInvested).toLocaleString('en-IN')} | P&L: ${pnlPct}% | Holdings: ${h.length} | Top: ${topHoldings}`;
  }, [portfolio, holdings]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sb-access-token')
      || localStorage.getItem('supabase.auth.token')
      || localStorage.getItem('token')
      || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const tryStream = useCallback(async (prompt) => {
    try {
      abortRef.current = new AbortController();
      const res = await fetch(`${API}/api/advisor/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: prompt }),
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) return false;

      setStreaming(true);
      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try { full += JSON.parse(data).text || ''; } catch { full += data; }
        }
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.streaming) copy[copy.length - 1] = { ...last, content: full };
          return copy;
        });
      }
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.streaming) copy[copy.length - 1] = { role: 'assistant', content: full || FALLBACK_MSG };
        return copy;
      });
      setStreaming(false);
      return true;
    } catch (e) {
      setStreaming(false);
      if (e.name === 'AbortError') return true;
      return false;
    }
  }, []);

  const tryRegular = useCallback(async (prompt) => {
    let attempts = 3;
    while (attempts > 0) {
      try {
        const res = await fetch(`${API}/api/advisor/chat`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ message: prompt }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.reply || data.response || data.message || FALLBACK_MSG;
          setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
          return;
        }
      } catch (_) {}
      attempts--;
      if (attempts > 0) await new Promise(r => setTimeout(r, 1500));
    }
    setMessages(prev => [...prev, { role: 'assistant', content: FALLBACK_MSG, isError: true }]);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    const context = buildPortfolioContext();
    const fullPrompt = context ? `${context}\n\nUser: ${userText}` : userText;

    const streamOk = await tryStream(fullPrompt);
    if (!streamOk) await tryRegular(fullPrompt);

    setLoading(false);
  }, [input, loading, buildPortfolioContext, tryStream, tryRegular]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] animate-[fadeSlideUp_0.4s_ease-out]">
      {/* 1. PAGE HEADER */}
      <div className="px-6 py-5 border-b border-[var(--color-border)] shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-cinzel text-xl font-bold text-[var(--color-text)] tracking-wide">AI Advisor</h1>
            <p className="font-inter text-[11px] text-[var(--color-text-faint)] mt-1">Portfolio-aware · Gemini powered</p>
          </div>
          {loading && (
            <span className="flex items-center gap-2 font-inter text-[10px] uppercase text-[var(--color-gain)] tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gain)] animate-pulse" />
              {streaming ? 'Streaming...' : 'Thinking...'}
            </span>
          )}
        </div>
      </div>

      {/* 3. PROMPT PILLS */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto scrollbar-none border-b border-[var(--color-border)] shrink-0">
        {SMART_PROMPTS.map((sp, i) => (
          <button
            key={sp.label}
            onClick={() => sendMessage(sp.text)}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 rounded-[3px] border border-[var(--color-border)] bg-[var(--color-bg)] font-inter text-[9px] uppercase tracking-[0.1em] text-[var(--color-text-faint)] transition-colors disabled:opacity-40 hover:text-[var(--color-text)] hover:border-[var(--color-gold)]"
            style={{ animation: `fadeSlideUp 0.3s ease-out ${i*50}ms backwards` }}
          >
            {sp.label}
          </button>
        ))}
      </div>

      {/* 2 & 4. CHAT AREA & MESSAGES */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animation: 'fadeSlideUp 0.3s ease-out backwards' }}>
            <div
              className={`max-w-[80%] px-5 py-4 rounded-[4px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-[13px]'
                  : msg.isError
                  ? 'bg-[rgba(182,106,106,0.1)] border border-[rgba(182,106,106,0.3)] text-[var(--color-loss)] font-inter text-[13px]'
                  : 'bg-transparent border-none text-[var(--color-text-muted)] font-serif text-[15px]'
              }`}
            >
              {msg.content}
              {msg.streaming && (
                <span className="inline-flex gap-1 ml-2 align-middle">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gain)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gain)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gain)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* 5. INPUT BAR */}
      <div className="px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-bg)] shrink-0">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about your portfolio..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-[3px] bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] font-inter text-[13px] focus:outline-none focus:border-[rgba(200,179,142,0.5)] transition-colors disabled:opacity-50 placeholder-[var(--color-text-faint)]"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-[3px] font-inter text-[12px] font-bold tracking-wide transition-all disabled:opacity-40 bg-[var(--color-gold)] text-[var(--color-bg)] hover:brightness-110"
          >
            {loading ? '...' : 'SEND'}
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 px-1">
          <p className="font-inter text-[9px] uppercase tracking-wide text-[var(--color-text-faint)]">Portfolio context auto-injected</p>
          <p className="font-inter text-[9px] uppercase tracking-wide text-[var(--color-text-faint)]">Powered by Gemini</p>
        </div>
      </div>
    </div>
  );
}
