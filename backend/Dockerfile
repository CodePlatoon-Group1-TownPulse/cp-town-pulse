# Using slim as the standard
FROM python:3.12-slim

# Stop python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy the rest of the code
COPY . .

# Bake static files into the image. Build-time env keeps Django settings happy
# during collectstatic; runtime env overrides these for the actual server.
ENV SECRET_KEY=build-only DEBUG=False ALLOWED_HOSTS=*
RUN python manage.py collectstatic --noinput

# Expose the port
EXPOSE 8000

# run the app
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-", "town_pulse.wsgi:application"]