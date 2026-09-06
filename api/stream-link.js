// api/stream-link.js
const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
  // ضبط رأس الاستجابة لتمكين CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const targetUrl = event.queryStringParameters?.url;

  if (!targetUrl) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, message: 'رابط الصفحة مطلوب' })
    };
  }

  try {
    // 1. جلب محتوى صفحة الفليم/المسلسل من أكوام
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://akwam.ss/'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    let streamUrl = null;

    // 2. البحث عن رابط التشغيل Direct MP4 داخل الصفحة
    $('a, source, video').each((_, element) => {
      const href = $(element).attr('href') || $(element).attr('src');
      if (href && (href.includes('.mp4') || href.includes('/download/'))) {
        streamUrl = href;
      }
    });

    if (!streamUrl) {
      // محاولة البحث عن الرابط داخل السكريبتات
      const scripts = $('script').text();
      const match = scripts.match(/https?:\/\/[^\s"']+\.mp4/i);
      if (match) streamUrl = match[0];
    }

    if (streamUrl) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, streamUrl })
      };
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'لم يتم العثور على رابط مباشر' })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
