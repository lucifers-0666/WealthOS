/**
 * WealthOS — useChat hook
 * Manages AI CFO conversation state, session persistence, streaming UI.
 */

import { useState, useRef, useCallback } from 'react';
import { sendChatMessage, getChatHistory } from './api.js';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
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
      if (!sessionId) setSessionId(sid);

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
    setError(null);
  }, []);

  return { messages, loading, error, sessionId, sendMessage, clearChat, loadHistory };
}
