import sys
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from django.conf import settings
from django.db import connection
from django_apscheduler.jobstores import DjangoJobStore, register_events

from .tasks import (
    send_daily_task_reports,
    generate_weekly_attendance_reports,
    check_and_send_weekly_attendance_approval,
)


scheduler = BackgroundScheduler(timezone=settings.TIME_ZONE)


def is_running_migrations():
    """Check if we're running migration commands"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        return command in ['migrate', 'makemigrations', 'showmigrations', 'sqlmigrate']
    return False


def table_exists(table_name):
    """Check if a database table exists"""
    try:
        with connection.cursor() as cursor:
            # SQLite uses ? as parameter placeholder
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                [table_name]
            )
            return cursor.fetchone() is not None
    except Exception:
        return False


def start_scheduler():
    # Skip scheduler startup during migrations
    if is_running_migrations():
        print("[Scheduler] Skipping startup (running migrations)...")
        return
    
    # Check if django_apscheduler tables exist (only if not running migrations)
    try:
        if not table_exists('django_apscheduler_djangojob'):
            print("[Scheduler] Skipping startup (database tables not created yet)...")
            print("[Scheduler] Run 'python manage.py migrate' first to create the required tables.")
            return
    except Exception:
        # If we can't check the table (e.g., during initial setup), skip scheduler
        print("[Scheduler] Skipping startup (database not ready)...")
        return
    
    # Prevent scheduler from duplicating jobs on server reload
    if scheduler.running:
        return
    
    if scheduler.get_jobs():
        return
    
    try:
        # استفاده از دیتابیس برای ذخیره وضعیت جاب‌ها
        scheduler.add_jobstore(DjangoJobStore(), "default")

        # -----------------------------
        #  گزارش روزانه — هر شب ساعت 23:00 (پس از مهلت تایید مدیر)
        # -----------------------------
        scheduler.add_job(
            send_daily_task_reports,
            trigger=CronTrigger(hour=23, minute=0),
            id="daily_task_report",
            max_instances=1,
            replace_existing=True,
        )

        # -----------------------------
        #  تولید گزارش هفتگی حضور و غیاب — شنبه‌ها ساعت 8:00 صبح
        # -----------------------------
        scheduler.add_job(
            generate_weekly_attendance_reports,
            trigger=CronTrigger(day_of_week="sat", hour=8, minute=0),
            id="generate_weekly_attendance_reports",
            max_instances=1,
            replace_existing=True,
        )

        # -----------------------------
        #  چک کردن تایید و ارسال گزارش هفتگی — شنبه‌ها ساعت 23:00 (11 شب)
        # -----------------------------
        scheduler.add_job(
            check_and_send_weekly_attendance_approval,
            trigger=CronTrigger(day_of_week="sat", hour=23, minute=0),
            id="check_and_send_weekly_attendance_approval",
            max_instances=1,
            replace_existing=True,
        )

        register_events(scheduler)
        scheduler.start()
        print("[Scheduler] APScheduler started successfully...")
    except Exception as e:
        print(f"[Scheduler] Error starting scheduler: {e}")
        print("[Scheduler] This is normal if database tables don't exist yet.")
