import React from 'react';

export const IonicColumn = ({ width = 24, height = 120, className = '', color = 'var(--border-dark)' }) => (
  <svg width={width} height={height} viewBox="0 0 24 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M2 0H22V4H2V0Z" fill={color} />
    <path d="M0 4C0 4 3 6 3 12C3 18 0 20 0 20V24H24V20C24 20 21 18 21 12C21 6 24 4 24 4V0H0V4Z" fill={color} fillOpacity="0.5"/>
    <rect x="4" y="24" width="2" height="92" fill={color} fillOpacity="0.4" />
    <rect x="10" y="24" width="4" height="92" fill={color} fillOpacity="0.4" />
    <rect x="18" y="24" width="2" height="92" fill={color} fillOpacity="0.4" />
    <path d="M2 116H22V120H2V116Z" fill={color} />
  </svg>
);

export const GreekFrieze = ({ width = '100%', height = 12, className = '', color = 'var(--greek-gold)' }) => (
  <svg width={width} height={height} className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="frieze" x="0" y="0" width="40" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 6H10V2H20V6H30V10H40" stroke={color} strokeWidth="1" fill="none" opacity="0.4"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="100%" height="12" fill="url(#frieze)" />
  </svg>
);

export const Pediment = ({ width = 300, height = 40, className = '', color = 'var(--border-dark)' }) => (
  <svg width={width} height={height} viewBox="0 0 300 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M150 0L300 36V40H0V36L150 0Z" stroke={color} strokeWidth="1" fill="rgba(212,160,23,0.02)"/>
    <path d="M150 6L280 34H20L150 6Z" stroke={color} strokeWidth="0.5" strokeOpacity="0.5"/>
  </svg>
);

export const GreekStar = ({ size = 24, className = '', color = 'var(--greek-gold)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill={color} fillOpacity="0.6"/>
    <circle cx="12" cy="12" r="3" fill="var(--obsidian)"/>
    <circle cx="12" cy="12" r="1.5" fill={color}/>
  </svg>
);

export const Amphora = ({ size = 120, className = '', color = 'var(--greek-gold)' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M40 20C40 20 20 40 20 60C20 90 40 110 60 110C80 110 100 90 100 60C100 40 80 20 80 20H40Z" stroke={color} strokeWidth="1" fill="rgba(212,160,23,0.04)" />
    <path d="M45 10H75V20H45V10Z" stroke={color} strokeWidth="1"/>
    <path d="M30 40C20 40 10 30 15 20" stroke={color} strokeWidth="1" fill="none"/>
    <path d="M90 40C100 40 110 30 105 20" stroke={color} strokeWidth="1" fill="none"/>
    <path d="M30 80H90" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.4"/>
    <path d="M22 60H98" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.4"/>
  </svg>
);

export const OrnamentDivider = ({ className = '', color = 'var(--border-dark)' }) => (
  <div className={`flex items-center justify-center gap-4 ${className}`} style={{ color }}>
    <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${color})` }} />
    <div style={{ fontSize: 16, fontFamily: 'var(--font-serif)', fontWeight: '300' }}>⊕</div>
    <div style={{ height: 1, flex: 1, background: `linear-gradient(270deg, transparent, ${color})` }} />
  </div>
);
