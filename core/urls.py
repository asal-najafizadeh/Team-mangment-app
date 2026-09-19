from django.contrib import admin
from django.urls import path, include
from tasks.views import TaskViewSet
from reports.views import DailyReportViewSet
from warningss.views import WarningViewSet
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from accounts.views import me

router = DefaultRouter()
router.register("tasks", TaskViewSet, basename="tasks")
router.register("reports", DailyReportViewSet, basename="reports")
router.register("warnings", WarningViewSet, basename="warnings")

urlpatterns = [
    path("admin/", admin.site.urls),

    # auth
    path("api/auth/login/", TokenObtainPairView.as_view(), name="jwt_login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="jwt_refresh"),
    path("api/auth/me/", me, name="auth_me"),

    # main routers
    path("api/", include(router.urls)),

    # tasks urls
    path("api/", include("tasks.urls")),

    # attendance URLs only (not reports again)
    path("api/", include("reports.urls")),

    # calendar events urls
    path("api/", include("calendar_events.urls")),
    path("api/calendar/", include("calendar_events.urls")),


    # accounts (users list etc.)
    path("api/", include("accounts.urls")),

]
