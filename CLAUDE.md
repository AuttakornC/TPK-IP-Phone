# Wireless PA — Project Notes (v2 Multi-tenant)

Throwaway **UI prototype** for client feedback. Multi-tenant SaaS for managing wireless PA systems sold as **packages** to municipalities/projects. Vendor (admin) creates projects, assigns user accounts and speakers; each project has 1 authority + 1 officer + 1+ head villages.

Original requirements: [wireless-pa-requirements-md.md](wireless-pa-requirements-md.md). Pending tasks: [todo.md](todo.md).

## Status

This repo currently contains the **prototype only** — no real backend, no SIP, no auth, no real tenancy isolation. All data in [assets/mock.js](assets/mock.js) is placeholder. The `index.html` role-selector picks a demo identity and stores it in `localStorage` for navigation; to switch roles, return to `index.html`.

## Roles (4)

| Role | Thai | Scope | Lands at | Notes |
|---|---|---|---|---|
| `admin` | ผู้ดูแลระบบ (vendor) | All projects | `admin-dashboard.html` | Dark-themed sidebar UI. Can create projects, speakers, users; assign speakers to head villages |
| `authority` | ผู้บริหาร | Single project | `app.html` | Full operational control within their project (emergency, MP3, scheduler, users) |
| `officer` | เจ้าหน้าที่ | Single project | `app.html` | Same as authority but **cannot manage users**; nav link "ผู้ใช้" auto-hidden |
| `headVillage` | ผู้ใหญ่บ้าน | Assigned speakers | `village.html` | Mobile-first elder-friendly UI. Big buttons, large text, broadcasts only to assigned speakers |

The login email determines the project + role in production. For the demo, role-selector cards bypass that.

## Prototype stack

Plain HTML + CSS + JS. Tailwind via CDN. Sarabun Thai font. No build step.

## File layout

```
index.html                  role selector (demo entry)
app.html                    operations control panel — authority + officer
village.html                head village home — elder-friendly mobile UI
village-call.html           head village full-screen broadcast (sessionStorage handoff from village.html)
village-history.html        head village own broadcast history (mobile)
admin-dashboard.html        admin overview — stats, tier breakdown, recent activity, projects table
admin-projects.html         admin projects list with create modal
admin-project-detail.html   admin single project — tabs for accounts/speakers/usage (?id=p1)
admin-speakers.html         admin speakers across all projects + assign to head village
admin-accounts.html         admin all accounts across all projects
mp3.html                    MP3 library + drag-drop upload
scheduler.html              scheduled announcements + skipHolidays
log.html                    announcement log + recording playback
status.html                 system health (admin sees global, others scope to project)
users.html                  users + permission matrix (project-scoped for authority)
assets/
  styles.css       Tailwind extensions: demo ribbon, elder UI, admin theme, role switcher
  mock.js          PROJECTS, PACKAGE_TIERS, SPEAKERS, USERS, ROLES, PERMISSION_MATRIX, etc.
  dom.js           shared h() / icon() / clear() helpers (loaded by mp3/log/scheduler/status/users)
  role.js          getCurrentUser(), getCurrentProject(), loginAsRole(), demo switcher FAB,
                   auto-updates header #userName / #roleBadge / #projectName
  app.js           control panel logic for app.html
```

## Multi-tenant data model (in mock + recommended for prod)

- **PROJECTS** — id, name, tier (basic/standard/premium), contractStart/End, status (active/expiring/expired), contact info
- **PACKAGE_TIERS** — basic/standard/premium with price, maxSpeakers, maxHeadVillage, mp3Storage, recordingDays
- **USERS** — has `projectId` (null for admin), `assignedSpeakers: []` for head villages
- **SPEAKERS** — has `projectId` to scope ownership
- **LOG_ENTRIES**, **MP3_FILES**, **SCHEDULES** — all carry `projectId`

## Demo flow (what to show client)

1. Open [index.html](index.html) → 4 role cards. Click each to see the UX:
   - **Admin** → dark sidebar console. Click "📁 โครงการ" → see 4 mock projects. Click one → tabs (accounts/speakers/usage). Click "🔊 จุดประกาศ" → speaker list with assign-to-head-village. Click "👤 ผู้ใช้" → all accounts.
   - **Authority** (somphong @ p1) → full control panel.
   - **Officer** (somchai @ p1) → same control panel but "ผู้ใช้" nav hidden.
   - **Head Village** (manit @ p1, 3 speakers) → mobile-first elder UI. Open in mobile / narrow window for best effect.
2. Click "ออกจากระบบ" / "ออก" in any header to return to the role selector.

## Conventions

- **Thai-first UI text.** Don't switch to English without asking.
- **No `innerHTML`.** A pre-write security hook blocks it. Use `document.createElement` + `textContent`, or the `h()` helper.
- **No build step.** Don't introduce a bundler/framework/npm.
- **Mock data only.** Real data comes from the client.

## Recommended stack for the real build

Multi-tenant requires more careful design now:

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui |
| SIP | JsSIP in browser → WSS → Nginx → Asterisk (existing) |
| Backend | Next.js Route Handlers + Auth.js (credentials provider with email-based tenant detection) |
| DB | PostgreSQL + Drizzle ORM, **single DB with `project_id` column on every tenant table**, Row-Level Security (RLS) policies for isolation |
| Files | Local filesystem, scoped `/data/projects/<projectId>/` |
| Tenancy | Single domain with email-based tenant detection; admin namespace at `/admin` (separate auth claim) |
| Billing | Stripe + tier limits enforced server-side (maxSpeakers, maxHeadVillage, recordingDays) |
| Deploy | Docker Compose alongside Asterisk + Nginx (on-prem per spec); or split — vendor admin/billing in cloud, project runtime on customer infra |

## Pending follow-ups (see [todo.md](todo.md))

- Confirm Thai role labels with client
- Confirm head village can use template + emergency (assumed yes)
- Decide hard caps vs soft caps on package limits
- Confirm officer = full operational access except user management (assumed)
- Add real per-project filtering to log.html / mp3.html / scheduler.html (currently still global)

## Public demo

Currently shared via ngrok at the URL printed in the chat. To re-share:
```
# server should already be on 8080; restart ngrok if stopped
ngrok http 8080
```
