import React, { useEffect, useMemo, useState } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';
import { ArrowUpRight, Search, RadioTower } from 'lucide-react';

const NEWSAPI_KEY = import.meta.env.VITE_NEWSAPI_KEY || '';
const CATEGORIES = ['All', 'Markets', 'Economy', 'Stocks', 'Mutual Funds', 'Global'];

function fetchNews(query) {
  const q = query || 'Indian stock market NSE BSE';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWSAPI_KEY}`;
  return fetch(url).then((r) => r.json());
}

function ArticleCard({ article }) {
  const articleUrl = article.url || '#';
  const domain = articleUrl !== '#' ? new URL(articleUrl).hostname.replace('www.', '') : '';
  const pub = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

  return (
    <article style={{ ...panelStyle({ padding: 0, overflow: 'hidden' }) }}>
      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div style={{ padding: 18, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <span className="section-label" style={{ letterSpacing: '0.1em' }}>{article.source?.name || domain}</span>
          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>{pub}</span>
        </div>
        <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 19, lineHeight: 1.35 }}>{article.title}</h3>
        {article.description && <p style={{ margin: 0, color: theme.colors.textSoft, lineHeight: 1.65, fontSize: 14 }}>{article.description}</p>}
        <a href={articleUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.gold, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
          Read full article <ArrowUpRight size={14} />
        </a>
      </div>
    </article>
  );
}

export default function News() {
  const { holdings } = usePortfolio();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const tickers = holdings.slice(0, 5).map((h) => h.ticker.replace('.NS', '').replace('.BO', '')).join(' OR ');
  const query = useMemo(() => search || (tickers ? `(${tickers}) stock India` : 'Indian stock market NSE'), [search, tickers]);

  useEffect(() => {
    if (!NEWSAPI_KEY) {
      setError('Add VITE_NEWSAPI_KEY to your frontend env to load live market news.');
      return;
    }
    setLoading(true);
    fetchNews(query)
      .then((data) => {
        if (data.status === 'ok') setArticles(data.articles || []);
        else setError(data.message || 'Failed to load news');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={{ ...panelStyle({ padding: 24 }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 740 }}>
            <div className="section-label">Market intelligence</div>
            <h2 className="editorial-title" style={{ margin: '8px 0 0', fontSize: 'clamp(2rem, 3vw, 3rem)' }}>Editorial market feed tied to your holdings and signals.</h2>
            <p style={{ margin: '10px 0 0', color: theme.colors.textSoft, lineHeight: 1.65 }}>Search live financial news and scan the feed through a calm, institutional lens.</p>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft }}>
            <RadioTower size={15} /> Live feed
          </div>
        </div>
      </section>

      <section style={{ ...panelStyle({ padding: 18 }) }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', borderRadius: 12, border: `1px solid ${theme.colors.border}`, minWidth: 280, flex: '1 1 320px' }}>
            <Search size={15} color={theme.colors.textMuted} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search market news…" style={{ ...fieldStyle({ border: '0', background: 'transparent', padding: '12px 0', minHeight: 44 }) }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  border: `1px solid ${category === c ? theme.colors.gold : theme.colors.border}`,
                  background: category === c ? 'rgba(200,179,142,0.08)' : 'transparent',
                  color: category === c ? theme.colors.text : theme.colors.textSoft,
                  borderRadius: 999,
                  padding: '9px 12px',
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <div style={{ ...panelStyle({ padding: 18, color: theme.colors.error }) }}>{error}</div>}

      {loading ? (
        <div style={{ ...panelStyle({ padding: 24 }) }}>Loading news…</div>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {articles.map((a, i) => <ArticleCard key={i} article={a} />)}
          {!articles.length && !error && <div style={{ ...panelStyle({ padding: 24, color: theme.colors.textSoft }) }}>No articles found. Try a different search.</div>}
        </section>
      )}
    </div>
  );
}
