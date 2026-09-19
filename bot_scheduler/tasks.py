from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from decimal import Decimal
import os
import requests

from tasks.models import Task
from reports.models import Attendance, DailyReport, WeeklyAttendanceReport
from accounts.models import User
from bot.message_builder import build_daily_task_message
from calendar_events.models import LeaveRequest
from warningss.models import Warning, WarningSettings, WarningDeleteLog


def send_telegram_message(text, chat_id=None):
    """
    Helper function to send Telegram messages.
    Uses environment variables for BOT_TOKEN and GROUP_CHAT_ID.
    Uses proxy for Telegram API (required in Iran).
    """
    # Set proxy for Telegram (required in Iran)
    os.environ["HTTP_PROXY"] = "http://127.0.0.1:2080"
    os.environ["HTTPS_PROXY"] = "http://127.0.0.1:2080"
    
    # Load from environment variables or settings
    token = os.environ.get('TELEGRAM_BOT_TOKEN') or getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    chat_id = chat_id or os.environ.get('TELEGRAM_GROUP_CHAT_ID') or getattr(settings, 'TELEGRAM_GROUP_CHAT_ID', None)
    
    if not token or not chat_id:
        print("ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_GROUP_CHAT_ID not configured")
        return False
    
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
        response = requests.post(url, data=payload, proxies=proxies)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Telegram Send Error: {e}")
        return False


def send_daily_task_reports():
    """
    Send daily task reports to Telegram.
    Runs every night at 23:00 (after manager verification deadline).
    این تابع گزارش‌های روزانه را برای همه تسک‌ها (غیر از تسک حضور و غیاب) به تلگرام ارسال می‌کند.
    """
    today = timezone.localdate()
    tasks = Task.objects.filter(is_attendance_task=False, is_active=True)
    
    if not tasks.exists():
        print("No tasks found for daily reports")
        return
    
    sent_count = 0
    for task in tasks:
        try:
            msg = build_daily_task_message(task, today)
            success = send_telegram_message(msg)
            if success:
                print(f"Daily report sent for task: {task.title}")
                sent_count += 1
            else:
                print(f"Failed to send daily report for task: {task.title}")
        except Exception as e:
            print(f"Error sending daily report for task {task.title}: {e}")

    # پس از ارسال گزارش‌های روزانه، کاربران متعهد را بررسی و پاداش بده
    try:
        reward_committed_users()
    except Exception as e:
        print(f"Error in reward_committed_users: {e}")

    # تایید خودکار اخطارهای معلقی که مهلت ۲۴ ساعته آن‌ها گذشته است
    try:
        auto_approve_pending_warnings()
    except Exception as e:
        print(f"Error in auto_approve_pending_warnings: {e}")
    
    return f"Daily reports sent for {sent_count}/{tasks.count()} tasks"


def auto_approve_pending_warnings():
    """
    تایید خودکار همه اخطارهای معلقی که زمان تعلیق آن‌ها (pending_until)
    گذشته است. این تابع هر شب یک‌بار صدا زده می‌شود.
    """
    now = timezone.now()
    pending_qs = Warning.objects.filter(is_pending=True, pending_until__lte=now)
    updated = pending_qs.update(is_pending=False, pending_until=None)
    print(f"Auto-approved {updated} pending warnings (24h timeout reached).")


def reward_committed_users():
    """
    اگر کاربری به مدت ۱۰ روز هیچ اخطاری دریافت نکند،
    به عنوان «کاربر متعهد» یک واحد از مجموع اخطارهایش کم می‌شود
    و این حذف به صورت لاگ در WarningDeleteLog ثبت می‌گردد.

    این تابع هر شب یک‌بار صدا زده می‌شود.
    """
    today = timezone.localdate()
    threshold_date = today - timedelta(days=10)
    reason_text = "حذف خودکار ۱ واحد اخطار به دلیل ۱۰ روز بدون دریافت اخطار (کاربر متعهد)"

    users = User.objects.filter(is_active=True)
    rewarded_count = 0

    for user in users:
        # اگر هیچ اخطاری ندارد، نیازی به پاداش نیست
        if not Warning.objects.filter(user=user).exists():
            continue

        # اگر در ۱۰ روز اخیر اخطار گرفته، واجد شرایط نیست
        if Warning.objects.filter(user=user, created_at__date__gt=threshold_date).exists():
            continue

        # اگر در ۱۰ روز اخیر به خاطر همین قانون، از او اخطار کم شده، دوباره پاداش نده
        if WarningDeleteLog.objects.filter(
            user_id=user.id,
            delete_reason__icontains="۱۰ روز بدون دریافت اخطار",
            deleted_at__date__gte=threshold_date,
        ).exists():
            continue

        remaining = Decimal("1.00")
        # از قدیمی‌ترین اخطارها شروع به کم کردن می‌کنیم
        warnings_qs = Warning.objects.filter(user=user).order_by("created_at")

        removed_any = False
        for w in warnings_qs:
            if remaining <= 0:
                break

            remove_amount = min(w.amount, remaining)

            WarningDeleteLog.objects.create(
                warning=w,
                deleted_by=None,  # حذف خودکار توسط سیستم
                user_id=w.user_id,
                task_id=w.task_id,
                task_title=w.task.title if w.task else "",
                amount=remove_amount,
                note=w.note,
                warning_created_at=w.created_at,
                delete_reason=reason_text,
            )

            if remove_amount == w.amount:
                # کل این اخطار پاک می‌شود
                w.delete()
            else:
                # بخشی از اخطار کم می‌شود
                w.amount = w.amount - remove_amount
                w.save(update_fields=["amount"])

            remaining -= remove_amount
            removed_any = True

        if removed_any:
            rewarded_count += 1

    print(f"Rewarded committed users (10 days without warnings): {rewarded_count}")


