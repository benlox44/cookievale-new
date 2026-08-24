# CookieVale — Migration to NestJS + React (TODO)

Migration project from **cookievale** (FastAPI + HTMX + Alpine.js, Python) to a new
stack: **NestJS** (backend, EXAMOC/Clean Architecture style) + **Vite + React +
TypeScript + TanStack Query** (frontend) + **Drizzle** (ORM) + PostgreSQL.

The old project stays **frozen** (no new features) in `~/dev/cookievale` until this
checklist is complete.

## Working agreement

This project is **learning first, product second**. The goal is that I write all the
code (Dockerfile, docker-compose, Makefile, backend, frontend, tests, CI) and the agent
**reviews and grades it**, explaining what is good, what is not, and why. There is no
rush: it is my partner's small business, I will be on this project forever and can take
as long as needed. Go step by step, in several parts.

- [ ] Golden rule: **I write, the agent reviews/grades**. The agent does not implement
      for me unless I explicitly ask.
- [ ] Every new piece I write → the agent reviews it with criteria (correctness,
      conventions, security, testing) and gives me a grade + explanation.

## Phase 0 — Repo bootstrap

- [ ] `git init` in `~/dev/cookievale-new` (repo from scratch, without the old branch)
- [ ] New GitHub repo for cookievale-new (the old one will be archived at cutover)
- [ ] `versions.env` with NODE_VERSION / POSTGRES_VERSION / BUN_VERSION (if applicable)
      as the single source of truth
- [ ] `.env.example` fail-fast (all values, no defaults)
- [ ] `.gitattributes` (LF: versions.env, .env.example, Makefile, Dockerfile,
      docker-compose.yml)
- [ ] `.gitignore` (node_modules, .env, dist, coverage, etc.)
- [ ] `.pre-commit-config.yaml` (file hygiene: end-of-file, trailing whitespace, LF)
- [ ] pnpm workspace: root `package.json` + `pnpm-workspace.yaml`
      (apps/api, apps/web, packages/shared)

## Phase 1 — Docker + Make (I write it, they grade it)

- [ ] Multi-stage `Dockerfile` (build web + api; NestJS serves the static SPA)
- [ ] `docker-compose.yml` (db postgres:15-alpine + api + web in dev)
- [ ] `docker-compose.override.yml` (gitignored, watch/reload in dev)
- [ ] `Makefile` with: build, up, down, restart, logs, shell, migrate, backup,
      test, lint, format, format-check, typecheck, check-md
- [ ] The stack starts in Docker and responds on `/health`

## Phase 2 — Shared (config, security, infra)

- [ ] Fail-fast config (read `process.env` without defaults)
- [ ] Auth: exact port of the HMAC cookie session (NestJS guard + cookie)
- [ ] Rate limiting (`@nestjs/throttler`) with parity to the current app
- [ ] Telegram notifier as a provider (same contract as `telegram.py`)
- [ ] Media uploads + serve `/media` (preserve `/media/orders/<id>/` structure)
- [ ] Packages/shared: enums (OrderStatus, DeliveryMethod) and shared TS DTOs

## Phase 3 — Drizzle: new schema + migrations

- [ ] `drizzle/schema.ts` with the 4 tables: orders, order_items, products,
      availability_slots (+ enums)
- [ ] Generate baseline migration and a working `make migrate`
- [ ] Schema decisions made consciously (do not blindly copy the old one)
- [ ] ETL script (old DB → new DB) that **preserves the IDs** so
      `/media/orders/<id>/` keeps pointing at existing photos and history is kept
      (product_name, amounts, dates)

## Phase 4 — Backend modules (order: scheduling → products → orders → auth)

Each module with the EXAMOC structure (Application/Domain/Infrastructure) + tests:

- [ ] **scheduling**: availability slots, available dates, capacity
- [ ] **products**: admin CRUD, active/inactive, images
- [ ] **orders**: customer form (cart, slot, photos, Telegram on create),
      admin CRUD, editing, deletion (frees the slot), no rejected status
- [ ] **auth**: admin login (HMAC), panel, logout, login rate limit

## Phase 5 — Frontend (Vite + React + TS + TanStack Query)

- [ ] Admin login + protected routing
- [ ] Admin dashboards (orders, products, dates) with TanStack Query
      (mutations → invalidate → refetch)
- [ ] **Customer form** (business priority): catalog, cart, date/capacity selection,
      photos, confirmation
- [ ] UI in Spanish, port of the current look & feel (Tailwind v4)
- [ ] SEO: `/`, `/orders/new`, sitemap.xml, robots.txt

## Phase 6 — Tests + CI

- [ ] Test parity with the current 13 files (unit + integration against real
      postgres, vitest)
- [ ] CI (GitHub Actions): lint, format, typecheck, test, check-md, pre-commit,
      docker-build (same job pattern as the old repo)
- [ ] Adapted PowerShell deploy (drizzle migrate instead of alembic)

## Phase 7 — Cutover (when to really migrate)

Migration gate: **everything below green** before shutting down the old app.

- [ ] Customer form complete and tested (cart, slots, photos, Telegram)
- [ ] Admin complete (login, CRUD orders/products/dates, photo upload)
- [ ] Rate limit and session security with parity
- [ ] `/`, `/orders/new`, sitemap.xml, robots.txt
- [ ] Backup + media working against the new infra
- [ ] Test parity + green CI in cookievale-new
- [ ] ETL executed: data verified (row counts, amounts, history,
      photos reachable via `/media/orders/<id>/`)
- [ ] New deploy on the VPS + healthcheck ok
- [ ] **Switch**: shut down old cookievale, archive `benlox44/cookievale` on GitHub
- [ ] Document operations (backup, deploy, migrate) in the new README
