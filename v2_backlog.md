# v2 Backlog — Roadmap

Items deliberately cut from v1 to keep the first ship surface small. Listed here so they don't get lost.

## Cut from v1 (originally proposed for v1, deferred)

- **Supabase Realtime subscription** — refresh-to-sync is acceptable for solo use. Add when multi-tab edit conflicts start hurting.
- **In-app settings page** — density, accent, per-role rules (start/end/weekend/locations). Hardcoded defaults in code for now.

## Discovered during v1 build (deferred fixes)

- **Reorder while a hiding filter is active** — dragging a task while a hiding
  `where`/`mode` filter is active can land it at an unexpected spot relative to
  hidden siblings (no data loss; hidden rows keep their relative order). Fix =
  disable the drag handle when a hiding filter is active. (Priority/dim filters
  are unaffected — those rows stay in the DOM.)

## Mobile — deferred from M6 (v1 is responsive layout + touch affordances)

- **Touch-drag reorder** — DnD reorder is desktop-only (dnd-kit PointerSensor on
  the ⋮⋮ grip; the grip is hidden on touch). Mobile reordering needs a touch
  sensor (e.g. dnd-kit TouchSensor with an activation delay so it doesn't fight
  scroll) or an explicit move-up/down control. Add/edit/delete are fully
  touch-reachable in v1; only reorder is deferred.

## Today's Log — deferred from M5 (v1 is today-only, add/delete)

- **Edit existing log entries** — v1 is add + delete only.
- **Past-day navigation** — v1 renders `log_date = today` only; no date picker / history view.
- **Per-task log history** and **analytics/totals** (e.g. time-per-tag rollups).

## Out of scope from the original brief

- PWA (manifest, service worker, IndexedDB write queue, offline replay)
- GPS-based location detection (manual switcher only in v1)
- Native iOS / Android shells
- Push notifications on role transitions
- ⌘K command palette / global search
- Streak tracking on `daily-routine` tags
- Weekly schedule heatmap
- User-defined custom context families
- Bulk multi-select task actions
- Font swap and tag-style swap (exploration knobs from the mock's Tweaks panel)
