"""
HeartRate models for storing Polar H10 heart rate data.
"""

from django.db import models
from django.utils import timezone


class HeartRateReading(models.Model):
    """
    Model to store individual heart rate readings from Polar H10 sensor.
    
    Fields match the Pub/Sub message format:
    {
        "type": "HR",
        "timestamp": 1766417260747938000,  # nanoseconds
        "bpm": 119,
        "rr_interval": 521,  # milliseconds
        "energy": null
    }
    """
    
    # Sensor timestamp in nanoseconds (from Polar H10)
    sensor_timestamp = models.BigIntegerField(
        help_text="Sensor timestamp in nanoseconds"
    )
    
    # Heart rate in beats per minute
    bpm = models.IntegerField(
        help_text="Heart rate in beats per minute"
    )
    
    # RR interval in milliseconds (time between consecutive heartbeats)
    rr_interval = models.IntegerField(
        help_text="RR interval in milliseconds"
    )
    
    # Energy expenditure in kilojoules (usually null for Polar H10)
    energy = models.FloatField(
        null=True,
        blank=True,
        help_text="Energy expenditure in kilojoules (if available)"
    )
    
    # Server-side timestamp when the reading was received/stored
    created_at = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="Timestamp when the reading was stored in database"
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"HR: {self.bpm} BPM at {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
    
    @property
    def sensor_timestamp_seconds(self):
        """Convert sensor timestamp from nanoseconds to seconds."""
        return self.sensor_timestamp / 1_000_000_000
    
    @property
    def rr_interval_seconds(self):
        """Convert RR interval from milliseconds to seconds."""
        return self.rr_interval / 1000


