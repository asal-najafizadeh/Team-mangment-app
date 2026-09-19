from rest_framework.routers import DefaultRouter
from .views_attendance import AttendanceViewSet

router = DefaultRouter()
router.register("attendance", AttendanceViewSet, basename="attendance")

urlpatterns = router.urls
