/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const icon = {
  search: '⌕',
  bookmark: '🔖',
  play: '▶',
  info: 'ⓘ',
  close: '✕',
  back: '→',
  download: '⇩',
  star: '★',
  film: '🎬',
  check: '✓'
};

function AkwamApp() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeQuality, setActiveQuality] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [viewWatchlistOnly, setViewWatchlistOnly] = useState(false);

  const api = (path) => `${API_BASE}${path}`;

  useEffect(() => {
    try {
      setWatchlist(JSON.parse(localStorage.getItem('akwam_watchlist') || '[]'));
    } catch {
      setWatchlist([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('akwam_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const loadCatalog = async (query = searchQuery, type = activeType) => {
    setLoading(true);
    setError('');

    try {
      const serverType = type === 'movie' ? 'movies' : type === 'series' ? 'series' : 'movies';
      const response = await fetch(
        api(`/api/media?q=${encodeURIComponent(query)}&type=${serverType}`)
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'فشل جلب البيانات');
      }

      let result = data.data || [];
      if (type === 'all' && !query) {
        result = result;
      }

      setItems(result);
    } catch (e) {
      console.error(e);
      setItems([]);
      setError('تعذر تحميل المحتوى. تحقق من إعدادات المصدر أو Netlify Functions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog('', activeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  const filteredItems = useMemo(() => {
    if (viewWatchlistOnly) return watchlist;
    return items.filter((item) => {
      if (activeType === 'movie') return !item.isSeries;
      if (activeType === 'series') return item.isSeries;
      return true;
    });
  }, [items, watchlist, viewWatchlistOnly, activeType]);

  const featured = items[0] || null;

  const toggleWatchlist = (item) => {
    setWatchlist((current) =>
      current.some((x) => x.id === item.id)
        ? current.filter((x) => x.id !== item.id)
        : [...current, item]
    );
  };

  const playStreamDirectly = async (mediaLink, title, item = null) => {
    setSelectedItem(null);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        api(`/api/stream-link?url=${encodeURIComponent(mediaLink)}`)
      );
      const data = await response.json();

      if (!response.ok || !data.success || !data.streamUrl) {
        throw new Error(data.message || 'لم يتم العثور على رابط التشغيل');
      }

      const resolvedItem = item || {
        title,
        link: mediaLink,
        poster: '',
        banner: ''
      };

      setActiveQuality(data.quality || '1080p');
      setActiveVideo({
        ...resolvedItem,
        title: title || resolvedItem.title,
        streamLinks: data.streamLinks?.length
          ? data.streamLinks
          : [{ quality: data.quality || '1080p', url: data.streamUrl }],
        url: data.streamUrl,
        sourcePage: data.sourcePage
      });
    } catch (e) {
      console.error(e);
      setError('تعذر استخراج رابط التشغيل لهذا العنصر.');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (item) => {
    setSelectedItem(item);
  };

  const search = async (e) => {
    e.preventDefault();
    setViewWatchlistOnly(false);
    await loadCatalog(searchQuery, activeType);
  };

  return (
    <main className="ak-shell">
      <div className="ak-bg-orb orb-a" />
      <div className="ak-bg-orb orb-b" />

      <header className="ak-topbar">
        <div className="ak-brand">
          <div className="ak-logo">A</div>
          <div>
            <strong>أكوام<span>+</span></strong>
            <small>سينما ومسلسلات</small>
          </div>
        </div>

        <nav className="ak-nav">
          <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>الرئيسية</button>
          <button className={activeTab === 'movies' ? 'active' : ''} onClick={() => setActiveTab('movies')}>الأفلام</button>
          <button className={activeTab === 'series' ? 'active' : ''} onClick={() => setActiveTab('series')}>المسلسلات</button>
          <button className={activeTab === 'favorites' ? 'active' : ''} onClick={() => setActiveTab('favorites')}>المفضلة</button>
        </nav>

        <div className="ak-actions">
          <button className="icon-btn" aria-label="المفضلة">♡</button>
          <button className="profile-btn"><span>👤</span> حسابي</button>
        </div>
      </header>

      <section className="ak-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> اكتشف عالمًا من الترفيه</div>
          <h1>شاهد ما تحب،<br /><em>متى ما تريد.</em></h1>
          <p>اكتشف أحدث الأفلام والمسلسلات، وابحث عن عملك المفضل واستمتع بتجربة مشاهدة بسيطة وسريعة.</p>

          <form className="search-box" onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) performSearch(searchQuery.trim()); }}>
            <span className="search-icon">⌕</span>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن فيلم، مسلسل أو ممثل..." />
            <button type="submit">بحث</button>
          </form>

          <div className="hero-meta">
            <span>✦ مكتبة متجددة</span>
            <span>◉ جودة عالية</span>
            <span>▣ واجهة سريعة</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-poster poster-one"><div className="poster-shade" /><span>THE<br />LAST<br /><b>HORIZON</b></span></div>
          <div className="hero-poster poster-two"><div className="poster-shade" /><span>BEYOND<br /><b>TIME</b></span></div>
          <div className="hero-poster poster-three"><div className="poster-shade" /><span>NO<br /><b>LIMITS</b></span></div>
          <div className="hero-ring" />
        </div>
      </section>

      <section className="ak-content">
        <div className="section-head">
          <div>
            <div className="section-kicker">مكتبتك المفضلة</div>
            <h2>{activeTab === 'series' ? 'أحدث المسلسلات' : activeTab === 'movies' ? 'أحدث الأفلام' : activeTab === 'favorites' ? 'المفضلة لديك' : 'الأحدث والأكثر مشاهدة'}</h2>
          </div>
          <button className="see-all" onClick={() => setActiveTab(activeTab === 'series' ? 'movies' : 'series')}>عرض المزيد <span>←</span></button>
        </div>

        <div className="filter-row">
          {['الكل', 'أفلام', 'مسلسلات', 'الأعلى تقييمًا', 'الأحدث'].map((x, i) => (
            <button key={x} className={i === 0 ? 'filter active' : 'filter'}>{x}</button>
          ))}
        </div>

        {loading ? (
          <div className="movie-grid">{Array.from({ length: 8 }).map((_, i) => <div className="skeleton-card" key={i}><div className="sk-poster" /><div className="sk-line" /><div className="sk-line short" /></div>)}</div>
        ) : (
          <div className="movie-grid">
            {(items || []).map((item, index) => (
              <article className="movie-card" key={item.id || item.url || index} onClick={() => openMovie(item)}>
                <div className="poster-wrap">
                  <img src={item.poster || item.image || item.thumbnail || '/placeholder.jpg'} alt={item.title || item.name || 'فيلم'} loading="lazy" onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                  <div className="poster-fallback">▶</div>
                  <div className="card-gradient" />
                  <div className="type-badge">{item.type === 'series' ? 'مسلسل' : 'فيلم'}</div>
                  <button className="quick-play" onClick={(e) => { e.stopPropagation(); openMovie(item); }}>▶</button>
                  <button className="heart-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}>♡</button>
                </div>
                <div className="movie-info">
                  <h3>{item.title || item.name || 'بدون عنوان'}</h3>
                  <div className="movie-sub">
                    <span>⭐ {item.rating || '—'}</span>
                    <span>{item.year || item.releaseYear || '2026'}</span>
                    <span>{item.type === 'series' ? 'مسلسل' : 'فيلم'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && (!items || items.length === 0) && (
          <div className="empty-state"><div>🎬</div><h3>لا توجد نتائج حاليًا</h3><p>جرّب كلمة بحث مختلفة أو تصفح قسمًا آخر.</p></div>
        )}
      </section>

      {activePlayerItem && (
        <div className="player-overlay" onClick={() => setActivePlayerItem(null)}>
          <div className="player-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-player" onClick={() => setActivePlayerItem(null)}>×</button>
            <div className="player-title">{activePlayerItem.title}</div>
            <div className="video-frame">
              {activePlayerItem.streamLinks?.[0]?.url ? (
                <video controls autoPlay playsInline src={activePlayerItem.streamLinks[0].url} />
              ) : <div className="player-loading">جاري تجهيز المشغل...</div>}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
