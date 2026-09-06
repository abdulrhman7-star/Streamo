const axios = require('axios');
const cheerio = require('cheerio');

const AKWAM_BASE_URL = process.env.AKWAM_BASE_URL || 'https://akwam.ss';

const client = axios.create({
  timeout: 15000,
  maxRedirects: 5,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
  }
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

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  try {
    const path = event.path.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '') || '/';
    const params = event.queryStringParameters || {};

    if (path === '/health') {
      return json(200, { success: true, service: 'netlify-api' });
    }

    if (path === '/media') {
      const q = params.q || '';
      const type = params.type || 'movies';
      const page = params.page || '1';

      let targetUrl = `${AKWAM_BASE_URL}/movies?page=${encodeURIComponent(page)}`;

      if (q.trim()) {
        targetUrl = `${AKWAM_BASE_URL}/search?q=${encodeURIComponent(q.trim())}&page=${encodeURIComponent(page)}`;
      } else if (type === 'series') {
        targetUrl = `${AKWAM_BASE_URL}/series?page=${encodeURIComponent(page)}`;
      }

      const { data } = await client.get(targetUrl);
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

      return json(200, {
        success: true,
        count: results.length,
        page: Number(page),
        data: results
      });
    }

    if (path === '/series-episodes') {
      const url = params.url;
      if (!url) return json(400, { success: false, message: 'رابط المسلسل مطلوب' });

      const { data } = await client.get(url);
      const $ = cheerio.load(data);
      const episodes = [];
      const seen = new Set();

      $('a[href*="/episode/"], .widget-body .bg-primary2, .row .entry-box').each((i, el) => {
        const anchor = $(el).is('a') ? $(el) : $(el).find('a').first();
        const link = absoluteUrl(anchor.attr('href'));

        if (!link || !link.includes('/episode/') || seen.has(link)) return;

        const title =
          cleanText(anchor.text()) ||
          cleanText($(el).find('.entry-title').text()) ||
          `الحلقة ${episodes.length + 1}`;

        seen.add(link);
        episodes.push({ title, link });
      });

      return json(200, {
        success: true,
        count: episodes.length,
        data: episodes
      });
    }

    if (path === '/stream-link') {
      const url = params.url;
      if (!url) return json(400, { success: false, message: 'الرابط مطلوب' });

      const { data } = await client.get(url);
      const $ = cheerio.load(data);

      let watchPageUrl =
        $('a.link-btn[href*="/watch/"]').first().attr('href') ||
        $('a[href*="/watch/"]').first().attr('href') ||
        $('a[href*="/download/"]').first().attr('href') ||
        $('iframe').first().attr('src');

      watchPageUrl = absoluteUrl(watchPageUrl);

      if (!watchPageUrl) {
        return json(404, {
          success: false,
          message: 'لم يتم العثور على رابط مشاهدة'
        });
      }

      let directVideoUrl = null;

      try {
        const watchRes = await client.get(watchPageUrl);
        const $watch = cheerio.load(watchRes.data);

        directVideoUrl =
          $watch('source').first().attr('src') ||
          $watch('video').first().attr('src') ||
          $watch('video source').first().attr('src') ||
          $watch('iframe').first().attr('src');

        directVideoUrl = absoluteUrl(directVideoUrl);
      } catch (error) {
        console.warn('watch extraction:', error.message);
      }

      return json(200, {
        success: true,
        streamUrl: directVideoUrl || watchPageUrl,
        sourcePage: watchPageUrl,
        direct: Boolean(directVideoUrl)
      });
    }

    return json(404, {
      success: false,
      message: 'API route not found'
    });
  } catch (error) {
    console.error(error);

    return json(500, {
      success: false,
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
};