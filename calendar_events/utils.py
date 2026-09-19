from .models import Event
from django.utils import timezone

def is_global_off(date=None):
    """
    بررسی می‌کند که آیا یک تاریخ تعطیل است یا نه.
    در مدل جدید Event، هر رویداد به معنای تعطیل بودن آن تاریخ است.
    """
    if date is None:
        date = timezone.localdate()
    return Event.objects.filter(date=date).exists()

def task_off_for_date(task, date=None):
    """
    این تابع دیگر استفاده نمی‌شود چون Event دیگر به task متصل نیست.
    اما برای سازگاری با کدهای قدیمی نگه داشته شده است.
    """
    if date is None:
        from django.utils import timezone
        date = timezone.localdate()
    # در مدل جدید، Event مستقل از task است
    # اگر می‌خواهیم بررسی کنیم که آیا یک task در یک تاریخ خاص تعطیل است،
    # باید از Event استفاده کنیم (که همه‌جا تعطیل است)
    return Event.objects.filter(date=date).exists()

def get_events_for_today():
    from django.utils import timezone
    return Event.objects.filter(date=timezone.localdate())
