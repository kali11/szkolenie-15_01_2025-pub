"""
API views for HeartRate app.
"""

from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Min, Max, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import HeartRateReading
from .serializers import HeartRateReadingSerializer, HeartRateStatsSerializer


class HeartRateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for heart rate readings.
    
    Endpoints:
        GET /api/heartrate/              - List all readings (paginated)
        GET /api/heartrate/?minutes=5    - Get readings from last N minutes
        GET /api/heartrate/{id}/         - Get single reading by ID
        GET /api/heartrate/latest/       - Get most recent reading
        GET /api/heartrate/stats/        - Get aggregated statistics
    """
    
    queryset = HeartRateReading.objects.all()
    serializer_class = HeartRateReadingSerializer

    def get_queryset(self):
        """
        Optionally filter readings by time range.
        
        Query parameters:
            - minutes: Get readings from the last N minutes
        """
        queryset = HeartRateReading.objects.all()
        
        # Filter by last N minutes
        minutes = self.request.query_params.get('minutes')
        if minutes:
            try:
                minutes = int(minutes)
                cutoff_time = timezone.now() - timedelta(minutes=minutes)
                queryset = queryset.filter(created_at__gte=cutoff_time)
            except ValueError:
                pass  # Invalid minutes value, ignore filter
        
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get the most recent heart rate reading.
        
        GET /api/heartrate/latest/
        """
        reading = HeartRateReading.objects.order_by('-created_at').first()
        if reading:
            serializer = self.get_serializer(reading)
            return Response(serializer.data)
        return Response(
            {'detail': 'No readings available'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get aggregated statistics for heart rate readings.
        
        GET /api/heartrate/stats/
        GET /api/heartrate/stats/?minutes=5
        
        Returns:
            - count: Total number of readings
            - avg_bpm: Average heart rate
            - min_bpm: Minimum heart rate
            - max_bpm: Maximum heart rate
            - avg_rr_interval: Average RR interval
            - time_range_start: Earliest reading timestamp
            - time_range_end: Latest reading timestamp
        """
        queryset = self.get_queryset()
        
        stats = queryset.aggregate(
            count=Count('id'),
            avg_bpm=Avg('bpm'),
            min_bpm=Min('bpm'),
            max_bpm=Max('bpm'),
            avg_rr_interval=Avg('rr_interval'),
            time_range_start=Min('created_at'),
            time_range_end=Max('created_at'),
        )
        
        # Round floating point values
        if stats['avg_bpm']:
            stats['avg_bpm'] = round(stats['avg_bpm'], 1)
        if stats['avg_rr_interval']:
            stats['avg_rr_interval'] = round(stats['avg_rr_interval'], 1)
        
        serializer = HeartRateStatsSerializer(stats)
        return Response(serializer.data)


