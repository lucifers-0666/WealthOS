import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SENTIMENT_STYLE = {
  bullish: { background: 'rgba(74,138,106,0.15)', color: 'var(--aegean-green)', border: '1px solid rgba(74,138,106,0.3)' },
  bearish: { background: 'rgba(107,46,46,0.15)', color: 'var(--terracotta)', border: '1px solid rgba(107,46,46,0.3)' },
  neutral: { background: 'rgba(212,160,23,0.15)', color: 'var(--greek-gold)', border: '1px solid rgba(212,160,23,0.3)' },
};

const MACRO_SIGNALS = [
  { label: 'RBI Policy', value: 'Neutral', detail: 'Repo rate held at 6.5%', sentiment: 'neutral' },
  { label: 'FII Flow', value: 'Buying', detail: '+₹4,200 Cr (5-day avg)', sentiment: 'bullish' },
  { label: 'DII Flow', value: 'Buying', detail: '+₹2,800 Cr (5-day avg)', sentiment: 'bullish' },
  { label: 'USD/INR', value: '83.4', detail: 'Rupee stable this week', sentiment: 'neutral' },
  { label: 'India VIX', value: '13.2', detail: 'Low volatility environment', sentiment: 'bullish' },
  { label: 'Crude Oil', value: '$78/bbl', detail: 'Moderately elevated', sentiment: 'neutral' },
];

export default function Signals() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('macro');

  useEffect(() => {
    fetchNews();
  }, [filter]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?sentiment=${filter}` : '';
      const res = await fetch(`${API}/api/news${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNews(data.articles || data.news || []);
      }
    } catch (e) {
      console.warn('News fetch failed, using empty state');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'macro', label: 'Macro Signals' },
    { key: 'news', label: 'Market News' },
    { key: 'portfolio', label: 'Portfolio Signals' },
  ];

  const sentimentFilters = [
    { key: 'all', label: 'All' },
    { key: 'bullish', label: '↑ Bullish' },
    { key: 'bearish', label: '↓ Bearish' },
    { key: 'neutral', label: '— Neutral' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--parchment)', fontFamily: 'var(--font-serif)' }}>Signals & Intelligence</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Macro signals · Market sentiment · Portfolio-relevant news</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition`}
            style={{
              background: tab === t.key ? 'var(--greek-gold)' : 'transparent',
              color: tab === t.key ? '#1a1206' : 'var(--text-secondary)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MACRO SIGNALS */}
      {tab === 'macro' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MACRO_SIGNALS.map(sig => (
            <div key={sig.label} className="p-4 rounded-2xl space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{sig.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={SENTIMENT_STYLE[sig.sentiment]}>
                  {sig.sentiment}
                </span>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--cream)', fontFamily: 'var(--font-serif)' }}>{sig.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sig.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* NEWS */}
      {tab === 'news' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {sentimentFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 rounded-full text-xs transition"
                style={{
                  background: filter === f.key ? 'var(--greek-gold)' : 'transparent',
                  color: filter === f.key ? '#1a1206' : 'var(--text-secondary)',
                  border: `1px solid ${filter === f.key ? 'var(--greek-gold)' : 'var(--border-subtle)'}`
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card-hover)' }} />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
              <div className="text-4xl mb-3">📰</div>
              <p className="font-medium" style={{ color: 'var(--cream)', fontFamily: 'var(--font-serif)' }}>No news articles available</p>
              <p className="text-xs mt-1">News integration coming soon. Configure your News API key in Settings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {news.map((article, i) => (
                <a
                  key={i}
                  href={article.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-2xl transition"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2" style={{ color: 'var(--cream)', fontFamily: 'var(--font-serif)' }}>{article.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{article.source} · {article.publishedAt?.slice(0, 10)}</p>
                    </div>
                    {article.sentiment && (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full" style={SENTIMENT_STYLE[article.sentiment] || SENTIMENT_STYLE.neutral}>
                        {article.sentiment}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PORTFOLIO SIGNALS */}
      {tab === 'portfolio' && (
        <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
          <div className="text-4xl mb-3">🧠</div>
          <p className="font-medium" style={{ color: 'var(--cream)', fontFamily: 'var(--font-serif)' }}>Portfolio signal analysis</p>
          <p className="text-xs mt-1">AI-driven signals based on your holdings will appear here once the AI Advisor has processed your portfolio.</p>
        </div>
      )}
    </div>
  );
}
