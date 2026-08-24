.PHONY: help build up down restart logs migrate backup test lint lint-check format format-check typecheck check-md

.DEFAULT_GOAL := help

include versions.env
export NODE_VERSION POSTGRES_VERSION TAILWIND_VERSION PNPM_VERSION

DC := docker-compose
APP := api

## help: List available targets
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed -E 's/^Makefile:## //' | awk -F': ' '{printf "  %-12s %s\n", $$1, $$2}'

## build: Build Docker images (production image, ignoring the dev override)
build:
	$(DC) -f docker-compose.yml build

## up: Start the stack
up:
	$(DC) up -d

## down: Stop the stack
down:
	$(DC) down

## restart: Restart the api container
restart:
	$(DC) restart $(APP)

## logs: Tail api container logs
logs:
	$(DC) logs -f $(APP)

## migrate: Apply Drizzle migrations
migrate:
	$(DC) exec $(APP) npx drizzle-kit migrate

## backup: Run a database + media backup
backup:
	@BD=$$(grep '^BACKUP_DEST=' .env | head -1 | cut -d= -f2- | tr -d '\r'); \
	if [ -z "$$BD" ] || [ ! -d "$$BD" ]; then \
		echo "ERROR: Backup destination (BACKUP_DEST) is not available. No backup was created."; \
		exit 1; \
	fi; \
	$(DC) run --rm --no-deps -v "$$BD:/app_backup" $(APP) sh -c "apk add --no-cache postgresql-client >/dev/null && node /app/backup.js"

## test: Run tests across the monorepo
test:
	$(DC) exec $(APP) pnpm -r run test

## lint: Lint across the monorepo (auto-fix)
lint:
	$(DC) exec $(APP) pnpm -r run lint

## lint-check: Check lint across the monorepo (read-only)
lint-check:
	$(DC) exec $(APP) pnpm -r run lint-check

## format: Format across the monorepo
format:
	$(DC) exec $(APP) pnpm -r run format

## format-check: Check formatting across the monorepo
format-check:
	$(DC) exec $(APP) pnpm -r run format-check

## typecheck: Type-check across the monorepo
typecheck:
	$(DC) exec $(APP) pnpm -r run typecheck

## check-md: Lint Markdown files
check-md:
	docker run --rm -v "$${PWD}:/work" -w /work node:${NODE_VERSION}-alpine npx markdownlint-cli2 "**/*.md"
