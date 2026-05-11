import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../lib/usePortfolio.js';
import SectionHeader from '../components/SectionHeader.jsx';

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
    <article className="news-card">
      {article.urlToImage && (
        <div className="news-image">
          <img
            src={article.urlToImage}
            alt={article.title}
            width="280" height="160"
            loading="lazy"
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="news-body">
        <div className="news-meta">
          <span className="news-source">{article.source?.name || domain}</span>
          <span className="news-date">{pub}</span>
        </div>
        <h3 className="news-title">{article.title}</h3>
        {article.description && (
          <p className="news-desc">{article.description}</p>
        )}
        <a
          href={articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="news-link"
        >
          Read Full Article
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
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

  useEffect(() => {
    if (!NEWSAPI_KEY) {
      setError('Add VITE_NEWSAPI_KEY to your .env to load live news.');
      return;
    }
    setLoading(true);
    const q = search || (tickers ? `(${tickers}) stock India` : 'Indian stock market NSE');
    fetchNews(q)
      .then((data) => {
        if (data.status === 'ok') setArticles(data.articles || []);
        else setError(data.message || 'Failed to load news');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, tickers]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Intelligence</h1>
          <p className="page-subtitle">News contextualised for your portfolio positions</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="news-controls">
        <input
          className="news-search"
          type="search"
          placeholder="Search news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="news-categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`cat-chip ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >{c}</button>
          ))}
        </div>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <div className="news-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="news-card skeleton">
              <div className="shimmer-block" style={{ height: 160 }} />
              <div style={{ padding: 16 }}>
                <div className="shimmer-block" style={{ height: 12, width: '40%', marginBottom: 8 }} />
                <div className="shimmer-block" style={{ height: 18, marginBottom: 8 }} />
                <div className="shimmer-block" style={{ height: 14, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="news-grid">
          {articles.map((a, i) => <ArticleCard key={i} article={a} />)}
          {!articles.length && !error && (
            <div className="empty-state">No articles found. Try a different search.</div>
          )}
        </div>
      )}
    </div>
  );
}
