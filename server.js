const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const NodeCache = require('node-cache');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

// ذاكرة مؤقتة لتسريع الاستجابة وتقليل الضغط على الموقع المصدر (صالحية 30 دقيقة)
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

// إعدادات Puppeteer لتجنب الحظر
const PUPPETEER_OPTIONS = {
    headless: "new",
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
    ]
};

// دالة مساعدة للحصول على متصفح أو إعادة استخدام واحد
let browser;
async function getBrowser() {
    if (!browser || !browser.isConnected()) {
        browser = await puppeteer.launch(PUPPETEER_OPTIONS);
    }
    return browser;
}

// 1. نقطة نهاية البحث (Search API)
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'مطلوب معلمة البحث q' });

    const cacheKey = `search_${q}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
        const browserInstance = await getBrowser();
        const page = await browserInstance.newPage();
        
        // محاكاة مستخدم حقيقي
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // البحث المباشر في موقع أكوام (أفضل من جوجل لتجنب حظر Google Captcha)
        const searchUrl = `https://ak.sv/?s=${encodeURIComponent(q)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        const html = await page.content();
        const $ = cheerio.load(html);
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

        const response = { success: true, data: results };
        cache.set(cacheKey, response); // حفظ في الذاكرة المؤقتة
        res.json(response);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ success: false, error: 'فشل في عملية البحث' });
    }
});

// 2. نقطة نهاية التفاصيل والروابط المباشرة (Details & Direct Links API)
app.get('/api/details', async (req, res) => {
    const { url } = req.query;
    if (!url || !url.includes('ak.sv')) return res.status(400).json({ success: false, error: 'رابط غير صالح' });

    const cacheKey = `details_${url}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
        const browserInstance = await getBrowser();
        const page = await browserInstance.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        const html = await page.content();
        const $ = cheerio.load(html);

        // استخراج البيانات الوصفية
        const title = $('h1.post-title').text().trim() || $('title').text().split('-')[0].trim();
        const image = $('.poster-img').attr('src') || $('.post-image img').attr('src');
        const story = $('.story').text().trim() || $('.post-content p').first().text().trim();
        const rating = $('.rating').text().trim() || 'غير متوفر';
        const duration = $('.duration').text().trim() || 'غير متوفر';

        // استخراج روابط downet.net
        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim().toLowerCase();
            
            // البحث عن روابط التحميل أو المشاهدة المباشرة من downet
            if (href && (href.includes('downet.net') || href.includes('watch') || text.includes('مشاهدة') || text.includes('تحميل'))) {
                // تنظيف الرابط لضمان أنه مباشر
                const cleanUrl = href.replace('&amp;', '&');
                
                // محاولة استنتاج الجودة من النص المحيط بالرابط
                let quality = '1080p';
                if (text.includes('4k') || text.includes('2160')) quality = '4K';
                else if (text.includes('720')) quality = '720p';
                else if (text.includes('480')) quality = '480p';

                // تجنب التكرار
                if (!links.find(l => l.url === cleanUrl)) {
                    links.push({
                        quality: quality,
                        url: cleanUrl,
                        isM3u8: cleanUrl.includes('.m3u8')
                    });
                }
            }
        });

        const response = {
            success: true,
            data: { title, image, story, rating, duration, links }
        };
        
        cache.set(cacheKey, response);
        res.json(response);
    } catch (error) {
        console.error('Details Error:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب تفاصيل الفيلم' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
