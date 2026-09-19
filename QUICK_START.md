# 🚀 راهنمای نصب سریع - Team Management

## ⚡ نصب در 3 مرحله

### 1️⃣ نصب Backend (Django)

```powershell
# ایجاد و فعال‌سازی Virtual Environment
python -m venv venv
.\venv\Scripts\activate

# نصب پکیج‌ها
pip install -r requirements.txt

# اعمال Migrations
python manage.py migrate

# ایجاد مدیر
python manage.py createsuperuser
```

### 2️⃣ نصب Frontend (React)

```powershell
cd team_management_frontend
npm install
```

### 3️⃣ اجرا

**Terminal 1 - Backend:**
```powershell
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
cd team_management_frontend
npm run dev
```

✅ **پروژه آماده است!**
- Backend: http://127.0.0.1:8000
- Frontend: http://localhost:5173

---

## 📦 فایل‌های Requirements

- **Backend:** `requirements.txt` (پکیج‌های Python)
- **Frontend:** `team_management_frontend/package.json` (پکیج‌های Node.js)

---

## 🔧 تنظیمات مهم

### Telegram Bot:
```python
# در core/settings.py
TELEGRAM_BOT_TOKEN = 'your-token'
TELEGRAM_GROUP_CHAT_ID = 'your-chat-id'
```

### Proxy (ایران):
پروکسی `127.0.0.1:2080` به صورت پیش‌فرض تنظیم شده است.

---

## 📚 مستندات کامل

- [README.md](./README.md) - اطلاعات کلی پروژه
- [DEPLOYMENT.md](./DEPLOYMENT.md) - راهنمای کامل deployment
- [INSTALL.md](./INSTALL.md) - راهنمای نصب تفصیلی

