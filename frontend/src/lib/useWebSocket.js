/**
 * useWebSocket — low-level hook that manages a single WebSocket connection.
 * Handles connect, disconnect, auto-reconnect with exponential backoff,
 * and JSON message parsing.
 *
 * Usage:
 *   const { lastMessage, readyState, send } = useWebSocket(url, { onMessage });
 */
import { useEffect, useRef, useCallback, useState } from 'react';

const READY_STATES = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };

const DEFAULT_OPTIONS = {
  reconnect: true,
  reconnectBaseDelay: 1000,   // ms
  reconnectMaxDelay: 30000,   // ms
  reconnectMaxAttempts: 10,
  onOpen: null,
  onClose: null,
  onError: null,
  onMessage: null,            // (parsedData) => void
};

export function useWebSocket(url, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const wsRef = useRef(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef(null);
  const unmountedRef = useRef(false);

  const [readyState, setReadyState] = useState(READY_STATES.CLOSED);
  const [lastMessage, setLastMessage] = useState(null);

  // Stable refs so callbacks don't re-trigger the effect
  const onMessageRef = useRef(opts.onMessage);
  const onOpenRef    = useRef(opts.onOpen);
  const onCloseRef   = useRef(opts.onClose);
  const onErrorRef   = useRef(opts.onError);

  useEffect(() => { onMessageRef.current = opts.onMessage; }, [opts.onMessage]);
  useEffect(() => { onOpenRef.current    = opts.onOpen; },    [opts.onOpen]);
  useEffect(() => { onCloseRef.current   = opts.onClose; },   [opts.onClose]);
  useEffect(() => { onErrorRef.current   = opts.onError; },   [opts.onError]);

  const connect = useCallback(() => {
    if (!url || unmountedRef.current) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setReadyState(READY_STATES.CONNECTING);

    ws.onopen = (evt) => {
      if (unmountedRef.current) { ws.close(); return; }
      attemptsRef.current = 0;
      setReadyState(READY_STATES.OPEN);
      onOpenRef.current?.(evt);
    };

    ws.onmessage = (evt) => {
      let data = evt.data;
      try { data = JSON.parse(evt.data); } catch (_) { /* raw string */ }
      setLastMessage(data);
      onMessageRef.current?.(data);
    };

    ws.onerror = (evt) => {
      onErrorRef.current?.(evt);
    };

    ws.onclose = (evt) => {
      if (unmountedRef.current) return;
      setReadyState(READY_STATES.CLOSED);
      onCloseRef.current?.(evt);

      if (
        opts.reconnect &&
        attemptsRef.current < opts.reconnectMaxAttempts
      ) {
        const delay = Math.min(
          opts.reconnectBaseDelay * 2 ** attemptsRef.current,
          opts.reconnectMaxDelay
        );
        attemptsRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      }
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === READY_STATES.OPEN) {
      wsRef.current.send(
        typeof data === 'string' ? data : JSON.stringify(data)
      );
      return true;
    }
    return false;
  }, []);

  return { lastMessage, readyState, send, READY_STATES };
}
