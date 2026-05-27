/**
 * usePerformanceMonitor — tracks render frequency and WS event rate.
 * Logs warnings when rerenders exceed threshold.
 * Dev-only. No-ops in production.
 */
import { useRef, useEffect } from 'react';

export function usePerformanceMonitor(name, { maxRendersPerSecond = 10 } = {}) {
  if (!import.meta.env.DEV) return;

  const renderCountRef = useRef(0);
  const windowStartRef = useRef(Date.now());

  renderCountRef.current++;

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - windowStartRef.current;
    if (elapsed >= 1000) {
      const rps = Math.round((renderCountRef.current / elapsed) * 1000);
      if (rps > maxRendersPerSecond) {
        console.warn(`[PerfMonitor] ${name} rendering at ${rps} renders/sec — possible excessive rerender`);
      }
      renderCountRef.current = 0;
      windowStartRef.current = now;
    }
  });
}

/**
 * useThrottledValue — throttles a value update to at most once per intervalMs.
 * Use on values that update at WS speed to prevent chart/table thrashing.
 */
import { useState, useRef as _useRef, useEffect as _useEffect } from 'react';

export function useThrottledValue(value, intervalMs = 500) {
  const [throttled, setThrottled] = useState(value);
  const lastRef = _useRef(0);
  const pendingRef = _useRef(null);

  _useEffect(() => {
    const now = Date.now();
    if (now - lastRef.current >= intervalMs) {
      lastRef.current = now;
      setThrottled(value);
    } else {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        lastRef.current = Date.now();
        setThrottled(value);
      }, intervalMs - (now - lastRef.current));
    }
    return () => { if (pendingRef.current) clearTimeout(pendingRef.current); };
  }, [value, intervalMs]);

  return throttled;
}

export default usePerformanceMonitor;
