from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, TownViewSet, AttendanceViewSet, UserViewSet # Add UserViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'towns', TownViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'users', UserViewSet) # <--- Add this line

urlpatterns = [
    path('', include(router.urls)),
]