import { useState, useRef, useEffect, useCallback } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SMART_PROMPTS = [
  { label: '⚖️ Rebalance', text: 'Analyze my current allocation and suggest a rebalancing plan.' },
  { label: '🎯 Concentration Risk', text: 'Identify concentration risks in my portfolio and suggest fixes.' },
  { label: '📊 vs NIFTY', text: 'Compare my portfolio performance against NIFTY 50 benchmark.' },
  { label: '💡 SIP Plan', text: 'Suggest a monthly SIP plan based on my current holdings and risk profile.' },
  { label: '🛡️ Tax Harvesting', text: 'Identify tax loss harvesting opportunities in my portfolio.' },
  { label: '📉 Stress Test 10%', text: 'What happens to my portfolio if NIFTY falls 10%? Show sector impact.' },
  { label: '💻 IT Sector -15%', text: 'Simulate a 15% drop in IT sector — what is my estimated portfolio impact?' },
];

const FALLBACK_MSG = 'Advisor systems are temporarily under elevated load. Your portfolio context is preserved — please try again in a moment.';

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to WealthOS AI Advisor. I have full context of your portfolio. How can I help you today?' }
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

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('sb-access-token') || localStorage.getItem('token') || ''}`,
  });

  // ── Stream attempt (primary) ─────────────────────────────────
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

  // ── Non-stream fallback (retry 3x) ───────────────────────────
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
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-cream">AI Advisor</h1>
          <p className="text-xs text-muted mt-0.5">Portfolio-aware · Gemini powered</p>
        </div>
        {loading && (
          <span className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {streaming ? 'Streaming...' : 'Thinking...'}
          </span>
        )}
      </div>

      {/* Smart Prompts */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-white/5">
        {SMART_PROMPTS.map(sp => (
          <button
            key={sp.label}
            onClick={() => sendMessage(sp.text)}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs border border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-muted hover:text-emerald-300 transition-all disabled:opacity-40"
          >
            {sp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-emerald-600/20 border border-emerald-500/20 text-cream'
                  : msg.isError
                  ? 'bg-amber-900/20 border border-amber-500/20 text-amber-200'
                  : 'bg-white/5 border border-white/10 text-cream/90'
              }`}
            >
              {msg.content}
              {msg.streaming && (
                <span className="inline-flex gap-0.5 ml-1 align-middle">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about your portfolio..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-cream placeholder-muted text-sm focus:outline-none focus:border-emerald-500/50 transition disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-40"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-muted/50 mt-2 text-center">Powered by Gemini · Portfolio context auto-injected</p>
      </div>
    </div>
  );
}
