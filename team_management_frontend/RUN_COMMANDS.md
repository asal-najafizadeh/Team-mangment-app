# دستورات اجرای پروژه / Project Run Commands

## 🚀 Frontend (React + Vite)

### Development Mode (حالت توسعه)
```bash
cd team_management_frontend
npm run dev
```
سپس در مرورگر به آدرس زیر بروید:
- http://localhost:5173

### Build برای Production
```bash
cd team_management_frontend
npm run build
```
فایل‌های build شده در پوشه `dist` قرار می‌گیرند.

### Preview Build (پیش‌نمایش build)
```bash
cd team_management_frontend
npm run preview
```

---

## 🔧 Backend (Django)

### Development Mode (حالت توسعه)
```bash
# در root پروژه (Team_management)
python manage.py runserver
```
سپس در مرورگر به آدرس زیر بروید:
- http://localhost:8000
- Admin Panel: http://localhost:8000/admin

### ساخت Migration ها
```bash
python manage.py makemigrations
python manage.py migrate
```

### ساخت Superuser
```bash
python manage.py createsuperuser
```

---

## 📝 دستورات کامل (از root پروژه)

### Frontend:
```bash
cd team_management_frontend && npm run dev
```

### Backend:
```bash
python manage.py runserver
```

---

## ⚠️ نکات مهم:

1. **Frontend و Backend باید همزمان اجرا شوند** برای کار کردن کامل سیستم
2. **Backend باید روی پورت 8000** باشد (مگر اینکه تغییر دهید)
3. **Frontend به صورت پیش‌فرض روی پورت 5173** اجرا می‌شود
4. قبل از اولین اجرا، حتماً `npm install` را در پوشه frontend اجرا کنید

---

## 🔄 دستورات نصب (اولین بار):

### Frontend:
```bash
cd team_management_frontend
npm install
```

### Backend:
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

