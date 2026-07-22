.PHONY: help build up down restart logs clean seed test migrate

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker containers
	docker compose build

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose down && docker compose up -d

logs: ## View all logs
	docker compose logs -f

logs-backend: ## View backend logs
	docker compose logs -f backend

logs-frontend: ## View frontend logs
	docker compose logs -f frontend

logs-worker: ## View celery worker logs
	docker compose logs -f celery_worker

clean: ## Remove all containers, volumes, images
	docker compose down -v --rmi all --remove-orphans

seed: ## Seed database with initial data
	docker compose exec backend python -m scripts.seed_db

admin: ## Create admin user
	docker compose exec backend python -m scripts.create_admin

migrate: ## Run Alembic migrations
	docker compose exec backend alembic upgrade head

migrate-create: ## Create new migration (usage: make migrate-create MSG="description")
	docker compose exec backend alembic revision --autogenerate -m "$(MSG)"

test: ## Run backend tests
	docker compose exec backend pytest -v --cov=app

test-unit: ## Run unit tests only
	docker compose exec backend pytest tests/unit -v

test-api: ## Run API tests only
	docker compose exec backend pytest tests/api -v

shell: ## Open backend shell
	docker compose exec backend python

psql: ## Open PostgreSQL shell
	docker compose exec db psql -U netshield netshield_db

redis-cli: ## Open Redis CLI
	docker compose exec redis redis-cli

mongo-shell: ## Open MongoDB shell
	docker compose exec mongodb mongosh -u netshield -p netshield_mongo
