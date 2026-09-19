from django.apps import AppConfig
from django.apps import AppConfig

class BotSchedulerConfig(AppConfig):
    name = 'bot_scheduler'

    def ready(self):
        from .scheduler import start
        start()


class BotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bot'
