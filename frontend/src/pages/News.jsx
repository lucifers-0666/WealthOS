import React, { useEffect, useMemo, useState } from 'react';
import { fetchMarketNews } from '../services/news.js';
import { PageLoadingState, EmptyState } from '../components/PageStates.jsx';

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[2px] h-3 bg-[var(--color-gold)]"></div>
      <h3 className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {title}
      </h3>
    </div>
  );
}

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchMarketNews({ query: '', category: 'All', portfolioTickers: [] });
        if (mounted) setArticles(result.articles || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const trending = ['#HDFCBANK', '#RELIANCE', '#INFY', '#NIFTY50', '#TCS', '#ITC', '#ICICIBANK'];
  
  const macroEvents = [
    { event: 'RBI Policy Meet', date: 'Oct 4', impact: 'High' },
    { event: 'US Non-Farm Payrolls', date: 'Oct 6', impact: 'High' },
    { event: 'India CPI Inflation', date: 'Oct 12', impact: 'Medium' }
  ];

  if (loading) return <PageLoadingState title="Loading market intelligence…" subtitle="Gathering live headlines." />;

  return (
    <div className="flex flex-col min-h-0 h-full p-6 animate-[fadeSlideUp_0.4s_ease-out]">
      {/* 1. PAGE HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="font-cinzel text-xl font-bold text-[var(--color-text)] tracking-wide">Market News</h1>
          <div className="font-inter text-[11px] text-[var(--color-text-faint)] mt-1">Real-time financial intelligence</div>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search news..." 
            className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[12px] text-[var(--color-text)] outline-none focus:border-[rgba(45,60,55,0.9)] w-[200px]"
          />
        </div>
      </div>

      {/* 2. TRENDING STRIP */}
      <div className="flex gap-3 overflow-x-auto scrollbar-none mb-6 shrink-0 animate-[fadeSlideUp_0.4s_ease-out_100ms_both]">
        <div className="font-inter text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-faint)] py-2 pr-2 flex-shrink-0">TRENDING</div>
        {trending.map(t => (
          <div key={t} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] px-3 py-1.5 font-inter text-[10px] font-semibold text-[var(--color-text-muted)] flex-shrink-0 hover:text-[var(--color-text)] transition-colors cursor-pointer">
            {t}
          </div>
        ))}
      </div>

      {/* 3. LAYOUT */}
      <div className="flex gap-6 min-h-0 flex-1">
        {/* 4. MAIN FEED */}
        <div className="flex-1 overflow-y-auto pr-2 min-h-0 flex flex-col gap-4">
          {!articles.length ? (
            <EmptyState title="No articles found" message="Try a broader search or switch categories." />
          ) : (
            articles.map((a, i) => {
              const pub = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
              const sentiment = a.sentiment || 'Neutral';
              return (
                <div key={i} className="flex gap-4 p-4 bg-transparent border-b border-[var(--color-border)] hover:bg-[rgba(255,255,255,0.015)] transition-colors animate-[fadeSlideUp_0.4s_ease-out_both] group" style={{ animationDelay: `${200 + i*50}ms` }}>
                  {a.urlToImage && (
                    <div className="w-[120px] h-[80px] flex-shrink-0 overflow-hidden rounded-[2px] bg-[var(--color-card)]">
                      <img src={a.urlToImage} alt={a.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  )}
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-inter text-[9px] uppercase tracking-[0.1em] text-[var(--color-text-faint)]">
                        {a.source?.name || 'News'} · {pub}
                      </div>
                      <div className={`font-inter text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-[2px] border ${sentiment === 'Bullish' ? 'bg-[rgba(111,174,141,0.1)] border-[rgba(111,174,141,0.25)] text-[var(--color-gain)]' : sentiment === 'Bearish' ? 'bg-[rgba(182,106,106,0.1)] border-[rgba(182,106,106,0.25)] text-[var(--color-loss)]' : 'bg-[rgba(200,179,142,0.1)] border-[rgba(200,179,142,0.25)] text-[var(--color-gold)]'}`}>
                        {sentiment}
                      </div>
                    </div>
                    <a href={a.url || '#'} target="_blank" rel="noopener noreferrer" className="font-serif text-[18px] font-bold text-[var(--color-text)] leading-snug mb-2 hover:text-[var(--color-gold)] transition-colors">
                      {a.title}
                    </a>
                    {a.description && (
                      <p className="font-inter text-[12px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                        {a.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. RIGHT SIDEBAR */}
        <div className="w-[316px] flex flex-col gap-4 shrink-0 min-h-0">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-5 animate-[fadeSlideUp_0.4s_ease-out_300ms_both]">
            <SectionHeader title="TOP SECTORS" />
            <div className="flex flex-col gap-2 mt-4">
              {['Technology', 'Financials', 'Energy', 'Automobile', 'FMCG'].map(s => (
                <div key={s} className="flex justify-between items-center py-1.5 border-b border-[rgba(45,60,55,0.4)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors px-1 -mx-1 rounded">
                  <span className="font-inter text-[12px] text-[var(--color-text)]">{s}</span>
                  <span className="font-mono text-[11px] text-[var(--color-gain)]">+{(Math.random()*2).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[3px] p-5 flex-1 animate-[fadeSlideUp_0.4s_ease-out_400ms_both]">
            <SectionHeader title="MACRO EVENTS" />
            <div className="flex flex-col gap-4 mt-4">
              {macroEvents.map(e => (
                <div key={e.event} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-inter text-[12px] font-semibold text-[var(--color-text)]">{e.event}</span>
                    <span className="font-inter text-[10px] text-[var(--color-text-faint)]">{e.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-[9px] uppercase tracking-wide text-[var(--color-text-muted)]">Impact:</span>
                    <span className={`font-inter text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-[2px] ${e.impact === 'High' ? 'bg-[rgba(182,106,106,0.15)] text-[var(--color-loss)]' : 'bg-[rgba(200,179,142,0.15)] text-[var(--color-gold)]'}`}>
                      {e.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
