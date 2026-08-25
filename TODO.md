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
      test, lint, format, format-check, typecheck, check-md
- [x] The stack starts in Docker and responds on `/health`

## Phase 2 — Shared (config, security, infra)

- [x] Fail-fast config (`shared/config/env.ts`: PORT, DATABASE_URL, SECRET_KEY,
      ADMIN_PASSWORD, BASE_URL, TRUSTED_PROXY_HOSTS, CONTAINER_MEDIA_PATH,
      TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, NODE_ENV, TZ)
- [ ] `packages/shared`: enums `OrderStatus`/`DeliveryMethod` + shared TS DTOs
- [ ] Drizzle provider (postgres.js) + module wiring in `app.module.ts`
- [ ] Auth: port of `core/security.py` (HMAC cookie token) as a NestJS guard +
      login/logout with cookie (`httponly`, `secure=!dev`, `samesite=lax`, TTL 8h)
- [ ] Rate limiting (`@nestjs/throttler`) with parity: login `5/hour`,
      order create `5/hour`; trust proxy from `TRUSTED_PROXY_HOSTS`
- [ ] Telegram provider (same contract as `core/telegram.py`, HTML, non-fatal)
- [ ] Media: validation by magic bytes (jpeg/png/gif/webp, ≤10MB), `save_uploads`,
      `update_photo_set` (reconcile/order/cap/cleanup), `delete_media_files`,
      serve `/media`; MAX_ORDER_PHOTOS=8, MAX_PRODUCT_IMAGES=10
- [ ] Global filters: 401/429/422 as JSON; trust proxy + HTTPS (parity with `main.py`)

## Phase 3 — Drizzle: schema + migrations + ETL

- [ ] `drizzle/schema.ts`: availability_slots, products, orders, order_items +
      pgEnum `OrderStatus`/`DeliveryMethod`
- [ ] Conscious schema decisions (do not blindly copy the old one): `image_urls`/
      `reference_photos` as `text[]`, `product_name` snapshot, timestamps,
      `uq_orders_availability_slot_active`
- [ ] Generate baseline migration + working `make migrate`
- [ ] ETL script (old DB → new DB) that **preserves the primary keys** so
      `/media/orders/<id>/` keeps pointing at existing photos and history is kept
      (product_name, amounts, dates, statuses)

## Phase 4 — Backend modules (order: scheduling → products → orders → auth)

Each module with the EXAMOC structure (Application/Domain/Infrastructure) + tests:

- [ ] **scheduling**: slots by date, available dates with free counts, purge past
      slots, assign a free slot (with `current_slot_id` for edits), admin add/remove
      slot; public available-dates endpoint
- [ ] **products**: admin CRUD, active/inactive, multiple images (order + delete),
      `display_order`/reorder, delete guard when orders exist
- [ ] **orders**: customer create (cart + slot + photos + Telegram + rate limit) and
      admin create, list (page 50, include delivered, sort by id/date), detail,
      update (slot re-match for date, past dates → null slot), change status
      (auto-pays on paid/delivered), replace items (price snapshot), delete (frees
      the slot + removes media dir), **no rejected status**
- [ ] **auth**: login (HMAC, `5/hour`), logout, admin guard
- [ ] Cart parsing shared (port of `cart.py` `parse_cart_items`, Spanish
      `CartError` messages, `stored_prices` for edits)

## Phase 5 — Backend delivery (tests, Swagger, SPA serve, CI)

- [ ] Unit tests (vitest): cart, HMAC security, order/product/scheduling service,
      telegram, uploads/media, health — parity with the legacy unit tests
- [ ] Integration tests against real postgres (dedicated `<db>_test` database,
      throwaway media dir, drizzle migrate, fake Telegram): admin/auth/client API +
      repositories (slot race / unique index)
- [ ] NestJS serves the built SPA (`apps/web/dist`) with SPA fallback +
      `/robots.txt` + `/sitemap.xml` (parity)
- [ ] Swagger verified against the real controllers (`/api/docs`)
- [ ] CI (GitHub Actions): lint, format-check, typecheck, test, check-md,
      docker-build
- [ ] Deploy: `drizzle migrate` on boot/deploy (replaces alembic), adapted
      PowerShell deploy

## Deferred — Frontend (out of scope until backend parity)

The customer form, admin dashboards and the rest of the UI (Vite + React + TanStack
Query) plus the cutover checklist are planned **only after the backend reaches full
parity**. This section will be expanded into its own phases at that point.
