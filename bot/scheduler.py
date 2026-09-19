from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import register_job
from bot_scheduler.tasks import send_daily_task_reports

def start():
    scheduler = BackgroundScheduler()
    scheduler.add_job(send_daily_task_reports, "cron", hour=23, minute=55)
    scheduler.start()
