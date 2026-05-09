# Wireless PA — TPK IP Phone

Multi-tenant SaaS prototype for managing wireless PA (public address) systems sold as **packages** to municipalities. Vendor (admin) creates projects, assigns user accounts and speakers; each project has 1 authority + 1 officer + 1+ head villages.

> See [CLAUDE.md](CLAUDE.md) for the architecture, file layout, conventions, and demo flow. New contributors should start there.

## Quick start

```bash
cp .env.example .env          # fill DATABASE_URL, NEXTAUTH_SECRET
docker compose up -d db       # or run your own Postgres on port 5432/5433
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev                      # http://localhost:3000
```

Or full Docker stack: `docker compose up`.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind v4 |
| i18n | next-intl (Thai default + English) |
| Auth | next-auth v4 |
| DB | PostgreSQL + Prisma 7 |

## Workflow (trunk-based + PRs)

This repo follows **short-lived feature branches → PR → review → merge to `main`**. Direct pushes to `main` are discouraged once branch protection is on.

1. Branch from `main`: `git switch -c feat/<short-name>`
2. Implement using the [tpk-workflow skill](.claude/skills/tpk-workflow/SKILL.md): ask/clarify → plan → implement → test → review
3. Push and open a PR
4. CI runs (see below). Address failures.
5. Merge once green

## CI

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on every PR to `main` and every push to `main`:

- `pnpm install --frozen-lockfile`
- `pnpm db:generate` (Prisma types)
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`

Build runs with placeholder env vars — `output: 'standalone'` means no DB needed at build time.

## Vercel preview deploys

Recommended setup for visual review on every PR.

### One-time setup (Vercel dashboard)

1. Sign in at [vercel.com](https://vercel.com) with the GitHub account that owns the repo.
2. **Add New → Project → Import Git Repository → `AuttakornC/TPK-IP-Phone`**.
3. Framework Preset: **Next.js** (auto-detected). Build/Install commands: leave defaults (Vercel detects `pnpm`).
4. **Environment Variables**: add for both **Preview** and **Production** environments:
   - `DATABASE_URL` — connection string for a Postgres reachable from Vercel. Easiest is a free tier from the Vercel Marketplace (Neon or Supabase) — installing one auto-injects this var.
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`. Use one secret for Preview, a different one for Production.
   - `NEXTAUTH_URL` — leave **unset** on Vercel; the framework reads `VERCEL_URL` automatically for previews. Set it explicitly only for Production once you have a custom domain.
   - `DEMO_LOGIN_PASSWORD` — `demo1234` (or whatever you want the demo password to be).
5. **Deploy**. The first deploy from `main` becomes Production.

After this:

- Every PR auto-builds a Preview at `https://tpk-ip-phone-git-<branch-slug>-<account>.vercel.app`. The bot comments the URL on the PR.
- Every push to `main` redeploys Production.

### Preview database options

Pick one based on how much isolation you want between previews and dev:

| Option | Setup time | Isolation | Cost |
|---|---|---|---|
| **Share dev DB** (point Preview `DATABASE_URL` at your local-tunnel or shared Postgres) | 1 min | None — all previews mutate the same data | Free |
| **Vercel Marketplace Neon** (one provisioned DB across all previews) | 5 min | All previews share one DB; resets if you re-seed | Free tier |
| **Neon branching** (per-PR ephemeral DBs) | 30 min — needs a webhook/script to provision a Neon branch per preview deployment and inject its URL | Full | Free tier covers small projects |

For client demos, the middle option is the sweet spot. Re-run `pnpm db:seed` against the preview DB once to populate it.

### Local install of the Vercel CLI (optional)

Useful for `vercel env pull`, manual deploys, and log streaming:

```bash
npm i -g vercel
vercel link               # link this directory to the Vercel project
vercel env pull           # writes .env.local with the Vercel-managed env vars
vercel deploy             # manual deploy (preview)
vercel deploy --prod      # manual deploy (production)
vercel logs               # stream logs from the latest deployment
```

## Demo

Currently shared via ngrok at the URL printed in the chat. To re-share:

```bash
pnpm dev                  # or docker compose up
ngrok http 3000
```

Once Vercel previews are live, the ngrok step is mostly obsolete.
