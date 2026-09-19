from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from accounts.utils import is_manager, require_manager
from calendar_events.utils import is_global_off, task_off_for_date
from calendar_events.models import Event
from .models import DailyReport
from .serializers import DailyReportSerializer
from .utils import (
    validate_user_report_time,
    validate_manager_verification_time,
    within_user_report_window,
    within_manager_verification_window,
)


class DailyReportViewSet(viewsets.ModelViewSet):
    """
    مدیریت گزارش‌های روزانه:
    - CRUD
    - ارسال گزارش (با محدودیت زمانی)
    - تأیید گزارش توسط مدیر یا مدیر تسک

    محدودیت زمانی‌ها:
        کاربر: 12:00 تا 22:00
        مدیر: تا 23:00

    تسک‌های حضور و غیاب (is_attendance_task=True):
        بدون محدودیت زمانی
    """

    queryset = DailyReport.objects.all().order_by("-report_date")
    serializer_class = DailyReportSerializer
    permission_classes = [IsAuthenticated]

    # ---------------------------------------------------------------------
    #                           Queryset Scope
    # ---------------------------------------------------------------------

    def get_queryset(self):
        """مدیر همه گزارش‌ها را می‌بیند — کاربر فقط گزارش‌های خودش."""
        user = self.request.user

        if is_manager(user):
            return DailyReport.objects.all().order_by("-report_date")

        return DailyReport.objects.filter(user=user).order_by("-report_date")

    # ---------------------------------------------------------------------
    #                             Create
    # ---------------------------------------------------------------------

    def perform_create(self, serializer):
        user = self.request.user
        task = serializer.validated_data.get("task")
        today = timezone.localdate()

        # چک تعطیلات: اگر جمعه کلی غیرفعال است (یا event global وجود دارد)
        if is_global_off(today) or today.weekday() == 4:  # Friday == 4
            raise ValidationError({"detail": "امروز تعطیل است؛ ارسال گزارش غیرمجاز می‌باشد."})

        # چک تعطیلات: اگر تسک برای امروز غیرفعال است
        if task_off_for_date(task, today):
            ev = Event.objects.filter(type=Event.TYPE_TASK, task=task, date=today).first()
            reason = ev.reason if ev else ""
            raise ValidationError({"detail": f"این تسک امروز تعطیل است. دلیل: {reason}"})

        # تسک حضور و غیاب: بدون محدودیت زمانی
        if getattr(task, "is_attendance_task", False):
            serializer.save(user=user)
            return

        # تسک عادی → چک محدودیت زمانی
        validate_user_report_time()

        serializer.save(user=user)

    # ---------------------------------------------------------------------
    #                             Update
    # ---------------------------------------------------------------------

    def perform_update(self, serializer):
        report = self.get_object()
        user = self.request.user

        # فقط صاحب گزارش یا مدیر می‌تواند ویرایش کند
        if not is_manager(user) and report.user != user:
            raise PermissionDenied("فقط مدیر یا صاحب گزارش مجاز به ویرایش است.")

        serializer.save()

    # ---------------------------------------------------------------------
    #                             Delete
    # ---------------------------------------------------------------------

    def perform_destroy(self, instance):
        require_manager(self.request.user, "فقط مدیر می‌تواند گزارش را حذف کند.")
        instance.delete()

    # ---------------------------------------------------------------------
    #                         SEND ACTION
    # ---------------------------------------------------------------------

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        """
        ارسال دستی گزارش (اگر نیاز باشد خارج از create استفاده شود).
        """
        report = self.get_object()

        # بدون محدودیت زمانی برای تسک حضور و غیاب
        if report.task.is_attendance_task:
            return Response({"detail": "گزارش ارسال شد."})

        # چک محدودیت زمانی
        if not within_user_report_window():
            return Response(
                {"detail": "ارسال گزارش فقط بین 12:00 تا 22:00 مجاز است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"detail": "ارسال گزارش در بازه مجاز انجام شد."})

    # ---------------------------------------------------------------------
    #                         VERIFY ACTION
    # ---------------------------------------------------------------------

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """
        تایید گزارش توسط:
            - مدیر تیم (is_staff)
            - مدیر تسک (task.manager)
        """
        report = self.get_object()
        user = request.user

        is_task_manager = bool(report.task.manager == user)

        if not (is_manager(user) or is_task_manager):
            raise PermissionDenied("فقط مدیر تیم یا مدیر تسک می‌تواند گزارش را تایید کند.")

        # محدودیت زمانی تایید
        if not within_manager_verification_window():
            return Response(
                {"detail": "مهلت تایید گزارش توسط مدیر گذشته است (تا 23:00)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # گرفتن مقدار تایید
        status_verified = request.data.get("status_verified")
        if status_verified is None:
            return Response(
                {"detail": "فیلد status_verified لازم است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report.status_verified = status_verified
        report.verified_by = user
        report.save()

        # اگر وضعیت تایید شده "کامل و گزارش داده" نباشد، اخطار ایجاد کن
        if int(status_verified) != 1:  # 1 = کامل و گزارش داده
            from warningss.models import Warning, WarningSettings

            settings_obj = WarningSettings.get_solo()

            # تعیین مقدار اخطار بر اساس نوع وضعیت
            status_int = int(status_verified)
            if status_int == 2:
                penalty = settings_obj.penalty_incomplete_report
            elif status_int == 3:
                penalty = settings_obj.penalty_fake_report
            elif status_int == 4:
                penalty = settings_obj.penalty_no_report
            else:
                penalty = settings_obj.penalty_incomplete_report

            # ایجاد اخطار در حالت تعلیق ۲۴ ساعته
            Warning.create_pending(
                user=report.user,
                task=report.task,
                amount=penalty,
                note=f"گزارش با وضعیت '{report.get_status_verified_display()}' تایید شد.",
            )

        return Response({"detail": "گزارش با موفقیت تایید شد."})
