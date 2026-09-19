from django.db import models
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from tasks.models import Task


class Warning(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="warnings")
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    # مقدار اخطار به صورت اعشاری تا دو رقم اعشار
    amount = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    # وضعیت تعلیق اخطار (قبل از تایید نهایی)
    is_pending = models.BooleanField(default=False)
    pending_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Warning → {self.user}"

    @classmethod
    def create_pending(cls, user, task, amount, note=""):
        """
        ایجاد یک اخطار در حالت تعلیق ۲۴ ساعته.
        این اخطار تا قبل از تایید نهایی در شمارش‌ها لحاظ نمی‌شود.
        """
        now = timezone.now()
        return cls.objects.create(
            user=user,
            task=task,
            amount=amount,
            note=note,
            is_pending=True,
            pending_until=now + timedelta(hours=24),
        )


class WarningDeleteLog(models.Model):
    """
    لاگ حذف اخطارها برای ردیابی مدیریتی
    """

    warning = models.ForeignKey(Warning, on_delete=models.SET_NULL, null=True, blank=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="deleted_warnings")
    deleted_at = models.DateTimeField(auto_now_add=True)
    
    # ذخیره اطلاعات اخطار قبل از حذف (برای نمایش در تاریخچه)
    user_id = models.IntegerField(null=True, blank=True)  # ID کاربری که اخطار داشت
    task_id = models.IntegerField(null=True, blank=True)  # ID تسک مربوطه
    task_title = models.CharField(max_length=255, blank=True)  # عنوان تسک
    amount = models.DecimalField(max_digits=6, decimal_places=2, default=0)  # مقدار اخطار
    note = models.TextField(blank=True)  # یادداشت اخطار
    warning_created_at = models.DateTimeField(null=True, blank=True)  # تاریخ ایجاد اخطار
    delete_reason = models.TextField(blank=True)  # دلیل حذف

    def __str__(self):
        return f"Deleted warning {self.warning_id} by {self.deleted_by_id}"


class WarningSettings(models.Model):
    """
    تنظیمات میزان اخطارها (فقط یک رکورد استفاده می‌شود)
    """

    # اخطار برای گزارش ناقص / بدون گزارش / فیک
    penalty_incomplete_report = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=1.00,
        help_text="مقدار اخطار برای گزارش ناقص یا وضعیت‌های غیر از کامل.",
    )
    penalty_fake_report = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=1.50,
        help_text="مقدار اخطار برای گزارش فیک.",
    )
    penalty_no_report = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=1.00,
        help_text="مقدار اخطار برای انجام کار بدون ثبت گزارش.",
    )

    # اخطار برای کمتر بودن ساعات هفتگی از حداقل تعیین‌شده
    penalty_weekly_low_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=1.00,
        help_text="مقدار اخطار برای کمتر بودن ساعات هفتگی حضور از حداقل تعریف‌شده.",
    )

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Warning Settings"

    @classmethod
    def get_solo(cls):
        """
        همیشه یک رکورد تنظیمات برمی‌گرداند (در صورت نبودن، ایجاد می‌کند)
        """
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
