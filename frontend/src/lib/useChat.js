/**
 * WealthOS — useChat hook
 * Manages AI CFO conversation state, session persistence, streaming UI.
 */

import { useState, useRef, useCallback } from 'react';
import { sendChatMessage, getChatHistory } from './api.js';
import { getPortfolioHoldings } from './portfolioStore.js';

const SESSION_KEY = 'wealthos:advisor-session';

function withPortfolioContext(text) {
  const holdings = getPortfolioHoldings();
  if (!Array.isArray(holdings) || !holdings.length) return text;

  const compact = holdings.slice(0, 30).map((holding) => ({
    ticker: holding.ticker,
    quantity: holding.quantity,
    avg_buy_price: holding.avg_buy_price ?? holding.avg_price,
    exchange: holding.exchange,
    sector: holding.sector,
    asset_class: holding.asset_class,
  }));

  return `${text}\n\nPortfolio context from the current WealthOS workspace:\n${JSON.stringify(compact)}`;
}

function buildFallbackReply(text) {
  const holdings = getPortfolioHoldings();
  const lower = text.toLowerCase();

  if (lower.includes('rebalance')) {
    return `I can help structure a rebalance review. You currently have ${holdings.length} tracked positions. A practical next step is to compare concentration in your largest holdings against target allocation, then reduce any single position that dominates portfolio risk.`;
  }

  if (lower.includes('tax')) {
    return `For tax planning, I’d separate realised versus unrealised gains, then bucket equity positions by holding period. I can help estimate the likely LTCG/STCG impact once the portfolio feed is available.`;
  }

  if (lower.includes('risk') || lower.includes('concentration')) {
    const top = holdings[0]?.ticker || 'your largest position';
    return `Your most useful immediate risk check is concentration around ${top}. I’d review position sizing, sector overlap, and whether cash or gold buffers should be increased.`;
  }

  return `I’m unable to reach the AI service right now, so here’s a lightweight portfolio note: you have ${holdings.length} tracked positions. I can still help with exposure review, diversification, and rebalancing once the advisor service is back online.`;
}

function friendlyAiError(message) {
  const text = String(message || '').toLowerCase();
  if (text.includes('rate limit') || text.includes('too many requests') || text.includes('429')) {
    return 'The AI advisor is currently experiencing high traffic. Please wait a moment and try again.';
  }
  if (text.includes('quota') || text.includes('invalid key') || text.includes('api key')) {
    return 'AI service configuration issue detected. Please verify Gemini API credentials.';
  }
  if (text.includes('timeout') || text.includes('took too long')) {
    return 'The advisor took too long to respond. Retrying with a lightweight analysis model.';
  }
  if (text.includes('blocked') || text.includes('forbidden')) {
    return 'The AI request was blocked by the service. Please try again shortly.';
  }
  return 'The advisor is temporarily unavailable. Using a fallback analysis mode.';
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SESSION_KEY);
  });
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const loadHistory = useCallback(async (sid) => {
    try {
      const history = await getChatHistory(sid);
      setMessages(
        history.map((m) => ({ role: m.role, content: m.content, ts: m.created_at }))
      );
    } catch (_) {
      // No history yet — start fresh
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text, ts: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    // Add a typing placeholder
    const typingId = Date.now();
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '...', ts: '', _typing: typingId },
    ]);

    try {
      const res = await sendChatMessage(withPortfolioContext(text), sessionId);
      const sid = res.session_id;
      if (!sessionId) {
        setSessionId(sid);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(SESSION_KEY, sid);
        }
      }

      if (res.success === false || !res.reply) {
        throw new Error(res.error || res.message || 'AI service unavailable');
      }

      setMessages((prev) =>
        prev
          .filter((m) => m._typing !== typingId)
          .concat({ role: 'assistant', content: res.reply, ts: new Date().toISOString() })
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._typing !== typingId));
      setError(friendlyAiError(err.message));
      setMessages((prev) => prev.concat({ role: 'assistant', content: buildFallbackReply(text), ts: new Date().toISOString() }));
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_KEY);
    }
    setError(null);
  }, []);

  const restoreHistory = useCallback(async () => {
    if (!sessionId) return;
    await loadHistory(sessionId);
  }, [loadHistory, sessionId]);

  return { messages, loading, error, sessionId, sendMessage, clearChat, loadHistory, restoreHistory };
}
