from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ⚠️ SECURITY: Generate a secure secret key for production
# Use: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
SECRET_KEY = 'django-insecure-CHANGE-ME'  # TODO: Change in production

DEBUG = False

# در حالت توسعه همه هاست‌ها را مجاز می‌کنیم تا خطای هاست نداشته باشیم
ALLOWED_HOSTS = ['*'] # فعلاً برای اینکه به مشکل نخورید

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # our apps
    'accounts',
    'tasks',
    'warningss',
    'reports',
    'calendar_events',
    'bot',
    'bot_scheduler',
    "django_apscheduler",
    
    
    

    # CORS
    'corsheaders',

    # DRF
    'rest_framework',
    'rest_framework_simplejwt', # for jwt authentication

    # CRONJOBS
    'django_crontab',
]

AUTH_USER_MODEL = 'accounts.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # 👈 اضافه شد
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / "static"]  # اگر پوشه ساختی، بگذار بمونه
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ⭐ REST FRAMEWORK CONFIGURATION ⭐
from datetime import timedelta

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

# ⚠️ SECURITY: Change CORS settings in production
# در توسعه اجازه دسترسی از همه اوریجن‌ها
CORS_ALLOW_ALL_ORIGINS = True  # TODO: Set to False in production

# اگر بخواهیم خاص هم ست کنیم، این‌ها اوریجن‌های فرانت‌اند هستند
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://team-management-frontend.vercel.app", # 👈 آدرس فرانت‌اند  در ورسل
]

# برای درخواست‌های POST (مثل login) از فرانت‌اند
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://team-management-frontend.vercel.app", # 👈 آدرس فرانت‌اند شما در ورسل
]


# ⚠️ TELEGRAM BOT CONFIGURATION ⚠️
# Load from environment variables if available, otherwise use defaults
import os
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '8461992103:AAF6XzqmTw1IyE7NVrir_PucCUva0CusSPE')
TELEGRAM_GROUP_CHAT_ID = os.environ.get('TELEGRAM_GROUP_CHAT_ID', '-1002259543237')

APSCHEDULER_DATETIME_FORMAT = "N j, Y, f:s a"
APSCHEDULER_RUN_NOW_TIMEOUT = 25
