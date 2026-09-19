from django.core.management.base import BaseCommand
from django.utils import timezone
from tasks.models import Task
from bot.telegram import send_message
from bot.message_builder import build_daily_task_message

class Command(BaseCommand):
    help = "Send daily reports to Telegram"

    def handle(self, *args, **kwargs):
        today = timezone.localdate()
        tasks = Task.objects.filter(is_attendance_task=False)

        for task in tasks:
            msg = build_daily_task_message(task, today)
            send_message(msg)

        self.stdout.write("Daily reports sent.")
