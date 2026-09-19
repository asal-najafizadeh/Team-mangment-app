# reports/serializers.py
from rest_framework import serializers
from .models import DailyReport


# -----------------------------
#   گزارش روزانه
# -----------------------------
class DailyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyReport
        fields = "__all__"
        read_only_fields = ("user", "created_at")
