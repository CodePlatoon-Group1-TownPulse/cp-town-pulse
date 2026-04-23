from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Town, Event, Attendance
from .serializers import TownSerializer, EventSerializer, AttendanceSerializer, UserSerializer
from .seattle_socrata import search_events, SocrataError
from .ticketmaster import search_events as tm_search_events, TicketmasterError

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
    """Aggregated event search across Seattle Socrata + Ticketmaster Discovery.

    The Socrata dataset is civic-heavy but sparse; Ticketmaster fills in
    ticketed concerts/sports/arts. Results are merged and sorted by date.
    """

    def get(self, request):
        query = request.query_params.get('q')
        area = request.query_params.get('area')
        try:
            limit = int(request.query_params.get('limit', 500))
        except ValueError:
            return Response({'detail': 'limit must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            days_ahead = int(request.query_params.get('days_ahead', 60))
        except ValueError:
            return Response({'detail': 'days_ahead must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        combined: list[dict] = []

        try:
            combined.extend(search_events(query=query, limit=limit, area=area, days_ahead=days_ahead))
        except SocrataError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            combined.extend(tm_search_events(area=area, query=query, limit=limit, days_ahead=days_ahead))
        except TicketmasterError:
            # Ticketmaster is a supplement; if it fails we still return Socrata.
            pass

        combined.sort(key=lambda ev: ev.get('date') or '')

        return Response({'count': len(combined), 'results': combined})