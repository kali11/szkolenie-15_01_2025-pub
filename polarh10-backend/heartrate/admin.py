"""
Admin configuration for HeartRate app.
"""

from django.contrib import admin
from .models import HeartRateReading


@admin.register(HeartRateReading)
class HeartRateReadingAdmin(admin.ModelAdmin):
    list_display = ['id', 'bpm', 'rr_interval', 'created_at']
    list_filter = ['created_at']
    search_fields = ['bpm']
    ordering = ['-created_at']
    readonly_fields = ['sensor_timestamp', 'bpm', 'rr_interval', 'energy', 'created_at']
    
    date_hierarchy = 'created_at'


