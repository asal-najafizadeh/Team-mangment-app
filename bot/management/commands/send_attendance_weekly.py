from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tasks.models import Task
from reports.models import Attendance
from bot.telegram import send_message

class Command(BaseCommand):
    help = "Send weekly attendance report"

    def handle(self, *args, **kwargs):
        today = timezone.localdate()
        start = today - timedelta(days=7)

        attendance_task = Task.objects.filter(is_attendance_task=True).first()
        if not attendance_task:
            return

        records = Attendance.objects.filter(date__gte=start, date__lte=today)

        text = f"<b>📅 گزارش هفتگی حضور و غیاب ({start} تا {today})</b>\n\n"

        for rec in records:
            text += f"• {rec.user.username} | ورود: {rec.check_in} | خروج: {rec.check_out}\n"

        send_message(text)
        self.stdout.write("Weekly attendance sent.")
