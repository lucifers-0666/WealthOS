/**
 * useMarketStatus.js
 * React hook for real-time NSE/BSE market session status.
 * Falls back to a client-side calculation if the API is unreachable.
 * Polls every 30 seconds.
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const POLL_INTERVAL_MS = 30_000;

// ── Client-side IST market timing fallback ────────────────────────────────────

const NSE_HOLIDAYS = new Set([
  '2026-01-26', '2026-03-20', '2026-03-30', '2026-04-03',
  '2026-04-14', '2026-04-17', '2026-05-01', '2026-08-15',
  '2026-08-20', '2026-09-18', '2026-10-02', '2026-10-20',
  '2026-11-12', '2026-11-25', '2026-12-25',
  '2025-01-26', '2025-02-26', '2025-03-14', '2025-03-31',
  '2025-04-10', '2025-04-14', '2025-04-18', '2025-05-01',
  '2025-08-15', '2025-08-27', '2025-10-02', '2025-10-24',
  '2025-11-05', '2025-12-25',
]);

function getISTTime() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return ist;
}

function computeStatusLocally() {
  const ist = getISTTime();
  const dayOfWeek = ist.getDay(); // 0=Sun, 6=Sat
  const dateStr = ist.toISOString().slice(0, 10);
  const totalMinutes = ist.getHours() * 60 + ist.getMinutes();

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = NSE_HOLIDAYS.has(dateStr);
  const isTradingDay = !isWeekend && !isHoliday;

  // Minutes since midnight IST
  const PRE_OPEN_START = 9 * 60;       // 09:00
  const PRE_OPEN_END   = 9 * 60 + 15;  // 09:15
  const MARKET_OPEN    = 9 * 60 + 15;  // 09:15
  const MARKET_CLOSE   = 15 * 60 + 30; // 15:30
  const AFTER_HOURS_END = 16 * 60;     // 16:00

  let session = 'closed';
  let label = 'Markets Closed';

  if (isTradingDay) {
    if (totalMinutes >= PRE_OPEN_START && totalMinutes < PRE_OPEN_END) {
      session = 'pre_open'; label = 'Pre-Market';
    } else if (totalMinutes >= MARKET_OPEN && totalMinutes <= MARKET_CLOSE) {
      session = 'open'; label = 'Markets Open';
    } else if (totalMinutes > MARKET_CLOSE && totalMinutes <= AFTER_HOURS_END) {
      session = 'after_hours'; label = 'After Hours';
    }
  }

  const timeStr = ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return {
    session,
    label,
    is_open: session === 'open',
    current_time_ist: timeStr,
    current_date_ist: dateStr,
    day_of_week: ist.toLocaleDateString('en-IN', { weekday: 'long' }),
    exchange: 'NSE / BSE',
    timezone: 'Asia/Kolkata (IST)',
    source: 'client',
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMarketStatus() {
  const [status, setStatus] = useState(() => computeStatusLocally());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/market/status`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus({ ...data, source: 'api' });
      setError(null);
    } catch {
      // API unreachable — use client-side calculation silently
      setStatus(computeStatusLocally());
      setError('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // Update the live clock every second regardless of API polling
  useEffect(() => {
    const id = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        current_time_ist: getISTTime().toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }),
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return { status, loading, error };
}
