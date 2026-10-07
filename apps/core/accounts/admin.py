# accounts/admin.py
from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_seller', 'is_active')
    list_filter = ('is_staff', 'is_seller', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)  # Fixed: Ordering by email instead of date_joined