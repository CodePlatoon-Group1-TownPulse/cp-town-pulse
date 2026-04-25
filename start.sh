#!/bin/bash

echo "Starting Town Pulse..."

# 1. Activate Backend
# Change 'venv' to '.venv' if that is what you named your folder!
if [ -f "backend/.venv/bin/activate" ]; then
    echo "🐍 Activating backend .venv..."
    source backend/.venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
    echo "🐍 Activating root .venv..."
    source .venv/bin/activate
else
    echo "❌ Error: Could not find .venv/bin/activate in root or backend!"
    exit 1
fi

# 2. Start Django
echo "⚙️ Starting Django backend..."
# Use python3 to be safe on WSL
python3 backend/manage.py migrate
python3 backend/manage.py runserver & 

# 3. Start Frontend
echo "⚛️ Starting frontend..."
if [ -d "frontend" ]; then
    cd frontend
    npm run dev
else
    echo "⚠️ Warning: 'frontend' folder not found. Trying npm in root..."
    npm run dev
fi
# #!/bin/bash

# echo "Starting Town Pulse..."

# # Activate backend venv
# echo "Activating backend..."
# cd backend
# source venv/bin/activate

# # Run Django
# echo "Starting Django backend..."
# python manage.py migrate
# python manage.py runserver 8000 &

# # Start frontend
# echo "Starting frontend..."
# cd ../frontend
# npm install
# npm run dev &

# echo "App is running!"
# echo "Backend: http://127.0.0.1:8000"
# echo "Frontend: http://localhost:5173"

# wait