from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "role", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("username",)
