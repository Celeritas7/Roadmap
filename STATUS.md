# STATUS — Roadmap (Personal Task Manager)

**Last updated:** 2026-05-31
**Phase:** M6 done — M7 next
**Build owner:** Claude (Claude Code, Opus 4.8)
**Review / sync owner:** human collaborator via chat relay

---

## Decisions locked

| Area | Choice | Notes |
|---|---|---|
| Framework | Vite + React + TS | Single-user app, no SSR needed. |
| Persistence | Supabase (project: General_apps) | Tables prefixed `roadmap_`. Schema applied externally. |
| Auth | **None** (single-user mode) | Removed mid-M0 (2026-05-25). RLS disabled on all `roadmap_*` tables; `user_id` defaults at the DB layer; the app never passes `user_id`. |
| Styling | Tailwind 3 + CSS variables | Lattice token set. |
| State | Zustand | Realtime cut from v1. |
| Drag & drop | dnd-kit + integer re-numbering | Within one parent only; cross-parent DnD = v2. See "DnD ordering" below. |
| Visual variant | B · Lattice | Default accent: terracotta `#c96442`. |
| Deployment | Vercel | M7. |
| Sync model | Refresh-to-sync | Realtime deferred to v2. |
| Settings | Hardcoded defaults | In-app settings page deferred to v2. |

## DnD ordering: integer re-numbering (not fractional-indexing)

Single-user, no concurrency, small sibling lists; `position` is already `int`
so no migration is needed. Fractional-indexing's benefits (O(1) writes,
concurrency-safety, huge lists) don't apply here. On reorder, all siblings
under the affected parent are renumbered to contiguous integers (0,1,2,…) and
written via `sync.reorderTasks` as one position-only `UPDATE` per sibling.
(Not upsert: PostgREST upsert is INSERT-on-conflict, which constructs a row
with a NULL `title` and trips the NOT NULL constraint — SQLSTATE 23502 —
before the conflict resolves. A plain `UPDATE` touches only `position`.)
Cross-parent DnD = v2.

## Delete semantics (M4) — Option A: cascade, allow deleting any node

Confirmed against the live DB FKs:
- `roadmap_tasks.parent_id → roadmap_tasks.id` is **ON DELETE CASCADE**, so
  deleting a group removes its whole subtree atomically at the DB — no orphans,
  no app-level recursion needed.
- `roadmap_daily_logs.task_id → roadmap_tasks.id` is **ON DELETE SET NULL**, so
  deleting a task does not fail on its logs; log rows survive with `task_id`
  NULL.

**Decision:** allow deleting any node (task OR group) via the cascade — uses the
schema as designed; the orphan concern is handled at the DB layer. Every delete
is `window.confirm`-gated; the group confirm names the group and states how many
descendant tasks go with it (the real footgun is an accidental subtree wipe).
The store mirrors the cascade in local state — it removes the node **and its
whole subtree** (`subtreeIds` in `lib/tree.ts`) optimistically, and rolls the
**entire subtree** back to the prior snapshot if the DB delete fails.

**Failed-mutation resilience:** a failed write no longer blanks the tree. The
full error screen is shown only on a *load* failure (`error && tree.length===0`);
a failed *mutation* keeps the rolled-back tree rendered and surfaces a dismissible
banner (see `App.tsx`). Proven by an induced-failure test on a group delete
(multi-row subtree restored, no blank).

**M5 note:** because logs survive a task delete with `task_id` NULL, Today's Log
(M5) must render log rows with a NULL `task_id` (orphaned/standalone entries).

## Schema (applied externally — see `supabase/migrations/0001_roadmap_v1_init.sql` for reference SQL)

- `roadmap_tasks` (id, user_id, parent_id self-ref, title, done, kind in ('task','group'), position, expanded, tags text[], created_at, updated_at)
- `roadmap_daily_logs` (id, user_id, task_id nullable, log_date, context, duration_minutes, notes, created_at)
- `roadmap_user_settings` (user_id pk, role_overrides jsonb, custom_rules jsonb, preferences jsonb, updated_at)
- **RLS off. FKs to `auth.users` dropped. `user_id` defaults at the DB layer — the app never sets it on insert/update.**

## v1 scope adds (folded into milestones)

- **Campaign-mode dim** — when a priority-family context tag is active in the filter, non-matching tasks render at opacity 0.3 (dim, not hide). Other tag families keep hide behavior. Folded into M3.
- **Defenders weekend window** — default role rules override Defenders to 09:00–21:00 on weekends (instead of the weekday 21:00–23:00 window). Folded into M1 seed/role-defaults.

## v2 backlog

See `v2_backlog.md`.

## Build order

| | Milestone | State |
|---|---|---|
| M0 | Scaffold (Vite + TS + Tailwind, env, Supabase client) — auth removed; single-user mode, RLS disabled, `user_id` defaults at DB layer | **done** 2026-05-24, auth removed 2026-05-25 |
| M1 | Types + Zustand store + `seed.ts` (INITIAL_TREE seed) + sync round-trip | **done** 2026-05-25 |
| M2 | Static Lattice shell | **done** 2026-05-25 |
| M3 | Role rules + filtering (incl. campaign-mode dim + Defenders weekend) | **done** 2026-05-25 |
| M4 | Tree interactions (toggle, add, edit, delete, DnD reorder) + done-checkbox | **done** 2026-05-31 |
| M5 | Today's Log — quick-log add/delete, today-only, NULL `task_id` handled (editing + date-nav → v2) | **done** 2026-05-31 |
| M6 | Mobile responsive polish — responsive layout, touch affordances, log empty-state (touch-reorder → v2) | **done** 2026-05-31 |
| M7 | Deploy to Vercel + README update | next |

## M1 verification log (2026-05-25)

```
[seed] checking row count…
[seed] empty DB — inserted 34 rows
[fetch] reading all tasks…
[fetch] got 34 rows (9 groups, 25 tasks)
[crud] inserting test task…
[crud] inserted id=72ba0d09-85f9-404b-b088-deefce4e7f08, title="M1 verify — DELETE ME", done=false
[crud] fetching to confirm insert…
[crud] confirmed present: "M1 verify — DELETE ME", done=false
[crud] toggling done → true…
[crud] confirmed toggled: done=true
[crud] deleting test task…
[crud] confirmed gone
[done] verification passed
```

Verification script removed post-run. Seed left the DB populated with the INITIAL_TREE (34 rows); future `seedIfEmpty` calls no-op.

## Reference

- Design brief: `design_handoff_roadmap_task_manager/README.md` (original — partially superseded by schema simplification)
- Canonical visual: `design_handoff_roadmap_task_manager/source/variant-lattice.jsx`
- Legacy data shape (for INITIAL_TREE seed reference): `design_handoff_roadmap_task_manager/source/data.jsx`
- v2 backlog: `v2_backlog.md`
