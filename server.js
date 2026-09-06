// server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const AKWAM_BASE_URL = 'https://akwam.ss'; // نطاق موقع أكوام الحالي

// 1. API للبحث عن أفلام أو مسلسلات
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const searchUrl = `${AKWAM_BASE_URL}/search?q=${encodeURIComponent(query)}`;
    
    const { data } = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.widget-body .entry-box').each((i, el) => {
      const title = $(el).find('.entry-title a').text().trim();
      const link = $(el).find('.entry-title a').attr('href');
      const poster = $(el).find('.entry-image img').attr('src') || $(el).find('.entry-image img').attr('data-src');
      const rating = $(el).find('.rating').text().trim() || 'N/A';
      const category = $(el).find('.category').text().trim();

      if (title && link) {
        results.push({
          id: Buffer.from(link).toString('base64'), // معرّف مشفّر من الرابط
          title,
          link,
          poster,
          rating,
          category,
          type: link.includes('/series/') ? 'series' : 'movie'
        });
      }
    });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء البحث في أكوام', error: error.message });
  }
});

// 2. API لجلب تفاصيل العرض وروابط التشغيل المباشرة (.mp4)
app.get('/api/details', async (req, res) => {
  try {
    const pageUrl = req.query.url;
    if (!pageUrl) return res.status(400).json({ message: 'يرجى تزويد رابط الصفحات' });

    const { data } = await axios.get(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(data);
    
    const title = $('h1.entry-title').text().trim();
    const story = $('.entry-story p').text().trim();
    const banner = $('.banner-img').attr('src') || '';
    
    // استخراج روابط المشاهدة والتحميل المباشرة
    const streamLinks = [];
    $('.download-link, .watch-link, a[href*="downet.net"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      let quality = '720p';
      if (text.includes('1080') || href.includes('1080')) quality = '1080p';
      if (text.includes('480') || href.includes('480')) quality = '480p';

      if (href && (href.endsWith('.mp4') || href.includes('download'))) {
        streamLinks.push({
          quality,
          url: href
        });
      }
    });

    res.json({
      success: true,
      data: {
        title,
        story,
        banner,
        streamLinks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'فشل جلب التفاصيل', error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Akwam Scraper API running on port ${PORT}`));
