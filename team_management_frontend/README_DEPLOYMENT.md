# راهنمای Deployment و حل مشکل 404 در SPA

## مشکل
وقتی مستقیماً URL یک route را در مرورگر می‌زنید (مثلاً `aa.com/tasks`)، صفحه 404 نمایش داده می‌شود.

## دلیل
در Single Page Applications (SPA)، routing در سمت کلاینت انجام می‌شود. وقتی مستقیماً URL را می‌زنید، سرور سعی می‌کند فایل `/tasks` را پیدا کند که وجود ندارد.

## راه حل

### 1. Development (Vite)
Vite به صورت پیش‌فرض از history API fallback پشتیبانی می‌کند. اگر مشکلی داشتید، مطمئن شوید که از `react-router-dom` استفاده می‌کنید.

### 2. Production - Netlify
فایل `public/_redirects` را در پروژه قرار داده‌ایم. این فایل به صورت خودکار توسط Netlify استفاده می‌شود.

### 3. Production - Vercel
فایل `vercel.json` را در root پروژه قرار داده‌ایم. این فایل به صورت خودکار توسط Vercel استفاده می‌شود.

### 4. Production - Apache
فایل `public/.htaccess` را در پوشه `public` قرار داده‌ایم. بعد از build، این فایل باید در پوشه `dist` کپی شود.

**نکته:** بعد از `npm run build`، فایل `.htaccess` را از `public` به `dist` کپی کنید:
```bash
cp public/.htaccess dist/.htaccess
```

### 5. Production - Nginx
فایل `nginx.conf` را در تنظیمات Nginx خود استفاده کنید. این فایل را در پوشه config Nginx قرار دهید یا محتوای آن را به فایل config موجود اضافه کنید.

**مثال:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 6. Production - Docker + Nginx
اگر از Docker استفاده می‌کنید، می‌توانید از فایل `nginx.conf` در Dockerfile استفاده کنید:

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## تست
بعد از deployment:
1. به صفحه اصلی بروید
2. به یک route دیگر بروید (مثلاً `/tasks`)
3. صفحه را refresh کنید (F5)
4. باید صفحه به درستی نمایش داده شود و 404 نگیرید

## نکات مهم
- مطمئن شوید که فایل `index.html` در root پوشه build قرار دارد
- همه فایل‌های static باید به درستی serve شوند
- API calls باید به backend درست اشاره کنند

