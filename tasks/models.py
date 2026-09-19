from django.db import models
from accounts.models import User


class Task(models.Model):

    STATUS_CHOICES = (
        ("todo", "در انتظار انجام"),
        ("doing", "در حال انجام"),
        ("done", "انجام شده"),
    )

    # اطلاعات اصلی تسک
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    overview = models.TextField(blank=True)

    assigned_to = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="primary_tasks"
    )

    # اعضای مشارکت‌کننده در تسک (چند نفره)
    assigned_members = models.ManyToManyField(
        User,
        blank=True,
        related_name="member_tasks",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="todo"
    )

    # 🔥 نوع تسک
    is_attendance_task = models.BooleanField(default=False)   # تسک حضور و غیاب
    is_system = models.BooleanField(default=False)            # تسک سیستمی (قابل ویرایش فقط با پرمیژن)

    # 🔥 مدیریت و جریمه
    manager = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_tasks",
    )
    manager_warning_penalty = models.IntegerField(default=1)

    # حداقل ساعات کاری هفتگی مورد انتظار (برای تسک حضور و غیاب استفاده می‌شود)
    weekly_required_hours = models.FloatField(
        default=30.0,
        help_text="حداقل ساعات کاری هفتگی مورد انتظار برای اعضای این تسک (ساعات حضور).",
    )

    class Meta:
        permissions = [
            ("edit_system_task", "Can edit system task fields"),
        ]

    is_active = models.BooleanField(default=True)  # برای غیرفعال کردن تسک

    def __str__(self):
        return self.title


class TaskMemberAssignment(models.Model):
    """وظیفه هر کاربر در یک تسک"""
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="member_assignments"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="task_assignments"
    )
    assignment = models.TextField(
        blank=True,
        help_text="وظیفه مشخص شده برای این کاربر در این تسک"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("task", "user")  # هر کاربر فقط یک وظیفه در هر تسک
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.task.title} - {self.user.username}: {self.assignment[:50]}"
