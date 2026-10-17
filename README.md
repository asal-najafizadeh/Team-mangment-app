# Team Management System

A full-stack team management application with attendance tracking, task management, daily reports, warnings, calendar/leave management, and optional Telegram bot integration.

**Created and developed by Asal Najafizadeh.**

## License

This project is released under the [MIT License](./LICENSE).

## Features

- User and role management
- Tasks and team assignments
- Daily attendance
- Daily reporting
- Warning system
- Calendar and leave requests
- Telegram bot integration (optional)
- Dashboard UI

## Prerequisites

### Backend

- Python 3.10+
- pip

### Frontend

- Node.js 18+
- npm

### Optional

- PostgreSQL
- Git

## Installation

### 1. Clone the repository

```powershell
git clone <repository-url>
cd Team-mangment-app
```

### 2. Backend

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

### 3. Frontend

```powershell
cd team_management_frontend
npm install
```

### 4. Configuration

Set environment variables (or update `core/settings.py` for local development):

- `SECRET_KEY` — Django secret key
- `TELEGRAM_BOT_TOKEN` — Telegram bot token (if using the bot)
- `TELEGRAM_GROUP_CHAT_ID` — Telegram group chat ID (if using the bot)

For the frontend API URL, set `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8000/api/`).

## Running locally

### Backend

```powershell
python manage.py runserver
```

API: `http://127.0.0.1:8000`

### Frontend

```powershell
cd team_management_frontend
npm run dev
```

App: `http://localhost:5173`

### Production build (frontend)

```powershell
cd team_management_frontend
npm run build
```

Output is in `team_management_frontend/dist`.

## Project structure

```
├── requirements.txt
├── manage.py
├── core/                    # Django settings and URLs
├── accounts/
├── tasks/
├── reports/
├── warningss/
├── calendar_events/
├── bot/
├── bot_scheduler/
└── team_management_frontend/
```

## Security (production)

1. Use a strong `SECRET_KEY` from the environment.
2. Set `DEBUG = False`.
3. Restrict `ALLOWED_HOSTS` and CORS to your domains.
4. Never commit secrets or bot tokens to version control.

## Additional documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [INSTALL.md](./INSTALL.md)
- [QUICK_START.md](./QUICK_START.md)
