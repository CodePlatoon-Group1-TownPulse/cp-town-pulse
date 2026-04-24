from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        name = (request.data.get('name') or '').strip()

        if not username:
            return Response({'detail': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username__iexact=username).exists():
            return Response({'detail': 'That username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=name[:150],
        )
        return Response({'username': user.username, 'first_name': user.first_name})


class SigninView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''

        if not username or not password:
            return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'detail': 'Incorrect username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({'username': user.username, 'first_name': user.first_name})


class GoogleConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'client_id': settings.GOOGLE_CLIENT_ID})


class GoogleSignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response({'detail': 'Missing credential.'}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.GOOGLE_CLIENT_ID:
            return Response({'detail': 'Server is missing GOOGLE_CLIENT_ID.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            claims = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response({'detail': 'Invalid Google token.'}, status=status.HTTP_401_UNAUTHORIZED)

        email = (claims.get('email') or '').lower()
        if not email or not claims.get('email_verified'):
            return Response({'detail': 'Google account email is not verified.'}, status=status.HTTP_400_BAD_REQUEST)

        first_name = claims.get('given_name', '') or ''
        last_name = claims.get('family_name', '') or ''

        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': first_name[:150],
                'last_name': last_name[:150],
            },
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=['password'])

        return Response({
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'new_account': created,
        })
