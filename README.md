# Akwam Netlify Edition

نسخة مخصصة للنشر على Netlify بدون خادم Express منفصل.

## البنية

- Next.js + React
- Netlify Functions
- Axios + Cheerio
- `netlify.toml`
- API موحد تحت `/api/*`

## API

```text
GET /api/health
GET /api/media?q=&type=movies&page=1
GET /api/series-episodes?url=...
GET /api/stream-link?url=...
```

## النشر من GitHub

ارفع الملفات إلى GitHub ثم في Netlify:

Build command:
```text
npm run build
```

Publish directory:
```text
.next
```

Functions directory:
```text
netlify/functions
```

وجود `netlify.toml` يجعل Netlify يقرأ الإعدادات تلقائياً.

## Environment Variables

في Netlify > Site configuration > Environment variables:

```text
AKWAM_BASE_URL=https://akwam.ss
```

لا تحتاج إلى `NEXT_PUBLIC_API_URL` في حالة استخدام نفس موقع Netlify؛ الواجهة تستدعي `/api/...` على نفس النطاق.

## تشغيل محلي

```bash
npm install
npm run build
```

للتجربة الكاملة لـ Netlify Functions محلياً يُفضّل تثبيت Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

ثم:

```text
http://localhost:8888
```

## ملاحظة

Selectors الخاصة بالاستخراج تعتمد على بنية HTML للمصدر وقت التنفيذ، وقد تحتاج إلى تحديث إذا تغيرت بنية المصدر. استخدم المشروع فقط مع المصادر والمحتوى الذي لديك الحق في الوصول إليه وتشغيله.