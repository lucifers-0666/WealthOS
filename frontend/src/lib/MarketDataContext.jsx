/**
 * MarketDataContext
 * Provides live market data (holdings, watchlist, market_status) from the
 * WebSocket connection to the entire app. Wraps the WealthOS LiveMarketEngine WS.
 *
 * Provider: wrap in main.jsx
 * Consumer: useMarketData() hook
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { useAuth } from './useAuth.js';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';

const MarketDataContext = createContext(null);

export function MarketDataProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth();

  const [holdings, setHoldings]         = useState([]);
  const [watchlist, setWatchlist]         = useState([]);
  const [marketStatus, setMarketStatus]   = useState(null);
  const [staleTickers, setStaleTickers]   = useState([]);
  const [sources, setSources]             = useState({});
  const [updatedAt, setUpdatedAt]         = useState(null);
  const [wsStatus, setWsStatus]           = useState('disconnected'); // 'connecting' | 'open' | 'disconnected'

  const wsRef        = useRef(null);
  const attemptsRef  = useRef(0);
  const timerRef     = useRef(null);
  const unmountRef   = useRef(false);
  const MAX_ATTEMPTS = 10;

  const handleMessage = useCallback((raw) => {
    let msg;
    try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch (_) { return; }

    if (msg.type === 'market_update') {
      if (msg.holdings)      setHoldings(msg.holdings);
      if (msg.watchlist)     setWatchlist(msg.watchlist);
      if (msg.market_status) setMarketStatus(msg.market_status);
      if (msg.stale_tickers) setStaleTickers(msg.stale_tickers);
      if (msg.sources)       setSources(msg.sources);
      if (msg.updated_at)    setUpdatedAt(msg.updated_at);
    }
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.id || unmountRef.current) return;

    const url = `${WS_BASE}/ws/market/${user.id}${token ? `?token=${token}` : ''}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;
    setWsStatus('connecting');

    ws.onopen = () => {
      attemptsRef.current = 0;
      setWsStatus('open');
    };

    ws.onmessage = (evt) => handleMessage(evt.data);

    ws.onerror = () => { /* handled in onclose */ };

    ws.onclose = () => {
      if (unmountRef.current) return;
      setWsStatus('disconnected');
      if (attemptsRef.current < MAX_ATTEMPTS) {
        const delay = Math.min(1000 * 2 ** attemptsRef.current, 30000);
        attemptsRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      }
    };
  }, [isAuthenticated, user?.id, token, handleMessage]);

  useEffect(() => {
    unmountRef.current = false;
    if (isAuthenticated && user?.id) {
      connect();
    }
    return () => {
      unmountRef.current = true;
      clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, isAuthenticated, user?.id]);

  /** Force a manual refresh — e.g. after adding a holding */
  const forceRefresh = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'refresh' }));
    }
  }, []);

  const value = {
    holdings,
    watchlist,
    marketStatus,
    staleTickers,
    sources,
    updatedAt,
    wsStatus,
    forceRefresh,
    isLive: wsStatus === 'open',
  };

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error('useMarketData must be used inside MarketDataProvider');
  return ctx;
}
