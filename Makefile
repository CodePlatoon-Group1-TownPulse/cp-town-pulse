# cp-town-pulse Makefile

# set which commands will be available
.PHONY: up down build migrate shell superuser test logs dbeaver
VENV_PYTHON = backend/.venv/bin/python

# Start the whole stack
up:
	docker-compose up -d

# Stop the stack
down:
	docker-compose down

# Rebuild containers
build:
	docker-compose up -d --build

stop:
	@echo "Stopping everything........."
# 	kill django server:8000
	-fuser -k 8000/tcp
# 	kill vite:5173
	-fuser -k 5173/tcp
# 	stop the database
	docker-compose down
	@echo "Everything is off. No crazy API calls or AWS bills"

# COmplete Django migrations
migrate:
# 	docker-compose exec backend python manage.py makemigrations
# 	docker-compose exec backend python manage.py migrate
	cd backend && . .venv/bin/activate && python manage.py makemigrations
	cd backend && . .venv/bin/activate && python manage.py migrate

# Make that Django superuser
superuser:
	docker-compose exec backend python manage.py createsuperuser

# Add a way to get into the Django shell for testing
shell:
	docker-compose exec backend python manage.py shell

# Look at the logs
logs:
	docker-compose logs -f

# Check DB using DBeaver
db-check:
	docker-compose exec db pg_isready -U admin -d townpulse_db

# Start just the backend
backend:
	docker-compose up -d db
	cd backend && . .venv/bin/activate && python manage.py runserver

# Start just the frontend
frontend:
	cd frontend && npm run dev

# start both
dev:
	docker compose up -d db
	(cd backend && . .venv/bin/activate && python manage.py runserver &)
	(cd frontend && npm run dev)

clean-start:
# 	docker-compose stop backend || true
	-fuser -k 8000/tcp
	-fuser -k 5173/tcp
	docker-compose down
# 	docker-compose up -d db
# 	cd backend && . .venv/bin/activate && python manage.py runserver

# broken test recipe. 
# test:
# 	cd backend && . .venv/bin/activate && python manage.py test
#################################################################
###################### Experimental #############################
## Should be able to add whatever to my local with pip install ##
## Freeze the local #############################################
## run make build to rebuild with new packages ##################
#################################################################

# freeze backend/requirements.txt with the local venv
freeze-local:
	pip freeze > backend/requirements.txt

# pull the reqs from the running container
freeze-docker:
	docker-compose exec backend pip freeze > backend/requirements.txt