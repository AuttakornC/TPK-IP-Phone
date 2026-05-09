# Wireless PA — Project Notes (Next.js build)

Multi-tenant SaaS for managing wireless PA systems sold as **packages** to municipalities/projects. Vendor (admin) creates projects, assigns user accounts and speakers; each project has 1 authority + 1 officer + 1+ head villages.

Original requirements: [wireless-pa-requirements-md.md](wireless-pa-requirements-md.md). Pending tasks: [todo.md](todo.md).

## Status

Next.js 16 App Router build. Backed by Postgres via Prisma. Auth wired (next-auth credentials), i18n wired (next-intl, Thai default). **No real SIP integration yet** — broadcast UI is wired, transport is mocked. User/speaker data is being migrated from `src/lib/mock.ts` to the database; some pages still read from mock until their server actions land.

> ⚠️ Next.js 16 has breaking changes. Read `node_modules/next/dist/docs/` before relying on memory of older Next.js APIs. Heed deprecation notices. (See [AGENTS.md](AGENTS.md).)

## Roles (4)

| Role | Thai | Scope | Lands at | Notes |
|---|---|---|---|---|
| `admin` | ผู้ดูแลระบบ (vendor) | All projects | `/admin/dashboard` | Dark-themed sidebar UI. Signs in via separate `/admin/login` surface. Creates projects, speakers, users; assigns speakers to head villages. **Only role that can manage users.** |
| `authority` | ผู้บริหาร | Single project | `/app` | Operations panel: emergency, MP3 library, presets, scheduler, log, system status (project-scoped) |
| `officer` | เจ้าหน้าที่ | Single project | `/app` | **Same surface and feature set as authority** in this build |
| `headVillage` | ผู้ใหญ่บ้าน | Assigned speakers | `/village` | Mobile-first elder-friendly UI. Big buttons, large text, broadcasts only to assigned speakers |

Auth: two `next-auth` credential providers in [src/auth.ts](src/auth.ts) — `credentials` (project users) and `admin-credentials` (vendor admins). They are mutually exclusive — admin accounts are blocked from the user sign-in surface, and vice versa. Demo password is shared across all mock users via `DEMO_LOGIN_PASSWORD` env (default `demo1234`).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind v4 (via `@tailwindcss/postcss`); Sarabun Thai font |
| i18n | next-intl, `[locale]` segment, `th` default + `en`, `localePrefix: 'always'` |
| Auth | next-auth v4 (JWT sessions, credentials providers) |
| DB | PostgreSQL + Prisma 7 (`prisma-client` generator → `src/generated/prisma`) |
| Deploy | Docker Compose (db + migrate + app), `output: 'standalone'` |

Real SIP integration (when added): JsSIP in browser → WSS → Nginx → Asterisk.

## File layout

