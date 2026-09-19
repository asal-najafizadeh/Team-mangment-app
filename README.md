# Team Management System - Batltazar Plus

سیستم مدیریت تیم با قابلیت‌های حضور و غیاب، مدیریت تسک‌ها، گزارش‌دهی و اخطاردهی.

آدرس مشاهده : 

https://team-mangment-app.vercel.app/

اطلاعات ورود : 

user : User

password : user12345

## 🚀 ویژگی‌ها

- ✅ مدیریت کاربران و نقش‌ها
- ✅ مدیریت تسک‌ها و اعضای تیم
- ✅ حضور و غیاب روزانه
- ✅ گزارش‌دهی روزانه
- ✅ سیستم اخطاردهی
- ✅ تقویم و مدیریت مرخصی
- ✅ اتصال به Telegram Bot
- ✅ داشبورد گرافیکی

## 📋 پیش‌نیازها

### Backend:
- Python 3.10 یا بالاتر
- pip (Python Package Manager)

### Frontend:
- Node.js 18 یا بالاتر
- npm (Node Package Manager)

### اختیاری:
- PostgreSQL (برای استفاده از دیتابیس PostgreSQL)
- Git (برای clone کردن پروژه)

---

## 📦 نصب و راه‌اندازی

### 1. Clone یا دانلود پروژه

```powershell
git clone <repository-url>
cd Team_management
```

### 2. نصب Backend

```powershell
# ایجاد Virtual Environment
python -m venv venv

# فعال‌سازی Virtual Environment
.\venv\Scripts\activate

# نصب پکیج‌ها
pip install --upgrade pip
pip install -r requirements.txt

# اعمال Migrations
python manage.py migrate

# ایجاد Superuser
python manage.py createsuperuser
```

### 3. نصب Frontend

```powershell
cd team_management_frontend
npm install
```

### 4. تنظیمات

#### تنظیم Telegram Bot:
در `core/settings.py` یا متغیرهای محیطی:
```python
TELEGRAM_BOT_TOKEN = 'your-bot-token'
TELEGRAM_GROUP_CHAT_ID = 'your-group-chat-id'
```

#### تنظیم Proxy (برای ایران):
پروکسی `127.0.0.1:2080` به صورت پیش‌فرض در کد تنظیم شده است.

---

## 🏃 اجرای پروژه

### Development Mode

#### Backend:
```powershell
python manage.py runserver
```
Backend روی `http://127.0.0.1:8000` اجرا می‌شود.

#### Frontend:
```powershell
cd team_management_frontend
npm run dev
```
Frontend روی `http://localhost:5173` اجرا می‌شود.

### Production Mode

#### Backend (با Waitress):
```powershell
pip install waitress
waitress-serve --host=0.0.0.0 --port=8000 core.wsgi:application
```

#### Frontend:
```powershell
cd team_management_frontend
npm run build
```
فایل‌های build شده در `dist` قرار می‌گیرند.

---

## 📁 ساختار پروژه

```
Team_management/
├── requirements.txt              # پکیج‌های Python
├── manage.py                     # Django management
├── DEPLOYMENT.md                 # راهنمای کامل deployment
├── INSTALL.md                    # راهنمای نصب سریع
├── core/                         # تنظیمات اصلی Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/                     # مدیریت کاربران
├── tasks/                        # مدیریت تسک‌ها
├── reports/                      # گزارش‌ها و حضور و غیاب
├── warningss/                    # سیستم اخطاردهی
├── calendar_events/              # تقویم و مرخصی
├── bot/                          # Telegram Bot
├── bot_scheduler/                # زمان‌بندی وظایف
└── team_management_frontend/     # Frontend React
    ├── package.json              # پکیج‌های Node.js
    ├── src/
    └── dist/                     # فایل‌های build شده
```

---

## 🔧 پکیج‌های اصلی

### Backend (Python):
- Django 5.2.7
- Django REST Framework
- django-cors-headers
- django-apscheduler
- requests

### Frontend (Node.js):
- React 19.2.0
- React Router DOM
- Axios
- Tailwind CSS
- Vite

---

## 📝 دستورات مفید

### Backend:
```powershell
python manage.py migrate          # اعمال migrations
python manage.py makemigrations    # ایجاد migrations جدید
python manage.py createsuperuser  # ایجاد مدیر
python manage.py check            # بررسی تنظیمات
python manage.py collectstatic    # جمع‌آوری فایل‌های static
```

### Frontend:
```powershell
npm install          # نصب dependencies
npm run dev          # اجرای development server
npm run build        # build برای production
npm run preview      # preview فایل‌های build شده
```

---

## 🔐 تنظیمات امنیتی

برای production حتماً:

1. **SECRET_KEY** را تغییر دهید:
```python
SECRET_KEY = os.environ.get('SECRET_KEY', 'generate-new-key')
```

2. **DEBUG** را روی `False` بگذارید:
```python
DEBUG = False
```

3. **ALLOWED_HOSTS** را تنظیم کنید:
```python
ALLOWED_HOSTS = ['your-domain.com', 'your-ip']
```

4. **CORS** را محدود کنید:
```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = ['https://your-domain.com']
```

---

## 📚 مستندات بیشتر

- [DEPLOYMENT.md](./DEPLOYMENT.md) - راهنمای کامل deployment
- [INSTALL.md](./INSTALL.md) - راهنمای نصب سریع

## 📄 لایسنس

این پروژه برای استفاده داخلی تیم Batltazar Plus طراحی شده است.

