'use client';

import { useState, useMemo, useEffect } from 'react';

// كتالوج وسائط موسع لإنشاء واجهة غنية على طريقة نتفليكس وشاهد
const AKWAM_CATALOG = [
  {
    id: "ak-101",
    title: "همام في أمستردام",
    type: "movie",
    year: 1999,
    rating: "8.4",
    duration: "1h 55m",
    category: "كوميدي / دراما",
    description: "يتجه شاب مصري طموح إلى هولندا بحثًا عن فرصة عمل وتحقيق أحلامه، ليواجه العديد من المواقف الكوميدية والتحديات الصعبة قبل الوصول للنجاح.",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
    akwamPageUrl: "https://akwam.ss/movie/7013/همام-في-امستردام",
    defaultStream: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    isTrending: true
  },
  {
    id: "ak-102",
    title: "صعيدي في الجامعة الأمريكية",
    type: "movie",
    year: 1998,
    rating: "8.8",
    duration: "2h 05m",
    category: "كوميدي",
    description: "شاب صعيدي يحصل على بورصة للدراسة في الجامعة الأمريكية بالقاهرة، ويحاول التأقلم مع المجتمع الجديد في إطار كوميدي ساخر.",
    backdrop: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80",
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    akwamPageUrl: "https://akwam.ss/movie/7014/صعيدي-في-الجامعة-الأمريكية",
    defaultStream: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    isTrending: true
  },
  {
    id: "ak-103",
    title: "صراع العروش",
    type: "series",
    year: 2019,
    rating: "9.3",
    duration: "8 مواسم",
    category: "فانتازيا / مغامرة",
    description: "تسعة عائلات نبيلة تتقاتل من أجل السيطرة على أراضي ويستروس الخيالية، بينما يعود عدو قديم بعد أن ظل خامداً لآلاف السنين.",
    backdrop: "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=1920&q=80",
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    akwamPageUrl: "https://akwam.ss/series/100/got",
    defaultStream: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    isTrending: true
  },
  {
    id: "ak-104",
    title: "سرقة الأموال (لا كاسا دي بابا)",
    type: "series",
    year: 2021,
    rating: "8.2",
    duration: "5 مواسم",
    category: "جريمة / إثارة",
    description: "يقوم رجل غامض يُدعى (البروفيسور) بإعداد أكبر عملية سطو مُخطط لها على الإطلاق لطباعة مليارات اليوروات في دار السكة الملكية الإسبانية.",
    backdrop: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80",
    poster: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=800&q=80",
    akwamPageUrl: "https://akwam.ss/series/101/money-heist",
    defaultStream: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    isTrending: false
  }
];

