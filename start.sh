#!/bin/bash

echo "Starting Town Pulse..."

# Activate backend venv
echo "Activating backend..."
cd backend
source venv/bin/activate

# Run Django
echo "Starting Django backend..."
python manage.py migrate
python manage.py runserver 8000 &

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm install
npm run dev &

echo "App is running!"
echo "Backend: http://127.0.0.1:8000"
echo "Frontend: http://localhost:5173"

wait