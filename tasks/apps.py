from django.apps import AppConfig
from django.db import connection


class TasksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tasks'
    
    def ready(self):
        # Import signals
        from . import signals
        """ایجاد تسک حضور و غیاب به صورت پیش‌فرض"""
        # بررسی اینکه آیا جداول دیتابیس وجود دارند
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM tasks_task LIMIT 1")
                cursor.execute("SELECT 1 FROM accounts_user LIMIT 1")
        except Exception:
            # جداول هنوز ایجاد نشده‌اند (در حال migration)
            return
        
        try:
            from .models import Task
            from accounts.models import User
            
            # بررسی وجود تسک حضور و غیاب
            attendance_task, created = Task.objects.get_or_create(
                is_attendance_task=True,
                defaults={
                    "title": "حضور و غیاب",
                    "description": "تسک حضور و غیاب سیستم",
                    "is_system": True,
                    "is_active": True,
                    "status": "todo",
                    "weekly_required_hours": 30.0,
                }
            )
            
            if created:
                print("[Tasks] تسک حضور و غیاب به صورت خودکار ایجاد شد.")
            
            # تنظیم manager به اولین سوپر ادمین یا مدیر تیم
            if not attendance_task.manager:
                # اول سوپر ادمین را پیدا کن
                superuser = User.objects.filter(is_superuser=True, is_active=True).first()
                if superuser:
                    attendance_task.manager = superuser
                    attendance_task.save()
                    print(f"[Tasks] مدیر تسک حضور و غیاب به {superuser.username} (سوپر ادمین) تنظیم شد.")
                else:
                    # اگر سوپر ادمین نبود، مدیر تیم (role=1) را پیدا کن
                    admin_user = User.objects.filter(role=1, is_active=True).first()
                    if admin_user:
                        attendance_task.manager = admin_user
                        attendance_task.save()
                        print(f"[Tasks] مدیر تسک حضور و غیاب به {admin_user.username} (مدیر تیم) تنظیم شد.")
            
            # اضافه کردن همه کاربران فعال به assigned_members
            all_users = User.objects.filter(is_active=True)
            current_members = set(attendance_task.assigned_members.all())
            new_members = []
            
            for user in all_users:
                if user not in current_members:
                    new_members.append(user)
            
            if new_members:
                attendance_task.assigned_members.add(*new_members)
                print(f"[Tasks] {len(new_members)} کاربر به تسک حضور و غیاب اضافه شدند.")
                
        except Exception as e:
            # در هنگام migration ممکن است خطا بدهد، پس ignore می‌کنیم
            import traceback
            print(f"[Tasks] خطا در ایجاد/به‌روزرسانی تسک حضور و غیاب: {e}")
            traceback.print_exc()