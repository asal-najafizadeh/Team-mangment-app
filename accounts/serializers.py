from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import User


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")


class UserSerializer(serializers.ModelSerializer):
    """
    برای ویرایش کاربر از سمت مدیریت
    - پسورد به صورت write_only
    - نقش بر اساس فیلد role موجود (1=ADMIN, 2=SUPERVISOR, 3=EMPLOYEE)
    - اگر role=2 (SUPERVISOR) باشد، باید task_id هم ارسال شود
    """

    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    task_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ("id", "username", "password", "role", "task_id")
        read_only_fields = ("id",)

    def validate(self, attrs):
        role = attrs.get("role", self.instance.role if self.instance else None)
        task_id = attrs.get("task_id")
        
        # اگر نقش SUPERVISOR (2) است، باید task_id هم ارسال شود
        if role == 2:
            if not task_id:
                raise ValidationError({
                    "task_id": "برای نقش مدیر تسک باید یک تسک انتخاب شود."
                })
            
            # بررسی وجود تسک
            from tasks.models import Task
            try:
                task = Task.objects.get(id=task_id)
            except Task.DoesNotExist:
                raise ValidationError({
                    "task_id": "تسک انتخاب شده یافت نشد."
                })
            
            # بررسی اینکه تسک manager ندارد یا کاربر فعلی مدیر آن است
            if task.manager and task.manager != self.instance:
                raise ValidationError({
                    "task_id": f"تسک '{task.title}' از قبل مدیر دارد و قابل انتخاب نیست."
                })
        
        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        task_id = validated_data.pop("task_id", None)
        
        # ذخیره role قبلی
        old_role = instance.role
        # role جدید
        role = validated_data.get("role", old_role)
        
        user = super().update(instance, validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        from tasks.models import Task
        
        # اگر نقش SUPERVISOR است
        if role == 2:
            if task_id:
                # پیدا کردن تسک قبلی که این کاربر مدیر آن بود
                old_task = Task.objects.filter(manager=user).first()
                
                # تنظیم manager تسک جدید
                try:
                    new_task = Task.objects.get(id=task_id)
                    new_task.manager = user
                    new_task.save()
                    
                    # اگر تسک قبلی وجود داشت و با تسک جدید متفاوت است، manager آن را پاک کن
                    if old_task and old_task.id != new_task.id:
                        old_task.manager = None
                        old_task.save()
                except Task.DoesNotExist:
                    pass
        else:
            # اگر نقش دیگر است (نه SUPERVISOR)، manager تسک‌های قبلی را پاک کن
            Task.objects.filter(manager=user).update(manager=None)
        
        return user