def generate_weekly_attendance_reports():
    """
    تولید گزارش هفتگی برای همه کاربران.
    هر شنبه صبح اجرا می‌شود.
    """
    today = timezone.localdate()
    
    # محاسبه شنبه هفته گذشته (شنبه تا جمعه)
    days_since_saturday = (today.weekday() + 2) % 7
    last_saturday = today - timedelta(days=days_since_saturday + 7)  # شنبه هفته گذشته
    last_friday = last_saturday + timedelta(days=6)  # جمعه هفته گذشته
    
    # دریافت همه کاربران فعال
    users = User.objects.filter(is_active=True)

    # تسک حضور و غیاب (برای ثبت اخطارها و خواندن حداقل ساعات هفتگی)
    attendance_task = Task.objects.filter(is_attendance_task=True).first()
    weekly_threshold = attendance_task.weekly_required_hours if attendance_task else 30.0

    # تنظیمات اخطارها (مقدار اخطار برای کم بودن ساعات هفتگی)
    warning_settings = WarningSettings.get_solo()
    
    generated_count = 0
    for user in users:
        # چک کردن که آیا گزارش قبلاً تولید شده
        if WeeklyAttendanceReport.objects.filter(
            user=user, week_start_date=last_saturday
        ).exists():
            continue
        
        # محاسبه ساعات و روزهای حضور در این بازه
        attendances = Attendance.objects.filter(
            user=user,
            date__gte=last_saturday,
            date__lte=last_friday,
            check_in__isnull=False,
            check_out__isnull=False
        )
        
        total_hours = sum(att.get_duration_hours() for att in attendances)
        total_days = attendances.count()

        # اگر مجموع ساعات کمتر از حداقل تعریف‌شده باشد، یک اخطار (معلق) برای تسک حضور و غیاب ثبت کن
        if total_hours < weekly_threshold and attendance_task is not None:
            Warning.create_pending(
                user=user,
                task=attendance_task,
                amount=warning_settings.penalty_weekly_low_hours,
                note=(
                    f"حضور هفتگی کمتر از حداقل {weekly_threshold} ساعت در بازه {last_saturday} تا {last_friday} "
                    f"(مجموع ساعات: {total_hours})"
                ),
            )
        
        # ایجاد گزارش
        WeeklyAttendanceReport.objects.create(
            user=user,
            week_start_date=last_saturday,
            week_end_date=last_friday,
            total_hours=total_hours,
            total_days=total_days,
            status=1,  # در انتظار تایید
        )
        generated_count += 1
    
    print(f"Generated {generated_count} weekly attendance reports for week {last_saturday} to {last_friday}")
    return f"Generated {generated_count} weekly attendance reports"


