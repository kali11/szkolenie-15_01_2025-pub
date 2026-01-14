"""
Serializers for HeartRate API.
"""

from rest_framework import serializers
from .models import HeartRateReading


class HeartRateReadingSerializer(serializers.ModelSerializer):
    """Serializer for HeartRateReading model."""
    
    # Add computed fields
    sensor_timestamp_seconds = serializers.FloatField(read_only=True)
    rr_interval_seconds = serializers.FloatField(read_only=True)
    
    class Meta:
        model = HeartRateReading
        fields = [
            'id',
            'sensor_timestamp',
            'sensor_timestamp_seconds',
            'bpm',
            'rr_interval',
            'rr_interval_seconds',
            'energy',
            'created_at',
        ]
        read_only_fields = fields


class HeartRateStatsSerializer(serializers.Serializer):
    """Serializer for heart rate statistics."""
    
    count = serializers.IntegerField()
    avg_bpm = serializers.FloatField(allow_null=True)
    min_bpm = serializers.IntegerField(allow_null=True)
    max_bpm = serializers.IntegerField(allow_null=True)
    avg_rr_interval = serializers.FloatField(allow_null=True)
    time_range_start = serializers.DateTimeField(allow_null=True)
    time_range_end = serializers.DateTimeField(allow_null=True)


