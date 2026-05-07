# TODO — Wireless PA Prototype v2 (Multi-tenant + Role Refactor)

> Based on client feedback (2026-05-07):
> 1. 4 roles: head village / officer / authority / admin
> 2. Head Village = mobile-first, elder-friendly UI
> 3. Remove Push-to-Talk
> 4. Multi-tenant SaaS — admin creates projects, assigns accounts (1 head village + 1 officer + 1 authority per package), creates speakers, assigns speakers to accounts

---

## Phase 0 — Decisions to confirm before coding
See **"Open questions for client"** section at the bottom. Don't start coding until these are answered (or assumed defaults are accepted).

---

## Phase 1 — Data model + role refactor

- [ ] **Update `assets/mock.js`**
  - [ ] Replace ROLES with 4 new roles: `admin`, `authority`, `officer`, `headVillage`
  - [ ] Update PERMISSION_MATRIX for 4 new roles
  - [ ] Add `PROJECTS` array (3 mock projects, e.g. ตำบล A / B / C)
  - [ ] Replace single USERS list with users keyed by project (admin has no project)
  - [ ] Add `projectId` to SPEAKERS
  - [ ] Add `assignedTo` (user ids) to SPEAKERS for head-village assignments
- [ ] **Remove Push-to-Talk completely**
  - [ ] Delete PTT section from `app.html`
  - [ ] Delete PTT logic from `assets/app.js`
  - [ ] Delete PTT CSS from `assets/styles.css` (`.ptt-button`, `.ptt-wrap`, `@keyframes ptt-ring`)
- [ ] **Login → role-selector for demo**
  - [ ] `index.html` becomes 4 cards: "เข้าใช้งานในมุมมอง <role>"
  - [ ] Each card routes to that role's home page

---

## Phase 2 — Head Village mobile-first UI 📱

> Audience: ผู้ใหญ่บ้าน (often elderly, using on mobile in the field, low tech literacy)
> Principles: Big buttons (≥64px tap), big text (18-22px body), 1 column, max 4-5 choices per screen, plain Thai, confirm before every broadcast.

- [ ] **Create `village.html`** — head village home (mobile-first)
  - [ ] Big greeting card: "สวัสดีครับ ผู้ใหญ่ <name>" + ชื่อโครงการ + วันที่/เวลาแบบเต็ม
  - [ ] Hero red button: "🚨 แจ้งเหตุฉุกเฉิน" (full width, 80px tall)
  - [ ] **Single big "ประกาศตอนนี้" button** — broadcasts to ALL their assigned speakers (default flow)
  - [ ] List of assigned speakers (big cards, online/offline status, ปุ่ม "ประกาศ" ใหญ่ๆ)
  - [ ] Templates as 2-column grid of large tiles (icon 40px+ name)
  - [ ] Bottom tab bar: หน้าหลัก · ประวัติของฉัน · ออก
- [ ] **Create `village-call.html`** — full-screen call view
  - [ ] Large "กำลังประกาศ" indicator + big timer
  - [ ] Single huge red "วางสาย" button at bottom
  - [ ] No multi-step UX (mute, volume hidden — keep simple)
- [ ] **Create `village-history.html`** — own broadcast history (last 30 days only, simple list, big text)
- [ ] **Confirmation dialogs** before every broadcast — full-screen with big yes/no, prevent accidental taps
- [ ] Use system font size respect — `clamp()` for fluid type
- [ ] High contrast palette — no light grey on white
- [ ] Test at 360px width (smallest common Android)

---

## Phase 3 — Admin SaaS area (multi-tenant management)

- [ ] **Create `admin/` directory** (or `admin-*.html` flat files for simplicity)
- [ ] **`admin-projects.html`** — Projects list
  - [ ] Table: ชื่อโครงการ · package tier · accounts · speakers · status · expiry
  - [ ] "เพิ่มโครงการ" button → modal (name, contact, tier, contract dates)
  - [ ] Each row → link to project detail
- [ ] **`admin-project-detail.html`** — Single project
  - [ ] Project info card (name, contract, tier, usage stats)
  - [ ] Tab: Accounts — list of authority/officer/head-village + add/remove
  - [ ] Tab: Speakers — list of speakers in this project + assign to head-village
  - [ ] Tab: Usage — broadcast count this month, storage used
- [ ] **`admin-speakers.html`** — All speakers across all projects
  - [ ] Filter by project, online status
  - [ ] Add new speaker (name, ext, zone, project, optional assigned head-village)
  - [ ] Bulk assignment UI
- [ ] **`admin-accounts.html`** — All accounts across all projects
  - [ ] Filter by role + project
  - [ ] Create / disable / reset password
  - [ ] When creating: choose project + role + assign speakers (if head village)
- [ ] **`admin-dashboard.html`** — Admin landing
  - [ ] Stats: total projects, total accounts, total speakers, system uptime
  - [ ] Quick links + recent activity feed

---

## Phase 4 — Authority & Officer views

