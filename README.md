# CookieVale — Order Management System

A custom order management system for a boutique bakery. Monorepo with a NestJS API, a Vite + React + TanStack Query SPA, and Drizzle + PostgreSQL.

## Quick Start

**Prerequisites**: Docker with the Compose plugin (v2+) installed and running. This project runs entirely inside Docker — Node, PostgreSQL, Tailwind and the package manager are never installed on your machine.

1. **Clone the repo:**

   ```bash
   git clone https://github.com/benlox44/cookievale-new.git
   cd cookievale-new
   ```

2. **Create your environment file:**

   ```bash
   cp .env.example .env
   ```

   Then fill in **every** value: the PostgreSQL credentials, `DATABASE_URL`, `SECRET_KEY`, `ADMIN_PASSWORD`, `BASE_URL`, `TZ`, `MEDIA_ROOT`, `BACKUP_DEST` and the Telegram bot credentials. The app is fail-fast: if any variable is missing it will refuse to start, so don't skip any.

   `TRUSTED_PROXY_HOSTS` is a comma-separated list of IPs or CIDRs of the reverse proxy (or Cloudflare Tunnel) that sits in front of the app. Client IPs for rate limiting and HTTPS detection come from the `X-Forwarded-For`/`X-Forwarded-Proto` headers, which are only trusted when the request comes directly from one of these addresses. The example value `127.0.0.1,172.16.0.0/12` covers a proxy running on the same machine and forwarding to `localhost:8000` (e.g. `cloudflared` on the host): the container sees those connections from the Docker bridge gateway, which is why the `172.16.0.0/12` range is included alongside loopback. If the proxy is not listed, every visitor is seen as a single IP and the login rate limit is shared across all of them. Change it on the server's `.env` and restart the stack — do not commit the real `.env`.

3. **Start the stack:**

   ```bash
   make up
   ```

   The first run builds the Docker image, which can take a few minutes. In development the web app and the API run with watch/reload.

4. **Apply the database migrations:**

   ```bash
   make migrate
   ```

5. **Open in your browser:**

   ```text
   http://localhost:8000
   ```

## Development Commands

We rely on a `Makefile` to encapsulate Docker operations. Run `make` or `make help` to list every available target (the help output is the source of truth).

| Command | Description |
| --- | --- |
| `make build` | Rebuild Docker images. Only needed when the `Dockerfile`, `package.json`, or system dependencies change. |
| `make up` | Spin up the entire stack in the background |
| `make down` | Tear down the stack |
| `make restart` | Restart the API container |
| `make logs` | Tail the API container logs |
| `make shell` | Open a bash session inside the API container |
| `make migrate` | Apply all pending Drizzle migrations |
| `make backup` | Run the backup script in a throwaway container that mounts `BACKUP_DEST` only for the backup. The app container never mounts it. Fails with a clear message if unavailable. |
| `make test` | Run vitest (unit + integration) across the monorepo |
| `make lint` / `make lint-check` | Lint with auto-fix / read-only gate for CI |
| `make format` / `make format-check` | Format (write) / check formatting (read-only) |
| `make typecheck` | Strict type-check across the monorepo |
| `make check-md` | Lint all Markdown files |

## Stack

- **Backend:** NestJS (strict TypeScript, clean architecture)
- **Database:** PostgreSQL with Drizzle (SQL-first migrations)
- **Data Validation:** class-validator + TypeScript DTOs shared between API and web
- **Frontend:** Vite + React + TypeScript + TanStack Query + TailwindCSS v4
- **Auth:** HMAC-based cookie sessions (ported as-is from the legacy repo)
- **Backups:** plain Node script, run via `make backup` in a throwaway container

## Architecture

The repo is a pnpm monorepo with three packages:

| Package | Role |
| --- | --- |
| `apps/api` | NestJS backend (clean architecture, EXAMOC-style vertical slicing) |
| `apps/web` | Vite + React + TypeScript + TanStack Query SPA |
| `packages/shared` | Enums + TS DTOs shared between API and web |

The backend is built upon **vertical slices**: each business context (e.g. `orders`, `products`, `scheduling`, `auth`) lives in its own module under `apps/api/src/modules/` with a fixed internal layout:

| Path | Role |
| --- | --- |
| `application/dto/` | Request/Response/Summary/SearchParams DTOs |
| `application/use-cases/` | One class per operation, orchestrating domain + repositories |
| `domain/entities/` | Pure domain entities (no framework/infra imports) |
| `domain/value-objects/` | Value objects |
| `domain/repositories/` | Repository interfaces + criteria types |
| `infrastructure/controllers/` | NestJS controllers that delegate to use cases |
| `infrastructure/repositories/` | Drizzle implementations of the repository interfaces |
| `<context>.module.ts` | NestJS module wiring it all together |

Server state never lives in local component state: TanStack Query mutations invalidate and refetch the cache.

## Routes

The backend exposes a JSON API. All routes are documented automatically by NestJS in the interactive OpenAPI/Swagger UI at **`/api/docs`** (available when not running in production). The source of truth lives in the controllers under `apps/api/src/modules/*/infrastructure/controllers/`.

- `GET /health` — health check used by the stack
- **scheduling** — availability slots, available dates, capacity
- **products** — admin CRUD, active/inactive, images
- **orders** — customer form (cart, slot, photos, Telegram on create), admin CRUD, editing, deletion (frees the slot; there is no rejected status)
- **auth** — admin login (HMAC cookie session), panel, logout, login rate limit

The SPA is served by the API: `/` and `/orders/new` for customers, plus the admin panel. Photos are served from `/media/orders/<id>/`, preserving the legacy directory structure.
