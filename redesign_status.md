# Redesign Status — "Journey" UI (branch `redesign/journey-ui`)

Re-skin of the v1 Roadmap into the journey/trailhead design. Built in steps,
each committed at its own coherent boundary. Source brief + prototype:
`design_handoff_roadmap_journey/`. This file records step state so it's recorded,
not inferred from the diff.

**Build owner:** Claude (Opus 4.8) · **Review/sync:** human collaborator via chat
**Default direction:** `trailhead` (light). `summit` (dark) + `fieldguide` (warm)
token sets exist in `index.css` but aren't surfaced by a switcher yet.

## Steps

| Step | Scope | State |
|---|---|---|
| 1 | Foundation: tokens + 3 directions (`data-theme`) + role personality (`data-role`), root flip to `.rm`/`.rm-scroll`, filter popover/bottom-sheet, priority dim, error banner | **done** — commit `6694660` |
| 2 | Header + role-tier + subbar re-skin **+ hybrid single-role model** (`selectedRole`/`selectRole`, `effectiveRoleId`, `roleProgress`); `data-role` + visibility now gate on the effective role | **done** — this commit |
| 3+ | Body re-skin: folder cards / route map (replaces the interim unstyled `FoldersRow` tabs), tree station list, Today's Log | **pending** |
| — | Error banner Retry affordance (op-level re-attempt) | deferred to a later step (see `App.tsx`) |

## Step 2 — locked decisions (hold; don't re-decide)

- **Hybrid model:** `effectiveRoleId = selectedRole` if set, else the first
  schedule-active role in `ROLES` order, else `attackers`. `selectedRole` is
  ephemeral (not persisted); `selectRole` **toggles** (clicking the pinned role
  un-pins). Schedule eval (`isRoleActive`/`activeRoleIds`) is intact and still
  drives the default selection.
- **Single source of truth:** `useEffectiveRoleId()` — Header (mood), RolesTier
  (active chip), App (`data-role`), FoldersRow + Tree (visibility) all derive
  from it, so they can't drift.
- **Visibility** gates on `new Set([effectiveRoleId])` in **both** FoldersRow and
  Tree (not the old schedule-active union).
- **`data-role`** emits exactly `attackers`/`midplayers`/`defenders` (CSS tokens).
- **Chip state is binary** (active = effective role, idle = all others). No
  on-duty third state.
- **Override path preserved but unwired:** `cycleRole`/`role_overrides`/
  `isRoleActive` remain in code; the only chip gesture is `selectRole`. Re-expose
  + optional on-duty indicator are logged in `v2_backlog.md`.
- **`badge`/`mood`** are in-code constants on `ROLES` (`types.ts`/`seed.ts`),
  never persisted.

## Step 2 — verification

Verified with a one-shot Playwright harness (trailhead) — **PASS**, 7/7
assertions, 0 console errors. The harness was removed post-run (throwaway, like
the M1 verifier); the durable artifacts are the screenshots in `docs/step2-*.png`.

- (a) on load, no selection → `data-role` = schedule default (`attackers` at the
  test time); `selectedRole === null`.
- (b) `selectRole('defenders')` → `data-role='defenders'`, exactly one
  `.role-chip.active` (Defenders), visible folders swap to Sleep + Fashion.
- (c) `activeRoleIds` still computes — active set logged (proves the schedule/
  override path isn't deleted).
- toggle: re-selecting Defenders un-pins back to the default.

> Interim: the body below the subbar (`FoldersRow` tabs, tree, log) still uses
> pre-redesign classes that became dead CSS in Step 1, so it renders unstyled
> until Step 3+. Header/role-tier/subbar are the Step 2 surface and are complete.
