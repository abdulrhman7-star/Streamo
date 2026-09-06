# Akwam Netlify UI

نسخة واجهة جديدة مستوحاة من التصميم المرفق:
- Header زجاجي ثابت.
- شعار أكوام Stream.
- تبويبات الكل/الأفلام/المسلسلات.
- بحث.
- قائمة مفضلة محفوظة في localStorage.
- Hero banner.
- بطاقات حديثة مع التقييم والجودة وزر التشغيل.
- نافذة تفاصيل.
- مشغل HTML5.
- Netlify Functions بدل Express Server.

## Netlify

Build command:
```text
npm run build
```

Publish directory:
```text
.next
```

Functions:
```text
netlify/functions
```

يوجد `netlify.toml` لضبط الإعدادات.

Environment Variable:
```text
AKWAM_BASE_URL=https://akwam.ss
```

## محلياً

```bash
npm install
npm run dev
```

ولاختبار Functions مع Netlify CLI:
```bash
npm install -g netlify-cli
netlify dev
```

ملاحظة: بيانات البطاقة تعتمد على HTML المصدر، لذلك قد تحتاج selectors في `netlify/functions/api.js` إلى تحديث إذا تغيرت بنية المصدر. استخدم المشروع فقط مع المصادر والمحتوى الذي لديك الحق في الوصول إليه وتشغيله.