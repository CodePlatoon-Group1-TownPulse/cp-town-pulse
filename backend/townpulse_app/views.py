from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Town, Event, Attendance
from .serializers import TownSerializer, EventSerializer, AttendanceSerializer, UserSerializer
from .seattle_socrata import search_events, SocrataError

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # This ensures only logged-in users can see the user list
    permission_classes = [permissions.IsAuthenticated]

class TownViewSet(viewsets.ModelViewSet):
    queryset = Town.objects.all()
    serializer_class = TownSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def get_queryset(self):
        queryset = Event.objects.all()
        category = self.request.query_params.get('category')
        if category is not None:
            queryset = queryset.filter(category=category)
        return queryset

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer


class SeattleEventSearchView(APIView):
    """Live search against Seattle's Socrata civic events dataset."""

    def get(self, request):
        query = request.query_params.get('q')
        try:
            limit = int(request.query_params.get('limit', 25))
        except ValueError:
            return Response({'detail': 'limit must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            results = search_events(query=query, limit=limit)
        except SocrataError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'count': len(results), 'results': results})