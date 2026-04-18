from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet,
    TownViewSet,
    AttendanceViewSet,
    UserViewSet,
    SeattleEventSearchView,
)

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'towns', TownViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'users', UserViewSet)
urlpatterns = [
    path('seattle-events/', SeattleEventSearchView.as_view(), name='seattle-events'),
    path('', include(router.urls)),
]