.DEFAULT_GOAL := help
.PHONY: help install dev dev-backend dev-frontend test test-backend test-frontend \
        fmt lint lint-backend lint-frontend ci build clean

ARGS ?=

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install backend + frontend dependencies
	cd backend && uv sync
	cd frontend && npm install
	uv run --project backend pre-commit install

dev: ## Run both dev servers concurrently
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend: ## Run FastAPI with reload on :8000
	cd backend && uv run uvicorn app.main:app --reload --port 8000

dev-frontend: ## Run Vite dev server on :5173
	cd frontend && npm run dev

test: test-backend test-frontend ## Run all tests

test-backend: ## Run pytest (pass extra flags with ARGS="-k foo")
	cd backend && uv run pytest $(ARGS)

test-frontend: ## Run vitest once
	cd frontend && npm run test

fmt: ## Format and autofix everything
	cd backend && uv run ruff check --fix . && uv run ruff format .
	cd frontend && npm run lint:fix && npm run format

lint: lint-backend lint-frontend ## Lint + typecheck only

ci: lint test build ## Everything CI runs

build: ## Production build of the frontend
	cd frontend && npm run build

lint-backend:
	cd backend && uv run ruff format --check .
	cd backend && uv run ruff check .
	cd backend && uv run mypy

lint-frontend:
	cd frontend && npm run format:check
	cd frontend && npm run lint
	cd frontend && npm run typecheck

clean: ## Remove caches and build artifacts
	rm -rf backend/.pytest_cache backend/.mypy_cache backend/.ruff_cache \
	       backend/.coverage backend/htmlcov frontend/dist frontend/coverage
	find backend/src backend/tests -type d -name __pycache__ -prune -exec rm -rf {} +
