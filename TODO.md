# CookieVale — Migration to NestJS (TODO)

Migration project from **cookievale** (FastAPI + HTMX + Alpine.js, Python) to a new
stack: **NestJS** (backend, EXAMOC/Clean Architecture style) + **Drizzle** (ORM) +
PostgreSQL. The frontend (Vite + React + TanStack Query) is deliberately **out of
scope** for now: first the backend reaches full parity with the legacy app, and only
then is the frontend planned.

The old project stays **frozen** (no new features) in `~/dev/cookievale` until this
checklist is complete.

## Phase 0 — Repo bootstrap [DONE]

- [x] `git init` in `~/dev/cookievale-new` (repo from scratch, without the old branch)
- [x] New GitHub repo for cookievale-new (the old one will be archived at cutover)
- [x] `versions.env` with NODE_VERSION / POSTGRES_VERSION / BUN_VERSION (if applicable)
      as the single source of truth
- [x] `.env.example` fail-fast (all values, no defaults)
- [x] `.gitattributes` (LF: versions.env, .env.example, Makefile, Dockerfile,
      docker-compose.yml)
- [x] `.gitignore` (node_modules, .env, dist, coverage, etc.)
- [x] `.pre-commit-config.yaml` (file hygiene: end-of-file, trailing whitespace, LF)
- [x] pnpm workspace: root `package.json` + `pnpm-workspace.yaml`
      (apps/api, apps/web, packages/shared)

## Phase 1 — Docker + Make [DONE]

- [x] Multi-stage `Dockerfile` (build web + api; NestJS serves the static SPA)
- [x] `docker-compose.yml` (db postgres:15-alpine + api + web in dev)
- [x] `docker-compose.override.yml` (gitignored, watch/reload in dev)
- [x] `Makefile` with: build, up, down, restart, logs, shell, migrate, backup,
      test, lint, format, format-check, typecheck
- [x] The stack starts in Docker and responds on `/health`

## Phase 2 — Shared (config, security, infra)

- [x] Fail-fast config (`shared/config/env.ts`: PORT, DATABASE_URL, SECRET_KEY,
      ADMIN_PASSWORD, BASE_URL, TRUSTED_PROXY_HOSTS, CONTAINER_MEDIA_PATH,
      TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, NODE_ENV, TZ)
- [x] `packages/shared`: enums `OrderStatus`/`DeliveryMethod` + shared TS DTOs
- [x] Drizzle provider (postgres.js) + module wiring in `app.module.ts`
- [x] Auth: port of `core/security.py` (HMAC cookie token) as a NestJS guard +
      login/logout with cookie (`httponly`, `secure=!dev`, `samesite=lax`, TTL 8h)
- [x] Swagger self-documentation at `/docs`: `@nestjs/swagger` CLI plugin (DTO
      auto-schemas via `dtoFileNameSuffix` + `parameterProperties`) + per-controller
      `@ApiTags`/`@ApiOperation`/`@Api*Response`. **Convention: every new module
      documents itself as it is created** (not deferred).
- [x] Rate limiting (`@nestjs/throttler`): global `ThrottlerGuard` (100/h default),
      login `5/hour` via `@Throttle`, trust proxy from `TRUSTED_PROXY_HOSTS`
      (`main.ts`). Order create `5/hour` moves with the **orders** module (Phase 4).
- [x] Telegram provider (same contract as `core/telegram.py`, HTML, non-fatal)
- [x] Media: validation by magic bytes (jpeg/png/gif/webp, ≤10MB), `save_uploads`,
      `update_photo_set` (reconcile/order/cap/cleanup), `delete_media_files`,
      serve `/media`; MAX_ORDER_PHOTOS=8, MAX_PRODUCT_IMAGES=10
- [x] Global exception filter (`shared/http/domain-exception.filter.ts` as
      `APP_FILTER`): pure domain exceptions → HTTP (e.g. `InvalidCredentialsException`
      → 401), `HttpException`s pass through; string-message `HttpException`s are
      wrapped as `{ statusCode, message }` (429 shape fixed). Remaining: HTTPS
      (parity with `main.py`)

## Phase 3 — Drizzle: schema + migrations + cutover

