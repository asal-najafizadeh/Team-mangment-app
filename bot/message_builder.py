from reports.models import DailyReport
from calendar_events.models import LeaveRequest
from django.utils import timezone

def build_daily_task_message(task, date):
    reports = DailyReport.objects.filter(task=task, report_date=date)

    ok_list = []
    warn_list = []
    on_leave_list = []  # کاربرانی که مرخصی دارند

    # دریافت لیست کاربرانی که در این تاریخ مرخصی تایید شده دارند
    leave_requests = LeaveRequest.objects.filter(
        date=date,
        status="accepted"
    ).select_related('user')
    
    leave_usernames = {leave.user.username for leave in leave_requests}

    # کاربرانی که گزارش ارسال کرده‌اند
    reported_usernames = set()
    
    for rep in reports:
        reported_usernames.add(rep.user.username)
        # اگر کاربر مرخصی دارد، در لیست معاف قرار می‌گیرد (نه در اخطارها)
        if rep.user.username in leave_usernames:
            # اگر قبلاً اضافه نشده، اضافه کن
            if rep.user.username not in on_leave_list:
                on_leave_list.append(rep.user.username)
        elif rep.status_verified == 1:  # کامل و گزارش داده (تایید شده)
            ok_list.append(rep.user.username)
        elif rep.status_verified is not None:  # تایید شده اما وضعیت غیر از کامل
            status_display = rep.get_status_verified_display() if hasattr(rep, 'get_status_verified_display') else f"وضعیت {rep.status_verified}"
            warn_list.append(f"{rep.user.username} - {status_display}")
        else:
            # گزارش ارسال شده اما هنوز تایید نشده
            warn_list.append(f"{rep.user.username} - در انتظار تایید")

    # کاربرانی که مرخصی دارند اما گزارش ارسال نکرده‌اند (معاف هستند)
    # باید بررسی کنیم که آیا این کاربر به این تسک اختصاص دارد
    task_users = set()
    if task.assigned_to:
        task_users.add(task.assigned_to.username)
    # اضافه کردن اعضای تسک
    for member in task.assigned_members.all():
        task_users.add(member.username)
    
    for leave in leave_requests:
        if leave.user.username not in reported_usernames and leave.user.username not in on_leave_list:
            # بررسی اینکه آیا این کاربر به این تسک اختصاص دارد
            if leave.user.username in task_users:
                on_leave_list.append(leave.user.username)

    # وضعیت تایید مدیر
    manager_status = "❌ تایید نشده"
    if reports.first() and reports.first().verified_by:
        manager_status = f"✔ تایید شده توسط {reports.first().verified_by.username}"

    text = f"""
<b>📌 گزارش روزانه تسک: {task.title}</b>
<b>📅 تاریخ:</b> {date}

<b>✔ عملکرد خوب:</b>
{chr(10).join(['• ' + x for x in ok_list]) if ok_list else '—'}

<b>⚠️ اخطارها:</b>
{chr(10).join(['• ' + x for x in warn_list]) if warn_list else '—'}

<b>🏖️ معاف از انجام وظیفه (مرخصی):</b>
{chr(10).join(['• ' + x for x in on_leave_list]) if on_leave_list else '—'}

<b>📝 وضعیت تأیید:</b>
{manager_status}
    """

    return text
