from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "assigned_to", "status", "created_at", "deadline")
    list_filter = ("status",)
    search_fields = ("title",)
    autocomplete_fields = ("assigned_to",)
