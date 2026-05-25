import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SENTIMENT_BADGE = {
  bullish: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  bearish: 'bg-red-500/15 text-red-400 border-red-500/30',
  neutral: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
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
        <h1 className="text-xl font-semibold text-cream">Signals & Intelligence</h1>
        <p className="text-xs text-muted mt-1">Macro signals · Market sentiment · Portfolio-relevant news</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-emerald-600 text-white' : 'text-muted hover:text-cream'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MACRO SIGNALS */}
      {tab === 'macro' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MACRO_SIGNALS.map(sig => (
            <div key={sig.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted uppercase tracking-wider">{sig.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${SENTIMENT_BADGE[sig.sentiment]}`}>
                  {sig.sentiment}
                </span>
              </div>
              <p className="text-lg font-bold text-cream">{sig.value}</p>
              <p className="text-xs text-muted">{sig.detail}</p>
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
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  filter === f.key
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-white/10 text-muted hover:text-cream'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <div className="text-4xl mb-3">📰</div>
              <p className="font-medium text-cream">No news articles available</p>
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
                  className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cream line-clamp-2">{article.title}</p>
                      <p className="text-xs text-muted mt-1">{article.source} · {article.publishedAt?.slice(0, 10)}</p>
                    </div>
                    {article.sentiment && (
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${SENTIMENT_BADGE[article.sentiment] || SENTIMENT_BADGE.neutral}`}>
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
        <div className="text-center py-16 text-muted">
          <div className="text-4xl mb-3">🧠</div>
          <p className="font-medium text-cream">Portfolio signal analysis</p>
          <p className="text-xs mt-1">AI-driven signals based on your holdings will appear here once the AI Advisor has processed your portfolio.</p>
        </div>
      )}
    </div>
  );
}
