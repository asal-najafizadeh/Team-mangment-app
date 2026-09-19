from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from datetime import date, timedelta

from accounts.utils import is_manager, require_manager
from calendar_events.utils import is_global_off
from .models import Attendance, WeeklyAttendanceReport
from .serializers_attendance import AttendanceSerializer, WeeklyAttendanceReportSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by("-date")
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    # ---------------------------------------------------------
    #   لیست: مدیر همه را می‌بیند – کاربر فقط رکوردهای خودش
    # ---------------------------------------------------------
    def get_queryset(self):
        user = self.request.user
        if is_manager(user):
            return Attendance.objects.all().order_by("-date")
        return Attendance.objects.filter(user=user).order_by("-date")

    # ---------------------------------------------------------
    #   ثبت ورود (check_in)
    # ---------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="check_in")
    def check_in(self, request):
        today = timezone.localdate()
        
        # چک تعطیلات: اگر جمعه کلی غیرفعال است (یا event global وجود دارد)
        if is_global_off(today) or today.weekday() == 4:  # Friday == 4
            return Response(
                {"detail": "امروز تعطیل است؛ ثبت حضور امکان‌پذیر نیست."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user

        # استفاده از get_or_create برای جلوگیری از خطای unique_together
        attendance, created = Attendance.objects.get_or_create(
            user=user,
            date=today,
            defaults={
                'task': None,  # حضور و غیاب مستقل از تسک است
                'check_in': timezone.now(),
            }
        )

        # اگر رکورد قبلاً وجود داشت و check_in ثبت نشده بود
        if not created:
            if attendance.check_in is not None:
                return Response({"detail": "ورود امروز قبلاً ثبت شده."},
                                status=status.HTTP_400_BAD_REQUEST)
            # اگر check_in null است، آن را ثبت کن
            attendance.check_in = timezone.now()
            attendance.save()

        serializer = AttendanceSerializer(attendance, context={'request': request})
        return Response(serializer.data)

    # ---------------------------------------------------------
    #   ثبت خروج (check_out)
    # ---------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="check_out")
    def check_out(self, request):
        today = timezone.localdate()
        
        # چک تعطیلات: اگر جمعه کلی غیرفعال است (یا event global وجود دارد)
        if is_global_off(today) or today.weekday() == 4:  # Friday == 4
            return Response(
                {"detail": "امروز تعطیل است؛ ثبت حضور امکان‌پذیر نیست."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user

        try:
            attendance = Attendance.objects.get(user=user, date=today)
        except Attendance.DoesNotExist:
            return Response({"detail": "ابتدا باید ورود بزنید."},
                            status=status.HTTP_400_BAD_REQUEST)

        if attendance.check_out:
            return Response({"detail": "خروج امروز قبلاً ثبت شده."},
                            status=status.HTTP_400_BAD_REQUEST)

        attendance.check_out = timezone.now()
        attendance.save()

        serializer = AttendanceSerializer(attendance, context={'request': request})
        return Response(serializer.data)

    # ---------------------------------------------------------
    #   مدیر تسک یا مدیر تیم → ویرایش آزاد رکورد
    # ---------------------------------------------------------
    @action(detail=True, methods=["patch"], url_path="admin_edit")
    def admin_edit(self, request, pk=None):
        attendance = self.get_object()

        user = request.user

        # فقط مدیر تیم
        require_manager(user, "فقط مدیر تیم می‌تواند ویرایش کند.")

        serializer = AttendanceSerializer(attendance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    # ---------------------------------------------------------
    #   دریافت حضور و غیاب امروز
    # ---------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        user = request.user
        today = timezone.localdate()
        
        try:
            attendance = Attendance.objects.get(user=user, date=today)
            return Response(AttendanceSerializer(attendance).data)
        except Attendance.DoesNotExist:
            # Return 200 with empty dict instead of 404 to avoid console errors
            # Frontend will check if response.data is empty/null
            return Response({}, status=status.HTTP_200_OK)

    # ---------------------------------------------------------
    #   دریافت حضور و غیاب کاربر فعلی
    # ---------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="my-attendance")
    def my_attendance(self, request):
        user = request.user
        queryset = Attendance.objects.filter(user=user).order_by("-date")
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = AttendanceSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = AttendanceSerializer(queryset, many=True)
        return Response(serializer.data)

    # ---------------------------------------------------------
    #   تأیید هفتگی توسط مدیر
    # ---------------------------------------------------------
    # NOTE: Since approved/approved_by fields don't exist in model,
    # this action is kept for future implementation
    @action(detail=False, methods=["post"], url_path="approve_week")
    def approve_week(self, request):
        user = request.user

        require_manager(user, "فقط مدیر تیم می‌تواند حضور و غیاب هفتگی را تأیید کند.")

        week_records = Attendance.objects.filter(
            date__gte=date.today() - timedelta(days=7)
        )

        count = week_records.count()

        # TODO: If approved/approved_by fields are added to model, uncomment:
        # updated = week_records.update(
        #     approved=True,
        #     approved_by=user
        # )

        return Response({
            "detail": f"{count} رکورد حضور و غیاب در هفته گذشته یافت شد."
        })

    # ---------------------------------------------------------
    #   گزارش هفتگی حضور و غیاب
    # ---------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="weekly-reports")
    def weekly_reports(self, request):
        """دریافت گزارش‌های هفتگی - برای مدیر تسک (سوپروایزر)"""
        user = request.user
        
        # فقط مدیر تسک (سوپروایزر) یا مدیر سیستم می‌تواند ببیند
        from accounts.utils import is_admin_or_supervisor
        if not is_admin_or_supervisor(user):
            return Response(
                {"detail": "فقط مدیر تسک یا مدیر سیستم می‌تواند گزارش‌های هفتگی را ببیند."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # دریافت هفته از query params (اختیاری - پیش‌فرض هفته جاری)
        week_start_str = request.query_params.get("week_start")
        if week_start_str:
            from datetime import datetime
            try:
                week_start = datetime.strptime(week_start_str, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"detail": "فرمت تاریخ نامعتبر است. از فرمت YYYY-MM-DD استفاده کنید."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # محاسبه شنبه هفته جاری
            today = timezone.localdate()
            days_since_saturday = (today.weekday() + 2) % 7  # 0 = شنبه
            week_start = today - timedelta(days=days_since_saturday)
        
        week_end = week_start + timedelta(days=6)  # جمعه
        
        reports = WeeklyAttendanceReport.objects.filter(
            week_start_date=week_start
        ).order_by("-created_at")
        
        serializer = WeeklyAttendanceReportSerializer(reports, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="generate-weekly-report")
    def generate_weekly_report(self, request):
        """تولید گزارش هفتگی برای کاربر فعلی"""
        user = request.user
        today = timezone.localdate()
        
        # محاسبه شنبه هفته گذشته (شنبه تا جمعه)
        days_since_saturday = (today.weekday() + 2) % 7
        last_saturday = today - timedelta(days=days_since_saturday + 7)  # شنبه هفته گذشته
        last_friday = last_saturday + timedelta(days=6)  # جمعه هفته گذشته
        
        # چک کردن که آیا گزارش قبلاً تولید شده
        if WeeklyAttendanceReport.objects.filter(
            user=user, week_start_date=last_saturday
        ).exists():
            return Response(
                {"detail": "گزارش هفتگی برای این هفته قبلاً تولید شده است."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # محاسبه ساعات و روزهای حضور
        attendances = Attendance.objects.filter(
            user=user,
            date__gte=last_saturday,
            date__lte=last_friday,
            check_in__isnull=False,
            check_out__isnull=False
        )
        
        total_hours = sum(att.get_duration_hours() for att in attendances)
        total_days = attendances.count()
        
        # ایجاد گزارش
        report = WeeklyAttendanceReport.objects.create(
            user=user,
            week_start_date=last_saturday,
            week_end_date=last_friday,
            total_hours=total_hours,
            total_days=total_days,
            status=1,  # در انتظار تایید
        )
        
        serializer = WeeklyAttendanceReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="approve-weekly")
    def approve_weekly(self, request, pk=None):
        """تایید یا رد گزارش هفتگی توسط مدیر تسک"""
        user = request.user
        
        # فقط مدیر تسک (سوپروایزر) یا مدیر سیستم
        from accounts.utils import is_admin_or_supervisor
        if not is_admin_or_supervisor(user):
            return Response(
                {"detail": "فقط مدیر تسک یا مدیر سیستم می‌تواند گزارش را تایید کند."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            report = WeeklyAttendanceReport.objects.get(pk=pk)
        except WeeklyAttendanceReport.DoesNotExist:
            return Response(
                {"detail": "گزارش یافت نشد."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        action_type = request.data.get("action")  # "approve" or "reject"
        note = request.data.get("note", "")
        
        if action_type == "approve":
            report.status = 2  # تایید شده
            report.verified_by = user
            report.verified_at = timezone.now()
            report.note = note
            report.save()
            
            # ارسال فوری پیام به تلگرام بعد از تایید
            try:
                from bot_scheduler.tasks import send_weekly_attendance_report_message
                send_weekly_attendance_report_message(report.week_start_date)
            except Exception as e:
                print(f"Error sending telegram message after approval: {e}")
            
            return Response({
                "detail": "گزارش با موفقیت تایید شد.",
                "report": WeeklyAttendanceReportSerializer(report).data
            })
        elif action_type == "reject":
            report.status = 3  # رد شده
            report.verified_by = user
            report.verified_at = timezone.now()
            report.note = note
            report.save()
            
            # ارسال فوری پیام به تلگرام بعد از رد
            try:
                from bot_scheduler.tasks import send_weekly_attendance_report_message
                send_weekly_attendance_report_message(report.week_start_date)
            except Exception as e:
                print(f"Error sending telegram message after rejection: {e}")
            
            return Response({
                "detail": "گزارش رد شد.",
                "report": WeeklyAttendanceReportSerializer(report).data
            })
        else:
            return Response(
                {"detail": "action باید 'approve' یا 'reject' باشد."},
                status=status.HTTP_400_BAD_REQUEST
            )
