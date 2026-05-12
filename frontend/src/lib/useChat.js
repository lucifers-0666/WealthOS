/**
 * WealthOS — useChat hook
 * Manages AI CFO conversation state, session persistence, streaming UI.
 */

import { useState, useRef, useCallback } from 'react';
import { sendChatMessage, getChatHistory } from './api.js';

const SESSION_KEY = 'wealthos:advisor-session';

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
      const res = await sendChatMessage(text, sessionId);
      const sid = res.session_id;
      if (!sessionId) {
        setSessionId(sid);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(SESSION_KEY, sid);
        }
      }

      setMessages((prev) =>
        prev
          .filter((m) => m._typing !== typingId)
          .concat({ role: 'assistant', content: res.reply, ts: new Date().toISOString() })
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._typing !== typingId));
      setError(err.message);
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
