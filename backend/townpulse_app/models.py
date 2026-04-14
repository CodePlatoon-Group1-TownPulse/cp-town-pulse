from django.db import models
from django.contrib.auth.models import User

class Town(models.Model):
    name = models.CharField(max_length=255)
    zip_code = models.CharField(max_length=20)

    def __str__(self):
        return self.name

class Event(models.Model):
    external_id = models.CharField(max_length=255, unique=True)
    source_api = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    description = models.TextField()
    location_address = models.CharField(max_length=255)
    date = models.DateTimeField()
    
    town = models.ForeignKey(Town, on_delete=models.CASCADE, related_name='events')
    
    attendees = models.ManyToManyField(User, through='Attendance', related_name='attended_events')

    def __str__(self):
        return self.title

class Attendance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f"{self.user.username} at {self.event.title}"