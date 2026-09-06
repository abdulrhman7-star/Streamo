# Akwam Next.js + Express

مشروع JavaScript كامل يتكون من:

- Frontend: Next.js + React
- Backend: Node.js + Express
- Scraping: Axios + Cheerio
- API endpoints:
  - `/api/media`
  - `/api/series-episodes`
  - `/api/stream-link`
  - `/api/health`

## التشغيل

```bash
npm install
npm run dev
```

الواجهة:
http://localhost:3000

الخادم:
http://localhost:5000

## متغيرات البيئة

انسخ `.env.example` إلى `.env` وعدّل:

```env
AKWAM_BASE_URL=https://akwam.ss
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

يمكن تغيير نطاق المصدر إذا كان النطاق المستخدم لديك مختلفاً.

## تشغيل منفصل

الخادم:

```bash
node server.js
```

الواجهة:

```bash
npm run frontend
```

## ملاحظة

المشروع يعتمد على بنية صفحات المصدر وقت التنفيذ؛ إذا تغيرت HTML selectors في المصدر فقد تحتاج دوال الاستخراج في `server.js` إلى تحديث. استخدمه فقط مع مصادر ومحتوى لديك الحق في الوصول إليه وتشغيله.