def send_weekly_attendance_report_message(week_start_date):
    """
    Helper function to send weekly attendance report message to Telegram.
    Can be called from scheduler or from view after approval.
    """
    week_end_date = week_start_date + timedelta(days=6)

    # تسک حضور و غیاب برای خواندن حداقل ساعت هفتگی
    attendance_task = Task.objects.filter(is_attendance_task=True).first()
    weekly_threshold = attendance_task.weekly_required_hours if attendance_task else 30.0

    # دریافت همه گزارش‌های هفته
    reports = WeeklyAttendanceReport.objects.filter(
        week_start_date=week_start_date
    ).select_related('user', 'verified_by')
    
    if not reports.exists():
        text = f"<b>📅 گزارش هفتگی حضور و غیاب</b>\n"
        text += f"<b>📆 هفته:</b> {week_start_date} تا {week_end_date}\n\n"
        text += "هیچ گزارشی برای این هفته تولید نشده است."
        send_telegram_message(text)
        return "No reports found for this week"
    
    # دریافت مرخصی‌های تایید شده در این بازه برای همه کاربران
    leaves_qs = LeaveRequest.objects.filter(
        date__gte=week_start_date,
        date__lte=week_end_date,
        status="accepted",
    ).select_related("user")

    # دیکشنری: user_id -> [تاریخ‌های مرخصی]
    leaves_by_user = {}
    for leave in leaves_qs:
        leaves_by_user.setdefault(leave.user_id, []).append(leave.date)

    # جدا کردن گزارش‌های تایید شده و تایید نشده
    approved_reports = reports.filter(status=2)  # تایید شده
    pending_reports = reports.filter(status=1)  # در انتظار تایید
    rejected_reports = reports.filter(status=3)  # رد شده
    
    # ساخت پیام
    text = f"<b>📅 گزارش هفتگی حضور و غیاب</b>\n"
    text += f"<b>📆 هفته:</b> {week_start_date} تا {week_end_date}\n\n"
    
    # گزارش‌های تایید شده
    if approved_reports.exists():
        text += f"<b>✅ تایید شده توسط مدیر:</b>\n"
        for report in approved_reports:
            verified_by_name = report.verified_by.username if report.verified_by else "نامشخص"
            leave_days = leaves_by_user.get(report.user_id, [])
            leave_count = len(leave_days)
            leave_text = f"{leave_count} روز" if leave_count else "بدون مرخصی"
            hours_status = (
                f"✅ حداقل {weekly_threshold} ساعت"
                if report.total_hours >= weekly_threshold
                else f"⚠ کمتر از {weekly_threshold} ساعت"
            )

            text += f"• <b>{report.user.username}</b>\n"
            text += f"  └ تعداد روزهای حضور: {report.total_days} روز\n"
            text += f"  └ مجموع ساعات حضور: {report.total_hours} ساعت\n"
            text += f"  └ روزهای مرخصی تایید شده: {leave_text}\n"
            text += f"  └ وضعیت ساعات هفتگی: {hours_status}\n"
            text += f"  └ تایید شده توسط: {verified_by_name}\n\n"
    
    # گزارش‌های تایید نشده
    if pending_reports.exists():
        text += f"<b>⚠️ تایید نشده توسط مدیر (در انتظار تایید):</b>\n"
        for report in pending_reports:
            leave_days = leaves_by_user.get(report.user_id, [])
            leave_count = len(leave_days)
            leave_text = f"{leave_count} روز" if leave_count else "بدون مرخصی"
            hours_status = (
                f"✅ حداقل {weekly_threshold} ساعت"
                if report.total_hours >= weekly_threshold
                else f"⚠ کمتر از {weekly_threshold} ساعت"
            )

            text += f"• <b>{report.user.username}</b>\n"
            text += f"  └ تعداد روزهای حضور: {report.total_days} روز\n"
            text += f"  └ مجموع ساعات حضور: {report.total_hours} ساعت\n"
            text += f"  └ روزهای مرخصی تایید شده: {leave_text}\n"
            text += f"  └ وضعیت ساعات هفتگی: {hours_status}\n"
            text += f"  └ وضعیت: در انتظار تایید\n\n"
    
    # گزارش‌های رد شده
    if rejected_reports.exists():
        text += f"<b>❌ رد شده:</b>\n"
        for report in rejected_reports:
            rejected_by_name = report.verified_by.username if report.verified_by else "نامشخص"
            leave_days = leaves_by_user.get(report.user_id, [])
            leave_count = len(leave_days)
            leave_text = f"{leave_count} روز" if leave_count else "بدون مرخصی"
            hours_status = (
                f"✅ حداقل {weekly_threshold} ساعت"
                if report.total_hours >= weekly_threshold
                else f"⚠ کمتر از {weekly_threshold} ساعت"
            )

            text += f"• <b>{report.user.username}</b>\n"
            text += f"  └ تعداد روزهای حضور: {report.total_days} روز\n"
            text += f"  └ مجموع ساعات حضور: {report.total_hours} ساعت\n"
            text += f"  └ روزهای مرخصی تایید شده: {leave_text}\n"
            text += f"  └ وضعیت ساعات هفتگی: {hours_status}\n"
            text += f"  └ رد شده توسط: {rejected_by_name}\n"
            if report.note:
                text += f"  └ یادداشت: {report.note}\n"
            text += "\n"
    
    # ارسال پیام
    success = send_telegram_message(text)
    if success:
        print(f"Weekly attendance approval report sent for {reports.count()} reports")
        return f"Weekly attendance approval report sent successfully"
    else:
        print("Failed to send weekly attendance approval report")
        return "Failed to send weekly attendance approval report"


def check_and_send_weekly_attendance_approval():
    """
    چک کردن تایید گزارش‌های هفتگی و ارسال به تلگرام.
    هر شنبه ساعت 11 شب اجرا می‌شود.
    """
    today = timezone.localdate()
    
    # محاسبه شنبه هفته گذشته
    days_since_saturday = (today.weekday() + 2) % 7
    last_saturday = today - timedelta(days=days_since_saturday + 7)
    
    return send_weekly_attendance_report_message(last_saturday)

