import requests
import os
from django.conf import settings

def send_message(text, chat_id=None):
    # Set proxy for Telegram (required in Iran)
    os.environ["HTTP_PROXY"] = "http://127.0.0.1:2080"
    os.environ["HTTPS_PROXY"] = "http://127.0.0.1:2080"
    
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = chat_id or settings.TELEGRAM_GROUP_CHAT_ID

    url = f"https://api.telegram.org/bot{token}/sendMessage"

    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
    }

    proxies = {
        "http": "http://127.0.0.1:2080",
        "https": "http://127.0.0.1:2080",
    }

    try:
        requests.post(url, data=payload, proxies=proxies)
    except Exception as e:
        print("Telegram Send Error:", e)
