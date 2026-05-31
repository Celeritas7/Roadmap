# Roadmap

A personal task manager built around a **roles / tier model** and a **three-tag
context system**, so the list you see is scoped to *who you need to be right now*
rather than one flat backlog.

It's a single-user app: cloud-synced (Supabase) so it follows you across devices,
but with no auth, accounts, or multi-tenant machinery.

## The model

**Roles activate by time of day.** Every project belongs to one of three roles,
and a role is "active" only inside its window (with weekend + location overrides):

| Role | Theme | Default window | Notes |
|---|---|---|---|
| **Attackers** | ambitions | 09:00–19:00 | the growth work |
| **Mid-players** | life support | 19:00–21:00 | active all weekend |
| **Defenders** | self-care | 21:00–23:00 | weekends 09:00–21:00 instead |

Only tasks under currently-active roles surface, so mornings show ambitions and
late evenings show wind-down — automatically.

**Three tag families** refine what's shown:

- **where** — `@home` / `@train` / `@office` (location gate)
- **mode** — `@deep-focus` / `@keyboard` / `@audio-only` / `@short-burst`
- **priority** — `@auto-interview` / `@daily-routine`

`where`/`mode` filters **hide** non-matching tasks (AND semantics); a `priority`
filter **dims** non-matching tasks to 0.3 instead of hiding them ("campaign mode"),
so you keep context while focusing.

## Features

- Role-aware, time-of-day task tree with collapsible groups
- Add / rename / complete / delete tasks; drag-to-reorder (desktop)
- Project + context filtering, with the dim-vs-hide split above
- **Today's Log** — quick time-tracking entries (task-linked or general)
- Responsive: mobile gets a filter bottom-sheet, scrollable folders/roles, and
  tap-reachable controls (drag-reorder stays desktop-only — see `v2_backlog.md`)

## Stack

Vite · React 19 · TypeScript · Tailwind 3 · Supabase (Postgres) · Zustand ·
@dnd-kit · date-fns

## Run locally

```bash
git clone <repo-url>
cd Roadmap
npm install

# Supabase credentials (Project Settings → API)
cp .env.example .env.local
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...

npm run dev      # http://localhost:5173
```

The app seeds an initial task tree on first run against an empty database.

Scripts: `npm run dev` · `npm run build` (`tsc --noEmit` then `vite build`) ·
`npm run preview` · `npm run typecheck`.

## Architecture

- **State** — one Zustand store (`src/store/useStore.ts`) holding server-mirrored
  data (`tree`, `log`, `settings`) and client-only state (`filters`, `now`).
  `src/store/sync.ts` is the thin Supabase data layer.
- **Optimistic mutations** — every write applies to local state immediately and
  **rolls back to the prior snapshot on failure**. A failed write surfaces a
  dismissible banner and never blanks the UI; the full error screen is reserved
  for an initial-load failure (`App.tsx` load-vs-mutation split).
- **Selector pipeline** (`src/store/selectors.ts`) — active roles (time + weekend
  + location + overrides) → visible projects → per-task pass/dim, consumed by the
  tree via memoized selectors.
- **Reorder** — integer position re-numbering within a parent (not fractional
  indexing); see `STATUS.md` for the rationale.

### Schema (`roadmap_*` tables, applied externally)

- `roadmap_tasks` — self-referential `parent_id` with **`ON DELETE CASCADE`**, so
  deleting a group removes its whole subtree atomically (no orphans).
- `roadmap_daily_logs` — `task_id` FK with **`ON DELETE SET NULL`**, so deleting a
  task keeps its log entries (they become general/unlinked).
- `roadmap_user_settings` — role overrides + preferences.

## Honest notes / known tradeoffs

- **No auth; RLS is disabled.** This is a deliberate single-user v1 choice: the
  database has no row-level security, foreign keys to `auth.users` are dropped,
  and `user_id` is filled by a DB default — the app never sends it.
- **Because RLS is off, the `anon` key in the client bundle is not a security
  boundary.** Anyone with the URL + anon key can read/write the `roadmap_*`
  tables. That's an accepted tradeoff for a personal, single-user deployment; it
  would need RLS + auth before becoming multi-user. (Standard Supabase guidance is
  the opposite — there the anon key is safe *because* RLS gates access.)
- Deferred items (touch-drag reorder, log editing/history, realtime sync,
  in-app settings, etc.) are tracked in [`v2_backlog.md`](./v2_backlog.md).
- Build/milestone state lives in [`STATUS.md`](./STATUS.md).
