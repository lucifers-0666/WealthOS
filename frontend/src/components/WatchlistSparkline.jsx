import React, { useRef, useEffect } from 'react';

/**
 * Minimal SVG sparkline for watchlist cards.
 * props: data (array of numbers), width, height, positive (bool)
 */
export default function WatchlistSparkline({ data = [], width = 80, height = 30, positive = true }) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => [
    i * step,
    height - ((v - min) / range) * height,
  ]);

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  // fill area
  const fillD = `${d} L${points[points.length - 1][0]},${height} L0,${height} Z`;

  const color = positive ? '#4ade80' : '#f87171';
  const fillColor = positive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#sg-${positive})`} />
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
