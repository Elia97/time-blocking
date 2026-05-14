# Time Blocking

A personal time-blocking desktop application. Local-first, single-user, no cloud
backend. Built to provide the polish of Google Calendar / Notion Calendar with
none of the deployment overhead.

> Status: **Phase 0 (scaffolding) complete.** The app shell, theme switcher,
> database schema, and Google Calendar sync wiring points are stubbed out and
> ready for Phase 1 to start building the calendar grid.

## Stack

| Layer                | Choice                                  | Notes                                                                                           |
| -------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Desktop shell        | **Tauri 2** (Rust)                      | ~10–15 MB binary, ~30–80 MB RAM, native WebView                                                 |
| Bundler              | **Vite 7**                              | Fast dev server, fixed port 1420 for Tauri                                                      |
| UI framework         | **React 19 + TypeScript 5.8**           | App Router not used — this is a desktop app, not a website                                      |
| Styling              | **Tailwind CSS v4** + **shadcn/ui**     | Components are copied into `src/components/ui` and fully editable                               |
| State (UI)           | **Zustand**                             | Lightweight, ergonomic                                                                          |
| State (server cache) | **TanStack Query v5**                   | Used as cache layer over local SQLite                                                           |
| Drag & drop          | **dnd-kit**                             | Modern API, sensor flexibility                                                                  |
| Date utilities       | **date-fns** + **date-fns-tz**          | Temporal API still not stable cross-runtime                                                     |
| Persistence          | **SQLite** via `@tauri-apps/plugin-sql` | DB file lives in `appDataDir`                                                                   |
| ORM                  | **Drizzle ORM** (TS)                    | Used for type safety; migrations live in `src-tauri/migrations` and are run by Tauri at startup |
| Recurrence           | **rrule.js**                            | iCalendar RRULE expansion                                                                       |
| Theme                | **next-themes**                         | Works fine outside Next.js, toggles `class` on `<html>`                                         |

## Architecture principle

**Fat frontend, thin Rust core.** All domain logic (event overlap, statistics,
recurrence expansion, sync merge) lives in TypeScript. Rust will be used only
for capabilities the WebView cannot do safely or efficiently:

- OS keyring access (Google OAuth tokens)
- OAuth loopback HTTP server
- Background sync scheduling
- Filesystem (export ICS, backups)
- Global shortcuts (quick-capture overlay)

## Prerequisites

### Toolchain

