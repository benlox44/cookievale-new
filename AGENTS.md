# CookieVale — Agent Guide (NestJS + React)

NestJS + Vite + React + TypeScript + TanStack Query + TailwindCSS + PostgreSQL + Drizzle bakery order management system.
Everything runs inside Docker.

## Commands

- `make build` — rebuild Docker images. Only needed when `Dockerfile`, `package.json`, or system dependencies change.
- `make up` / `make down` — start/stop stack
- `make restart` — restart a container
- `make logs` — tail container logs
- `make shell` — bash into the api container
- `make migrate` — apply Drizzle migrations (inside container)
- `make backup` — run the backup script in a throwaway container that mounts `$BACKUP_DEST` at `/app_backup` only for the duration of the backup (requires the stack to be up). Exports the database and syncs media files. The app container never mounts the backup destination; fails with a clear message when it is unavailable.
- `make test` — run vitest (unit + integration)
- `make lint` / `make lint-check` / `make format` / `make format-check` / `make typecheck` — same semantics as the legacy repo (`lint` and `format` auto-fix; `lint-check` and `format-check` are read-only gates for CI)
- There is no `make check`: the Makefile exposes single-action primitives and CI composes them into jobs (Google-style presubmit). Run the relevant targets before pushing; CI is the authoritative gate.

## Architecture — Monorepo

npm/pnpm workspace with three packages:

| Package | Role |
| --- | --- |
| `apps/api` | NestJS backend (clean architecture, EXAMOC-style vertical slicing) |
| `apps/web` | Vite + React + TypeScript + TanStack Query SPA |
| `packages/shared` | Enums + TS DTOs shared between api and web |

Modules live in `apps/api/src/modules/<context>/`. Each module is a bounded
context with a fixed internal layout (DDD + Clean Architecture):

| Path | Role |
| --- | --- |
| `application/dto/` | Request/Response DTOs, suffix `.dto.ts`, class-validator where needed |
| `application/use-cases/` | Application services: one class per operation (e.g. `CreateOrderUseCase`). Orchestrate domain + repositories, return DTOs. |
| `domain/entities/` | Pure domain entities (no infra imports, no Drizzle decorators) |
| `domain/value-objects/` | Value objects |
| `domain/constants/` | Domain constants (e.g. session TTL, media caps) |
| `domain/services/` | Domain services: stateless domain logic that belongs to no single entity |
| `domain/repositories/` | Repository **interfaces** + criteria types |
| `domain/exceptions/` | Pure domain exceptions (extend `Error`, no HTTP knowledge) |
| `infrastructure/controllers/` | NestJS controllers. Return DTOs, delegate to use cases. |
| `infrastructure/repositories/` | Drizzle implementations of the repository interfaces |
| `infrastructure/services/` | Technical services (token, telegram, media) |
| `infrastructure/guards/` | NestJS guards (auth, roles) |
| `infrastructure/filters/` | Scoped exception filters |
| `<context>.module.ts` | NestJS module wiring it all together |

### Dependency rule

Dependencies point **inward**: `infrastructure → application → domain`.

- `domain` has zero framework/infra imports (no `@nestjs/*`, no Drizzle).
- `application` depends on domain interfaces, never on infrastructure implementations (Dependency Inversion).
- `infrastructure` implements the domain interfaces and is wired by NestJS DI.
- Domain exceptions are thrown from use cases/domain; a global `APP_FILTER` in
  `shared/http/` maps them to HTTP status codes. Infra at the boundary (guards,
  controllers) may throw HTTP exceptions directly.

Shared infra in `apps/api/src/shared/`: config, drizzle, security, rate-limit,
telegram, media, http (global filters). Global filters live in `shared/http/`.

`shared/` is a **Shared Kernel**, not a bounded context: it is organized by
technical concern (`config/`, `drizzle/`, `http/`, `security/`), NOT by DDD
layers — it holds cross-cutting infra shared between contexts.

New modules must be registered in `app.module.ts`.

## Migrations (Drizzle)

- Schema in `apps/api/drizzle/`.
- Generate: `drizzle-kit generate` (inside container), apply with `make migrate`.
- **Data migration**: a dedicated ETL script moves old-DB data into the new schema, **preserving primary keys** so `/media/orders/<id>/` keeps pointing at existing photos.

