from django.contrib import admin
from .models import DailyReport

@admin.register(DailyReport)
class DailyReportAdmin(admin.ModelAdmin):
    list_display = ("user", "task", "report_date", "status_sent", "status_verified")
    list_filter = ("status_sent", "status_verified", "report_date")
    search_fields = ("user__username", "task__title")
    autocomplete_fields = ("user", "task", "verified_by")
