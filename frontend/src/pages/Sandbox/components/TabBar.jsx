import React from 'react';

export default function TabBar({ tabs, activeTab, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid var(--color-gold)' : '2px solid transparent',
            color: activeTab === tab.id ? 'var(--color-gold)' : 'var(--color-text-secondary)',
            fontFamily: 'Inter',
            fontSize: '14px',
            fontWeight: activeTab === tab.id ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
