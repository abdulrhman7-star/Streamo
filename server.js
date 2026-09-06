const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const AKWAM_BASE_URL = process.env.AKWAM_BASE_URL || 'https://akwam.ss';

app.use(cors());
app.use(express.json());

const axiosInstance = axios.create({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
  },
  timeout: 15000,
  maxRedirects: 5
});

function absoluteUrl(url) {
  if (!url) return null;
  try {
    return new URL(url, AKWAM_BASE_URL).href;
  } catch {
    return null;
  }
}

function cleanText(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, service: 'akwam-api', port: PORT });
});

app.get('/api/media', async (req, res) => {
  try {
    const { q = '', type = 'movies', page = 1 } = req.query;

    let targetUrl = `${AKWAM_BASE_URL}/movies?page=${encodeURIComponent(page)}`;

    if (q.trim()) {
      targetUrl = `${AKWAM_BASE_URL}/search?q=${encodeURIComponent(q.trim())}&page=${encodeURIComponent(page)}`;
    } else if (type === 'series') {
      targetUrl = `${AKWAM_BASE_URL}/series?page=${encodeURIComponent(page)}`;
    }

    const { data } = await axiosInstance.get(targetUrl);
    const $ = cheerio.load(data);
    const results = [];

    $('.widget-body .entry-box, .col-lg-2 .entry-box, .entry-box').each((i, el) => {
      const title = cleanText($(el).find('.entry-title a').first().text());
      const link = absoluteUrl($(el).find('.entry-title a').first().attr('href'));
      const image = $(el).find('.entry-image img').first();
      const poster = absoluteUrl(image.attr('src') || image.attr('data-src'));
      const rating = cleanText($(el).find('.rating').first().text()) || 'N/A';
      const category = cleanText($(el).find('.category').first().text());

      if (title && link) {
        results.push({
          id: Buffer.from(link).toString('base64url'),
          title,
          link,
          poster,
          rating,
          category,
          isSeries:
            link.includes('/series/') ||
            link.includes('/season/') ||
            title.includes('مسلسل')
        });
      }
    });

    res.json({
      success: true,
      count: results.length,
      page: Number(page),
      data: results
    });
  } catch (error) {
    console.error('media:', error.message);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات',
      error: error.message
    });
  }
});

app.get('/api/series-episodes', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'رابط المسلسل مطلوب'
      });
    }

    const { data } = await axiosInstance.get(url);
    const $ = cheerio.load(data);
    const episodes = [];
    const seen = new Set();

    $('a[href*="/episode/"], .widget-body .bg-primary2, .row .entry-box').each(
      (i, el) => {
        const anchor = $(el).is('a') ? $(el) : $(el).find('a').first();
        const link = absoluteUrl(anchor.attr('href'));

        if (!link || !link.includes('/episode/')) return;
        if (seen.has(link)) return;

        const title =
          cleanText(anchor.text()) ||
          cleanText($(el).find('.entry-title').text()) ||
          `الحلقة ${episodes.length + 1}`;

        seen.add(link);
        episodes.push({ title, link });
      }
    );

    res.json({ success: true, count: episodes.length, data: episodes });
  } catch (error) {
    console.error('episodes:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل جلب الحلقات',
      error: error.message
    });
  }
});

app.get('/api/stream-link', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'الرابط مطلوب'
      });
    }

    const { data } = await axiosInstance.get(url);
    const $ = cheerio.load(data);

    let watchPageUrl =
      $('a.link-btn[href*="/watch/"]').first().attr('href') ||
      $('a[href*="/watch/"]').first().attr('href') ||
      $('a[href*="/download/"]').first().attr('href') ||
      $('iframe').first().attr('src');

    watchPageUrl = absoluteUrl(watchPageUrl);

    if (!watchPageUrl) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على رابط مشاهدة'
      });
    }

    let directVideoUrl = null;

    try {
      const watchRes = await axiosInstance.get(watchPageUrl);
      const $watch = cheerio.load(watchRes.data);

      directVideoUrl =
        $watch('source').first().attr('src') ||
        $watch('video').first().attr('src') ||
        $watch('video source').first().attr('src') ||
        $watch('iframe').first().attr('src');

      directVideoUrl = absoluteUrl(directVideoUrl);
    } catch (watchError) {
      console.warn('watch page:', watchError.message);
    }

    res.json({
      success: true,
      streamUrl: directVideoUrl || watchPageUrl,
      sourcePage: watchPageUrl,
      direct: Boolean(directVideoUrl)
    });
  } catch (error) {
    console.error('stream:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل استخراج رابط المشاهدة',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Akwam API running on http://localhost:${PORT}`);
});