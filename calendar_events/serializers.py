from rest_framework import serializers
from .models import Event, LeaveRequest
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class SimpleUserSerializer(serializers.ModelSerializer):
    """Serializer for basic user information"""
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ("created_by",)


class LeaveRequestSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = "__all__"
        read_only_fields = (
            "user",
            "status",
            "rejection_message",
            "handled_by",
            "created_at",
        )


class LeaveRequestAdminSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = "__all__"
        read_only_fields = ("user", "date", "reason", "created_at")