> Decision needed: do authority and officer use the **same** control panel with feature flags, or separate pages? Recommend same, with conditional rendering.

- [ ] Reuse current `app.html` as "Operations" page for **both** authority and officer
- [ ] Show/hide features based on role:
  - Authority: full access (emergency, MP3 upload, scheduler, log, users-within-project)
  - Officer: announce + group + view own log only — hide MP3 upload, scheduler, users
- [ ] Add **project context indicator** to header — "โครงการ: <name>"
- [ ] Speaker grid filters automatically to current project's speakers

---

## Phase 5 — Existing pages cleanup

- [ ] **Update `users.html`** — for current role's project only (or for admin = global)
- [ ] **Update `log.html`** — scope to project; head village sees only own
- [ ] **Update `mp3.html`** — scope to project; hide for officer
- [ ] **Update `scheduler.html`** — scope to project; hide for officer
- [ ] **Update `status.html`** — admin only (system-wide); other roles see project-scoped speaker health
- [ ] **Update navigation** in every page — show only what current role can access
- [ ] **Add role badge** in every header reflecting current demo role
- [ ] **Add "Switch role (demo)" link** in header for easy demo navigation

---

## Phase 6 — Documentation

- [ ] Update `CLAUDE.md`:
  - New role model + scope (project vs global)
  - Multi-tenant data model (project, account, speaker relationships)
  - Recommended SaaS tech additions (subdomain or path routing, tenant isolation, billing)
- [ ] Update prod stack recommendation:
  - Multi-tenancy strategy (single DB + tenant_id column vs schema-per-tenant)
  - Subdomain routing (e.g. `<project>.wirelesspa.com`)
  - Billing (Stripe + tier limits enforcement)
  - Admin API protection (separate auth or super-admin claim)

---

## Phase 7 — Re-test public demo
- [ ] Verify all role flows on ngrok URL
- [ ] Test village.html on actual mobile device
- [ ] Update DEMO ribbon if needed

---

## ❓ Open questions for client (please confirm before coding)

### Roles & permissions
1. **Thai labels** — confirm:
   - admin = "ผู้ดูแลระบบ (vendor)"
   - authority = "ผู้บริหาร" or "นายก/ปลัด"?
   - officer = "เจ้าหน้าที่"
   - head village = "ผู้ใหญ่บ้าน"
2. **Authority's scope** — full operational rights within their project (MP3 upload, scheduler, user mgmt within project, emergency, view log)?
3. **Officer's scope** — broadcast + view log only? Or also MP3 upload/scheduler?
4. **Head Village's scope** — assume:
   - (a) Broadcast to assigned speakers only (not all project speakers)
   - (b) Can fire emergency? (recommend YES — first responder in village)
   - (c) Can use templates? (recommend YES — they may not be tech savvy enough to record)
   - (d) Cannot upload MP3, cannot edit scheduler
   - (e) Sees only their own broadcast history
5. **Multiple head villages per project** — package says "1 head village" but real projects have multiple villages. Is "1" a hard cap or starter, with upgrade options?

### Multi-tenancy
6. **Package tiers** — Basic / Standard / Premium with different limits, or single tier?
7. **Login URL** — single URL with tenant detection, or per-project subdomain (`a.wirelesspa.com`)?
8. **Admin** — single super-admin account, or multiple admins (vendor team)?
9. **Project lifecycle** — what happens when contract expires? Read-only? Disabled? Data deleted after X days?

### Demo
10. OK to make `index.html` a "select role" demo screen with 4 cards (instead of fake login)?

---

## ✋ Recommendations (my view, can override)

1. **Same control panel for authority + officer with conditional rendering** — less code, easier to maintain. Different button visibility based on role.
2. **Separate village.html for head village** — fundamentally different layout (mobile-first big-touch). Don't try to fit it into the desktop control panel.
3. **Admin in its own namespace** — visually distinct (different accent color, sidebar nav instead of top nav) so admins know they're in vendor mode, not operational mode.
4. **Don't show real money/billing UI in prototype** — distracting. Just show "package: Standard · expires 2026-12-31" as text.
5. **For the real build** — go with single Postgres DB + `project_id` column on every table. RLS policies enforce isolation. Cheaper and simpler than schema-per-tenant for this scale.
6. **Demo trick** — top-right "🎭 Switch demo role" dropdown lets the client jump between role views without re-login. Speeds up demo dramatically.

---

## 📦 Estimated effort

| Phase | Effort | Notes |
|---|---|---|
| 1 — Data + role refactor + remove PTT | ~1 hr | Mostly mock data + delete |
| 2 — Head Village mobile UI | ~3 hr | Most design effort here |
| 3 — Admin SaaS area | ~3 hr | 4-5 new pages |
| 4 — Auth/Officer feature flags | ~1 hr | Conditional render in app.html |
| 5 — Existing pages cleanup + nav | ~1.5 hr | Touch every page |
| 6 — Docs | ~30 min | |
| **Total** | **~10 hours** | |