- [x] Schema in `src/shared/drizzle/schema/` (per-table modules + barrel;
      generated migrations in `drizzle/migrations/`): availability_slots,
      products, orders, order_items + pgEnum `order_status`/`delivery_method`
- [x] Conscious schema decisions (do not blindly copy the old one): `image_urls`/
      `reference_photos` as `text[]` NOT NULL default `'{}'`, `product_name`
      snapshot NOT NULL, timestamps, `uq_orders_availability_slot_active`;
      **enums lowercase** (shared package is source of truth — legacy stored
      UPPERCASE); **DB-level server defaults** (legacy had ORM-only); FK
      `ON DELETE`: order_items→orders `CASCADE`, order_items→products nullable
      `SET NULL`, orders→availability_slots `SET NULL`
- [x] Create `drizzle.config.ts`, wire `{ schema }` into `DrizzleService`
      (typed `db.query.*`), generate baseline migration, verify `make migrate`
      applies cleanly on an **empty** DB (reproducible baseline)
- [ ] Cutover (one-time, in place — at go-live, not now): reshape the legacy prod
      DB in the **same** database via a throwaway `cutover*.sql`
      (**gitignored, never committed**). Runbook **park → migrate → load → drop**:
      (1) move the 4 tables + 2 enums into a `legacy` schema so `public` is empty;
      (2) `make migrate` builds the new schema and stamps its own journal;
      (3) `INSERT … SELECT` from `legacy.*` **preserving primary keys** (so
      `/media/orders/<id>/` stays valid), lowercasing enums, coalescing null
      arrays to `'{}'`, backfilling `product_name`, then resync sequences;
      (4) `DROP SCHEMA legacy CASCADE`. No ETL code or `LEGACY_DATABASE_URL` in
      the repo — only this runbook.

## Phase 4 — Backend modules (order: scheduling → products → orders)

Each module with the EXAMOC structure (Application/Domain/Infrastructure) + unit
tests and self-documenting Swagger as it is built (see AGENTS.md conventions):

- [x] **scheduling**: available dates with free counts, purge past slots, assign a
      free slot (with `current_slot_id` for edits), admin add/remove slot; public
      available-dates endpoint. Occupancy via SQL `NOT EXISTS`; reads filter
      `date >= today` (purge is a cron-ready use-case, not write-on-read)
- [x] **products**: admin CRUD, active/inactive, multiple images (order + delete
      via `updatePhotoSet`), `display_order`/reorder, delete guard when orders
      exist; public `GET /products` (active only). Images behind a `PRODUCT_IMAGE_STORE`
      port; multipart uploads adapted to `UploadedImage` (no `@types/multer`)
- [x] **orders**: customer create (cart + slot + photos + Telegram + rate limit
      `5/hour`) and admin create, list (page 50, include delivered, sort by id/date),
      detail, update (slot re-match for date, past dates → null slot), change status
      (auto-pays on paid/delivered), replace items (price snapshot), delete (frees
      the slot + removes media dir), **no rejected status**. Slot race caught as a
      `23505` unique-violation → 409; Telegram message is English (per AGENTS.md)
- [x] Cart parsing (port of `cart.py` `parse_cart_items`): merge duplicates, drop
      qty≤0, resolve prices server-side (live or `stored_prices` snapshot on edit);
      `CartException` messages in English (SPA localizes)

## Phase 5 — Backend delivery (integration tests, SPA serve, CI)

- [ ] Integration tests against real postgres (dedicated `<db>_test` database,
      throwaway media dir, drizzle migrate, fake Telegram): admin/auth/client API +
      repositories (slot race / unique index)
- [ ] NestJS serves the built SPA (`apps/web/dist`) with SPA fallback +
      `/robots.txt` + `/sitemap.xml` (parity)
- [ ] Swagger audit: verify `/docs` reflects every real controller (already
      self-documented per module; Phase 5 only audits completeness)
- [ ] CI (GitHub Actions): lint, format-check, typecheck, test,
      docker-build
- [ ] Deploy: `drizzle migrate` on boot/deploy (replaces alembic), adapted
      PowerShell deploy

## Deferred — Frontend (out of scope until backend parity)

The customer form, admin dashboards and the rest of the UI (Vite + React + TanStack
Query) plus the cutover checklist are planned **only after the backend reaches full
parity**. This section will be expanded into its own phases at that point.
