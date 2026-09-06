'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function AkwamApp() {
  const [items, setItems] = useState([]);
  const [heroItem, setHeroItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('home'); // home, movies, series
  const [searchQuery, setSearchQuery] = useState('');

  // حالات المشغل
  const [activePlayer, setActivePlayer] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [currentStreamUrl, setCurrentStreamUrl] = useState('');
  const [loadingStream, setLoadingStream] = useState(false);
  const videoRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // جلب البيانات (تصفح + بحث)
  const fetchData = useCallback(async (tab = activeTab, page = 1, query = '') => {
    setLoading(true);
    try {
      let url = `/.netlify/functions/api?action=${tab}&page=${page}`;
      if (query.trim()) url = `/.netlify/functions/api?action=search&q=${encodeURIComponent(query)}`;
      
      const res = await fetch(url);
      const result = await res.json();
      
      if (result.success) {
        setItems(result.data || []);
        setTotalPages(result.totalPages || 1);
        setCurrentPage(result.currentPage || 1);
        if (result.data?.length > 0) setHeroItem(result.data[0]);
      } else {
        setItems([]);
        setHeroItem(null);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // التحميل الأولي
  useEffect(() => {
    fetchData('home', 1);
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // تغيير التبويب
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    fetchData(tab, 1);
  };

  // البحث
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) fetchData('search', 1, searchQuery);
  };

  // التنقل بين الصفحات
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchData(activeTab, page, searchQuery);
  };

  // تشغيل الفيديو
  const handlePlay = async (item) => {
    setLoadingStream(true);
    try {
      const res = await fetch(`/.netlify/functions/api?action=details&url=${encodeURIComponent(item.link)}`);
      const data = await res.json();
      if (data.success && data.streams?.length > 0) {
        const streams = data.streams;
        setActivePlayer({ title: item.title, streams });
        setSelectedQuality(streams[0].quality);
        setCurrentStreamUrl(streams[0].url);
      } else {
        alert('لا توجد روابط، سيتم تشغيل فيلم تجريبي');
        const fallback = [{ quality: '1080p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }];
        setActivePlayer({ title: item.title, streams: fallback });
        setSelectedQuality('1080p');
        setCurrentStreamUrl(fallback[0].url);
      }
    } catch (err) {
      console.error(err);
      alert('خطأ في جلب الفيديو');
    } finally {
      setLoadingStream(false);
    }
  };

  // تغيير الجودة مع حفظ الوقت
  const handleQualityChange = (quality, url) => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const isPlaying = !videoRef.current.paused;
    setSelectedQuality(quality);
    setCurrentStreamUrl(url);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (isPlaying) videoRef.current.play();
      }
    }, 150);
  };

  // عرض البطاقات
  return (
    <div className="min-h-screen bg-[#141414] text-white" dir="rtl">
      {/* الهيدر */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 flex flex-wrap items-center justify-between gap-3 ${isScrolled ? 'bg-[#141414]/95 backdrop-blur' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleTabChange('home')}>
            <span className="text-3xl font-black text-red-600">🎬 Streamo</span>
          </div>
          <nav className="hidden md:flex gap-4 text-sm font-medium">
            {['home', 'movies', 'series'].map(tab => (
              <button key={tab} onClick={() => handleTabChange(tab)} 
                className={`transition ${activeTab === tab ? 'text-white border-b-2 border-red-600 pb-1' : 'text-gray-400 hover:text-white'}`}>
                {tab === 'home' ? 'الرئيسية' : tab === 'movies' ? 'أفلام' : 'مسلسلات'}
              </button>
            ))}
          </nav>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
            placeholder="ابحث في أكوام..." 
            className="bg-black/60 border border-gray-700 focus:border-red-600 rounded-full px-4 py-1.5 pl-10 text-sm text-white focus:outline-none w-44 sm:w-64" />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</button>
        </form>
      </header>

      {/* البطل (Hero) */}
      {heroItem && !loading && (
        <section className="relative w-full h-[75vh] flex items-center overflow-hidden">
          <img src={heroItem.poster} className="absolute inset-0 w-full h-full object-cover brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
          <div className="relative z-20 max-w-3xl px-8 space-y-4">
            <h1 className="text-5xl md:text-7xl font-black drop-shadow-2xl">{heroItem.title}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="bg-red-600 px-2 py-0.5 rounded text-xs">مباشر</span>
              <span>⭐ {heroItem.rating}</span>
              <span>{heroItem.category}</span>
            </div>
            <button onClick={() => handlePlay(heroItem)} className="bg-white text-black font-bold px-8 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition">
              ▶ تشغيل الآن
            </button>
          </div>
        </section>
      )}

      {/* شبكة المحتوى */}
      <main className="relative z-30 px-6 md:px-12 -mt-16 pb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold border-r-4 border-red-600 pr-3">
            {loading ? 'جاري التحميل...' : `نتائج (${items.length})`}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-50">السابق</button>
            <span className="px-3 py-1 bg-zinc-900 rounded">{currentPage} / {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-1 bg-zinc-800 rounded disabled:opacity-50">التالي</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">⏳ جاري التحميل...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد نتائج</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map(item => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden bg-zinc-900 hover:scale-105 transition-all duration-300 cursor-pointer border border-zinc-800 hover:border-red-600" onClick={() => setHeroItem(item)}>
                <div className="aspect-[2/3]">
                  <img src={item.poster} className="w-full h-full object-cover" loading="lazy" />
                  <button onClick={(e) => { e.stopPropagation(); handlePlay(item); }} 
                    className="absolute inset-0 m-auto w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xl">
                    ▶
                  </button>
                </div>
                <div className="p-2 text-center">
                  <h3 className="text-sm font-bold line-clamp-1">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* مشغل الفيديو */}
      {activePlayer && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-zinc-900/90 border-b border-zinc-800">
            <h3 className="font-bold">{activePlayer.title} <span className="bg-red-600 text-xs px-2 py-0.5 rounded">{selectedQuality}</span></h3>
            <button onClick={() => { setActivePlayer(null); setCurrentStreamUrl(''); }} className="text-2xl px-3 hover:text-red-500">✕</button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {loadingStream && <div className="absolute w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin z-10"></div>}
            <video ref={videoRef} key={currentStreamUrl} src={currentStreamUrl} controls autoPlay className="w-full max-w-5xl aspect-video bg-black rounded-xl" />
          </div>
          <div className="flex flex-wrap justify-center gap-3 p-4 bg-zinc-900/90 border-t border-zinc-800">
            {activePlayer.streams.map(s => (
              <button key={s.quality} onClick={() => handleQualityChange(s.quality, s.url)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${selectedQuality === s.quality ? 'bg-red-600 shadow-lg shadow-red-600/40' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                {s.quality}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
