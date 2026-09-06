'use client';

import React, { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function AkwamApp() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('movies');
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);

  const api = (path) => `${API_BASE}${path}`;

  const loadMedia = async (query = '', type = filterType) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        api(`/api/media?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`)
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'فشل الطلب');

      setItems(data.data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError('تعذر جلب المحتوى. تحقق من إعدادات Netlify والمصدر.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia('', filterType);
  }, [filterType]);

  const handleCardClick = async (item) => {
    if (!item.isSeries) {
      playStream(item.link, item.title);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        api(`/api/series-episodes?url=${encodeURIComponent(item.link)}`)
      );
      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'فشل جلب الحلقات');

      setSelectedSeries(item);
      setEpisodes(data.data || []);
    } catch (err) {
      console.error(err);
      setError('تعذر جلب حلقات المسلسل.');
    } finally {
      setLoading(false);
    }
  };

  const playStream = async (link, title) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        api(`/api/stream-link?url=${encodeURIComponent(link)}`)
      );
      const data = await res.json();

      if (!data.success || !data.streamUrl) {
        throw new Error(data.message || 'لم يتم العثور على رابط التشغيل');
      }

      setSelectedSeries(null);
      setActiveVideo({ title, url: data.streamUrl });
    } catch (err) {
      console.error(err);
      setError('تعذر استخراج رابط التشغيل.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6" dir="rtl">
      <section className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            مكتبة الأفلام والمسلسلات
          </h1>
          <p className="text-slate-400 text-sm">
            ابحث وتصفح المحتوى من خلال واجهة بسيطة.
          </p>
        </header>

        <div className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row gap-3">
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setFilterType('movies')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition ${
                filterType === 'movies'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              أفلام
            </button>

            <button
              onClick={() => setFilterType('series')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition ${
                filterType === 'series'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مسلسلات
            </button>
          </div>

          <form
            className="flex-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              loadMedia(searchQuery, filterType);
            }}
          >
            <input
              type="search"
              placeholder="ابحث عن فيلم أو مسلسل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-600"
            />

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-xl text-sm font-bold transition"
            >
              بحث
            </button>
          </form>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-950/50 border border-red-800 text-red-200 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-500">لا توجد نتائج.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="text-right bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-red-600 cursor-pointer transition group"
              >
                <div className="aspect-[2/3] relative overflow-hidden bg-slate-800">
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                      لا توجد صورة
                    </div>
                  )}

                  <span className="absolute top-2 right-2 bg-black/80 text-xs px-2 py-1 rounded text-amber-400 font-bold">
                    ★ {item.rating || 'N/A'}
                  </span>

                  {item.isSeries && (
                    <span className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                      مسلسل
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-bold text-sm truncate">{item.title}</h3>
                  <span className="text-xs text-slate-500 mt-1 block truncate">
                    {item.category || 'غير مصنف'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedSeries && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-5 md:p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{selectedSeries.title}</h3>
              <button
                onClick={() => setSelectedSeries(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {episodes.map((ep, idx) => (
                <button
                  type="button"
                  key={`${ep.link}-${idx}`}
                  onClick={() => playStream(ep.link, ep.title)}
                  className="bg-slate-800 hover:bg-red-600/20 hover:border-red-600 border border-slate-700 text-right p-3 rounded-xl text-sm transition text-white"
                >
                  {ep.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeVideo && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-3 md:p-6">
          <div className="w-full max-w-5xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-4 flex justify-between items-center gap-4">
              <h3 className="font-bold truncate">{activeVideo.title}</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-black">
              <iframe
                src={activeVideo.url}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={activeVideo.title}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AkwamApp;