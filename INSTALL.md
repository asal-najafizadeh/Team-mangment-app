# دستورالعمل نصب سریع - Team Management

## پیش‌نیازها

1. **Python 3.10+** - [دانلود](https://www.python.org/downloads/)
2. **Node.js 18+** - [دانلود](https://nodejs.org/)
3. **Git** (اختیاری) - [دانلود](https://git-scm.com/)

---

## نصب Backend (5 دقیقه)

```powershell
# 1. فعال‌سازی Virtual Environment
python -m venv venv
.\venv\Scripts\activate

# 2. نصب پکیج‌ها
pip install --upgrade pip
pip install -r requirements.txt

# 3. اعمال Migrations
python manage.py migrate

# 4. ایجاد Superuser
python manage.py createsuperuser

# 5. اجرای سرور
python manage.py runserver
```

Backend روی `http://127.0.0.1:8000` اجرا می‌شود.

---

## نصب Frontend (3 دقیقه)

```powershell
# 1. رفتن به پوشه frontend
cd team_management_frontend

# 2. نصب Dependencies
npm install

# 3. اجرای Development Server
npm run dev
```

Frontend روی `http://localhost:5173` اجرا می‌شود.

---

## Build برای Production

### Backend:
```powershell
# نصب Waitress (برای Windows)
pip install waitress

# اجرا
waitress-serve --host=0.0.0.0 --port=8000 core.wsgi:application
```

### Frontend:
```powershell
cd team_management_frontend
npm run build
```

فایل‌های build شده در `team_management_frontend/dist` قرار می‌گیرند.

---

## تنظیمات مهم

### 1. Telegram Bot
در `core/settings.py` یا متغیرهای محیطی:
```python
TELEGRAM_BOT_TOKEN = 'your-token'
TELEGRAM_GROUP_CHAT_ID = 'your-chat-id'
```

### 2. Proxy برای Telegram (ایران)
پروکسی `127.0.0.1:2080` به صورت خودکار در کد تنظیم شده است.

---

## ساختار پروژه

```
Team_management/
├── requirements.txt          # پکیج‌های Python
├── manage.py
├── core/                     # تنظیمات Django
├── accounts/                 # کاربران
├── tasks/                    # تسک‌ها
├── reports/                  # گزارش‌ها
├── warningss/                # اخطارها
├── calendar_events/          # تقویم
├── bot/                      # تلگرام
├── bot_scheduler/            # زمان‌بندی
└── team_management_frontend/ # Frontend
    ├── package.json
    └── src/
```

---

## دستورات مفید

```powershell
# Backend
python manage.py migrate          # اعمال migrations
python manage.py createsuperuser  # ایجاد مدیر
python manage.py check            # بررسی تنظیمات

# Frontend
npm run dev      # Development
npm run build    # Production Build
npm run preview  # Preview Build
```

---

**برنامه‌نویس:** جاوید (@Javi.zia)

