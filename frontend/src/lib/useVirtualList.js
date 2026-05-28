/**
 * useVirtualList — lightweight row virtualization for large holdings/watchlist tables
 * No external deps. Uses IntersectionObserver for sentinel-based windowing.
 *
 * Usage:
 *   const { visibleItems, containerRef, sentinelRef } = useVirtualList(items, { rowHeight: 56, overscan: 10 });
 */
import { useRef, useState, useCallback, useEffect } from 'react';

const DEFAULT_ROW_HEIGHT = 56;
const DEFAULT_OVERSCAN = 8;

export function useVirtualList(items = [], options = {}) {
  const { rowHeight = DEFAULT_ROW_HEIGHT, overscan = DEFAULT_OVERSCAN } = options;
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 40 });

  const computeRange = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const end = Math.min(items.length, Math.ceil((scrollTop + clientHeight) / rowHeight) + overscan);
    setVisibleRange((prev) => {
      if (prev.start === start && prev.end === end) return prev;
      return { start, end };
    });
  }, [items.length, rowHeight, overscan]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', computeRange, { passive: true });
    computeRange();
    return () => el.removeEventListener('scroll', computeRange);
  }, [computeRange]);

  // Re-run when items length changes
  useEffect(() => { computeRange(); }, [items.length, computeRange]);

  const totalHeight = items.length * rowHeight;
  const offsetTop = visibleRange.start * rowHeight;
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetTop,
    visibleRange,
  };
}
