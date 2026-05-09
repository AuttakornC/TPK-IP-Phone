---
name: tpk-workflow
description: Use when given any non-trivial task (2+ steps) in the TPK Wireless PA project — features, bug fixes, refactors, UI changes, or anything touching multiple files. Skip for trivial single-line edits and pure questions.
---

# TPK Wireless PA — Iteration Loop

## Overview

Five-step loop for delivering changes to the TPK Wireless PA codebase. Each step has a checkpoint — do not skip ahead. The discipline exists because this is a Thai-first prototype shown to a real client; silent assumptions and untested UI both burn trust.

## The Loop

```
1. ask/clarify  →  2. plan  →  3. implement  →  4. test  →  5. review
```

## Quick Reference

| Step | Tool | Done when |
|---|---|---|
| 1. ask/clarify | `AskUserQuestion` (batched, 1–4 Qs) | Scope, role(s) affected, and Thai/EN copy decisions are explicit |
| 2. plan | Short text plan + `TodoWrite` | Files + ordered steps listed; user has had a chance to redirect |
| 3. implement | `Edit` / `Write` (prefer `Edit`) | Code compiles; no orphan imports; messages added to **both** `messages/th.json` and `messages/en.json` |
| 4. test | Chrome DevTools MCP | Affected page rendered in browser; no hydration error; no red console; the role flow actually works |
| 5. review | Read changed files + `git diff` | Re-read your own diff; confirm no leftover mock/console.log; report what changed and what's still pending |

## Step 1 — ask/clarify

Before touching code, surface anything that's ambiguous. Batch related questions into a single `AskUserQuestion` call (1–4 questions). Defaults to ask about for this project:

- **Which role(s)** does this affect? (`admin` / `authority` / `officer` / `headVillage`)
- **Which surface?** Project user pages (`AppHeader`-wrapped) vs admin pages (`AdminShell`-wrapped) — they look totally different.
- **Thai copy** — write the Thai string yourself, or get it from the user?
- **Mock vs DB** — does this need a Prisma migration / seed update, or is mock-only fine?

If the answer is genuinely obvious from context (Auto mode is on), state your assumption and proceed. Don't manufacture questions for trivial work.

## Step 2 — plan

A plan here is **3–8 bullets**, not a doc. Include:

- Files you'll touch (with paths)
- Order of changes
- Any migration / seed implications
- What "done" looks like for step 4

Use `TodoWrite` for plans with 3+ steps so progress is visible. For 2-step jobs, a sentence is enough.

## Step 3 — implement

- **Prefer `Edit` over `Write`** — never rewrite a whole file for a small change.
- **No raw HTML injection** (`dangerouslySetInnerHTML` and friends) — a pre-write hook blocks it. Use JSX or `textContent`.
- **Both locales** — every new key goes in `messages/th.json` AND `messages/en.json`. Thai first.
- **Use `@/generated/prisma`** for Prisma imports, not `@prisma/client`.
- **Use `@/i18n/navigation`** for `Link`, `redirect`, `useRouter` — not `next/link` / `next/navigation`.
- **Don't read `localStorage` during render** in client components — wrap in `useEffect`. (Otherwise SSR will hydrate-mismatch — see the ZoneTabs fix in `src/app/[locale]/app/page.tsx`.)
- Mark each `TodoWrite` item completed as you finish it, not in a batch at the end.

## Step 4 — test

**Browser walk-through is mandatory** for any UI change. Use the Chrome DevTools MCP:

1. Confirm the dev server is up (`tail /tmp/tpk-dev.log` or curl `http://localhost:3000`).
2. `mcp__plugin_chrome-devtools-mcp__new_page` (or `navigate_page`) to the affected route — remember locale prefix: `/th/...`.
3. If the change is role-scoped, set the demo identity in `localStorage` first via `evaluate_script`:
   ```js
   localStorage.setItem('paRole', 'authority');
   localStorage.setItem('paUsername', 'somphong');
   ```
   …then reload. (Admin uses next-auth instead — sign in at `/th/admin/login` with `admin` / `demo1234`.)
4. `take_snapshot` for the DOM, `list_console_messages` for errors, `take_screenshot` if visual.
5. Click through the actual flow — don't just load the page. Hydration errors only show after interaction sometimes.

If you can't run the browser test for some reason, **say so explicitly** in your reply. Don't claim "it works" from a curl 200 — that won't catch hydration mismatches or broken handlers.

## Step 5 — review

Before declaring done:

- `git status` + `git diff` — read your own changes.
- Look for leftover `console.log`, dead imports, TODO comments you added.
- Check whether `CLAUDE.md` or `todo.md` need an update.
- Report: **what changed** (file paths with line numbers), **what's verified**, **what's still open**.

## Common mistakes

| Mistake | Why it bites |
|---|---|
| Skipping step 1, assuming Thai vs English copy | Client expects Thai; English-only strings break the demo. |
| Skipping step 4 because "it compiled" | Hydration errors and broken `localStorage` reads compile fine. |
| Reading `localStorage` directly in render | SSR returns null → client returns real value → hydration mismatch. |
| Using `next/link` instead of `@/i18n/navigation` | Loses locale prefix, breaks deep-linking on `/en` side. |
| Forgetting `messages/en.json` | EN locale shows raw `xxx.yyy` keys instead of text. |
| Long file rewrites via `Write` | Hard to review in `git diff`; prefer `Edit`. |
| Reporting success after a curl 200 | 200 ≠ working UI. The browser walk-through is the test. |

## When NOT to use this skill

- Single-line typo fixes
- Pure questions ("what does X do?")
- Read-only exploration / git log queries
- Doc-only edits to README/CLAUDE.md (these get a lighter ask → write → review)
