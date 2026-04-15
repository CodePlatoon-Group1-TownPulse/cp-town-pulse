from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Town, Event, Attendance

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True} # This hides the password in GET responses
        }

    def create(self, validated_data):
        # This ensures the password is encrypted/hashed in the database
        user = User.objects.create_user(**validated_data)
        return user

class TownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Town
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    town_details = TownSerializer(source='town', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'external_id', 'source_api', 'title', 
            'category', 'description', 'location_address', 
            'town', 'town_details', 'date'
        ]

class AttendanceSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    event_details = EventSerializer(source='event', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'user', 'event', 'timestamp', 'user_details', 'event_details']