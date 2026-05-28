/**
 * useAnimatedNumber — spring-interpolated number animation.
 * Smooth 60fps counting transitions for KPI cards, P&L, LTP.
 * Direction-aware: green flash for up, red for down.
 */
import { useState, useEffect, useRef } from 'react';

export function useAnimatedNumber(target, { duration = 400, decimals = 2 } = {}) {
  const [display, setDisplay] = useState(target);
  const [direction, setDirection] = useState(null); // 'up' | 'down' | null
  const prevRef = useRef(target);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const startValueRef = useRef(target);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === target || !isFinite(target)) {
      setDisplay(target);
      return;
    }

    setDirection(target > prev ? 'up' : 'down');
    prevRef.current = target;
    startValueRef.current = prev;
    startRef.current = null;

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValueRef.current + (target - startValueRef.current) * eased;
      setDisplay(parseFloat(value.toFixed(decimals + 2)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        // Clear direction after flash
        setTimeout(() => setDirection(null), 600);
      }
    };

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);

    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, decimals]);

  return { value: display, direction };
}

export function useFlashEffect(value) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(null); // 'up' | 'down' | null

  useEffect(() => {
    if (value !== prevRef.current && isFinite(value)) {
      const dir = value > prevRef.current ? 'up' : 'down';
      setFlash(dir);
      const t = setTimeout(() => setFlash(null), 700);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value]);

  return flash;
}

export function flashClass(direction) {
  if (!direction) return '';
  return direction === 'up' ? 'flash-up' : direction === 'down' ? 'flash-down' : '';
}

export default useAnimatedNumber;
