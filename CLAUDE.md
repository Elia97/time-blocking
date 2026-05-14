# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Local-first, single-user **time-blocking desktop app**. Tauri 2 (Rust shell) + Vite 7 + React 19 + TypeScript 5.8, SQLite via `@tauri-apps/plugin-sql` with Drizzle ORM. No cloud backend; Google Calendar sync is planned but optional.

Status: **Phase 0 (scaffold) complete**, Phase 1 (calendar core) is the active work — see the Roadmap section in `README.md` for the phased plan and the `knip.json` allow-list that tracks dependencies waiting to be wired in.

## Architecture principle

**Fat frontend, thin Rust core.** All domain logic (event overlap, recurrence expansion, stats, sync merge) lives in TypeScript. Rust is reserved for things the WebView can't do safely or efficiently: OS keyring (OAuth tokens), OAuth loopback HTTP server, background sync scheduling, filesystem (ICS export, backups), and global shortcuts. When in doubt, put it in TS.

## Layout

- `src/app/` — root layout: `Providers` (TanStack Query + Tooltip + next-themes), `AppShell`, `Sidebar`, `Topbar`.
- `src/features/<feature>/` — one folder per feature (calendar, events, categories, tags, pomodoro, tracking, stats, google-sync). New feature code lives here, not in `src/components/`.
- `src/components/ui/` — shadcn primitives, copied in and editable. Exempt from `react-refresh/only-export-components`.
- `src/db/schema.ts` — Drizzle schema, **single source of truth** for table types.
- `src/db/client.ts` — Drizzle proxy bridging `drizzle-orm/sqlite-proxy` to `@tauri-apps/plugin-sql`. All queries go through this; TanStack Query wraps it as the cache layer.
- `src/stores/` — Zustand stores (UI state only; server data belongs in TanStack Query).
- `src-tauri/migrations/` — SQL migrations applied at app boot by `tauri-plugin-sql`.
- `src-tauri/src/lib.rs` — Tauri builder + plugin registration + the `Migration { version, ... }` list.
- `tests/playwright/` — Playwright smoke specs that hit `pnpm dev` (Vite + React) with Tauri IPC mocked via `src/test/e2e-mock.ts` (gated by `VITE_E2E=true`). No native build or WebDriver needed.

## Database workflow

When `src/db/schema.ts` changes:

1. `pnpm db:generate` — drizzle-kit emits a new `.sql` under `src-tauri/migrations/`.
2. Bump `version` and add a new `Migration { ... }` entry in `src-tauri/src/lib.rs` so `tauri-plugin-sql` applies it on next boot.

The DB file lives in `appDataDir/time-blocking/time-blocking.db`.

## Commands

```bash
pnpm tauri dev         # desktop app in dev (first cold build: 5–10 min Rust compile)
pnpm dev               # Vite only, no Tauri shell — fine for pure UI work
pnpm tauri build       # release binary in src-tauri/target/release
pnpm db:generate       # regenerate SQL migrations from Drizzle schema

pnpm typecheck         # tsc --noEmit (src)
pnpm lint              # ESLint (no fix)
pnpm format:check      # Prettier check (used by CI / pre-commit)
pnpm test              # Vitest watch
pnpm test:run          # Vitest single run
pnpm test:coverage     # Vitest with v8 coverage (80% threshold enforced)
pnpm knip              # unused files / exports / deps
pnpm check             # aggregate: typecheck + lint + format:check + test:coverage + knip
pnpm e2e               # Playwright against Vite dev server with mocked Tauri IPC
pnpm e2e:ui            # Playwright UI mode for debugging
```

Run a single Vitest file: `pnpm test:run path/to/file.test.ts` (or `-t "name"` to filter). Run a single Playwright spec: `pnpm e2e tests/playwright/foo.spec.ts` (or `--grep "name"`).

`pnpm check` is what `.husky/pre-push` runs — if it passes locally, push will succeed.

## Coverage policy

Vitest enforces **80% on statements / branches / functions / lines**. Infra files are excluded from the threshold so it reflects feature code only: `src/db/**`, `src/main.tsx`, `src/App.tsx`, `src/app/Providers.tsx`, shadcn UI primitives. Don't widen exclusions to dodge the threshold — add tests.

## Commits & releases

Conventional Commits enforced via commitlint (`commit-msg` hook). Types allowed: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Example: `feat(calendar): add week view skeleton`.

Releases are automated by `release-please.yml`: merging to `main` opens/updates a Release PR that bumps `package.json` + `src-tauri/tauri.conf.json` + `src-tauri/Cargo.toml` in lockstep and writes `CHANGELOG.md`. Merging the Release PR tags `vX.Y.Z` and triggers `release.yml` to build and attach Tauri bundles.

## knip allow-list

`knip.json` temporarily ignores dependencies queued for upcoming phases (dnd-kit, rrule, zustand, react-hook-form, zod, etc.). **When you wire one of these in, remove it from `ignoreDependencies`** so knip stays useful. The README roadmap lists which deps each phase is expected to unlock.

## WSL2 gotchas

- `theme: system` resolves to **light** on WSL2 — WSLg doesn't bridge Windows dark mode into GTK. Test dark with `GTK_THEME=Adwaita:dark pnpm tauri dev`.
- Mesa / EGL warnings on startup (`libEGL ... failed to get driver name`, `MESA: ZINK: failed to choose pdev`) are harmless — WSLg has no real GPU, software rendering kicks in.
