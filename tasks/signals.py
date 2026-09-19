"""
Signals for tasks app
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User
from .models import Task


@receiver(post_save, sender=User)
def add_user_to_attendance_task(sender, instance, created, **kwargs):
    """
    وقتی کاربر جدید ایجاد می‌شود، به تسک حضور و غیاب اضافه می‌شود
    """
    if created and instance.is_active:
        try:
            attendance_task = Task.objects.filter(is_attendance_task=True).first()
            if attendance_task:
                attendance_task.assigned_members.add(instance)
        except Exception:
            # اگر تسک حضور و غیاب هنوز ایجاد نشده، ignore می‌کنیم
            pass

