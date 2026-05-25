import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePortfolio } from '../lib/usePortfolio.js';
import { theme, panelStyle, fieldStyle } from '../lib/theme.js';
import { ArrowUpRight, Search, RadioTower, AlertTriangle } from 'lucide-react';
import debounce from 'lodash.debounce';
import { fetchMarketNews } from '../services/news.js';
import { PageLoadingState, PageErrorState, EmptyState } from '../components/PageStates.jsx';

const CATEGORIES = ['All', 'Markets', 'Economy', 'Stocks', 'Mutual Funds', 'Global'];

function sentimentTone(sentiment) {
  if (sentiment === 'Bullish') return theme.colors.success;
  if (sentiment === 'Bearish') return theme.colors.error;
  return theme.colors.textMuted;
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ border: `1px solid ${theme.colors.border}`, color: sentimentTone(article.sentiment), borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 700 }}>{article.sentiment || 'Neutral'}</span>
          {typeof article.relevanceScore === 'number' && (
            <span style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.textSoft, borderRadius: 999, padding: '6px 10px', fontSize: 11 }}>Relevance {article.relevanceScore}</span>
          )}
        </div>
        <a href={articleUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.gold, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
          Read full article <ArrowUpRight size={14} />
        </a>
      </div>
    </article>
  );
}

export default function News() {
  const { holdings } = usePortfolio();
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [serviceNotice, setServiceNotice] = useState(null);

  const portfolioTickers = useMemo(() => holdings.slice(0, 8).map((h) => h.ticker), [holdings]);
  const query = useMemo(() => search || '', [search]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearch(q);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const run = debounce(async () => {
      const result = await fetchMarketNews({ query, category, portfolioTickers });
      setArticles(result.articles || []);
      setError(result.error && result.articles.length === 0 ? result.error : null);
      setServiceNotice(result.error && result.articles.length === 0 ? result.error : null);
      setLoading(false);
    }, 220);

    run();
    return () => run.cancel();
  }, [query, category, portfolioTickers]);

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((article) => {
      const text = `${article.title || ''} ${article.description || ''} ${article.source?.name || ''}`.toLowerCase();
      const categoryMatch = category === 'All'
        || (category === 'Markets' && /market|index|sensex|nifty|bse|nse/.test(text))
        || (category === 'Economy' && /economy|rbi|inflation|rates|gdp|macro/.test(text))
        || (category === 'Stocks' && /stock|earnings|q[1-4]|results|shares|equity/.test(text))
        || (category === 'Mutual Funds' && /fund|sip|mutual/.test(text))
        || (category === 'Global' && /global|fed|wall street|nasdaq|dow|s&p/.test(text));
      const searchMatch = !q || text.includes(q);
      return categoryMatch && searchMatch;
    });
  }, [articles, category, search]);

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
        {serviceNotice && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: theme.colors.textMuted, fontSize: 13 }}>
            <AlertTriangle size={14} />
            {serviceNotice}
          </div>
        )}
      </section>

      {error && <PageErrorState title="Market feed paused" message={error} />}

      {loading ? (
        <PageLoadingState title="Loading market intelligence…" subtitle="Gathering live headlines and portfolio-relevant signals." />
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {filteredArticles.map((a, i) => <ArticleCard key={i} article={a} />)}
          {!filteredArticles.length && !error && <EmptyState title="No articles found" message="Try a broader search or switch categories." />}
        </section>
      )}
    </div>
  );
}