## Conventions

- **Language**: Backend is 100% English — code, comments, and user-facing error messages alike. Spanish UI text lives only in the frontend (deferred until the SPA is built). Swagger descriptions are developer-facing → English.
- **Typing**: Strict TypeScript mandatory everywhere. No `any` escapes. When fixing typecheck errors, never relax the config strictness — fix the code, not the rules.
- **Env vars**: fail-fast (`process.env["KEY"]` — crash if missing), never `process.env.KEY ?? "default"`.
- **Versions**: `versions.env` is the single source of truth for Node/PostgreSQL/Tailwind/package-manager versions. Never hardcode a version anywhere else (workflows, Dockerfile, docker-compose, configs).
- **Comments**: Explain WHY, not WHAT. Only comment complex business logic or edge cases.
- **TanStack Query**: mutations → invalidate cache → refetch. Server state never lives in local component state.
- **Domain layer**: pure entities and value objects. No framework/infra dependencies.
- **DTOs**: suffix `.dto.ts` (`login.dto.ts`, `login-response.dto.ts`), class PascalCase. Response DTOs are classes (not interfaces) so the Swagger CLI plugin can read them at runtime.
- **Exceptions**: domain exceptions are pure (`extends Error`, no HTTP knowledge). Throw them from use cases/domain; a global `APP_FILTER` maps them to HTTP. Never throw `HttpException` from use cases.
- **Swagger**: self-documenting per module (`@ApiTags`/`@ApiOperation`/`@Api*Response` on controllers). CLI plugin in `nest-cli.json` generates DTO schemas automatically.
- **Tests**: unit tests (vitest) are written **per module, as the module is built** — use cases, domain services, infra services, guards, filters. Integration tests against a real postgres run in a later phase, but unit tests are never deferred.
- **CQRS**: out of scope for this project — use cases already give per-operation separation; do not introduce `@nestjs/cqrs` unless the domain demands it.
- **Application vs domain services**: application services (use cases) orchestrate and return DTOs; domain services hold stateless domain logic that belongs to no single entity; technical services (token, telegram, media) live in `infrastructure/services/`.
- **Line endings**: LF everywhere.

## Quirks

- **Working flow**: one file per prompt. The user creates or edits a single file per prompt and the agent explains it before moving on. The agent must NOT implement features or fix code unasked — explain, suggest, and review instead. Only write code when the user explicitly asks. When building a module, include its unit tests and Swagger decorators in the same pass (convention, not deferred).
- The legacy `cookievale` repo (FastAPI/HTMX) lives at `~/dev/cookievale` (same directory as this one, without the `-new` suffix) and is **frozen**: no new features. It stays deployable until the cutover checklist in `TODO.md` is green, then it is archived.
- `docker-compose.override.yml` is gitignored — provides dev watch/reload.
- File hygiene (LF, trailing whitespace, final newline) is handled by prettier defaults via `make format` on prettier-supported files (`.ts`, `.tsx`, `.json`, `.md`, ...). Files prettier does not cover (`.env`, `Makefile`, `Dockerfile`, `docker-compose*.yml`, `versions.env`) are edited manually.
- Orders: `order_items.product_name` stores the product name at order time (renaming/deleting a product must not rewrite history), each order holds one `availability_slots` slot, and a unique index (`uq_orders_availability_slot_active`) enforces one order per slot. Deleting an order frees its slot; there is no rejected status.
- Media files: host volume `MEDIA_ROOT` mounted as `CONTAINER_MEDIA_PATH` in container. Photos written to `/media/orders/<id>/`.
- Auth is HMAC-based cookie sessions (ported as-is from the legacy repo; no JWT or third-party auth library).
- Frontend libs are vendored or installed via the package manager — never reference CDNs.
- Migrations use Drizzle (SQL-first). This project runs Postgres.
- Backup script: single script (stdlib/plain Node), run via `make backup` inside a throwaway container. Reads env vars fail-fast, dumps the DB, writes to the backup mount, and syncs media. Keeps last 7 timestamped backups. The app container never mounts the backup destination.
