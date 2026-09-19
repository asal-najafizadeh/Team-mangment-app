from django.apps import AppConfig


class BotSchedulerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "bot_scheduler"

    def ready(self):
        from .scheduler import start_scheduler
        start_scheduler()
