from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.db.models import Sum, Count, Q

from accounts.utils import is_manager, require_manager
from calendar_events.models import Event, LeaveRequest
from .models import Task, TaskMemberAssignment
from .serializers import TaskSerializer, TaskMemberAssignmentSerializer
from warningss.models import Warning, WarningDeleteLog
from warningss.serializers import WarningSerializer, WarningDeleteLogSerializer
from reports.models import DailyReport
from reports.serializers import DailyReportSerializer
from bot_scheduler.tasks import send_telegram_message
from bot.message_builder import build_daily_task_message



class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD + تغییر وضعیت + فیلتر کاربر
    دارای پرمیشن کامل:
      - فقط ادمین میتونه تسک بسازه
      - فقط ادمین میتونه تسک ویرایش/حذف کنه
      - کاربر فقط تسک‌های خودش رو میبینه
      - تغییر وضعیت فقط توسط ادمین یا خود کاربر انجام میشه
    """

    queryset = Task.objects.all().order_by("-created_at")
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    # -------------------------
    #  محدودیت روی لیست تسک‌ها
    # -------------------------
    def get_queryset(self):
        user = self.request.user
        # اگر مدیر تیم است همه‌ی تسک‌ها را ببین (فعال و غیرفعال) - شامل تسک حضور و غیاب
        if is_manager(user):
            return Task.objects.prefetch_related('assigned_members', 'member_assignments__user').select_related('manager', 'assigned_to').all().order_by("-created_at")
        # اگر مدیر تسک است، تسک‌هایی که مدیر آن است را ببیند (فعال و غیرفعال)
        # اگر کاربر عادی است فقط تسک‌های فعال خودش را ببیند
        # ترکیب: تسک‌هایی که مدیر آن است + تسک‌های فعالی که به او واگذار شده + تسک‌های فعالی که عضو آن است
        from django.db.models import Q
        return Task.objects.filter(
            Q(manager=user) | 
            Q(assigned_to=user, is_active=True) |
            Q(assigned_members=user, is_active=True)
        ).prefetch_related('assigned_members', 'member_assignments__user').select_related('manager', 'assigned_to').distinct().order_by("-created_at")

    # -------------------------
    #  محدودیت در ساخت تسک
    # -------------------------
    def perform_create(self, serializer):
        # فقط مدیر اجازه ساخت تسک دارد
        require_manager(self.request.user, "فقط مدیر اجازه ساخت تسک دارد.")
        serializer.save()

    # -------------------------
    #  محدودیت در آپدیت/حذف
    # -------------------------
    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        
        # مدیر تیم یا مدیر این تسک می‌تواند ویرایش کند
        if not is_manager(user) and instance.manager != user:
            raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک اجازه ویرایش دارد.")
        serializer.save()

    def perform_destroy(self, instance):
        require_manager(self.request.user, "فقط مدیر تیم اجازه حذف تسک دارد.")
        instance.delete()

    # -------------------------
    #  اکشن تغییر وضعیت تسک
    # -------------------------
    @action(detail=True, methods=["put"])
    def status(self, request, pk=None):
        task = self.get_object()
        user = request.user

        # فقط مدیر یا همان کاربری که تسک به او اختصاص یافته
        if not (is_manager(user) or task.assigned_to == user):
            raise PermissionDenied("اجازه تغییر وضعیت این تسک را ندارید.")

        status_value = request.data.get("status")
        if status_value not in dict(Task.STATUS_CHOICES).keys():
            return Response({"detail": "وضعیت نامعتبر است"}, status=status.HTTP_400_BAD_REQUEST)

        task.status = status_value
        task.save()

        return Response(TaskSerializer(task).data)

    # -------------------------
    #  تسک‌هایی که کاربر مدیر آن‌هاست
    # -------------------------
    @action(detail=False, methods=["get"], url_path="managed_by_me")
    def managed_by_me(self, request):
        """
        لیست تسک‌هایی که کاربر لاگین‌شده مدیر آن‌هاست
        GET /api/tasks/managed_by_me/
        """
        user = request.user
        qs = Task.objects.filter(manager=user, is_active=True).order_by("title")
        serializer = TaskSerializer(qs, many=True)
        return Response(serializer.data)

    # -------------------------
    #  پنل مدیر تسک: اعضا + اخطارهای هر عضو
    # -------------------------
    @action(detail=True, methods=["get"], url_path="manager_panel")
    def manager_panel(self, request, pk=None):
        """
        اطلاعات پنل مدیریتی یک تسک برای مدیر همان تسک یا مدیر تیم
        GET /api/tasks/{id}/manager_panel/

        خروجی:
        {
            "id": ...,
            "title": "...",
            "description": "...",
            "overview": "...",
            "is_attendance_task": false,
            "members": [
                {
                    "id": user_id,
                    "username": "...",
                    "warnings_count": 0,
                    "warnings_amount": "0"
                },
                ...
            ]
        }
        """
        task = self.get_object()
        user = request.user

        # فقط مدیر تیم یا مدیر این تسک اجازه دسترسی دارد
        if not (is_manager(user) or task.manager == user):
            raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند پنل مدیریتی را ببیند.")

        members = task.assigned_members.all().order_by("username")

        members_data = []
        for member in members:
            # اخطارهای تاییدشده مربوط به همین تسک
            agg_task = Warning.objects.filter(
                user=member,
                task=task,
                is_pending=False,
            ).aggregate(
                total_amount=Sum("amount"),
                total_count=Count("id"),
            )
            task_total_amount = agg_task["total_amount"] or 0
            task_total_count = agg_task["total_count"] or 0

            # همه اخطارهای تاییدشده کاربر (همه تسک‌ها)
            agg_all = Warning.objects.filter(
                user=member,
                is_pending=False,
            ).aggregate(
                total_amount=Sum("amount"),
                total_count=Count("id"),
            )
            all_total_amount = agg_all["total_amount"] or 0
            all_total_count = agg_all["total_count"] or 0

            members_data.append(
                {
                    "id": member.id,
                    "username": member.username,
                    # اخطارهای مربوط به همین تسک
                    "warnings_count": task_total_count,
                    "warnings_amount": str(task_total_amount),
                    # مجموع کل اخطارهای کاربر
                    "total_warnings_count": all_total_count,
                    "total_warnings_amount": str(all_total_amount),
                }
            )

        return Response(
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "overview": task.overview,
                "is_attendance_task": task.is_attendance_task,
                "members": members_data,
            }
        )

    # -------------------------
    #  تاریخچه اخطارهای یک کاربر برای یک تسک
    # -------------------------
    @action(detail=True, methods=["get"], url_path="member_warnings")
    def member_warnings(self, request, pk=None):
        """
        تاریخچه اخطارهای یک کاربر فقط برای همین تسک
        GET /api/tasks/{id}/member_warnings/?user_id={user_id}

        فقط مدیر تیم یا مدیر این تسک اجازه دسترسی دارد.
        ساختار خروجی مشابه /warnings/user_history/ است اما فیلتر شده روی همین تسک.
        """
        task = self.get_object()
        current_user = request.user

        # فقط مدیر تیم یا مدیر این تسک
        if not (is_manager(current_user) or task.manager == current_user):
            raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند تاریخچه اخطارهای این تسک را ببیند.")

        target_user_id = request.query_params.get("user_id")
        if not target_user_id:
            return Response(
                {"detail": "پارامتر user_id لازم است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # اخطارهای فعال (تاییدشده) فقط برای این تسک
        active_warnings = Warning.objects.filter(
            user_id=target_user_id,
            task=task,
            is_pending=False,
        ).order_by("-created_at")
        active_data = WarningSerializer(active_warnings, many=True).data

        # اخطارهای معلق فقط برای این تسک
        pending_warnings = Warning.objects.filter(
            user_id=target_user_id,
            task=task,
            is_pending=True,
        ).order_by("-created_at")
        pending_data = WarningSerializer(pending_warnings, many=True).data

        # اخطارهای حذف‌شده فقط برای این تسک
        deleted_warnings = WarningDeleteLog.objects.filter(
            user_id=target_user_id,
            task_id=task.id,
        ).order_by("-deleted_at")
        deleted_data = WarningDeleteLogSerializer(deleted_warnings, many=True).data

        history = []
        pending_list = []

        # معلق‌ها
        for warning in pending_data:
            pending_list.append(
                {
                    "id": warning["id"],
                    "amount": warning["amount"],
                    "task_title": warning.get("task_title", ""),
                    "task_id": warning.get("task", ""),
                    "note": warning.get("note", ""),
                    "date": warning["created_at"],
                    "pending_until": warning.get("pending_until"),
                }
            )

        # فعال‌ها
        for warning in active_data:
            history.append(
                {
                    "type": "active",
                    "id": warning["id"],
                    "amount": warning["amount"],
                    "task_title": warning.get("task_title", ""),
                    "task_id": warning.get("task", ""),
                    "note": warning.get("note", ""),
                    "date": warning["created_at"],
                    # مدیر تسک می‌تواند فقط اخطارهای این تسک را حذف کند و این لاگ مخصوص همین تسک است
                    "can_delete": True,
                }
            )

        # حذف‌شده‌ها
        for deleted in deleted_data:
            history.append(
                {
                    "type": "deleted",
                    "id": deleted["id"],
                    "amount": deleted["amount"],
                    "task_title": deleted.get("task_title", ""),
                    "task_id": deleted.get("task_id", ""),
                    "note": deleted.get("note", ""),
                    "date": deleted["deleted_at"],
                    "warning_created_at": deleted.get("warning_created_at"),
                    "delete_reason": deleted.get("delete_reason", ""),
                    "deleted_by": deleted.get("deleted_by_username", ""),
                }
            )

        # مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
        history.sort(key=lambda x: x["date"], reverse=True)

        return Response(
            {
                "pending": pending_list,
                "history": history,
            }
        )

    # -------------------------
    #  فیلتر بر اساس user_id
    # -------------------------
    @action(detail=False, methods=["get"], url_path="by_user")
    def by_user(self, request):
        user_id = request.query_params.get("user_id")

        if not user_id:
            return Response({"detail": "پارامتر user_id لازم است"}, status=status.HTTP_400_BAD_REQUEST)

        qs = self.get_queryset().filter(assigned_to_id=user_id)
        serializer = TaskSerializer(qs, many=True)
        return Response(serializer.data)

    # -------------------------
    #  بررسی وضعیت امروز تسک
    # -------------------------
    @action(detail=True, methods=["get"], url_path="today_status")
    def today_status(self, request, pk=None):
        """
        بررسی وضعیت امروز این تسک:
        - آیا امروز تعطیل است؟
        - آیا این تسک در لیست task_closed هست؟
        """
        task = self.get_object()
        today = timezone.localdate()

        # چک کردن event برای امروز
        event = Event.objects.filter(date=today).first()

        if not event:
            return Response({
                "is_closed": False,
                "reason": None,
                "message": "تسک امروز فعال است."
            })

        # تسک امروز تعطیل شده؟ (چک کردن event با type=TYPE_TASK و task=task)
        task_event = Event.objects.filter(
            type=Event.TYPE_TASK,
            task=task,
            date=today
        ).first()

        if task_event:
            return Response({
                "is_closed": True,
                "reason": task_event.reason,
                "message": "این تسک امروز توسط مدیر تعطیل شده است."
            })

        return Response({
            "is_closed": False,
            "reason": None,
            "message": "تسک امروز فعال است."
        })

    # -------------------------
    #  غیرفعال کردن تسک
    # -------------------------
    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        """غیرفعال کردن تسک توسط مدیر تیم یا مدیر تسک"""
        task = self.get_object()
        user = request.user
        
        # مدیر تیم یا مدیر این تسک می‌تواند غیرفعال کند
        if not is_manager(user) and task.manager != user:
            raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند تسک را غیرفعال کند.")
        
        task.is_active = False
        task.save()
        
        return Response({
            "detail": "تسک با موفقیت غیرفعال شد.",
            "task": TaskSerializer(task).data
        })

    # -------------------------
    #  فعال کردن تسک
    # -------------------------
    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        """فعال کردن تسک توسط مدیر تیم یا مدیر تسک"""
        task = self.get_object()
        user = request.user
        
        # مدیر تیم یا مدیر این تسک می‌تواند فعال کند
        if not is_manager(user) and task.manager != user:
            raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند تسک را فعال کند.")
        
        task.is_active = True
        task.save()
        
        return Response({
            "detail": "تسک با موفقیت فعال شد.",
            "task": TaskSerializer(task).data
        })

    # -------------------------
    #  گزارش‌های امروز تسک
    # -------------------------
    @action(detail=True, methods=["get"], url_path="today_reports")
    def today_reports(self, request, pk=None):
        """
        دریافت گزارش‌های امروز اعضای این تسک
        GET /api/tasks/{id}/today_reports/
        
        فقط مدیر تیم یا مدیر این تسک اجازه دسترسی دارد.
        """
        task = self.get_object()
        user = request.user

        # فقط مدیر تیم یا مدیر این تسک
        if not (is_manager(user) or task.manager == user):
            raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند گزارش‌های امروز را ببیند.")

        today = timezone.localdate()
        
        # دریافت گزارش‌های امروز اعضای این تسک
        reports = DailyReport.objects.filter(
            task=task,
            report_date=today
        ).select_related('user', 'verified_by').order_by('user__username')
        
        # دریافت لیست اعضای تسک
        members = task.assigned_members.all()
        member_ids = set(members.values_list('id', flat=True))
        
        # دریافت مرخصی‌های امروز
        leaves_today = LeaveRequest.objects.filter(
            date=today,
            status="accepted",
            user__in=members
        ).select_related('user')
        leave_user_ids = {leave.user_id for leave in leaves_today}
        
        # ساخت لیست گزارش‌ها با اطلاعات کامل
        reports_data = []
        reported_user_ids = set()
        
        for report in reports:
            reported_user_ids.add(report.user_id)
            reports_data.append({
                "id": report.id,
                "user_id": report.user_id,
                "username": report.user.username,
                "status_sent": report.status_sent,
                "status_sent_display": report.get_status_sent_display(),
                "status_verified": report.status_verified,
                "status_verified_display": report.get_status_verified_display() if report.status_verified else None,
                "verified_by": report.verified_by.username if report.verified_by else None,
                "note": report.note,
                "created_at": report.created_at,
                "has_warning": report.status_verified is not None and report.status_verified != 1,
            })
        
        # اضافه کردن اعضایی که گزارش ارسال نکرده‌اند
        for member in members:
            if member.id not in reported_user_ids:
                is_on_leave = member.id in leave_user_ids
                reports_data.append({
                    "id": None,
                    "user_id": member.id,
                    "username": member.username,
                    "status_sent": None,
                    "status_sent_display": None,
                    "status_verified": None,
                    "status_verified_display": None,
                    "verified_by": None,
                    "note": None,
                    "created_at": None,
                    "has_warning": not is_on_leave,  # اگر مرخصی ندارد، اخطار می‌گیرد
                    "is_on_leave": is_on_leave,
                })
        
        return Response({
            "task_id": task.id,
            "task_title": task.title,
            "date": today,
            "reports": reports_data,
        })

    # -------------------------
    #  ارسال گزارش روزانه به تلگرام
    # -------------------------
    @action(detail=True, methods=["post"], url_path="send_daily_report_to_telegram")
    def send_daily_report_to_telegram(self, request, pk=None):
        """
        ارسال گزارش روزانه این تسک به تلگرام
        POST /api/tasks/{id}/send_daily_report_to_telegram/
        
        فقط مدیر تیم یا مدیر این تسک اجازه دسترسی دارد.
        """
        task = self.get_object()
        user = request.user

        # فقط مدیر تیم یا مدیر این تسک
        if not (is_manager(user) or task.manager == user):
            raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند گزارش را به تلگرام ارسال کند.")

        today = timezone.localdate()
        
        # ساخت پیام گزارش روزانه
        try:
            message = build_daily_task_message(task, today)
            success = send_telegram_message(message)
            
            if success:
                return Response({
                    "detail": "گزارش روزانه با موفقیت به تلگرام ارسال شد.",
                    "date": today,
                })
            else:
                return Response(
                    {"detail": "ارسال گزارش به تلگرام با خطا مواجه شد. لطفاً تنظیمات تلگرام را بررسی کنید."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            return Response(
                {"detail": f"خطا در ساخت یا ارسال پیام: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )