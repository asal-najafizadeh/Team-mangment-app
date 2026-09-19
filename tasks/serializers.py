# tasks/serializers.py
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from .models import Task, TaskMemberAssignment
from accounts.models import User


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")


class TaskMemberAssignmentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="user",
        write_only=True,
    )

    class Meta:
        model = TaskMemberAssignment
        fields = ("id", "user", "user_id", "assignment", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class TaskSerializer(serializers.ModelSerializer):

    # نمایش یوزر اصلی
    assigned_to = SimpleUserSerializer(read_only=True)

    # مقداردهی در POST/PATCH برای یوزر اصلی
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="assigned_to",
        write_only=True,
        allow_null=True,
        required=False,
    )

    # نمایش اعضای تسک
    assigned_members = SimpleUserSerializer(many=True, read_only=True)

    # مقداردهی اعضای تسک (لیست آیدی‌ها)
    assigned_members_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="assigned_members",
        many=True,
        write_only=True,
        required=False,
    )

    # نمایش وظایف اعضای تسک
    member_assignments = TaskMemberAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "overview",
            "assigned_to",
            "assigned_to_id",
            "assigned_members",
            "assigned_members_ids",
            "member_assignments",
            "created_at",
            "deadline",
            "status",
            "is_attendance_task",
            "is_system",
            "is_active",
            "manager",
            "manager_warning_penalty",
            "weekly_required_hours",
        )

        # جلوگیری از هک کردن فیلدهای سیستمی
        read_only_fields = (
            "id",
            "created_at",
            "is_system",
            "is_attendance_task",
        )

    # -------------------------------------------
    #   کنترل های امنیتی هنگام UPDATE
    # -------------------------------------------
    def update(self, instance, validated_data):
        user = self.context["request"].user

        # جلوگیری از تغییر مدیر توسط مدیر تسک (فقط مدیر تیم می‌تواند تغییر دهد)
        from accounts.utils import is_manager
        if "manager" in validated_data:
            # اگر مدیر تسک است و می‌خواهد مدیر را تغییر دهد
            if instance.manager == user and not is_manager(user):
                raise PermissionDenied("مدیر تسک نمی‌تواند مدیر تسک را تغییر دهد. فقط مدیر تیم می‌تواند.")
            # اگر مدیر تیم نیست
            if not is_manager(user):
                raise PermissionDenied("فقط مدیر تیم می‌تواند مدیر تسک را تغییر دهد.")

        # جلوگیری از تغییر فیلدهای سیستمی (اگر کسی دستکاری کند)
        validated_data.pop("is_system", None)
        validated_data.pop("is_attendance_task", None)

        # مدیریت وظایف اعضا (اگر در request ارسال شده باشد)
        request = self.context.get("request")
        if request and hasattr(request, 'data'):
            member_assignments_data = request.data.get("member_assignments")
            if member_assignments_data is not None:
                # حذف وظایف قبلی
                TaskMemberAssignment.objects.filter(task=instance).delete()
                # ایجاد وظایف جدید
                if isinstance(member_assignments_data, list):
                    for assignment_data in member_assignments_data:
                        if isinstance(assignment_data, dict):
                            TaskMemberAssignment.objects.create(
                                task=instance,
                                user_id=assignment_data.get("user_id"),
                                assignment=assignment_data.get("assignment", "")
                            )

        # --------------------------------
        #   محدودیت‌های تسک‌های سیستم
        # --------------------------------
        if instance.is_system and not user.has_perm("tasks.edit_system_task"):
            forbidden_fields = {
                "title",
                "description",
                "assigned_to",
                "deadline",
                "manager",
                "manager_warning_penalty",
                "weekly_required_hours",
            }

            for field in forbidden_fields:
                if field in validated_data:
                    raise PermissionDenied("شما اجازه ویرایش این تسک سیستمی را ندارید.")

        # --------------------------------
        #   محدودیت‌های تسک حضور و غیاب
        # --------------------------------
        if instance.is_attendance_task:
            # مدیر تیم می‌تواند description, overview, manager را تغییر دهد
            # اما title و assigned_to نباید تغییر کند
            validated_data.pop("title", None)
            validated_data.pop("assigned_to", None)
            # description, overview, manager قابل تغییر هستند (در validated_data باقی می‌مانند)

        return super().update(instance, validated_data)