```
prisma/
  schema.prisma         Project, User, Admin, Speaker, Zone, SpeakerAssignment,
                        Mp3File, Schedule, LogEntry, EmergencyPreset, Template
  seed.ts               db seed (run via `pnpm db:seed`)

src/
  auth.ts               next-auth options — two credential providers
  middleware.ts         next-intl middleware (locale routing only)
  i18n/
    routing.ts          locales: ['th', 'en'], default 'th'
    request.ts          per-request message loader
    navigation.ts       typed Link / redirect helpers
  app/
    api/auth/[...nextauth]/   next-auth route handler
    [locale]/
      layout.tsx        root layout (providers, header, locale)
      page.tsx          landing — role selector / login
      app/              authority + officer operations panel
      village/          head village mobile-first UI
      presets/          authority/officer — manage emergency + template presets
      log/ mp3/ scheduler/ users/         project-scoped pages
      status/           project-scoped system status (admin redirects to /admin/status)
      admin/
        login/          admin sign-in
        dashboard/      vendor stats overview
        projects/       projects list + detail
        speakers/       speakers across all projects
        accounts/       all accounts across all projects
        status/         system-wide status (all speakers across all projects)
  components/
    AdminShell.tsx      dark sidebar layout for /admin
    AppHeader.tsx       top header for project users (no users link — admin-only)
    app/                operations panel + dialogs:
                          CallOverlay, EmergencyGrid, SpeakerCard, ZoneTabs,
                          TemplateStrip, GroupCallSidebar,
                          EmergencyConfirmDialog, BroadcastConfirmDialog,
                          EmergencyPresetEditor, TemplatePresetEditor,
                          PlayModeSelector, StatusContent
    ui/                 shared UI (Modal, StatCard, StatusPill, OnlinePill,
                        MeterBar, Avatar, DemoRibbon, LanguageSwitcher)
    providers/SessionProvider.tsx
  lib/
    mock.ts             demo data — USERS, PROJECTS, SPEAKERS, ROLES,
                        PERMISSION_MATRIX, DEMO_USER_BY_ROLE, EMERGENCIES, TEMPLATES, MP3_FILES
    role.ts             client-side role helpers (localStorage demo switcher,
                        landingForRole, loginAsRole, setDemoUser)
    presetStore.ts      project-scoped CRUD for EmergencyPreset / TemplatePreset (localStorage)
    mp3Store.ts         project-scoped CRUD for the MP3 library (localStorage)
  generated/prisma/     ← generated; do NOT edit

messages/
  th.json en.json       next-intl translations
```

## Multi-tenant data model

See [prisma/schema.prisma](prisma/schema.prisma). Single Postgres DB with `project_id` on every tenant table.

- **Project** — name, contractStart/End, status (`ACTIVE` / `EXPIRING` / `EXPIRED`), contact info
- **Admin** — separate vendor account, NOT scoped to a project
- **User** — `projectId` (required), role enum (`AUTHORITY` / `OFFICER` / `HEAD_VILLAGE`)
- **SpeakerAssignment** — many-to-many between head-village users and speakers
- **Speaker** — `projectId`, optional `zoneId`, `online`/`volume`
- **Zone** — `(projectId, code)` unique
- **Mp3File**, **Schedule**, **LogEntry** — all carry `projectId`
- **EmergencyPreset**, **Template** — global, shared across projects
- **LogEntry.userDisplayName** — denormalized so history survives user deletion

Note: package tier limits (maxSpeakers / maxHeadVillage / mp3Storage / recordingDays) are not yet in the schema — currently only mock data has them.

## Scripts

```
pnpm dev              # next dev
pnpm build            # next build (output: standalone)
pnpm start            # next start
pnpm lint             # eslint
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # tsx prisma/seed.ts
pnpm db:reset         # prisma migrate reset (destroys data)
```

## Local dev

```bash
cp .env.example .env          # fill DATABASE_URL, NEXTAUTH_SECRET
docker compose up -d db       # or run your own postgres
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev                      # http://localhost:3000
```

Or run the full stack in Docker: `docker compose up` (brings up db + migrate-and-seed + app on port 3000).

Required env (see [.env.example](.env.example)):

- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — public URL, no trailing slash (default `http://localhost:3000`)
- `DEMO_LOGIN_PASSWORD` — shared password for every mock user (default `demo1234`)

## Demo flow

1. `/` — landing role selector (4 cards). Click a role to log in as the demo user for that role.
2. **Admin** → `/admin/dashboard` (dark sidebar). Projects, speakers, accounts, system status (all 27 seeded speakers).
3. **Authority** (e.g. somphong @ p1) → `/app` operations panel. Project p1's 14 speakers.
4. **Officer** (e.g. somchai @ p1) → `/app` same surface and features as authority.
5. **Head Village** (e.g. manit @ p1, 3 speakers) → `/village` elder-friendly mobile UI. Open at narrow width / on mobile for best effect.
6. Sign out from any header to return to the role selector.

The locale prefix is always present — `/th/...` or `/en/...`. Use the `LanguageSwitcher` component or change the URL.

## Operations panel features (authority + officer)

