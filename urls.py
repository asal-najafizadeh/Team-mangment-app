from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from tasks.views import TaskViewSet
from reports.views import DailyReportViewSet
from warningss.views import WarningViewSet

router = DefaultRouter()
router.register("tasks", TaskViewSet, basename="tasks")
router.register("reports", DailyReportViewSet, basename="reports")
router.register("warnings", WarningViewSet, basename="warnings")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
]
