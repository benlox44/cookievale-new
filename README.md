<div align="center">
  <img src="apps/web/public/icons/icon.png" alt="CookieVale" width="200">
  <br/>
  <h1>CookieVale — Order Management System</h1>
  <p>A custom order management system for a boutique bakery.</p>
</div>

Monorepo with a NestJS API, a Vite + React + TanStack Query SPA, and Drizzle + PostgreSQL.

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

Every operation is a `make` target. Run `make help` (or plain `make`) to list them all — the help output is the source of truth.

## Working with AI agents

Agent guidance lives in a single file, [`AGENTS.md`](AGENTS.md) — build/test commands, architecture and conventions. Claude Code instead looks for `CLAUDE.md`. If you use Claude Code, create it locally as a symlink to `AGENTS.md`:

```bash
ln -s AGENTS.md CLAUDE.md
```

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

### Accepted architectural exceptions

Two deviations from the dependency rule are deliberate and documented:

- **`@nestjs/common` in the application layer** — use cases are marked `@Injectable()` so NestJS DI can inject their dependencies. Use cases still depend on domain *interfaces* (ports) and never on infrastructure implementations; the decorator is the one framework dependency NestJS requires.
- **Shared security primitives used by the application layer** — use cases import `safeCompare` from `shared/security` directly for constant-time comparisons. `shared/` is the shared kernel, so this is within the letter of the architecture; wrapping it behind an injected service would add ceremony without benefit.

## Routes

All backend routes are documented automatically by NestJS in the interactive OpenAPI/Swagger UI at **`/docs`** (available when not running in production). The source of truth lives in the controllers under `apps/api/src/modules/*/infrastructure/controllers/`.

The SPA is served by the API at `/` and `/orders/new` for customers, plus the admin panel. Photos are served from `/media/orders/<id>/`, preserving the legacy directory structure.
