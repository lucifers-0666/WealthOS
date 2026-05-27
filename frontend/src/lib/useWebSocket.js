/**
 * useWebSocket — lightweight hook for NON-market WS endpoints.
 * Market data MUST use MarketDataContext, not this hook.
 * This is for chat, notifications, portfolio-specific channels.
 */
import { useEffect, useRef, useCallback, useState } from 'react';

const MAX_BACKOFF = 30_000;

export function useWebSocket(url, { onMessage, enabled = true } = {}) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const backoffRef = useRef(1000);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState('disconnected');

  // Always keep callback ref current — prevents stale closures
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    if (!url || !enabled || !mountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    let ws;
    try { ws = new WebSocket(url); } catch { return; }
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      backoffRef.current = 1000;
      setStatus('connected');
    };

    ws.onmessage = (evt) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(evt.data);
        onMessageRef.current?.(data);
      } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!mountedRef.current) return;
      setStatus('disconnected');
      // Exponential backoff reconnect
      timerRef.current = setTimeout(() => {
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
        connect();
      }, backoffRef.current);
    };

    ws.onerror = () => {};
  }, [url, enabled]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [url, enabled, connect, disconnect]);

  return { status, send, disconnect, reconnect: connect };
}

export default useWebSocket;
