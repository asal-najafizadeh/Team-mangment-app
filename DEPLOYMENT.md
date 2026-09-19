# راهنمای نصب و راه‌اندازی پروژه Team Management

این راهنما برای نصب و راه‌اندازی پروژه روی سرور ویندوزی است.

## پیش‌نیازها

### 1. Python
- **نسخه مورد نیاز:** Python 3.10 یا بالاتر
- **دانلود:** از [python.org](https://www.python.org/downloads/) دانلود کنید
- **نصب:** در حین نصب، گزینه "Add Python to PATH" را فعال کنید

### 2. Node.js و npm
- **نسخه مورد نیاز:** Node.js 18 یا بالاتر
- **دانلود:** از [nodejs.org](https://nodejs.org/) دانلود کنید
- **نصب:** نسخه LTS را نصب کنید

### 3. Git (اختیاری)
- برای clone کردن پروژه از Git

---

## نصب Backend (Django)

### 1. ایجاد Virtual Environment

```powershell
# در پوشه اصلی پروژه
python -m venv venv

# فعال‌سازی virtual environment
.\venv\Scripts\activate
```

### 2. نصب پکیج‌های Python

```powershell
# اطمینان از فعال بودن venv
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. تنظیمات Database

#### استفاده از SQLite (پیش‌فرض):
- هیچ تنظیمات اضافی نیاز نیست
- فایل `db.sqlite3` به صورت خودکار ایجاد می‌شود

#### استفاده از PostgreSQL:
1. PostgreSQL را نصب کنید
2. یک دیتابیس ایجاد کنید:
```sql
CREATE DATABASE team_db;
```
3. در `core/settings.py` تنظیمات را تغییر دهید:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'team_db',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```
4. `psycopg2-binary` را به `requirements.txt` اضافه کنید

### 4. تنظیمات Environment Variables

یک فایل `.env` در root پروژه ایجاد کنید (یا از متغیرهای محیطی استفاده کنید):

```env
# Django Secret Key (تولید کنید با دستور زیر)
# python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
SECRET_KEY=your-secret-key-here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_GROUP_CHAT_ID=your-group-chat-id

# Database (اگر از PostgreSQL استفاده می‌کنید)
DB_NAME=team_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Debug Mode (برای production روی False بگذارید)
DEBUG=False

# Allowed Hosts (آدرس دامنه یا IP سرور)
ALLOWED_HOSTS=your-domain.com,192.168.1.100
```

### 5. اجرای Migrations

```powershell
python manage.py makemigrations
python manage.py migrate
```

### 6. ایجاد Superuser

```powershell
python manage.py createsuperuser
```

### 7. جمع‌آوری فایل‌های Static

```powershell
python manage.py collectstatic --noinput
```

---

## نصب Frontend (React/Vite)

### 1. نصب Dependencies

```powershell
cd team_management_frontend
npm install
```

### 2. Build برای Production

```powershell
npm run build
```

فایل‌های build شده در پوشه `dist` قرار می‌گیرند.

---

## راه‌اندازی Backend

### Development Mode

```powershell
# در root پروژه
python manage.py runserver 0.0.0.0:8000
```

### Production Mode (با Gunicorn - برای Linux)

برای ویندوز می‌توانید از:
- **IIS** با **HttpPlatformHandler**
- **Waitress** (Python WSGI server برای Windows)

#### نصب Waitress:

```powershell
pip install waitress
```

#### اجرا با Waitress:

```powershell
waitress-serve --host=0.0.0.0 --port=8000 core.wsgi:application
```

---

## راه‌اندازی Frontend

### Development Mode

```powershell
cd team_management_frontend
npm run dev
```

### Production Mode

بعد از build، فایل‌های `dist` را می‌توانید با:
- **IIS** (Internet Information Services)
- **Nginx** (با استفاده از WSL یا Docker)
- **Apache** (با استفاده از WSL)

سرو کنید.

---

## راه‌اندازی Scheduler (APScheduler)

Scheduler به صورت خودکار با Django راه‌اندازی می‌شود. برای اطمینان:

```powershell
python manage.py runserver
```

Scheduler در background اجرا می‌شود و وظایف زمان‌بندی شده را انجام می‌دهد.

---

## تنظیمات Production

### 1. تغییر SECRET_KEY

```python
# در core/settings.py
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
```

### 2. تغییر DEBUG

```python
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
```

### 3. تنظیم ALLOWED_HOSTS

```python
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
```

### 4. تنظیم CORS

```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",
    "http://your-domain.com",
]
```

### 5. تنظیم Static Files

```python
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

---

## ساختار فایل‌های مهم

```
Team_management/
├── requirements.txt          # پکیج‌های Python
├── manage.py                 # Django management script
├── core/                     # تنظیمات اصلی Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/                 # اپلیکیشن کاربران
├── tasks/                    # اپلیکیشن تسک‌ها
├── reports/                  # اپلیکیشن گزارش‌ها
├── warningss/                # اپلیکیشن اخطارها
├── calendar_events/          # اپلیکیشن تقویم
├── bot/                      # اپلیکیشن تلگرام
├── bot_scheduler/            # اپلیکیشن زمان‌بندی
├── db.sqlite3                # دیتابیس SQLite
└── team_management_frontend/ # Frontend React
    ├── package.json          # پکیج‌های Node.js
    ├── vite.config.js
    └── dist/                 # فایل‌های build شده
```

---

## دستورات مفید

### Backend

```powershell
# ایجاد migrations جدید
python manage.py makemigrations

# اعمال migrations
python manage.py migrate

# ایجاد superuser
python manage.py createsuperuser

# اجرای shell Django
python manage.py shell

# بررسی تنظیمات
python manage.py check
```

### Frontend

```powershell
# نصب dependencies
npm install

# اجرای development server
npm run dev

# Build برای production
npm run build

# Preview build شده
npm run preview
```

---

## عیب‌یابی

### مشکل: پورت 8000 در حال استفاده است
```powershell
# استفاده از پورت دیگر
python manage.py runserver 0.0.0.0:8001
```

### مشکل: CORS Error
- بررسی کنید که `CORS_ALLOWED_ORIGINS` در `settings.py` شامل آدرس frontend باشد

### مشکل: Database Error
- اطمینان حاصل کنید که migrations اعمال شده‌اند
- بررسی کنید که دیتابیس در دسترس است

### مشکل: Static Files نمایش داده نمی‌شوند
```powershell
python manage.py collectstatic --noinput
```

---

## نکات امنیتی

1. **SECRET_KEY**: هرگز در Git commit نکنید
2. **DEBUG**: در production روی `False` بگذارید
3. **ALLOWED_HOSTS**: فقط دامنه‌های مجاز را اضافه کنید
4. **CORS**: در production فقط دامنه frontend را مجاز کنید
5. **Database Password**: از متغیرهای محیطی استفاده کنید


