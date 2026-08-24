# CookieVale — Agent Guide (NestJS + React)

NestJS + Vite + React + TypeScript + TanStack Query + TailwindCSS + PostgreSQL + Drizzle bakery order management system.
Everything runs inside Docker. The user writes the code (Dockerfile, docker-compose, Makefile, backend, frontend, tests, CI) and the agent reviews it — this is a learning-first project.

## Commands

- `make build` — rebuild Docker images. Only needed when `Dockerfile`, `package.json`, or system dependencies change.
- `make up` / `make down` — start/stop stack
- `make restart` — restart a container
- `make logs` — tail container logs
- `make shell` — bash into the api container
- `make migrate` — apply Drizzle migrations (inside container)
- `make backup` — run the backup script in a throwaway container that mounts `$BACKUP_DEST` at `/app_backup` only for the duration of the backup (requires the stack to be up). Exports the database and syncs media files. The app container never mounts the backup destination; fails with a clear message when it is unavailable.
- `make test` — run vitest (unit + integration)
- `make lint` / `make lint-check` / `make format` / `make format-check` / `make typecheck` / `make check-md` — same semantics as the legacy repo (`lint` and `format` auto-fix; `lint-check` and `format-check` are read-only gates for CI)
- There is no `make check`: the Makefile exposes single-action primitives and CI composes them into jobs (Google-style presubmit). Run the relevant targets before pushing; CI is the authoritative gate.

## Architecture — Monorepo

npm/pnpm workspace with three packages:

| Package | Role |
| --- | --- |
| `apps/api` | NestJS backend (clean architecture, EXAMOC-style vertical slicing) |
| `apps/web` | Vite + React + TypeScript + TanStack Query SPA |
| `packages/shared` | Enums + TS DTOs shared between api and web |

Modules live in `apps/api/src/modules/<context>/`. Each module has a fixed internal layout (port of the EXAMOC/Laravel clean-architecture pattern):

| Path | Role |
| --- | --- |
| `application/dto/` | Request/Response/Summary/SearchParams DTOs (class-validator where needed) |
| `application/use-cases/` | One class per operation (e.g. `CreateOrderUseCase`). Orchestrates domain + repositories. |
| `domain/entities/` | Pure domain entities (no infra imports, no Drizzle decorators) |
| `domain/value-objects/` | Value objects |
| `domain/repositories/` | Repository interfaces + criteria types |
| `infrastructure/controllers/` | NestJS controllers. Return DTOs, delegate to use cases. |
| `infrastructure/repositories/` | Drizzle implementations of the repository interfaces |
| `<context>.module.ts` | NestJS module wiring it all together |

Shared infra in `apps/api/src/shared/`: config, prisma/drizzle, security, rate-limit, telegram, media.

New modules must be registered in `app.module.ts`.

## Migrations (Drizzle)

- Schema in `apps/api/drizzle/`.
- Generate: `drizzle-kit generate` (inside container), apply with `make migrate`.
- **Data migration**: a dedicated ETL script moves old-DB data into the new schema, **preserving primary keys** so `/media/orders/<id>/` keeps pointing at existing photos.

## Conventions

- **Language**: Backend code (TS vars, functions, classes, comments) in English. Frontend UI text in Spanish.
- **Typing**: Strict TypeScript mandatory everywhere. No `any` escapes. When fixing typecheck errors, never relax the config strictness — fix the code, not the rules.
- **Env vars**: fail-fast (`process.env["KEY"]` — crash if missing), never `process.env.KEY ?? "default"`.
- **Versions**: `versions.env` is the single source of truth for Node/PostgreSQL/Tailwind/package-manager versions. Never hardcode a version anywhere else (workflows, Dockerfile, docker-compose, configs).
- **Comments**: Explain WHY, not WHAT. Only comment complex business logic or edge cases.
- **TanStack Query**: mutations → invalidate cache → refetch. Server state never lives in local component state.
- **Domain layer**: pure entities and value objects. No framework/infra dependencies.
- **Line endings**: LF everywhere.

## Quirks

- **Working flow**: one file per prompt. The user creates or edits a single file per prompt and the agent explains it before moving on. The agent must NOT implement features or fix code unasked — explain, suggest, and review instead. Only write code when the user explicitly asks.
- The legacy `cookievale` repo (FastAPI/HTMX) lives at `~/dev/cookievale` (same directory as this one, without the `-new` suffix) and is **frozen**: no new features. It stays deployable until the cutover checklist in `TODO.md` is green, then it is archived.
- `docker-compose.override.yml` is gitignored — provides dev watch/reload.
- File hygiene (LF, trailing whitespace, final newline) is handled by prettier defaults via `make format` on prettier-supported files (`.ts`, `.tsx`, `.json`, `.md`, ...). Files prettier does not cover (`.env`, `Makefile`, `Dockerfile`, `docker-compose*.yml`, `versions.env`) are edited manually.
- Orders: `order_items.product_name` stores the product name at order time (renaming/deleting a product must not rewrite history), each order holds one `availability_slots` slot, and a unique index (`uq_orders_availability_slot_active`) enforces one order per slot. Deleting an order frees its slot; there is no rejected status.
- Media files: host volume `MEDIA_ROOT` mounted as `CONTAINER_MEDIA_PATH` in container. Photos written to `/media/orders/<id>/`.
- Auth is HMAC-based cookie sessions (ported as-is from the legacy repo; no JWT or third-party auth library).
- Frontend libs are vendored or installed via the package manager — never reference CDNs.
- Migrations use Drizzle (SQL-first). This project runs Postgres.
- Backup script: single script (stdlib/plain Node), run via `make backup` inside a throwaway container. Reads env vars fail-fast, dumps the DB, writes to the backup mount, and syncs media. Keeps last 7 timestamped backups. The app container never mounts the backup destination.
