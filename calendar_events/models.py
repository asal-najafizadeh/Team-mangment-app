from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Event(models.Model):
    date = models.DateField(unique=True)
    message = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return f"Event on {self.date}"


class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    reason = models.TextField(null=True, blank=True)

    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="pending"
    )

    rejection_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    handled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leave_handler",
    )

    class Meta:
        unique_together = ("user", "date")

    def __str__(self):
        return f"{self.user} -> {self.date} ({self.status})"
