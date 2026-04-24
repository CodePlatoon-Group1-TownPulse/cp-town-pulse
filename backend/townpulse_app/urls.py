from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet,
    TownViewSet,
    AttendanceViewSet,
    UserViewSet,
    SeattleEventSearchView,
)
from .auth_views import GoogleConfigView, GoogleSignInView, SigninView, SignupView

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'towns', TownViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'users', UserViewSet)
urlpatterns = [
    path('seattle-events/', SeattleEventSearchView.as_view(), name='seattle-events'),
    path('auth/google/config/', GoogleConfigView.as_view(), name='google-config'),
    path('auth/google/', GoogleSignInView.as_view(), name='google-signin'),
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/signin/', SigninView.as_view(), name='signin'),
    path('', include(router.urls)),
]