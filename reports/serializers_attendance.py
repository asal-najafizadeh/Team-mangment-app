# serializers_attendance.py
from rest_framework import serializers
from django.utils import timezone
from .models import Attendance, WeeklyAttendanceReport
from accounts.models import User


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")


class AttendanceSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = "__all__"
        read_only_fields = ("user", "created_at")

    # ------------------------------------------------------------
    #   CREATE → فقط ورود ثبت می‌شود (از طریق check_in action)
    # ------------------------------------------------------------
    def create(self, validated_data):
        request = self.context["request"]
        validated_data["user"] = request.user

        # ورود کاربر (اولین ثبت)
        if "check_in" not in validated_data:
            validated_data["check_in"] = timezone.now()

        return super().create(validated_data)

    # ------------------------------------------------------------
    #   UPDATE → ثبت خروج، یا ویرایش توسط مدیر
    # ------------------------------------------------------------
    def update(self, instance, validated_data):
        request = self.context["request"]
        user = request.user

        # --------------------------------------------------------
        # اگر کاربر معمولی است:
        #   - اگر هنوز خروج ثبت نشده → خروج را ثبت کند
        #   - اگر خروج ثبت شده → حق ویرایش ندارد
        # --------------------------------------------------------
        from accounts.utils import is_manager
        if not is_manager(user):
            # حالت ورود → اگر check_in ندارد
            if instance.check_in is None and "check_in" not in validated_data:
                instance.check_in = timezone.now()
                instance.save()
                return instance

            # حالت خروج → اگر check_out ندارد
            if instance.check_out is None and "check_out" not in validated_data:
                instance.check_out = timezone.now()
                instance.save()
                return instance

            # اگر کاربر عادی سعی کند فیلدهای دیگر را تغییر دهد
            if any(key not in ["check_out"] for key in validated_data.keys()):
                raise serializers.ValidationError("شما فقط می‌توانید خروج را ثبت کنید.")

        # --------------------------------------------------------
        # مدیر تیم یا مدیر تسک اجازه ویرایش دارد
        # --------------------------------------------------------

        # اگر به تسک وصل است → باید چک کنیم مدیر تسک است
        task = getattr(instance, "task", None)

        is_task_manager = False
        if task and task.manager == user:
            is_task_manager = True

        from accounts.utils import is_manager
        if is_manager(user) or is_task_manager:
            # مدیر می‌تواند همه فیلدها را مدیریت کند
            return super().update(instance, validated_data)

        raise serializers.ValidationError("شما اجازه ویرایش این حضور و غیاب را ندارید.")


class WeeklyAttendanceReportSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    verified_by = SimpleUserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = WeeklyAttendanceReport
        fields = "__all__"
        read_only_fields = ("user", "created_at", "updated_at", "verified_by", "verified_at")
