"""
Utility functions for time validation and report restrictions
"""
from django.utils import timezone
from datetime import datetime, time
from rest_framework.exceptions import ValidationError


def get_local_time():
    """Get current local time"""
    return timezone.localtime().time()


def within_user_report_window():
    """
    Check if current time is within user report window (12:00 to 22:00)
    Returns: bool
    """
    now = get_local_time()
    return time(12, 0) <= now <= time(22, 0)


def within_manager_verification_window():
    """
    Check if current time is within manager verification window (until 23:00)
    Returns: bool
    """
    now = get_local_time()
    return now <= time(23, 0)


def validate_user_report_time():
    """
    Validate that current time is within user report window.
    Raises ValidationError if not.
    """
    if not within_user_report_window():
        raise ValidationError({
            "detail": "ارسال گزارش فقط بین ساعت 12:00 تا 22:00 مجاز است."
        })


def validate_manager_verification_time():
    """
    Validate that current time is within manager verification window.
    Raises ValidationError if not.
    """
    if not within_manager_verification_window():
        raise ValidationError({
            "detail": "مهلت تایید گزارش توسط مدیر گذشته است (تا 23:00)."
        })

