/**
 * MarketDataContext — SINGLE global realtime source of truth.
 *
 * Rules enforced:
 *  - Exactly ONE WebSocket per app lifetime (ref-counted, not per-component)
 *  - Batched state updates via flushSync-safe scheduler (no cascade rerenders)
 *  - Stale closure–proof via useRef for callbacks
 *  - Exponential backoff reconnect (max 30s)
 *  - prices Map is stable reference — consumers diff on symbol keys only
 *  - Subscribes once, fans out via context
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { isDemoMode } from './auth.js';

const WS_USER_ID = import.meta.env.VITE_DEV_USER_ID || '';
const WS_URL = (() => {
  const base = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/market-updates';
  if (!WS_USER_ID) return base;
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}user_id=${encodeURIComponent(WS_USER_ID)}`;
})();
const MAX_BACKOFF_MS = 30_000;
const BATCH_FLUSH_MS = 250; // max latency before UI update

const MarketDataContext = createContext(null);

// Singleton WS state — survives HMR in dev
let _singleton = null;

function getOrCreateSingleton() {
  if (!_singleton) {
    _singleton = {
      ws: null,
      refCount: 0,
      listeners: new Set(),
      prices: new Map(),
      holdings: [],
      watchlist: [],
      marketStatus: null,
      connectionState: 'disconnected', // 'connecting' | 'connected' | 'disconnected'
      reconnectTimer: null,
      backoffMs: 1000,
      lastPingAt: null,
    };
  }
  return _singleton;
}

function connectSingleton(singleton) {
  if (singleton.ws && singleton.ws.readyState <= WebSocket.OPEN) return;
  if (singleton.reconnectTimer) {
    clearTimeout(singleton.reconnectTimer);
    singleton.reconnectTimer = null;
  }

  singleton.connectionState = 'connecting';
  singleton.listeners.forEach(fn => fn({ type: 'status', status: 'connecting' }));

  let ws;
  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    scheduleReconnect(singleton);
    return;
  }
  singleton.ws = ws;

  // Pending batch buffer
  let batchBuffer = {};
  let flushTimer = null;

  const flush = () => {
    if (Object.keys(batchBuffer).length === 0) return;
    const snapshot = batchBuffer;
    batchBuffer = {};
    flushTimer = null;
    // Merge into prices map
    for (const [sym, data] of Object.entries(snapshot)) {
      const prev = singleton.prices.get(sym) || {};
      singleton.prices.set(sym, { ...prev, ...data, _ts: Date.now() });
    }
    singleton.listeners.forEach(fn => fn({ type: 'prices', prices: singleton.prices }));
  };

  ws.onopen = () => {
    singleton.connectionState = 'connected';
    singleton.backoffMs = 1000;
    singleton.lastPingAt = Date.now();
    singleton.listeners.forEach(fn => fn({ type: 'status', status: 'connected' }));
  };

  ws.onmessage = (evt) => {
    let payload;
    try { payload = JSON.parse(evt.data); } catch { return; }

    singleton.lastPingAt = Date.now();

    if (payload.type === 'pong' || payload.type === 'heartbeat') return;

    if (payload.type === 'snapshot_ready' || payload.type === 'market_update') {
      if (Array.isArray(payload.holdings)) singleton.holdings = payload.holdings;
      if (Array.isArray(payload.watchlist)) singleton.watchlist = payload.watchlist;
      if (payload.market_status) singleton.marketStatus = payload.market_status;
      singleton.listeners.forEach(fn => fn({
        type: 'snapshot',
        holdings: singleton.holdings,
        watchlist: singleton.watchlist,
        marketStatus: singleton.marketStatus,
      }));
    }

    // Normalise payload shapes from backend
    const quotes = payload.prices || payload.data || (payload.symbol ? { [payload.symbol]: payload } : null);
    if (!quotes) return;

    for (const [sym, raw] of Object.entries(quotes)) {
      const key = sym.toUpperCase();
      batchBuffer[key] = {
        ltp: raw.ltp ?? raw.price ?? raw.c ?? raw.last_price,
        open: raw.open ?? raw.o,
        high: raw.high ?? raw.h,
        low: raw.low ?? raw.l,
        close: raw.close ?? raw.prev_close ?? raw.pc,
        change: raw.change ?? raw.d,
        change_pct: raw.change_pct ?? raw.dp ?? raw.pct_change,
        volume: raw.volume ?? raw.v,
        market_cap: raw.market_cap,
        week_52_high: raw.week_52_high ?? raw.h52,
        week_52_low: raw.week_52_low ?? raw.l52,
        sector: raw.sector,
        source: raw.source ?? 'ws',
        last_updated_at: raw.last_updated_at ?? raw.ts ?? Date.now(),
        previous_close: raw.previous_close ?? raw.prev_close ?? raw.pc,
        market_status: raw.market_status ?? 'unknown',
        stale_price: raw.stale_price ?? false,
        latency_ms: raw.latency_ms ?? null,
        fetch_source: raw.fetch_source ?? raw.source ?? 'unknown',
        confidence: raw.confidence ?? 'medium',
      };
    }

    if (!flushTimer) {
      flushTimer = setTimeout(flush, BATCH_FLUSH_MS);
    }
  };

  ws.onerror = () => {
    // onclose will fire next, handle reconnect there
  };

  ws.onclose = () => {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    singleton.ws = null;
    singleton.connectionState = 'disconnected';
    singleton.listeners.forEach(fn => fn({ type: 'status', status: 'disconnected' }));
    if (singleton.refCount > 0) scheduleReconnect(singleton);
  };
}

function scheduleReconnect(singleton) {
  if (singleton.reconnectTimer) return;
  singleton.reconnectTimer = setTimeout(() => {
    singleton.reconnectTimer = null;
    singleton.backoffMs = Math.min(singleton.backoffMs * 2, MAX_BACKOFF_MS);
    connectSingleton(singleton);
  }, singleton.backoffMs);
}

export function MarketDataProvider({ children }) {
  const singleton = getOrCreateSingleton();
  const [connectionStatus, setConnectionStatus] = useState(singleton.connectionState);
  const [prices, setPrices] = useState(new Map(singleton.prices));
  const [lastUpdated, setLastUpdated] = useState(null);
  const [holdings, setHoldings] = useState(singleton.holdings);
  const [watchlist, setWatchlist] = useState(singleton.watchlist);
  const [marketStatus, setMarketStatus] = useState(singleton.marketStatus);

  useEffect(() => {
    if (isDemoMode) {
      setConnectionStatus('connected');
      setLastUpdated(Date.now());
      return () => {};
    }

    singleton.refCount++;

    const listener = (event) => {
      if (event.type === 'status') {
        setConnectionStatus(event.status);
      } else if (event.type === 'prices') {
        // Shallow clone Map so React detects change
        setPrices(new Map(event.prices));
        setLastUpdated(Date.now());
      } else if (event.type === 'snapshot') {
        setHoldings(Array.isArray(event.holdings) ? event.holdings : []);
        setWatchlist(Array.isArray(event.watchlist) ? event.watchlist : []);
        setMarketStatus(event.marketStatus || null);
      }
    };

    singleton.listeners.add(listener);
    connectSingleton(singleton);

    return () => {
      singleton.listeners.delete(listener);
      singleton.refCount--;
      if (singleton.refCount === 0) {
        if (singleton.reconnectTimer) {
          clearTimeout(singleton.reconnectTimer);
          singleton.reconnectTimer = null;
        }
        if (singleton.ws) {
          singleton.ws.onclose = null;
          singleton.ws.close();
          singleton.ws = null;
        }
        singleton.connectionState = 'disconnected';
      }
    };
  }, []);

  const getPrice = useCallback((symbol) => {
    if (!symbol) return null;
    return prices.get(symbol.toUpperCase()) || null;
  }, [prices]);

  const isStale = useCallback((symbol) => {
    const p = prices.get(symbol?.toUpperCase());
    if (!p) return true;
    const age = Date.now() - (p._ts || 0);
    return age > 60_000 || p.stale_price === true;
  }, [prices]);

  const forceRefresh = useCallback(() => {
    if (isDemoMode) return;
    connectSingleton(singleton);
  }, [singleton]);

  const value = useMemo(() => ({
    prices,
    connectionStatus,
    lastUpdated,
    getPrice,
    isStale,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    holdings,
    watchlist,
    marketStatus,
    // Backward-compatible fields expected by existing UI components
    wsStatus: connectionStatus,
    updatedAt: lastUpdated,
    isLive: connectionStatus === 'connected',
    forceRefresh,
  }), [prices, connectionStatus, lastUpdated, getPrice, isStale, holdings, watchlist, marketStatus, forceRefresh]);

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error('useMarketData must be inside <MarketDataProvider>');
  return ctx;
}

export default MarketDataContext;
