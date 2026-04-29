# cp-town-pulse Makefile

.PHONY: help up down build stop migrate superuser shell logs db-check \
        backend frontend dev clean-start freeze-local freeze-docker

help: ## Show this help message
		@echo "Town Pulse Development CLI"
		@echo "--------------------------"
		@$(usage)

# Define the documentation here
# \033[36m<command>\033[0m    Command help description\n
define usage
	@printf " \033[36mdev\033[0m           Run DB in Docker + Django/Vite locally\n\
\033[36mclean-start\033[0m   Kill zombie ports and reset Docker\n\
\033[36mstop\033[0m          Full shutdown (saves AWS/API costs)\n\
\033[36mmigrate\033[0m       Sync Django database schema\n\
\033[36mbuild\033[0m         Rebuild Docker containers\n\
\033[36msuperuser\033[0m     Create superuser in Django\n\
\033[36mshell\033[0m         Open Django shell\n\
\033[36mbackend\033[0m       Start backend only\n\
\033[36mfrontend\033[0m      Start frontend only\n\
\033[36mlogs\033[0m          Start the docker logs\n\
\033[36mdb-check\033[0m      Complete a db health check\n\
\033[36mfreeze-local\033[0m  Pip freeze on local device\n\
\033[36mfreeze-docker\033[0m Pip freeze on docker stack\n\
\033[36mdestroy\033[0m       Destroy your hard drive, gfx card, and soul\n"
endef


# ── OS Detection ──────────────────────────────────────────────────────────────
# Windows users: run make targets inside WSL or Git Bash.
# The `dev` target uses bash job-control (&) and requires a Unix-like shell.
UNAME_S := $(shell uname -s 2>/dev/null || echo Windows)

ifeq ($(UNAME_S),Darwin)
    KILL_8000    := lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    KILL_5173    := lsof -ti :5173 | xargs kill -9 2>/dev/null || true
    VENV_PYTHON  := backend/venv/bin/python
    VENV_ACTIVATE := . venv/bin/activate
else ifeq ($(UNAME_S),Windows)
    $(warning Windows detected — run this Makefile inside WSL or Git Bash for full support.)
    KILL_8000    := echo "Use WSL or Git Bash to kill port 8000 automatically"
    KILL_5173    := echo "Use WSL or Git Bash to kill port 5173 automatically"
    VENV_PYTHON  := backend/venv/Scripts/python
    VENV_ACTIVATE := . backend/venv/Scripts/activate
else
    # Linux / WSL
    KILL_8000    := fuser -k 8000/tcp 2>/dev/null || true
    KILL_5173    := fuser -k 5173/tcp 2>/dev/null || true
    VENV_PYTHON  := backend/venv/bin/python
    VENV_ACTIVATE := . venv/bin/activate
endif

# ── Docker Compose ────────────────────────────────────────────────────────────
# Prefer Compose V2 plugin (`docker compose`); fall back to standalone V1.
DOCKER_COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

# ── Stack management ──────────────────────────────────────────────────────────
up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

build:
	$(DOCKER_COMPOSE) up -d --build

stop:
	@echo "Stopping everything........."
	-$(KILL_8000)
	-$(KILL_5173)
	$(DOCKER_COMPOSE) down
	@echo "Everything is off. No crazy API calls or AWS bills."

clean-start:
	-$(KILL_8000)
	-$(KILL_5173)
	$(DOCKER_COMPOSE) down

# ── Django ────────────────────────────────────────────────────────────────────
migrate:
	cd backend && $(VENV_ACTIVATE) && python manage.py makemigrations 
	cd backend && $(VENV_ACTIVATE) && python manage.py migrate

superuser:
	$(DOCKER_COMPOSE) exec backend python manage.py createsuperuser

shell:
	$(DOCKER_COMPOSE) exec backend python manage.py shell

# ── Local dev servers ─────────────────────────────────────────────────────────
backend:
	$(DOCKER_COMPOSE) up -d db
	cd backend && $(VENV_ACTIVATE) && pip install -r requirements.txt
	cd backend && $(VENV_ACTIVATE) && python manage.py runserver

frontend:
	cd frontend && npm run dev

# Runs DB in Docker; Django + Vite run locally in parallel.
# Requires a Unix-like shell (bash/zsh/WSL) for job-control (&).
dev:
	# Start DB only (backend + frontend run locally below)
	$(DOCKER_COMPOSE) up -d db
	# Kill any existing local servers first to avoid port conflicts
	-$(KILL_8000)
	-$(KILL_5173)
	# Wait for Postgres to be ready before starting Django
	@echo "Waiting for DB to be ready..."
	@until $(DOCKER_COMPOSE) exec db pg_isready -U $${DB_USER:-postgres} -d $${DB_NAME:-townpulse_db} >/dev/null 2>&1; do sleep 2; done
	@echo "DB is ready."
	# Run backend in background from the ROOT
	(cd backend && . venv/bin/activate && pip install -r requirements.txt && python3 manage.py runserver) &
	# Run frontend in foreground
	cd frontend && npm run dev

# ── Utilities ─────────────────────────────────────────────────────────────────
logs:
	$(DOCKER_COMPOSE) logs -f

db-check:
	$(DOCKER_COMPOSE) exec db pg_isready -U $${DB_USER:-postgres} -d townpulse_db

# Freeze from local venv (use after `pip install` in the venv)
freeze-local:
	$(VENV_PYTHON) -m pip freeze > backend/requirements.txt

# Freeze from the running backend container
freeze-docker:
	$(DOCKER_COMPOSE) exec backend pip freeze > backend/requirements.txt