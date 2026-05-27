import { useRef, useEffect, useState } from 'react';

/**
 * Smoothly animates a numeric value over `duration` ms.
 * Returns { value, direction } where direction is 'up'|'down'|'neutral'.
 */
export function useAnimatedNumber(target, duration = 400) {
  const [value, setValue] = useState(target);
  const [direction, setDirection] = useState('neutral');
  const prevRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === target) return;

    setDirection(target > prev ? 'up' : target < prev ? 'down' : 'neutral');
    prevRef.current = target;

    const start = performance.now();
    const from = prev;
    const to = target;
    const delta = to - from;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(from + delta * ease);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(to);
        // reset direction after flash
        setTimeout(() => setDirection('neutral'), 1200);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return { value, direction };
}

/**
 * Returns a CSS class name for price flash animation based on direction.
 */
export function flashClass(direction) {
  if (direction === 'up') return 'price-flash-up';
  if (direction === 'down') return 'price-flash-down';
  return '';
}