Both roles see the **same** UI on `/app`:

- **Emergency presets** — tile grid; click → confirm dialog → broadcast. Manage via [/presets](src/app/[locale]/presets/page.tsx).
- **Template presets (pre-recorded)** — strip; click → confirm dialog → broadcast. Manage via /presets.
- **Speakers** — single-call (📞) and multi-select group call. Every broadcast routes through `BroadcastConfirmDialog` before going live.
- **Play mode (per preset)** — saved on each preset:
  - `mp3` → play the MP3 only, mic stays closed (Mute button hidden, mic level bar replaced with "🎵 MP3 only" hint)
  - `mp3-then-mic` → play the MP3 as intro, then `CallOverlay` transitions to live-mic mode after ~2.5s
  - Default: emergencies → `mp3-then-mic`; templates → `mp3`
- **MP3 library** — `/mp3` page; add (file picker / drag-drop), rename inline, delete. Persisted to `localStorage` per project via `mp3Store.ts`. The library feeds the preset editors' MP3 dropdowns.
- **System status (`/status`)** — project-scoped: only that project's speakers. Admin gets redirected to `/admin/status` which shows all.

User management (`/users`) is **admin-only** in this build — non-admins are redirected to their landing page.

## Conventions

- **Thai-first UI text.** Don't switch to English without asking. Add new strings to both [messages/th.json](messages/th.json) and [messages/en.json](messages/en.json).
- **Never inject raw HTML strings into the DOM.** A pre-write security hook blocks raw HTML injection patterns. Use JSX or `textContent` for any dynamic content.
- **Mock data only for now.** Real customer data lives in Postgres once seeded; production data comes from the client.
- **Use the Prisma client from `@/generated/prisma`** — not `@prisma/client`. The generator output is configured to `src/generated/prisma` in the schema.
- **Do not edit `src/generated/`.** It's regenerated by `pnpm db:generate`.
- **Server-only secrets** stay in server components / route handlers / `auth.ts`. Never reference `process.env.NEXTAUTH_SECRET` etc. from client components.
- **Localized routing**: import `Link`, `redirect`, `useRouter`, etc. from [src/i18n/navigation.ts](src/i18n/navigation.ts) — not from `next/link` or `next/navigation` directly.
- **Don't read `localStorage` during render** in client components — wrap in `useEffect`. Otherwise SSR returns null while the client returns the real value, triggering a hydration mismatch (this bit `ZoneTabs` early on; see app/page.tsx for the corrected pattern).
- **No TTS / text-to-speech features.** Removed in this build — every broadcast is either MP3-only or MP3-intro-then-live-mic. Don't reintroduce a "type a script and let the system read it" path without explicit ask.
- **Project-scoped localStorage** keys (`paEmergencyPresets`, `paTemplatePresets`, `paMp3Library`) are bucketed by `projectId`. Helpers live in `src/lib/presetStore.ts` and `src/lib/mp3Store.ts`.
- **Lint warning carry-over**: `react-hooks/set-state-in-effect` triggers across many client pages because the demo-role lookup is inherently localStorage-based. The pattern is necessary for SSR safety; either suppress the rule project-wide or refactor when the auth flow moves entirely to next-auth.

## Pending follow-ups (see [todo.md](todo.md))

- Confirm Thai role labels with client
- Confirm head village can use template + emergency (assumed yes)
- Decide hard caps vs soft caps on package limits
- Wire project-scoped server actions into log / scheduler / users pages (some still read from mock)
- Move presets + mp3 library from localStorage to Postgres (Prisma schema for `EmergencyPreset`/`Template` already exists — wire the CRUD API)
- Add tier-limit enforcement (maxSpeakers, maxHeadVillage, recordingDays) once schema is extended
- Real audio for play modes (currently the call overlay simulates intro→mic transitions on a 2.5 s timer)

## Public demo

Currently shared via ngrok at the URL printed in the chat. To re-share:

```bash
pnpm dev                  # or docker compose up
ngrok http 3000
```
