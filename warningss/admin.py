from django.contrib import admin
from .models import Warning

@admin.register(Warning)
class WarningAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "note", "created_at")
    search_fields = ("user__username",)
