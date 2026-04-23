# app/services.py
import requests
from django.conf import settings

def get_weather(city):
    url = "https://api.example.com/weather"
    params = {"city": city, "key": settings.WEATHER_API_KEY}
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()