export default function AkwamApp() {
  const [heroItem, setHeroItem] = useState(AKWAM_CATALOG[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activePlayer, setActivePlayer] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // التحكم بشفافية الشريط العلوي عند التمرير
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePlayMedia = async (item) => {
    setLoadingStream(true);
    try {
      const res = await fetch(`/.netlify/functions/api?url=${encodeURIComponent(item.akwamPageUrl)}`);
      const data = await res.json();

      if (data.success && data.streamUrl) {
        setActivePlayer({ title: item.title, url: data.streamUrl });
      } else {
        setActivePlayer({ title: item.title, url: item.defaultStream });
      }
    } catch {
      setActivePlayer({ title: item.title, url: item.defaultStream });
    } finally {
      setLoadingStream(false);
    }
  };

  const filteredItems = useMemo(() => {
    return AKWAM_CATALOG.filter(item => {
      const matchesSearch = item.title.includes(searchQuery) || item.category.includes(searchQuery);
      const matchesType = activeType === 'all' ? true : item.type === activeType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, activeType]);

  const movies = useMemo(() => filteredItems.filter(i => i.type === 'movie'), [filteredItems]);
  const series = useMemo(() => filteredItems.filter(i => i.type === 'series'), [filteredItems]);
  const trending = useMemo(() => filteredItems.filter(i => i.isTrending), [filteredItems]);

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans dir-rtl select-none">
      
      {/* 1. Header / Navbar Style Netflix */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-12 py-4 flex items-center justify-between ${isScrolled ? 'bg-[#141414]/95 backdrop-blur-md shadow-2xl' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'}`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setHeroItem(AKWAM_CATALOG[0])}>
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-red-600/50">أ</div>
            <span className="text-2xl font-black tracking-wider text-red-600">أكـوام</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => setActiveType('all')} className={`transition hover:text-red-500 ${activeType === 'all' ? 'text-white font-bold border-b-2 border-red-600 pb-1' : 'text-gray-300'}`}>الرئيسية</button>
            <button onClick={() => setActiveType('movie')} className={`transition hover:text-red-500 ${activeType === 'movie' ? 'text-white font-bold border-b-2 border-red-600 pb-1' : 'text-gray-300'}`}>الأفلام</button>
            <button onClick={() => setActiveType('series')} className={`transition hover:text-red-500 ${activeType === 'series' ? 'text-white font-bold border-b-2 border-red-600 pb-1' : 'text-gray-300'}`}>المسلسلات</button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن فيلم أو مسلسل..."
              className="bg-black/60 border border-gray-700 focus:border-red-600 rounded-full px-4 py-1.5 pl-10 text-xs md:text-sm text-white focus:outline-none transition-all w-40 sm:w-64 focus:w-72"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Dynamic Banner) */}
      {heroItem && (
        <section className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-start overflow-hidden">
          {/* Hero Background Image with Overlay */}
          <div className="absolute inset-0">
            <img 
              src={heroItem.backdrop || heroItem.poster} 
              alt={heroItem.title} 
              className="w-full h-full object-cover object-center scale-105 transition-all duration-700 filter brightness-90"
            />
            {/* Cinematic Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-l from-[#141414]/20 via-transparent to-[#141414]/80"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-20 max-w-3xl px-6 md:px-16 space-y-4 md:space-y-6 mt-16">
            <div className="flex items-center gap-3">
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">VIP</span>
              <span className="text-yellow-400 text-sm font-semibold flex items-center gap-1">
                <i className="fa-solid fa-star"></i> {heroItem.rating}
              </span>
              <span className="text-gray-300 text-sm">{heroItem.year}</span>
              <span className="border border-gray-600 text-gray-300 text-xs px-2 py-0.5 rounded">{heroItem.duration}</span>
              <span className="text-xs text-gray-400 font-medium">{heroItem.category}</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-black tracking-tight text-white drop-shadow-2xl leading-tight">
              {heroItem.title}
            </h1>

            <p className="text-gray-300 text-sm md:text-base line-clamp-3 leading-relaxed max-w-2xl drop-shadow">
              {heroItem.description}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button 
                onClick={() => handlePlayMedia(heroItem)}
                className="bg-white hover:bg-gray-200 text-black font-bold px-8 py-3 rounded-lg flex items-center gap-3 transition transform hover:scale-105 shadow-xl"
              >
                <i className="fa-solid fa-play text-xl"></i>
                <span className="text-base">تشغيل الآن</span>
              </button>

              <button 
                onClick={() => setHeroItem(heroItem)}
                className="bg-gray-600/60 hover:bg-gray-600/80 backdrop-blur-md text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition"
              >
                <i className="fa-solid fa-circle-info text-lg"></i>
                <span>التفاصيل</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. Catalog Rows (Netflix Style Carousel/Grid) */}
      <main className="relative z-30 px-6 md:px-12 -mt-20 md:-mt-32 space-y-12 pb-20">
        
        {/* Row 1: Trending Now */}
        {trending.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
              الأكثر تداولاً الآن
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trending.map(item => (
                <MediaCard key={item.id} item={item} onSelectHero={setHeroItem} onPlay={handlePlayMedia} isSelected={heroItem.id === item.id} />
              ))}
            </div>
          </div>
        )}

        {/* Row 2: Movies Section */}
        {movies.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
              الأفلام السينمائية
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map(item => (
                <MediaCard key={item.id} item={item} onSelectHero={setHeroItem} onPlay={handlePlayMedia} isSelected={heroItem.id === item.id} />
              ))}
            </div>
          </div>
        )}

        {/* Row 3: TV Series Section */}
        {series.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
              المسلسلات التلفزيونية
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {series.map(item => (
                <MediaCard key={item.id} item={item} onSelectHero={setHeroItem} onPlay={handlePlayMedia} isSelected={heroItem.id === item.id} />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* 4. Stream Loading Overlay */}
      {loadingStream && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-bold text-lg animate-pulse">جاري استخراج رابط البث المباشر سينمائيًا...</p>
        </div>
      )}

      {/* 5. Modal Video Player */}
      {activePlayer && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between animate-fade-in">
          <div className="p-4 px-8 flex items-center justify-between bg-zinc-900/90 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
              <h3 className="font-bold text-lg text-white">{activePlayer.title}</h3>
            </div>
            <button 
              onClick={() => setActivePlayer(null)} 
              className="w-10 h-10 bg-zinc-800 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative">
              <video controls autoPlay className="w-full h-full">
                <source src={activePlayer.url} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0d0d0d] py-10 px-6 text-center text-gray-500 text-sm space-y-2">
        <p className="text-gray-400 font-semibold">منصة أكوام السينمائية © 2026</p>
        <p className="text-xs text-gray-600">تصميم وتطوير مستوحى من تجربة المشاهدة العالمية لدى Netflix و Shahed</p>
      </footer>
    </div>
  );
}

// مكون كارت الوسائط الفرعي مع دعم التفاعل والديناميكية
function MediaCard({ item, onSelectHero, onPlay, isSelected }) {
  return (
    <div 
      onClick={() => onSelectHero(item)}
      className={`group relative rounded-xl overflow-hidden bg-zinc-900 border transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl ${isSelected ? 'ring-2 ring-red-600 border-transparent scale-105' : 'border-zinc-800 hover:border-gray-600'}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <img 
          src={item.poster} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-110 mb-2 self-center"
          >
            <i className="fa-solid fa-play text-lg translate-x-0.5"></i>
          </button>
          <span className="text-xs text-gray-300 line-clamp-2">{item.description}</span>
        </div>
        <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-yellow-400 text-xs px-2 py-0.5 rounded font-bold border border-black/40">
          <i className="fa-solid fa-star text-[10px] mr-1"></i>{item.rating}
        </span>
      </div>

      <div className="p-3 bg-zinc-900">
        <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-red-500 transition">{item.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>{item.year}</span>
          <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-gray-300">{item.category.split('/')[0]}</span>
        </div>
      </div>
    </div>
  );
}
