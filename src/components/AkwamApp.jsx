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
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[76px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-7 min-w-0">
            <button
              onClick={() => {
                setSearchQuery('');
                setViewWatchlistOnly(false);
                setActiveType('all');
                loadCatalog('', 'all');
              }}
              className="flex items-center gap-2 shrink-0"
            >
              <span className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-red-600/25">
                أ
              </span>
              <span className="hidden sm:block text-2xl font-black bg-gradient-to-l from-white via-slate-200 to-red-500 bg-clip-text text-transparent">
                أكـوام <small className="text-red-500 text-xs">Stream</small>
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/70 p-1.5 rounded-xl border border-slate-800">
              {[
                ['all', 'الكل'],
                ['movie', 'الأفلام'],
                ['series', 'المسلسلات']
              ].map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveType(type);
                    setViewWatchlistOnly(false);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    activeType === type && !viewWatchlistOnly
                      ? 'bg-red-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <form onSubmit={search} className="relative hidden sm:block w-64 md:w-80">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن فيلم أو مسلسل..."
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2 pr-11 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                {icon.search}
              </button>
            </form>

            <button
              onClick={() => setViewWatchlistOnly(!viewWatchlistOnly)}
              className={`h-10 px-3 rounded-xl border flex items-center gap-2 transition ${
                viewWatchlistOnly
                  ? 'bg-red-600/15 border-red-600 text-red-500'
                  : 'bg-slate-900/80 border-slate-700 text-slate-300'
              }`}
              title="قائمة المفضلة"
            >
              <span>{icon.bookmark}</span>
              <span className="text-xs font-bold">{watchlist.length}</span>
            </button>
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[
              ['all', 'الكل'],
              ['movie', 'الأفلام'],
              ['series', 'المسلسلات']
            ].map(([type, label]) => (
              <button
                key={type}
                onClick={() => {
                  setActiveType(type);
                  setViewWatchlistOnly(false);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                  activeType === type && !viewWatchlistOnly
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 w-full flex-1">
        {!searchQuery && !viewWatchlistOnly && featured && (
          <section className="relative rounded-3xl overflow-hidden mb-10 border border-slate-800 shadow-2xl group fade-in">
            <div className="absolute inset-0 z-10 hero-gradient" />
            <img
              src={featured.banner || featured.poster}
              alt={featured.title}
              className="w-full h-[380px] sm:h-[470px] object-cover group-hover:scale-[1.03] transition-transform duration-700"
            />

            <div className="absolute bottom-0 right-0 z-20 p-6 sm:p-10 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                  مميز على أكوام
                </span>
                <span className="bg-slate-900/80 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-400/20 font-bold">
                  {icon.star} {featured.rating || 'N/A'}
                </span>
                {featured.year && (
                  <span className="text-slate-300 text-xs font-semibold">{featured.year}</span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 leading-tight">
                {featured.title}
              </h1>

              <p className="text-slate-300 text-sm leading-relaxed mb-6 line-clamp-2">
                {featured.story ||
                  `شاهد ${featured.title} من خلال واجهة أكوام Stream واستكشف خيارات المشاهدة المتاحة.`}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => playStreamDirectly(featured.link, featured.title, featured)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-600/25 hover:scale-[1.02] transition"
                >
                  {icon.play} شاهد الآن
                </button>
                <button
                  onClick={() => openDetails(featured)}
                  className="bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-600 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                >
                  {icon.info} التفاصيل والروابط
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <span className="w-1.5 h-7 bg-red-600 rounded-full" />
            {viewWatchlistOnly
              ? 'قائمة المفضلة والمشاهدة لاحقاً'
              : searchQuery
                ? `نتائج البحث عن: "${searchQuery}"`
                : 'أحدث العروض'}
          </h2>
          <span className="text-slate-500 text-xs sm:text-sm">
            عدد العناصر: ({filteredItems.length})
          </span>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-900 text-red-200 rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900/70 rounded-2xl h-[390px] animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
            <div className="text-5xl mb-4">{icon.film}</div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">
              لم يتم العثور على أي نتائج
            </h3>
            <p className="text-slate-500 text-sm">
              جرّب اسمًا مختلفًا أو غيّر نوع المحتوى.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredItems.map((item) => {
              const bookmarked = watchlist.some((w) => w.id === item.id);

              return (
                <article
                  key={item.id}
                  className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all shadow-lg relative"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {icon.film}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20 opacity-90" />

                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-amber-400 text-xs font-bold">
                      {icon.star} {item.rating || 'N/A'}
                    </div>

                    <button
                      onClick={() => toggleWatchlist(item)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md border ${
                        bookmarked
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-slate-950/70 text-slate-300 border-white/10'
                      }`}
                      title="المفضلة"
                    >
                      {icon.bookmark}
                    </button>

                    <button
                      onClick={() => playStreamDirectly(item.link, item.title, item)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xl"
                      aria-label="تشغيل"
                    >
                      {icon.play}
                    </button>

                    <span className="absolute bottom-3 right-3 bg-slate-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                      {item.quality || 'WEB'} {item.resolution || '1080p'}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{item.isSeries ? 'مسلسل' : 'فيلم'}</span>
                      <span>{item.year || ''}</span>
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 group-hover:text-red-500 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {item.category || 'غير مصنف'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => openDetails(item)}
                        className="text-slate-300 hover:text-red-500 text-xs font-bold flex items-center gap-1"
                      >
                        التفاصيل والروابط ←
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-10 text-center text-slate-500 text-xs">
        <p>أكـوام Stream © 2026</p>
        <p className="mt-1 text-slate-600">
          واجهة عرض حديثة ومتجاوبة للأفلام والمسلسلات.
        </p>
      </footer>

      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          bookmarked={watchlist.some((w) => w.id === selectedItem.id)}
          onClose={() => setSelectedItem(null)}
          onToggle={() => toggleWatchlist(selectedItem)}
          onPlay={() => playStreamDirectly(selectedItem.link, selectedItem.title, selectedItem)}
        />
      )}

      {activeVideo && (
        <PlayerModal
          item={activeVideo}
          quality={activeQuality}
          setQuality={setActiveQuality}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}

function DetailsModal({ item, bookmarked, onClose, onToggle, onPlay }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto fade-in"
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl my-6">
        <div className="relative h-64 sm:h-80">
          <img
            src={item.banner || item.poster}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700"
          >
            {icon.close}
          </button>

          <div className="absolute bottom-6 right-6 left-6 flex items-end gap-5">
            {item.poster && (
              <img
                src={item.poster}
                alt={item.title}
                className="hidden sm:block w-28 h-40 object-cover rounded-2xl border-2 border-slate-700 shadow-2xl"
              />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">
                  {item.isSeries ? 'مسلسل' : 'فيلم'}
                </span>
                <span className="text-amber-400 text-xs font-bold">
                  {icon.star} {item.rating || 'N/A'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">{item.title}</h2>
              {item.originalTitle && (
                <p className="text-slate-400 text-xs mt-1">{item.originalTitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {item.story || `استكشف تفاصيل ${item.title} وخيارات المشاهدة المتاحة.`}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 mb-6 text-xs">
            <div>
              <span className="text-slate-500 block">التصنيف</span>
              <b>{item.category || 'غير مصنف'}</b>
            </div>
            <div>
              <span className="text-slate-500 block">السنة</span>
              <b>{item.year || '—'}</b>
            </div>
            <div>
              <span className="text-slate-500 block">النوع</span>
              <b>{item.isSeries ? 'مسلسل' : 'فيلم'}</b>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onPlay}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2"
            >
              {icon.play} تشغيل
            </button>
            <button
              onClick={onToggle}
              className={`px-5 py-3 rounded-xl font-bold border ${
                bookmarked
                  ? 'bg-red-600/15 border-red-600 text-red-500'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              {icon.bookmark} {bookmarked ? 'في المفضلة' : 'أضف للمفضلة'}
            </button>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl font-bold bg-slate-800 border border-slate-700 text-slate-200"
              >
                فتح المصدر ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerModal({ item, quality, setQuality, onClose }) {
  const [videoError, setVideoError] = useState(false);

  const source = (item.streamLinks || []).find((x) => x.quality === quality)?.url || item.url;

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col fade-in">
      <div className="p-4 sm:p-6 flex items-center justify-between gap-4 bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="w-10 h-10 shrink-0 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700"
          >
            {icon.back}
          </button>
          <div className="min-w-0">
            <h3 className="font-bold text-white truncate">{item.title}</h3>
            <p className="text-slate-500 text-xs">مشغل HTML5</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <span className="hidden sm:block text-xs text-slate-500 px-2">الجودة</span>
          {(item.streamLinks?.length ? item.streamLinks.map((x) => x.quality) : ['1080p']).filter((q, i, a) => q && a.indexOf(q) === i).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                quality === q
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-2 sm:px-6">
        <div className="w-full max-w-6xl aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
          {videoError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-bold mb-2">تعذر تشغيل الفيديو داخل المتصفح</h3>
              <p className="text-slate-500 text-xs mb-5">
                قد يكون الرابط يحتاج إلى صلاحيات أو ترويسة من المصدر.
              </p>
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 px-5 py-2.5 rounded-xl text-sm font-bold"
              >
                فتح الرابط
              </a>
            </div>
          ) : (
            <video
              key={`${source}-${quality}`}
              controls
              autoPlay
              playsInline
              poster={item.banner || item.poster}
              className="w-full h-full object-contain"
              onError={() => setVideoError(true)}
            >
              <source src={source} type="video/mp4" />
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          )}
        </div>
      </div>

      <div className="p-4 text-center text-xs text-slate-600">
        استخدم أزرار الجودة عندما تتوفر روابط متعددة من المصدر.
      </div>
    </div>
  );
}

export default AkwamApp;