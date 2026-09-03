const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

// ذاكرة مؤقتة لتسريع الاستجابة وتقليل الضغط (صالحية 30 دقيقة)
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

// محاكاة متصفح حقيقي لتجنب الحظر من الموقع المصدر
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
    'Referer': 'https://ak.sv/'
};

// 1. نقطة نهاية البحث (Search API)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'مطلوب معلمة البحث q' });

    const cacheKey = `search_${q}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
        const searchUrl = `https://ak.sv/?s=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);
        const results = [];

        $('.post-box').each((i, el) => {
            const title = $(el).find('.post-title a').text().trim();
            const url = $(el).find('.post-title a').attr('href');
            const image = $(el).find('.post-image img').attr('data-src') || $(el).find('.post-image img').attr('src');
            const quality = $(el).find('.post-quality').text().trim();
            const rating = $(el).find('.post-rating').text().trim();

            if (title && url) {
                results.push({ title, url, image, quality, rating });
            }
        });

        const responseData = { success: true, data: results };
        cache.set(cacheKey, responseData);
        res.json(responseData);
    } catch (error) {
        console.error('Search Error:', error.message);
        res.status(500).json({ success: false, error: 'فشل في عملية البحث' });
    }
});

// 2. نقطة نهاية التفاصيل والروابط المباشرة (Details API)
app.get('/api/details', async (req, res) => {
    const { url } = req.query;
    if (!url || !url.includes('ak.sv')) return res.status(400).json({ success: false, error: 'رابط غير صالح' });

    const cacheKey = `details_${url}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
        const response = await axios.get(url, { headers, timeout: 15000 });
        const $ = cheerio.load(response.data);

        const title = $('h1.post-title').text().trim() || $('title').text().split('-')[0].trim();
        const image = $('.poster-img').attr('src') || $('.post-image img').attr('src');
        const story = $('.story').text().trim() || $('.post-content p').first().text().trim();
        const rating = $('.rating').text().trim() || 'غير متوفر';
        const duration = $('.duration').text().trim() || 'غير متوفر';

        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim().toLowerCase();
            
            if (href && (href.includes('downet.net') || href.includes('watch') || text.includes('مشاهدة') || text.includes('تحميل'))) {
                const cleanUrl = href.replace('&amp;', '&');
                let quality = '1080p';
                if (text.includes('4k') || text.includes('2160')) quality = '4K';
                else if (text.includes('720')) quality = '720p';
                else if (text.includes('480')) quality = '480p';

                if (!links.find(l => l.url === cleanUrl)) {
                    links.push({
                        quality: quality,
                        url: cleanUrl,
                        isM3u8: cleanUrl.includes('.m3u8')
                    });
                }
            }
        });

        const responseData = {
            success: true,
            data: { title, image, story, rating, duration, links }
        };
        
        cache.set(cacheKey, responseData);
        res.json(responseData);
    } catch (error) {
        console.error('Details Error:', error.message);
        res.status(500).json({ success: false, error: 'فشل في جلب تفاصيل الفيلم' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
