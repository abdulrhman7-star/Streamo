// server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const AKWAM_BASE_URL = 'https://akwam.ss';

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
  },
  timeout: 10000,
});

// 1. جلب قائمة المحتوى (أفلام/مسلسلات/بحث)
app.get('/api/media', async (req, res) => {
  try {
    const { q, type, page = 1 } = req.query;
    let targetUrl = `${AKWAM_BASE_URL}/movies?page=${page}`;

    if (q) {
      targetUrl = `${AKWAM_BASE_URL}/search?q=${encodeURIComponent(q)}&page=${page}`;
    } else if (type === 'series') {
      targetUrl = `${AKWAM_BASE_URL}/series?page=${page}`;
    }

    const { data } = await axiosInstance.get(targetUrl);
    const $ = cheerio.load(data);
    const results = [];

    $('.widget-body .entry-box, .col-lg-2 .entry-box').each((i, el) => {
      const title = $(el).find('.entry-title a').text().trim();
      const link = $(el).find('.entry-title a').attr('href');
      const poster = $(el).find('.entry-image img').attr('src') || $(el).find('.entry-image img').attr('data-src');
      const rating = $(el).find('.rating').text().trim() || 'N/A';
      const category = $(el).find('.category').text().trim();

      if (title && link) {
        results.push({
          id: Buffer.from(link).toString('base64'),
          title,
          link,
          poster,
          rating,
          category,
          isSeries: link.includes('/series/') || title.includes('مسلسل')
        });
      }
    });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب البيانات', error: error.message });
  }
});

// 2. جلب الحلقات الخاصة بمسلسل معين
app.get('/api/series-episodes', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'رابط المسلسل مطلوب' });

    const { data } = await axiosInstance.get(url);
    const $ = cheerio.load(data);
    const episodes = [];

    $('.widget-body .bg-primary2, .row .entry-box').each((i, el) => {
      const title = $(el).find('.entry-title a, a').text().trim();
      const link = $(el).find('.entry-title a, a').attr('href');
      
      if (link && link.includes('/episode/')) {
        episodes.push({ title, link });
      }
    });

    res.json({ success: true, data: episodes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'فشل جلب الحلقات', error: error.message });
  }
});

// 3. استخراج رابط التشغيل المباشر من صفحة الفيلم/الحلقة
app.get('/api/stream-link', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'الرابط مطلوب' });

    const { data } = await axiosInstance.get(url);
    const $ = cheerio.load(data);
    
    // البحث عن رابط التحميل/المشاهدة الوسيط
    let watchPageUrl = $('a.link-btn[href*="/watch/"]').attr('href') || 
                       $('a[href*="/download/"]').attr('href');

    if (!watchPageUrl) {
      // محاولة البحث عن أي رابط يحتوي على مشغل
      watchPageUrl = $('iframe').attr('src');
    }

    if (!watchPageUrl) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على رابط مباشر' });
    }

    // الذهاب لصفحة التحويل لتتبع الفيديو المباشر
    const watchRes = await axiosInstance.get(watchPageUrl);
    const $watch = cheerio.load(watchRes.data);
    
    const directVideoUrl = $watch('source').attr('src') || $watch('video').attr('src');

    res.json({
      success: true,
      streamUrl: directVideoUrl || watchPageUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'فشل استخراج رابط المشاهدة', error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Scraper running on port ${PORT}`));
