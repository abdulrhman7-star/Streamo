'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

export default function AkwamApp() {
  // حالات البيانات والتصفح
  const [items, setItems] = useState([]);
  const [heroItem, setHeroItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('akwam_watchlist') || '[]'); } catch { return []; }
  });
  const [viewWatchlistOnly, setViewWatchlistOnly] = useState(false);

  // حالات مشغل الفيديو
  const [activePlayerItem, setActivePlayerItem] = useState(null);
  const [activeQuality, setActiveQuality] = useState('720p');
  const [currentStreamUrl, setCurrentStreamUrl] = useState('');
  const [loadingStream, setLoadingStream] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);
  const videoRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // ---------- جلب البيانات من API ----------
  const fetchData = async (query = '', type = 'home', page = 1) => {
    setLoading(true);
    try {
      let url = `/.netlify/functions/api?action=${type}&page=${page}`;
      if (query.trim()) {
        url = `/.netlify/functions/api?action=search&q=${encodeURIComponent(query)}`;
      }
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
      console.error('خطأ في جلب البيانات:', err);
      alert('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  // التحميل الأولي
  useEffect(() => {
    fetchData('', 'home', 1);
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // حفظ قائمة المفضلة في localStorage
  useEffect(() => {
    localStorage.setItem('akwam_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // تصفية النتائج (مع المفضلة)
  const filteredItems = useMemo(() => {
    let list = viewWatchlistOnly ? watchlist : items;
    if (activeType !== 'all') {
      list = list.filter(item => item.type === activeType);
    }
    if (searchQuery.trim()) {
      list = list.filter(item => 
        item.title.includes(searchQuery) || 
        item.category?.includes(searchQuery)
      );
    }
    return list;
  }, [items, watchlist, activeType, searchQuery, viewWatchlistOnly]);

  // تبديل المفضلة
  const toggleWatchlist = (item) => {
    if (watchlist.some(w => w.id === item.id)) {
      setWatchlist(watchlist.filter(w => w.id !== item.id));
    } else {
      setWatchlist([...watchlist, item]);
    }
  };

  // تشغيل الفيديو (جلب الجودات من أكوام)
  const handlePlay = async (item) => {
    setLoadingStream(true);
    setActivePlayerItem(null);
    try {
      const res = await fetch(`/.netlify/functions/api?action=details&url=${encodeURIComponent(item.link)}`);
      const data = await res.json();
      if (data.success && data.streams?.length > 0) {
        const streams = data.streams;
        setActivePlayerItem({ ...item, streams });
        setActiveQuality(streams[0].quality);
        setCurrentStreamUrl(streams[0].url);
      } else {
        alert('لم يتم العثور على روابط تشغيل، سيتم استخدام فيلم تجريبي.');
        const fallback = [
          { quality: '1080p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
          { quality: '720p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' }
        ];
        setActivePlayerItem({ ...item, streams: fallback });
        setActiveQuality('1080p');
        setCurrentStreamUrl(fallback[0].url);
      }
    } catch (err) {
      console.error(err);
      alert('خطأ في جلب روابط الفيديو.');
    } finally {
      setLoadingStream(false);
    }
  };

  // تغيير الجودة مع حفظ الوقت
  const handleQualityChange = (quality, url) => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const isPlaying = !videoRef.current.paused;
    setActiveQuality(quality);
    setCurrentStreamUrl(url);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (isPlaying) videoRef.current.play();
      }
    }, 150);
  };

  // التنقل بين الصفحات
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchData(searchQuery, activeType === 'all' ? 'home' : activeType, page);
  };

  // --- عرض الواجهة ---
  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-cairo" dir="rtl">
      
      {/* ========== الهيدر ========== */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b border-slate-800/80 transition-all duration-300 ${
        isScrolled ? 'bg-[#0b0f19]/95' : 'bg-[#0b0f19]/70'
      }`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <a href="#" onClick={() => { setViewWatchlistOnly(false); setSearchQuery(''); fetchData('', 'home', 1); }} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#e50914] rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-lg">أ</div>
              <span className="text-2xl font-black text-white">أكـوام <span className="text-[#e50914] text-xs px-2 py-0.5 rounded bg-[#e50914]/10 border border-[#e50914]/20 font-bold">Stream</span></span>
            </a>

            <nav className="hidden md:flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
              <button onClick={() => { setActiveType('all'); setViewWatchlistOnly(false); setSearchQuery(''); fetchData('', 'home', 1); }} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${activeType === 'all' && !viewWatchlistOnly ? 'bg-[#e50914] text-white' : 'text-slate-400'}`}>الكل</button>
              <button onClick={() => { setActiveType('movie'); setViewWatchlistOnly(false); setSearchQuery(''); fetchData('', 'movies', 1); }} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${activeType === 'movie' && !viewWatchlistOnly ? 'bg-[#e50914] text-white' : 'text-slate-400'}`}>الأفلام</button>
              <button onClick={() => { setActiveType('series'); setViewWatchlistOnly(false); setSearchQuery(''); fetchData('', 'series', 1); }} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${activeType === 'series' && !viewWatchlistOnly ? 'bg-[#e50914] text-white' : 'text-slate-400'}`}>المسلسلات</button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchData(searchQuery, 'search', 1); }}
                placeholder="ابحث عن فيلم أو مسلسل..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 pr-10 text-sm text-slate-100 focus:outline-none focus:border-[#e50914]"
              />
              <i className="fa-solid fa-magnifying-glass absolute right-3 top-3 text-slate-400"></i>
            </div>

            <button 
              onClick={() => setViewWatchlistOnly(!viewWatchlistOnly)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${viewWatchlistOnly ? 'bg-[#e50914]/20 border-[#e50914] text-[#e50914]' : 'bg-slate-900 border-slate-700 text-slate-300'}`}
            >
              <i className={`fa-${watchlist.length > 0 ? 'solid' : 'regular'} fa-bookmark text-[#ffb703]`}></i>
              <span className="hidden sm:inline text-xs font-bold">{watchlist.length}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========== المحتوى الرئيسي ========== */}
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        {/* البطل (Hero) */}
        {!searchQuery && !viewWatchlistOnly && heroItem && !loading && (
          <div className="relative rounded-3xl overflow-hidden mb-12 border border-slate-800 shadow-2xl">
            <img src={heroItem.poster} alt={heroItem.title} className="w-full h-[420px] object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/60 to-transparent"></div>
            <div className="absolute bottom-0 right-0 p-8 max-w-2xl">
              <span className="bg-[#e50914] text-white text-xs px-3 py-1 rounded-full font-bold mb-3 inline-block">أعلى مشاهدة اليوم</span>
              <h1 className="text-4xl font-black text-white mb-2">{heroItem.title}</h1>
              <p className="text-slate-300 text-sm line-clamp-2 mb-6">{heroItem.category || 'فيلم عربي'}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => handlePlay(heroItem)}
                  className="bg-[#e50914] hover:bg-[#b80710] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
                >
                  <i className="fa-solid fa-play"></i> شاهد الآن
                </button>
                <button onClick={() => setSelectedItemForDetails(heroItem)} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-5 py-3 rounded-xl font-semibold">التفاصيل والتحميل</button>
              </div>
            </div>
          </div>
        )}

        {/* عنوان القائمة */}
        <h2 className="text-2xl font-bold text-white mb-6 border-r-4 border-[#e50914] pr-3">
          {viewWatchlistOnly ? 'قائمة المفضلة' : loading ? 'جاري التحميل...' : `نتائج البحث (${filteredItems.length})`}
        </h2>

        {/* أزرار التصفح (الصفحات) */}
        {!viewWatchlistOnly && !loading && items.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1 bg-slate-800 rounded disabled:opacity-50 text-sm">السابق</button>
              <span className="px-3 py-1 bg-slate-900 rounded text-sm">{currentPage} / {totalPages}</span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-1 bg-slate-800 rounded disabled:opacity-50 text-sm">التالي</button>
            </div>
          </div>
        )}

        {/* شبكة البطاقات */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">⏳ جاري التحميل...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-slate-400">لا توجد نتائج مطابقة.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredItems.map(item => {
              const isBookmarked = watchlist.some(w => w.id === item.id);
              return (
                <div key={item.id} className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all flex flex-col justify-between shadow-lg relative">
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => toggleWatchlist(item)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md ${isBookmarked ? 'bg-[#e50914] text-white' : 'bg-slate-950/60 text-slate-300'}`}
                    >
                      <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark text-xs`}></i>
                    </button>
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <button 
                        onClick={() => handlePlay(item)}
                        className="w-12 h-12 bg-[#e50914] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                      >
                        <i className="fa-solid fa-play text-lg"></i>
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-xs text-slate-400 mb-1">{item.type === 'movie' ? 'فيلم' : 'مسلسل'} • {item.category || 'N/A'}</div>
                    <h3 className="font-bold text-white text-base line-clamp-1">{item.title}</h3>
                    <button onClick={() => setSelectedItemForDetails(item)} className="text-xs text-slate-400 hover:text-[#e50914] mt-3 block">التفاصيل والروابط ←</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========== نافذة التفاصيل والتحميل ========== */}
      {selectedItemForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedItemForDetails(null)} className="absolute top-4 left-4 text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
            <h2 className="text-2xl font-bold text-white mb-2">{selectedItemForDetails.title}</h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">{selectedItemForDetails.category || 'لا يوجد وصف'}</p>

            <h4 className="text-sm font-bold text-white mb-3"><i className="fa-solid fa-circle-play text-[#e50914]"></i> التشغيل المباشر:</h4>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => { handlePlay(selectedItemForDetails); setSelectedItemForDetails(null); }} className="bg-[#e50914] hover:bg-[#b80710] text-white p-3 rounded-xl text-center font-bold">
                <i className="fa-solid fa-play"></i> تشغيل الآن
              </button>
            </div>

            <h4 className="text-sm font-bold text-white mb-3"><i className="fa-solid fa-download text-[#38bdf8]"></i> روابط التحميل (من أكوام):</h4>
            <div className="text-center text-slate-400 text-sm p-4 border border-dashed border-slate-700 rounded-xl">
              سيتم جلب روابط التحميل عند التشغيل.
            </div>
          </div>
        </div>
      )}

      {/* ========== مشغل الفيديو المدمج ========== */}
      {activePlayerItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between">
          <div className="p-4 flex items-center justify-between bg-black/80">
            <div className="flex items-center gap-4">
              <button onClick={() => { setActivePlayerItem(null); setCurrentStreamUrl(''); }} className="w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center">
                <i className="fa-solid fa-arrow-right"></i>
              </button>
              <h3 className="font-bold text-white text-lg">{activePlayerItem.title}</h3>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl">
              {activePlayerItem.streams?.map((s) => (
                <button
                  key={s.quality}
                  onClick={() => handleQualityChange(s.quality, s.url)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${activeQuality === s.quality ? 'bg-[#e50914] text-white' : 'text-slate-400'}`}
                >
                  {s.quality}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 relative">
            {loadingStream && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70">
                <div className="w-12 h-12 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800">
              <video 
                ref={videoRef}
                key={currentStreamUrl}
                src={currentStreamUrl}
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="p-4 text-center text-xs text-slate-500">
            مشغل بث مباشر مدمج عبر روابط أكوام.
          </div>
        </div>
      )}

      {/* ========== الفوتر ========== */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-slate-500 text-sm">
        جميع الحقوق محفوظة منصة أكوام السينمائية © 2026
      </footer>

      {/* إضافة FontAwesome عبر CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');
        .font-cairo { font-family: 'Cairo', sans-serif; }
      `}</style>
    </div>
  );
}