- **Node.js 20+** (tested with 22.x)
- **pnpm 10+**
- **Rust stable** (install via [rustup](https://www.rust-lang.org/learn/get-started#installing-rust))

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### Linux system packages (Ubuntu / Debian)

Tauri 2 needs the WebKitGTK 4.1 stack:

```bash
sudo apt update && sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl wget file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

E2E tests run with Playwright against the Vite dev server (no native build, no WebDriver). The first run downloads the Chromium browser into the local Playwright cache:

```bash
pnpm exec playwright install --with-deps chromium
```

> On Fedora / Arch the package names differ — see the
> [Tauri prerequisites page](https://tauri.app/start/prerequisites/).

### WSL2 note

The Tauri window is a native GTK app. It needs **WSLg** (bundled with
Windows 11) to render. If running WSL2 on Windows 10, install an X server
(e.g. VcXsrv) and export `DISPLAY` before `pnpm tauri dev`.

Two extra caveats specific to WSL2 + WSLg:

- **`theme: system` does not follow Windows.** WebKitGTK reads
  `prefers-color-scheme` from the **GTK** theme, and WSLg does not bridge
  Windows' dark mode into GTK. On WSL2 "system" therefore resolves to light by
  default. To force dark for a quick test, launch dev mode with
  `GTK_THEME=Adwaita:dark pnpm tauri dev`. On native Linux / Windows / macOS
  the detection works out of the box.
- **Mesa / EGL warnings on startup are harmless.** `libEGL ... failed to get
driver name for fd -1` and `MESA: ZINK: failed to choose pdev` show up
  because WSLg does not expose a real GPU; Mesa falls back to software
  rendering and the WebView still works.

## Install & run

```bash
pnpm install
pnpm tauri dev
```

The first `tauri dev` compiles the Rust dependency graph (5–10 min cold).
Subsequent runs are incremental and fast.

Useful commands:

```bash
pnpm dev               # Vite dev server only (no Tauri shell)
pnpm tauri dev         # Desktop app in dev mode
pnpm tauri build       # Produce a release binary in src-tauri/target/release
pnpm db:generate       # Regenerate SQL migrations from the Drizzle schema
pnpm typecheck         # tsc --noEmit
pnpm lint              # ESLint (no auto-fix)
pnpm lint:fix          # ESLint with auto-fix
pnpm format            # Prettier --write across the repo
pnpm format:check      # Prettier --check, used by CI / pre-commit
pnpm test              # Vitest in watch mode
pnpm test:run          # Vitest single run (CI)
pnpm test:ui           # Vitest browser UI
pnpm test:coverage     # Vitest with v8 coverage
pnpm e2e               # Playwright against Vite dev server with mocked Tauri IPC
pnpm e2e:ui            # Playwright UI mode for debugging specs
pnpm knip              # Detect unused files, exports, dependencies
pnpm check             # Aggregate: typecheck + lint + format:check + test:run + knip
```

## Tooling

- **Prettier** (`prettier.config.mjs`) — `prettier-plugin-tailwindcss` sorts Tailwind class lists automatically. `.prettierignore` excludes `src-tauri/`, generated SQL, and lockfiles.
- **ESLint v10** (`eslint.config.js`, flat config) — `typescript-eslint` strict rules, `react`, `react-hooks`, `react-refresh`, `jsx-a11y`. `src/components/ui/**` (shadcn) is exempted from the `react-refresh/only-export-components` rule.
- **Vitest** (`vitest.config.ts`) — jsdom environment, React Testing Library, jest-dom matchers via `src/test/setup.ts`. Coverage via v8 provider, 80% threshold enforced on statements / branches / functions / lines. Infra files (`src/db/**`, `src/main.tsx`, `src/App.tsx`, `src/app/Providers.tsx`, shadcn UI primitives) are excluded so the threshold reflects feature code only.
- **knip** (`knip.json`) — Phase-1+ dependencies (dnd-kit, rrule, zustand, ...) are temporarily allow-listed and should be removed from `ignoreDependencies` as each phase wires them in.
- **Husky + lint-staged** (`.husky/pre-commit`, `.lintstagedrc.json`) — runs `eslint --fix` + `prettier --write` on staged `.ts/.tsx/.js/.mjs/.cjs` files, and `prettier --write` on staged docs/JSON/CSS. Husky activates after `pnpm install` once a `.git/` directory exists (see [First-time setup](#first-time-setup)).
- **commitlint** (`commitlint.config.mjs`, `.husky/commit-msg`) — enforces [Conventional Commits](https://www.conventionalcommits.org/). Accepted types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Example: `feat(calendar): add week view skeleton`.
- **Playwright** (`playwright.config.ts`, `tests/playwright/`) — runs Chromium against `pnpm dev` (Vite). Tauri IPC is mocked in `src/test/e2e-mock.ts` via `@tauri-apps/api/mocks`, gated on `VITE_E2E=true` so production builds are untouched. No native binary, no WebDriver, no Xvfb.
- **Pre-push hook** (`.husky/pre-push`) — runs the full `pnpm check` before every push. Safety net before sharing code.
- **EditorConfig** + `.nvmrc` + `engines` + `packageManager` — keep editors, Node version, and the pnpm release pinned across machines and CI.

## CI / CD

Four GitHub Actions workflows live under `.github/workflows/`:

| Workflow             | Trigger                              | What it does                                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`             | push & PR on `main`                  | `pnpm check` — typecheck (src + e2e) + lint + format:check + Vitest with v8 coverage at 80% threshold + knip                                                                                                                                                         |
| `e2e.yml`            | push & PR on `main`, manual dispatch | Installs Node + pnpm, caches the Playwright browser bundle, runs `pnpm e2e` against the Vite dev server with mocked Tauri IPC.                                                                                                                                       |
| `release-please.yml` | push on `main`, manual dispatch      | Reads your Conventional Commits and opens/maintains a "Release PR" that bumps `package.json` + `src-tauri/tauri.conf.json` + `src-tauri/Cargo.toml` and writes `CHANGELOG.md`. Merging the Release PR creates the `vX.Y.Z` tag and the corresponding GitHub Release. |
| `release.yml`        | tag `v*`, manual dispatch            | Builds the Tauri bundle (Linux `.deb`, `.rpm`, `.AppImage` by default) and **attaches** the artifacts to the GitHub Release created by release-please. Uncomment matrix entries to also build Windows / macOS.                                                       |

### Release flow recap

1. Land Conventional Commits on `main` (`feat: …`, `fix: …`, `chore: …`).
2. `release-please.yml` opens/updates **Release PR #N** with the version bump and changelog diff.
3. When ready to ship, merge that PR. Release Please creates the tag `v0.X.Y` and a GitHub Release.
4. The tag push triggers `release.yml`, which builds the Tauri bundles and uploads them as assets on the Release.

The initial version is `0.1.0`, tracked in `.release-please-manifest.json`. See `release-please-config.json` to tweak behavior (pre-major bumping, extra files to keep in sync, etc.).

`.github/dependabot.yml` opens weekly PRs for **npm** (grouped: dev vs runtime), **cargo** (`src-tauri/`), and **github-actions**. PRs are prefixed `chore(...)` / `ci(...)` so commitlint accepts them automatically.

Issue / PR templates live under `.github/`. Blank issues are disabled — contributors must pick the bug or feature template.

## First-time setup

After cloning the repo:

```bash
pnpm install        # installs deps; also runs `husky` (no-op until .git exists)
git init            # only the first time, before pushing to GitHub
pnpm prepare        # activates husky now that .git/ is present
```

## Project layout

```
time-blocking/
├── src-tauri/                # Rust core
│   ├── src/lib.rs            # Tauri builder + plugin registration
│   ├── migrations/           # SQL migrations run by tauri-plugin-sql on boot
│   ├── capabilities/         # Permission grants per window
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── app/                  # Root layout: Providers, AppShell, Sidebar, Topbar
│   ├── components/ui/        # shadcn primitives (editable, copied in)
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema (single source of truth for types)
│   │   └── client.ts         # Drizzle proxy over @tauri-apps/plugin-sql
│   ├── features/             # One folder per feature (calendar, events, ...)
│   ├── hooks/                # Generic React hooks
│   ├── lib/                  # Pure utilities (cn, date helpers, ...)
│   ├── stores/               # Zustand stores
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css             # Tailwind + shadcn theme tokens
├── components.json           # shadcn CLI configuration
├── drizzle.config.ts         # drizzle-kit migration generation
└── package.json
```

## Database

SQLite, kept in the OS app-data directory under
`time-blocking/time-blocking.db`. Migrations live in
`src-tauri/migrations/` and are applied at app startup by
`tauri-plugin-sql`. The Drizzle schema in `src/db/schema.ts` mirrors them and
provides type safety for queries.

When the schema in `src/db/schema.ts` changes:

1. Run `pnpm db:generate` — drizzle-kit emits a new `.sql` file under
   `src-tauri/migrations/`.
2. Bump the `version` and add a new `Migration { ... }` entry in
   `src-tauri/src/lib.rs`.

## Roadmap

Phases are sequential. Each phase ends with a working, manually testable
slice. Roadmap is the canonical "next steps" reference — keep it in sync with
the implementation plan.

> As each phase wires in a dependency, **remove it from `knip.json` →
> `ignoreDependencies`** so dead-code detection stays meaningful. Each phase
> below ends with the deps it's expected to "unlock".

### Phase 0 — Scaffold ✅ (current)

**Desktop shell & frontend**

- [x] Tauri 2 + Vite 7 + React 19 + TypeScript 5.8
- [x] Tailwind CSS v4 + shadcn/ui (neutral theme, light / dark / system toggle via `next-themes`)
- [x] App shell layout — `Sidebar`, `Topbar`, `AppShell`, `Providers` (TanStack Query + Tooltip + Theme)
- [x] Project layout: `src/app`, `src/features/{calendar,events,categories,tags,pomodoro,tracking,stats,google-sync}`, `src/db`, `src/hooks`, `src/lib`, `src/stores`

**Persistence**

- [x] Drizzle ORM schema for all planned tables (`events`, `categories`, `tags`, `event_tags`, `pomodoro_sessions`, `time_entries`, `sync_state`, `settings`)
- [x] Initial SQL migration (`src-tauri/migrations/0000_initial.sql`) applied on boot by `tauri-plugin-sql`
- [x] Drizzle proxy client (`src/db/client.ts`) bridging `drizzle-orm/sqlite-proxy` to `@tauri-apps/plugin-sql`
- [x] `drizzle.config.ts` wired up for future `pnpm db:generate`

**Dev tooling**

- [x] Prettier 3 (no-semi, 100 col, Tailwind class sort plugin)
- [x] ESLint 10 flat config (typescript-eslint, react, react-hooks, react-refresh, jsx-a11y)
- [x] Vitest 4 + Testing Library + jsdom — **v8 coverage with 80% threshold enforced**
- [x] Playwright smoke E2E against Vite dev server with mocked Tauri IPC (no native build / WebDriver / Xvfb)
- [x] knip for unused files / exports / deps
- [x] Husky 9 hooks: `pre-commit` (lint-staged), `commit-msg` (commitlint), `pre-push` (`pnpm check`)
- [x] commitlint — Conventional Commits enforced on every commit

**CI/CD**

- [x] `ci.yml` — typecheck + lint + format:check + Vitest with coverage + knip
- [x] `e2e.yml` — pnpm + Node + cached Playwright Chromium, `pnpm e2e` against Vite with mocked Tauri IPC
- [x] `release-please.yml` — opens a Release PR from Conventional Commits, keeps `package.json` + `tauri.conf.json` + `Cargo.toml` versions in sync, writes `CHANGELOG.md`
- [x] `release.yml` — builds Tauri bundles on tag `v*` and attaches `.deb` / `.rpm` / `.AppImage` to the GitHub Release
- [x] Dependabot — weekly PRs for npm (dev + runtime groups), cargo, github-actions
- [x] PR template + bug / feature issue templates + blank-issue lockout
- [x] Editor / runtime pinning: `.editorconfig`, `.nvmrc`, `engines`, `packageManager`, `.vscode/settings.json`

### Phase 1 — Calendar core

- [ ] Week view component (`src/features/calendar/WeekView.tsx`) — CSS Grid 7 columns × 96 fifteen-minute rows
- [ ] Event block component with snapping, min duration, overlap layout (parallel events split horizontally)
- [ ] CRUD events via shadcn `Dialog` + `react-hook-form` + `zod` schema
- [ ] `dnd-kit` for drag-to-move, custom pointer handlers for top/bottom resize
- [ ] `TanStack Query` hooks (`useEvents`, `useCreateEvent`, ...) hitting the Drizzle proxy
- [ ] Zustand UI store (selected date range, draft event, drag state)
- [ ] Event-level unit tests + extend Playwright smoke to create-drag-resize

**knip cleanup at end of phase:** `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/utilities`, `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`, `date-fns-tz`, `zustand`, `src/db/client.ts` from `ignore`.

### Phase 2 — Views & organization

- [ ] Day view (single wide column) and Month view (mini events, click → day)
- [ ] Categories CRUD with color picker + visibility toggle in the sidebar
- [ ] Tags CRUD + multi-tag filter chips in the topbar
- [ ] Quick capture overlay (`Cmd/Ctrl+Shift+Space`) with natural-language parser ("Lunch 12-13 tomorrow")
- [ ] Basic recurrence (daily / weekly) via `rrule.js`, with single-instance exception support

**knip cleanup at end of phase:** `rrule`.

### Phase 3 — Tracking & Pomodoro

- [ ] Pomodoro timer in a dedicated Web Worker (configurable 25/5/15, automatic cycling, drift-free)
- [ ] Per-event start / stop tracking → `time_entries`
- [ ] Distinction between planned (event duration) and actual (sum of `time_entries`) minutes
- [ ] Stats panel: time per category / tag, last 7 / 30 days, Recharts bar + donut charts

**Deps to add this phase:** `recharts`.

### Phase 4 — Google Calendar sync

- [ ] Rust command: OAuth 2.0 desktop loopback flow (spawn browser, listen on `127.0.0.1:<ephemeral>`, capture code)
- [ ] Rust command: keyring read/write (via `keyring-rs`) for refresh tokens — never plaintext on disk
- [ ] TS sync worker: initial pull (-30d / +365d), incremental pulls every 5 min using `syncToken`
- [ ] Push pipeline: mark local rows `dirty`, debounce, send PATCH/POST/DELETE, refresh `google_etag`
- [ ] Conflict resolver UI ("keep mine" / "keep theirs" / merge fields)

**Deps to add this phase:** `googleapis`, plus a Rust crate for keyring access (`keyring`).
**knip cleanup at end of phase:** `@tauri-apps/api`.

### Phase 5 — Polish

- [ ] Native notifications via `tauri-plugin-notification` (event reminders + pomodoro completion)
- [ ] Daily rotating SQLite backups (last 14 days) under `appDataDir/time-blocking/backups/`
- [ ] ICS export of the entire database
- [ ] Global shortcut for quick capture via `tauri-plugin-global-shortcut`
- [ ] Onboarding (3-step: theme → first category → connect Google)
- [ ] Coverage threshold bump to 90% if practical at this stage

## License

Personal project — no license declared. Do not redistribute.
