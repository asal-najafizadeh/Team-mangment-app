from django.db import models
from accounts.models import User
from tasks.models import Task
from django.utils import timezone




class DailyReport(models.Model):

    REPORT_STATUS = (
        (1, "کامل و گزارش داده"),
        (2, "ناقص و بدون گزارش"),
        (3, "گزارش فیک"),
        (4, "انجام داده ولی گزارش نداده"),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    report_date = models.DateField()

    status_sent = models.IntegerField(choices=REPORT_STATUS)
    status_verified = models.IntegerField(choices=REPORT_STATUS, null=True, blank=True)

    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_reports",
    )

    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "task", "report_date")

    def __str__(self):
        return f"{self.user} - {self.task} - {self.report_date}"


class Attendance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="attendances")

    # task دیگر اجباری نیست - حضور و غیاب مستقل است
    task = models.ForeignKey(
        Task,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"is_attendance_task": True},
        related_name="attendances",
    )

    date = models.DateField(default=timezone.now)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "date")  # کاربر فقط یکبار ورود روزانه

    def __str__(self):
        return f"{self.user.username} - {self.date}"

    def get_duration_hours(self):
        """محاسبه ساعات کاری به صورت اعشاری"""
        if not self.check_in or not self.check_out:
            return 0.0
        duration = self.check_out - self.check_in
        return round(duration.total_seconds() / 3600, 2)


class WeeklyAttendanceReport(models.Model):
    """گزارش هفتگی حضور و غیاب برای تایید توسط مدیر"""
    
    STATUS_CHOICES = (
        (1, "در انتظار تایید"),
        (2, "تایید شده"),
        (3, "رد شده"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="weekly_attendance_reports")
    week_start_date = models.DateField()  # شنبه هفته
    week_end_date = models.DateField()  # جمعه هفته
    
    total_hours = models.FloatField(default=0.0)  # مجموع ساعات کاری هفته
    total_days = models.IntegerField(default=0)  # تعداد روزهای حضور
    
    status = models.IntegerField(choices=STATUS_CHOICES, default=1)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_weekly_reports",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True)  # یادداشت مدیر در صورت رد
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "week_start_date")  # یک گزارش برای هر کاربر در هر هفته
        ordering = ["-week_start_date"]

    def __str__(self):
        return f"{self.user.username} - هفته {self.week_start_date} تا {self.week_end_date}"
