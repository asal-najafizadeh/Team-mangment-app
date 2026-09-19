from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta, date

from .models import Event, LeaveRequest
from .serializers import (
    EventSerializer,
    LeaveRequestSerializer,
    LeaveRequestAdminSerializer
)
from .permissions import IsTeamManager


class CalendarEventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by("date")
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="list")
    def list_events(self, request):
        events = Event.objects.all()
        return Response(EventSerializer(events, many=True).data)


class LeaveRequestViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # ----------------------------
    # کاربر درخواست مرخصی می‌دهد
    # ----------------------------
    @action(detail=False, methods=["post"], url_path="request")
    def request_leave(self, request):
        user = request.user
        req_date = request.data.get("date")

        if not req_date:
            return Response({"detail": "تاریخ الزامی است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            req_date = date.fromisoformat(req_date)
        except ValueError:
            return Response({"detail": "فرمت تاریخ نامعتبر است."}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()

        # جلوگیری از درخواست برای روزهای گذشته
        if req_date < today:
            return Response({"detail": "برای روزهای گذشته نمی‌شود درخواست داد."}, status=status.HTTP_400_BAD_REQUEST)

        # حداقل ۲ روز قبل باید درخواست داده شود
        # مثال: اگر امروز 8 است، برای 9 نمی‌تواند ولی برای 10 می‌تواند
        delta_days = (req_date - today).days
        if delta_days < 2:
            return Response(
                {"detail": "حداقل باید دو روز قبل از تاریخ مرخصی درخواست را ثبت کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # محدودیت حداکثر ۳ مرخصی در هر ماه (صرف‌نظر از وضعیت درخواست)
        monthly_requests_count = LeaveRequest.objects.filter(
            user=user,
            date__year=req_date.year,
            date__month=req_date.month,
        ).count()

        if monthly_requests_count >= 3:
            return Response(
                {"detail": "در هر ماه حداکثر سه بار می‌توانید درخواست مرخصی ثبت کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ثبت
        serializer = LeaveRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ----------------------------
    # درخواست‌های خودم
    # ----------------------------
    @action(detail=False, methods=["get"], url_path="my")
    def my_requests(self, request):
        qs = LeaveRequest.objects.filter(user=request.user).order_by("-created_at")
        return Response(LeaveRequestSerializer(qs, many=True).data)

    # ----------------------------
    # همه درخواست‌ها (مدیر)
    # ----------------------------
    @action(
        detail=False,
        methods=["get"],
        url_path="all",
        permission_classes=[IsTeamManager]
    )
    def all_requests(self, request):
        qs = LeaveRequest.objects.all().order_by("-created_at")
        return Response(LeaveRequestAdminSerializer(qs, many=True).data)

    # ----------------------------
    # مدیریت درخواست (قبول / رد)
    # ----------------------------
    @action(
        detail=True,
        methods=["patch"],
        url_path="handle",
        permission_classes=[IsTeamManager]
    )
    def handle_request(self, request, pk=None):
        try:
            leave = LeaveRequest.objects.get(pk=pk)
        except LeaveRequest.DoesNotExist:
            return Response({"detail": "درخواست یافت نشد."}, status=404)

        serializer = LeaveRequestAdminSerializer(leave, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(handled_by=request.user)

        return Response(serializer.data)
