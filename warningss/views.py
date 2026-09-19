from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.conf import settings
from decimal import Decimal, InvalidOperation
import os
import requests

from .models import Warning, WarningDeleteLog, WarningSettings
from .serializers import WarningSerializer, WarningDeleteLogSerializer, WarningSettingsSerializer
from accounts.utils import is_manager, require_manager
from accounts.models import User
from django.db.models import Q


class WarningViewSet(viewsets.ModelViewSet):
    queryset = Warning.objects.all().order_by("-created_at")
    serializer_class = WarningSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_id = self.request.query_params.get("user_id")

        base_qs = Warning.objects.all().order_by("-created_at")
        if not is_manager(user):
            base_qs = base_qs.filter(user=user)

        if user_id:
            base_qs = base_qs.filter(user_id=user_id)

        return base_qs

    def perform_create(self, serializer):
        require_manager(self.request.user, "فقط مدیر می‌تواند اخطار صادر کند.")
        serializer.save()

    def perform_update(self, serializer):
        raise PermissionDenied("ویرایش اخطار مجاز نیست.")

    def perform_destroy(self, instance):
        # فقط مدیر تیم یا مدیر همان تسک اجازه حذف اخطار دارد
        user = self.request.user

        # اگر مدیر تیم است، مجاز است
        if not is_manager(user):
            # اگر مدیر تسک مربوطه است، مجاز است
            task_manager = getattr(instance.task, "manager", None)
            if task_manager != user:
                raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند این اخطار را حذف کند.")
        
        # ذخیره اطلاعات اخطار قبل از حذف
        delete_reason = self.request.data.get("delete_reason", "")
        WarningDeleteLog.objects.create(
            warning=instance,
            deleted_by=self.request.user,
            user_id=instance.user_id,
            task_id=instance.task_id,
            task_title=instance.task.title if instance.task else "",
            amount=instance.amount,
            note=instance.note,
            warning_created_at=instance.created_at,
            delete_reason=delete_reason,
        )
        super().perform_destroy(instance)

    # ----------------------------
    # کم کردن بخشی از اخطار (بدون حذف کامل رکورد)
    # ----------------------------
    @action(detail=True, methods=["post"], url_path="deduct")
    def deduct(self, request, pk=None):
        """
        کم کردن مقداری از اخطار (با ثبت لاگ حذف سبز رنگ)
        POST /api/warnings/{id}/deduct/

        بدنه درخواست:
        {
            "amount": 0.5,
            "delete_reason": "توضیح مدیر"
        }
        """
        warning = self.get_object()
        user = request.user

        # اخطارهای معلق را نمی‌توان کم کرد؛ یا باید تایید یا لغو شوند
        if getattr(warning, "is_pending", False):
            raise PermissionDenied("برای اخطارهای معلق ابتدا باید آن را تایید یا لغو کنید.")

        # فقط مدیر تیم یا مدیر همین تسک
        if not is_manager(user):
            task_manager = getattr(warning.task, "manager", None)
            if task_manager != user:
                raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند از این اخطار کم کند.")

        raw_amount = request.data.get("amount")
        if raw_amount is None:
            return Response(
                {"detail": "فیلد amount الزامی است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(str(raw_amount))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"detail": "مقدار amount نامعتبر است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount <= 0:
            return Response(
                {"detail": "مقدار حذف اخطار باید بزرگ‌تر از صفر باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount > warning.amount:
            return Response(
                {
                    "detail": "نمی‌توانید بیشتر از مقدار اخطار موجود حذف کنید.",
                    "current_amount": str(warning.amount),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        delete_reason = request.data.get("delete_reason", "")

        # ثبت لاگ حذف (نمایش به صورت رکورد سبز در تاریخچه)
        WarningDeleteLog.objects.create(
            warning=warning,
            deleted_by=request.user,
            user_id=warning.user_id,
            task_id=warning.task_id,
            task_title=warning.task.title if warning.task else "",
            amount=amount,
            note=warning.note,
            warning_created_at=warning.created_at,
            delete_reason=delete_reason,
        )

        # اگر تمام مقدار اخطار حذف شد، خود اخطار را حذف کن
        if amount == warning.amount:
            warning.delete()
            remaining = Decimal("0")
        else:
            warning.amount = warning.amount - amount
            warning.save(update_fields=["amount"])
            remaining = warning.amount

        return Response(
            {
                "detail": "مقداری از اخطار با موفقیت حذف شد.",
                "removed_amount": str(amount),
                "remaining_amount": str(remaining),
            }
        )

    # ----------------------------
    # تایید اخطار معلق
    # ----------------------------
    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """
        تایید نهایی یک اخطار معلق (خارج شدن از حالت تعلیق)
        POST /api/warnings/{id}/approve/

        فقط مدیر تیم یا مدیر همان تسک می‌تواند این کار را انجام دهد.
        """
        warning = self.get_object()
        user = request.user

        if not getattr(warning, "is_pending", False):
            return Response({"detail": "این اخطار در حالت تعلیق نیست."}, status=status.HTTP_400_BAD_REQUEST)

        # فقط مدیر تیم یا مدیر همین تسک
        if not is_manager(user):
            task_manager = getattr(warning.task, "manager", None)
            if task_manager != user:
                raise PermissionDenied("فقط مدیر تیم یا مدیر این تسک می‌تواند این اخطار را تایید کند.")

        warning.is_pending = False
        warning.pending_until = None
        warning.save(update_fields=["is_pending", "pending_until"])

        return Response({"detail": "اخطار از حالت تعلیق خارج و ثبت شد."})

    @action(detail=False, methods=["get"], url_path="users_summary")
    def users_summary(self, request):
        """
        خلاصه تعداد اخطارهای هر کاربر برای مدیر تیم
        همه کاربران را برمی‌گرداند، حتی اگر اخطار نداشته باشند (0 اخطار)
        GET /api/warnings/users_summary/
        """
        from accounts.utils import require_admin
        require_admin(request.user, "فقط مدیر تیم می‌تواند لیست اخطارها را ببیند.")

        # همه کاربران را با تعداد اخطارهای تاییدشده برمی‌گرداند (حتی اگر 0 باشد)
        # محاسبه تعداد اخطارهای تاییدشده برای هر کاربر
        users = User.objects.all().order_by("username")
        
        # محاسبه تعداد اخطارهای تاییدشده برای همه کاربران به صورت یکجا
        warning_counts = (
            Warning.objects
            .filter(is_pending=False)
            .values("user_id")
            .annotate(count=Count("id"))
        )
        warning_dict = {item["user_id"]: item["count"] for item in warning_counts}
        
        results = [
            {
                "id": user.id,
                "username": user.username,
                "total_warnings": warning_dict.get(user.id, 0),
            }
            for user in users
        ]

        return Response(results)

    @action(detail=False, methods=["get"], url_path="user_history")
    def user_history(self, request):
        """
        تاریخچه کامل اخطارهای یک کاربر (شامل اخطارهای فعال و حذف شده)
        GET /api/warnings/user_history/?user_id={user_id}
        """
        user = request.user
        target_user_id = request.query_params.get("user_id")
        
        if not target_user_id:
            return Response(
                {"detail": "user_id لازم است."},
                status=400
            )
        
        # اگر کاربر عادی است، فقط می‌تواند تاریخچه خودش را ببیند
        if not is_manager(user) and str(user.id) != str(target_user_id):
            return Response(
                {"detail": "شما فقط می‌توانید تاریخچه اخطارهای خودتان را ببینید."},
                status=403
            )
        
        # دریافت اخطارهای فعال (تاییدشده)
        active_warnings = Warning.objects.filter(
            user_id=target_user_id,
            is_pending=False,
        ).order_by("-created_at")
        active_data = WarningSerializer(active_warnings, many=True).data
        
        # دریافت اخطارهای حذف شده
        deleted_warnings = WarningDeleteLog.objects.filter(user_id=target_user_id).order_by("-deleted_at")
        deleted_data = WarningDeleteLogSerializer(deleted_warnings, many=True).data
        
        # ترکیب و مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
        history = []
        
        # اضافه کردن اخطارهای فعال
        for warning in active_data:
            history.append({
                "type": "active",
                "id": warning["id"],
                "amount": warning["amount"],
                "task_title": warning.get("task_title", ""),
                "task_id": warning.get("task", ""),
                "note": warning.get("note", ""),
                "date": warning["created_at"],
                "can_delete": is_manager(user),
            })
        
        # اضافه کردن اخطارهای حذف شده
        for deleted in deleted_data:
            history.append({
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
            })
        
        # مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
        history.sort(key=lambda x: x["date"], reverse=True)
        
        return Response(history)

    # ----------------------------
    # تنظیمات اخطارها (فقط مدیر تیم)
    # ----------------------------
    # توجه: نام متد را عمداً چیزی غیر از "settings" گذاشتیم تا با
    # property داخلی DRF به نام settings تداخل نکند.
    @action(detail=False, methods=["get", "patch"], url_path="settings")
    def warning_settings(self, request):
        """
        GET /api/warnings/settings/  -> دریافت تنظیمات
        PATCH /api/warnings/settings/ -> ویرایش تنظیمات (فقط سوپر ادمین)
        """
        user = request.user
        # فقط سوپر ادمین می‌تواند تنظیمات را تغییر دهد
        if not user.is_superuser:
            raise PermissionDenied("فقط سوپر ادمین می‌تواند تنظیمات اخطارها را مدیریت کند.")

        settings_obj = WarningSettings.get_solo()

        if request.method.lower() == "get":
            serializer = WarningSettingsSerializer(settings_obj)
            return Response(serializer.data)

        # PATCH
        serializer = WarningSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ----------------------------
    # ارسال لیست اخطارها به تلگرام
    # ----------------------------
    @action(detail=False, methods=["post"], url_path="send_to_telegram")
    def send_to_telegram(self, request):
        """
        ارسال لیست کاربران با تعداد اخطارهایشان به گروه تلگرام
        POST /api/warnings/send_to_telegram/
        """
        require_manager(request.user, "فقط مدیر تیم می‌تواند لیست اخطارها را به تلگرام ارسال کند.")

        # دریافت لیست کاربران با تعداد اخطارها
        users = (
            User.objects.all()
            .annotate(total_warnings=Count("warnings"))
            .order_by("username")
        )

        # ساخت پیام HTML برای تلگرام
        from django.utils import timezone
        today = timezone.localdate()
        
        text = f"<b>📊 خلاصه اخطارهای کاربران</b>\n"
        text += f"<b>📅 تاریخ:</b> {today}\n\n"

        if not users.exists():
            text += "هیچ کاربری در سیستم ثبت نشده است."
        else:
            # جدا کردن کاربران با اخطار و بدون اخطار
            users_with_warnings = [u for u in users if (u.total_warnings or 0) > 0]
            users_without_warnings = [u for u in users if (u.total_warnings or 0) == 0]

            if users_with_warnings:
                text += f"<b>⚠️ کاربران دارای اخطار:</b>\n"
                for user in users_with_warnings:
                    text += f"• <b>{user.username}</b>: {user.total_warnings} اخطار\n"
                text += "\n"

            if users_without_warnings:
                text += f"<b>✅ کاربران بدون اخطار:</b>\n"
                for user in users_without_warnings:
                    text += f"• <b>{user.username}</b>: 0 اخطار\n"

        # ارسال به تلگرام
        # Set proxy for Telegram (required in Iran)
        os.environ["HTTP_PROXY"] = "http://127.0.0.1:2080"
        os.environ["HTTPS_PROXY"] = "http://127.0.0.1:2080"
        
        token = os.environ.get('TELEGRAM_BOT_TOKEN') or getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
        chat_id = os.environ.get('TELEGRAM_GROUP_CHAT_ID') or getattr(settings, 'TELEGRAM_GROUP_CHAT_ID', None)
        
        if not token or not chat_id:
            return Response(
                {"detail": "تنظیمات تلگرام (BOT_TOKEN یا GROUP_CHAT_ID) پیکربندی نشده است."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        }
        
        proxies = {
            "http": "http://127.0.0.1:2080",
            "https": "http://127.0.0.1:2080",
        }
        
        try:
            response = requests.post(url, data=payload, proxies=proxies)
            response.raise_for_status()
            return Response({
                "detail": "لیست اخطارها با موفقیت به گروه تلگرام ارسال شد.",
                "users_count": users.count(),
                "users_with_warnings": len(users_with_warnings) if users.exists() else 0,
            })
        except Exception as e:
            return Response(
                {"detail": f"خطا در ارسال پیام به تلگرام: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )