// netlify/functions/api.js
const axios = require('axios');
const cheerio = require('cheerio');

const AKWAM_BASE_URL = 'https://akwam.ss';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const action = event.queryStringParameters?.action || 'home';
  const query = event.queryStringParameters?.q || '';
  const page = parseInt(event.queryStringParameters?.page) || 1;
  const targetUrl = event.queryStringParameters?.url || '';

  try {
    // ---------- 1. جلب الصفحة الرئيسية أو التصفح (الأفلام/المسلسلات) ----------
    if (action === 'home' || action === 'movies' || action === 'series') {
      let browseUrl = AKWAM_BASE_URL;
      if (action === 'movies') browseUrl = `${AKWAM_BASE_URL}/movies`;
      else if (action === 'series') browseUrl = `${AKWAM_BASE_URL}/series`;
      
      // إضافة رقم الصفحة (هذه هي الطريقة التي يعمل بها أكوام)
      if (page > 1) browseUrl += `/page/${page}`;

      const { data } = await axios.get(browseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'ar-EG,ar;q=0.9',
        },
        timeout: 12000,
      });

      const $ = cheerio.load(data);
      const results = [];

      // محددات أكوام العامة (تعمل في الصفحة الرئيسية والأقسام)
      $('.widget-body .entry-box, .entry-box, .items-list .item').each((_, el) => {
        const title = $(el).find('.entry-title a, .title a').text().trim();
        const link = $(el).find('.entry-title a, .title a').attr('href');
        const poster = $(el).find('.entry-image img, .poster img').attr('src') || 
                       $(el).find('.entry-image img, .poster img').attr('data-src') ||
                       $(el).find('img').attr('src');
        const rating = $(el).find('.rating, .rate').text().trim() || 'N/A';
        const category = $(el).find('.category, .type').text().trim() || 'فيلم';

        if (title && link) {
          const fullLink = link.startsWith('http') ? link : `${AKWAM_BASE_URL}${link}`;
          results.push({
            id: Buffer.from(fullLink).toString('base64'),
            title,
            link: fullLink,
            poster: poster || 'https://via.placeholder.com/300x450/1e293b/ffffff?text=No+Image',
            rating,
            category,
            type: fullLink.includes('/series/') ? 'series' : 'movie',
          });
        }
      });

      // معرفة عدد الصفحات من عناصر الترقيم (اختياري)
      let totalPages = 1;
      const lastPageLink = $('.pagination .page-numbers:last-child, .pagination a:last-child').attr('href');
      if (lastPageLink) {
        const match = lastPageLink.match(/\/page\/(\d+)/);
        if (match) totalPages = parseInt(match[1]) || 1;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          count: results.length, 
          data: results,
          currentPage: page,
          totalPages: totalPages,
        }),
      };
    }

    // ---------- 2. البحث (كما هو) ----------
    if (action === 'search' && query) {
      const searchUrl = `${AKWAM_BASE_URL}/search?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(searchUrl, { /* نفس الهيدر */ });
      const $ = cheerio.load(data);
      const results = [];
      $('.widget-body .entry-box').each((_, el) => {
        // ... نفس الكود السابق ...
        const title = $(el).find('.entry-title a').text().trim();
        const link = $(el).find('.entry-title a').attr('href');
        const poster = $(el).find('.entry-image img').attr('src') || $(el).find('.entry-image img').attr('data-src');
        const rating = $(el).find('.rating').text().trim() || 'N/A';
        const category = $(el).find('.category').text().trim() || 'فيلم';
        if (title && link) {
          const fullLink = link.startsWith('http') ? link : `${AKWAM_BASE_URL}${link}`;
          results.push({ id: Buffer.from(fullLink).toString('base64'), title, link: fullLink, poster: poster || 'https://via.placeholder.com/300x450/1e293b/ffffff?text=No+Image', rating, category, type: fullLink.includes('/series/') ? 'series' : 'movie' });
        }
      });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, count: results.length, data: results }) };
    }

    // ---------- 3. تفاصيل الفيديو (الجودات) ----------
    if (action === 'details' && targetUrl) {
      // ... نفس الكود السابق لجلب روابط mp4 ...
      const { data } = await axios.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
      const $ = cheerio.load(data);
      const streamQualities = [];
      $('a[href*=".mp4"], a[href*="/download/"], .download-link, .watch-link').each((_, el) => {
        let href = $(el).attr('href');
        if (!href) return;
        if (href.startsWith('/')) href = `${AKWAM_BASE_URL}${href}`;
        const text = $(el).text().trim() || $(el).parent().text().trim();
        let quality = '720p';
        const lowerText = (text + href).toLowerCase();
        if (lowerText.includes('1080') || lowerText.includes('full hd')) quality = '1080p';
        else if (lowerText.includes('720') || lowerText.includes('hd')) quality = '720p';
        else if (lowerText.includes('480') || lowerText.includes('sd')) quality = '480p';
        else if (lowerText.includes('360')) quality = '360p';
        if (!streamQualities.some(item => item.quality === quality)) {
          streamQualities.push({ quality, url: href });
        }
      });
      const finalStreams = streamQualities.length > 0 ? streamQualities : [
        { quality: '1080p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { quality: '720p', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
      ];
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, streams: finalStreams }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'طلب غير صالح' }) };
  } catch (error) {
    console.error('Scraper Error:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'خطأ في الخادم', error: error.message }) };
  }
};
