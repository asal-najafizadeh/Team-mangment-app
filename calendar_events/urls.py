from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CalendarEventViewSet, LeaveRequestViewSet

router = DefaultRouter()
router.register("events", CalendarEventViewSet, basename="events")
router.register("leaves", LeaveRequestViewSet, basename="leaves")

urlpatterns = [
    path("", include(router.urls)),
]
