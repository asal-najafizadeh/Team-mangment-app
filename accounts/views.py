from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import User
from .serializers import SimpleUserSerializer, UserSerializer
from warningss.models import Warning
from accounts.utils import require_admin, require_manager


class UserListView(generics.ListAPIView):
    """
    لیست ساده کاربران برای فرم‌های فرانت‌اند
    GET /api/accounts/users/
    """

    queryset = User.objects.all().order_by("username")
    serializer_class = SimpleUserSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    ویرایش/حذف کاربر فقط توسط ادمین
    PATCH /api/users/{id}/
    DELETE /api/users/{id}/
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(["GET"])
@permission_classes([IsAdminUser])
def users_with_stats(request):
    """
    لیست کاربران با نقش و تعداد اخطارها
    GET /api/users/with_stats/
    """
    from tasks.models import Task
    
    users = (
        User.objects.all()
        .annotate(total_warnings=Count("warnings"))
        .prefetch_related('managed_tasks')
        .order_by("username")
    )

    role_map = {
        1: "ADMIN",
        2: "SUPERVISOR",
        3: "EMPLOYEE",
    }

    data = []
    for u in users:
        # دریافت تسک‌هایی که این کاربر مدیر آن است
        managed_tasks = Task.objects.filter(manager=u).values_list('title', flat=True)
        managed_tasks_list = list(managed_tasks)
        
        data.append({
            "id": u.id,
            "username": u.username,
            "role": "task_manager" if u.role in (1, 2) else "user",
            "total_warnings": u.total_warnings,
            "role_display": role_map.get(u.role, "UNKNOWN"),
            "is_superuser": u.is_superuser,
            "managed_tasks": managed_tasks_list,  # لیست نام تسک‌هایی که مدیر آن است
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def tasks_for_role_selection(request):
    """
    لیست تسک‌ها برای انتخاب نقش مدیر تسک
    GET /api/users/tasks_for_role_selection/
    Returns: لیست تسک‌ها با اطلاعات manager
    """
    from tasks.models import Task
    from tasks.serializers import TaskSerializer
    
    # دریافت ID کاربری که در حال ویرایش است (از query parameter)
    user_id = request.query_params.get('user_id', None)
    
    # دریافت همه تسک‌ها
    tasks = Task.objects.all().select_related('manager').order_by('title')
    
    data = []
    for task in tasks:
        has_manager = task.manager is not None
        is_current_user_manager = False
        
        # اگر user_id ارسال شده، بررسی کن که آیا این کاربر مدیر این تسک است
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                is_current_user_manager = task.manager == user
            except User.DoesNotExist:
                pass
        
        data.append({
            "id": task.id,
            "title": task.title,
            "is_attendance_task": task.is_attendance_task,
            "has_manager": has_manager,
            "manager_id": task.manager.id if task.manager else None,
            "manager_username": task.manager.username if task.manager else None,
            "is_current_user_manager": is_current_user_manager,
            "can_select": not has_manager or is_current_user_manager,  # قابل انتخاب اگر manager ندارد یا کاربر فعلی مدیر آن است
        })
    
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    اطلاعات کاربر لاگین‌شده برای فرانت‌اند
    GET /api/auth/me/
    """
    user = request.user
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "role": getattr(user, "role", None),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_user(request):
    """
    ایجاد کاربر جدید توسط مدیر تیم
    POST /api/users/create/
    Body: { "username": "...", "password": "..." }
    """
    require_manager(request.user, "فقط مدیر تیم می‌تواند کاربر جدید ایجاد کند.")
    
    username = request.data.get("username")
    password = request.data.get("password")
    
    if not username or not password:
        return Response(
            {"detail": "نام کاربری و پسورد الزامی است."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # بررسی تکراری نبودن نام کاربری
    if User.objects.filter(username=username).exists():
        return Response(
            {"detail": "این نام کاربری قبلاً استفاده شده است."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # ایجاد کاربر جدید با نقش پیش‌فرض (EMPLOYEE = 3)
    user = User.objects.create_user(
        username=username,
        password=password,
        role=3  # نقش پیش‌فرض: کاربر عادی
    )
    
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
