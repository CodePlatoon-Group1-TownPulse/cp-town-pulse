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
# Auto-detects macOS vs Linux/WSL and picks the right port-killing tool.
# Both environments use the same POSIX venv layout (backend/venv/bin/*).
# The `dev` target uses bash job-control (&) and requires a Unix-like shell.
UNAME_S := $(shell uname -s 2>/dev/null || echo Unknown)

# Use bash explicitly so `source`/`&`/`until` behave the same everywhere.
SHELL := /bin/bash

# python3 exists on macOS and modern Linux/WSL; fall back to python if not.
PYTHON := $(shell command -v python3 2>/dev/null || command -v python 2>/dev/null || echo python3)

ifeq ($(UNAME_S),Darwin)
    # macOS: lsof is preinstalled; fuser is not.
    KILL_PORT = lsof -ti :$(1) 2>/dev/null | xargs kill -9 2>/dev/null || true
else
    # Linux / WSL: prefer fuser (always present), fall back to lsof.
    KILL_PORT = (command -v fuser >/dev/null 2>&1 && fuser -k $(1)/tcp 2>/dev/null) || (command -v lsof >/dev/null 2>&1 && lsof -ti :$(1) 2>/dev/null | xargs -r kill -9 2>/dev/null) || true
endif

KILL_8000 := $(call KILL_PORT,8000)
KILL_5173 := $(call KILL_PORT,5173)

VENV_PYTHON   := backend/venv/bin/python
VENV_ACTIVATE := . venv/bin/activate

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
migrate: backend/venv
	cd backend && $(VENV_ACTIVATE) && python manage.py makemigrations
	cd backend && $(VENV_ACTIVATE) && python manage.py migrate

superuser:
	$(DOCKER_COMPOSE) exec backend python manage.py createsuperuser

shell:
	$(DOCKER_COMPOSE) exec backend python manage.py shell

# ── Local dev servers ─────────────────────────────────────────────────────────
# Create the Python venv if it doesn't exist yet (cross-platform safe).
backend/venv:
	@echo "Creating Python venv at backend/venv..."
	$(PYTHON) -m venv backend/venv

# Install npm deps if frontend/node_modules is missing.
frontend/node_modules:
	cd frontend && npm install

backend: backend/venv
	$(DOCKER_COMPOSE) up -d db
	cd backend && $(VENV_ACTIVATE) && pip install -r requirements.txt
	cd backend && $(VENV_ACTIVATE) && python manage.py runserver

frontend: frontend/node_modules
	cd frontend && npm run dev

# Runs DB in Docker; Django + Vite run locally in parallel.
# Requires a Unix-like shell (bash/zsh/WSL) for job-control (&).
dev: backend/venv frontend/node_modules
	# Start DB only (backend + frontend run locally below)
	$(DOCKER_COMPOSE) up -d db
	# Kill any existing local servers first to avoid port conflicts
	-$(KILL_8000)
	-$(KILL_5173)
# Wait for Postgres to accept connections (max 30s); avoids docker exec hang on WSL.
# Uses bash's /dev/tcp pseudo-device to attempt a raw TCP connect to localhost:5432
# without shelling into the container. Retries every 2s, up to 15 times (30s max).
	@echo "Waiting for DB to be ready..."
	@i=0; while [ $$i -lt 15 ]; do \
		(echo > /dev/tcp/localhost/5432) >/dev/null 2>&1 && break; \
		i=$$((i+1)); sleep 2; \
	done
	@echo "DB is ready."
	# Run backend in background from the ROOT
	(cd backend && $(VENV_ACTIVATE) && pip install -r requirements.txt && python manage.py runserver) &
	# Run frontend in foreground
	cd frontend && npm run dev

# ── Utilities ─────────────────────────────────────────────────────────────────
logs:
	$(DOCKER_COMPOSE) logs -f

db-check:
	$(DOCKER_COMPOSE) exec -T db pg_isready -U $${DB_USER:-postgres} -d $${DB_NAME:-townpulse_db}

# Freeze from local venv (use after `pip install` in the venv)
freeze-local: backend/venv
	$(VENV_PYTHON) -m pip freeze > backend/requirements.txt

# Freeze from the running backend container
freeze-docker:
	$(DOCKER_COMPOSE) exec backend pip freeze > backend/requirements.txt