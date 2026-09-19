from rest_framework import serializers
from .models import Warning, WarningDeleteLog, WarningSettings


class WarningSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source="task.title", read_only=True)
    pending_until = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Warning
        fields = "__all__"


class WarningDeleteLogSerializer(serializers.ModelSerializer):
    deleted_by_username = serializers.CharField(source="deleted_by.username", read_only=True)

    class Meta:
        model = WarningDeleteLog
        fields = "__all__"


class WarningSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WarningSettings
        fields = (
            "id",
            "penalty_incomplete_report",
            "penalty_fake_report",
            "penalty_no_report",
            "penalty_weekly_low_hours",
            "updated_at",
        )
        read_only_fields = ("id", "updated_at")
