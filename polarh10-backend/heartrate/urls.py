"""
URL configuration for HeartRate API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import HeartRateViewSet

router = DefaultRouter()
router.register(r'heartrate', HeartRateViewSet, basename='heartrate')

urlpatterns = [
    path('', include(router.urls)),
]


