# Handoff: Roadmap — "Journey" UI Redesign

## Overview

This is a complete visual redesign of the **Roadmap** personal task manager. The
data model, information architecture, and interactions are **unchanged** — only
the visual layer is new. The redesign reframes the product around its name: every
folder is a **journey down a road**, tasks are **stops** along it, and progress is
literally a route being travelled toward a **destination** (the folder's goal).

It ships **three switchable visual directions** and a **per-tier personality
system** layered on top of them.

The current app is the light "lattice" build (`src/index.css` + `src/features/*`).
This redesign replaces that visual layer.

---

## About the Design Files

The files in `source/` are **design references built in HTML/React-via-Babel** —
a working prototype that demonstrates the intended look, motion, and behavior.
**They are not meant to be dropped into the app as-is.** The task is to **recreate
these designs inside the existing codebase** (React 19 + TypeScript + Tailwind 3 +
Vite), reusing its established patterns:

- Keep the existing data layer (`src/types.ts`, `src/seed.ts`, `src/store/*`,
  `src/hooks/*`, Supabase) — **do not change the schema or queries.**
- Re-skin the existing feature components in `src/features/*` to match the new look.
- Port the design tokens into `tailwind.config.ts` + `src/index.css` (CSS variables).

The prototype uses plain CSS variables and class names; the mapping to Tailwind is
spelled out under **Design Tokens** below. You can implement either with Tailwind
utility classes driven by the token theme, or by keeping a small hand-written CSS
layer (as the prototype does) — the team's call. The prototype's CSS
(`source/styles.css`, `source/styles-app.css`) is production-quality and can be
adapted nearly verbatim into `src/index.css`.

### What is showcase-only (do NOT port)

`source/app.jsx` contains a **showcase shell** (the dark toolbar, the direction
tabs, the desktop browser frame + iPhone frame, the "States" menu, fit-to-screen
scaling). That exists only to present the three directions side-by-side for review.
**None of that chrome belongs in the real app.** What you port from `app.jsx` is the
**`RoadmapApp` component's internal structure** (header → role tier → subbar →
body → log) and its state wiring.

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, shadows, and motion are final
and exact. Recreate pixel-accurately using the codebase's stack. Exact values are in
`source/styles.css` and `source/styles-app.css`; the key ones are tabulated below.

---

## The System (read this first)

Two independent axes compose:

1. **Direction** (`data-theme` on the root): the overall aesthetic. Three options:
   - **`trailhead`** — clean & light. Off-white canvas, blue accent, route-line energy.
   - **`summit`** — dark "tactical board." Near-black canvas with a faint pitch grid
     and a colored top-glow, brighter accents, an ascent feel.
   - **`fieldguide`** — warm editorial. Paper canvas, **Instrument Serif** display
     type, rounded/circular markers, an expedition-journal feel.
   Pick one as the app default (recommend `trailhead`); the others can be a setting.

2. **Role personality** (`data-role` on the root): the active tier washes the whole
   UI in its color and changes the mood. Layers on top of any direction.
   - **`attackers`** (ambitions) — hue **18** (warm orange). Mood: "Push your ambitions forward."
   - **`midplayers`** (life support) — hue **158** (green). Mood: "Keep the engine running."
   - **`defenders`** (self-care) — hue **252** (indigo). Mood: "Guard your base."

Both are just attributes on the app root that flip CSS-variable values. Everything
else (accent color, canvas tint, daypart pill, buttons, "you are here", labels)
reads from those variables and updates automatically.

---

## Design Tokens

### Fonts (Google Fonts)

```
Space Grotesk      → display / headings (trailhead + summit)
Hanken Grotesk     → UI / body (all directions)
Instrument Serif   → display / headings (fieldguide only)
JetBrains Mono     → metadata, counts, tags, kbd
```
Load weights: Space Grotesk 400–700, Hanken 400–700, Instrument Serif 400 + italic,
JetBrains Mono 400–600.

Tailwind `fontFamily` extension:
```ts
fontFamily: {
  display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
  serif:   ['"Instrument Serif"', 'Georgia', 'serif'], // fieldguide display
  sans:    ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
  mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
}
```

### Base color tokens per direction (CSS variables on the root)

These are the canonical values. Drive Tailwind colors from `var(--token)` (as the
current `tailwind.config.ts` already does for `bg`, `ink`, etc.) and set the
variable sets per `[data-theme]`.

**Trailhead (light)**
```
--canvas:#fbfbf9  --panel:#fff  --panel-2:#f6f6f3
--ink:#16181d  --ink-2:#565a63  --ink-3:#9a9ea7  --ink-4:#c6c9d0
--rule:#ecece8  --rule-strong:#dedfda  --hover:rgba(20,22,28,.04)
--accent:#3b6ef0  --accent-soft:#eaf0fe  --accent-ink:#2452cc  --on-accent:#fff
shadow-card: 0 1px 2px rgba(16,18,29,.04), 0 4px 16px rgba(16,18,29,.04)
shadow-pop:  0 12px 40px rgba(16,18,29,.14), 0 0 0 1px rgba(16,18,29,.05)
```

**Summit (dark)**
```
--canvas:#0a0c10  --panel:#14171e  --panel-2:#1b1f28
--ink:#eef1f7  --ink-2:#a4abba  --ink-3:#6b7280  --ink-4:#444b57
--rule:#232834  --rule-strong:#2f3542  --hover:rgba(255,255,255,.045)
--accent:#5b8cff  --accent-soft:rgba(91,140,255,.14)  --accent-ink:#9db8ff  --on-accent:#08111f
+ a fixed ::before layer: radial top-glow (role-hued) + 40px faint grid
```

**Field Guide (warm)**
```
--canvas:#f3ede1  --panel:#faf6ec  --panel-2:#f1ead9
--ink:#211c14  --ink-2:#5e564a  --ink-3:#9b9384  --ink-4:#c4bba8
--rule:#e3dac6  --rule-strong:#d2c6ac  --hover:rgba(33,28,20,.04)
--accent:#2f64df  --accent-soft:#e4ebfb  --accent-ink:#244fb3  --on-accent:#fff
```

### Role personality overrides (apply on top of direction)

Each role sets `--role-h` (a hue) and re-derives the accent + a canvas wash:
```
attackers  --role-h:18    midplayers --role-h:158   defenders --role-h:252

[data-role] {
  --accent:      hsl(var(--role-h) 62% 50%);
  --accent-soft: hsl(var(--role-h) 62% 55% / .12);
  --accent-ink:  hsl(var(--role-h) 52% 40%);
  background-image: radial-gradient(135% 62% at 50% -8%, hsl(var(--role-h) 65% 52% / .14), transparent 60%);
}
```
Per-direction tuning (exact in `source/styles.css`, section "ROLE PERSONALITY"):
- Trailhead canvases: attackers `#fcf7f3`, midplayers `#f4faf6`, defenders `#f4f6fd`.
- Field Guide canvases: `#f5ecdd` / `#edf1e2` / `#eaedf3`; accent darker (`hsl(h 52% 44%)`).
- Summit: accent brighter (`hsl(h 74% 66%)`); base canvas nudged
  (`#110c0a` / `#090f0c` / `#0a0b13`); the top-glow uses `--role-h`.

### Per-phase color (inside a folder's route)

Each phase (chapter/group) within a folder gets its own hue so legs of the road are
visually distinct. Offsets from the folder's base hue, cycled by phase index:
```
PHASE_OFFSET = [0, 132, 256, 64, 196, 320]
phaseHue(baseHue, i) = (baseHue + PHASE_OFFSET[i % 6]) % 360
```
The phase hue is set as `--h` on each row in that phase; nodes, road segments,
waypoint badge, and book chapter dots all read `hsl(var(--h) …)`.

### Folder (project) identity hues

From `src/seed.ts` PROJECTS — keep as-is, used for folder cards & project chips:
`dx:18  fullstack:220  lang:138  visa:200  food:38  exercise:165  sleep:250  fashion:320`.

### Spacing / radius / misc
```
radius: cards 14px (fieldguide 4px), small 9px, chips 5–8px, pills 7px
row min-height: route stop 56px; task ~46px; role chip ~48px
road rail width: 52px desktop / 48px mobile
content padding: 28px desktop / 16px mobile; bottom 96–120px
font sizes: titles 13.5–16px, body 13.5px, meta/mono 10–11.5px, mood 12px,
            slide nothing below 12px
transitions: .12–.16s on hover/state; .4–.5s cubic-bezier(.4,0,.1,1) on progress widths
```

---

## Screens / Views & Component Mapping

The app is one screen with two body states (Focus grid ⇄ expanded Route map),
plus an overlay (Filter) and a panel (Today's Log). Map onto existing
`src/features/*`:

### 1. Header — `features/header/Header.tsx`
- Left: wordmark **"Roadmap"** (display font; serif in fieldguide) + a small route
  glyph (inline SVG: two dots joined by a dotted curve) + `⌘K to jump` (mono, hidden
  on mobile) + the **mood tagline** (`RM.ROLES[active].mood`, italic, role-hued,
  desktop-only).
- Right: date pill (`Sun · May 31`, mono, bordered) + `Week 22` (mono, hidden mobile).
- Sticky, with `backdrop-filter: blur(14px)` over a translucent canvas.

### 2. Role tier — `features/roles-tier/RolesTier.tsx`, `RoleChip.tsx`, `DaypartPill.tsx`
- Daypart pill: glyph in an `--accent-soft` rounded square + "Afternoon / 2:00 PM".
- Three role chips: a mono "FWD/MID/DEF" badge (role-hued), name + subtitle, and a
  `done/total` mini-count (hidden mobile). Active chip gets a role-hued ring + soft
  bg. **Clicking a chip sets the active role** (and on mobile the row horizontally
  scrolls). Selecting a role sets `data-role` on the app root → the whole UI retints.

### 3. Subbar
- Left: view title. In Focus view: "Focus / {RoleLabel}". In expanded view: a back
  button (←) + folder name + "/ {RoleLabel}" crumb.
- Right: **Filter** button (mono, shows active-count badge, turns accent when active)
  + **Clear**.

### 4. Focus view (default body) — replaces `features/folders/FoldersRow.tsx`
A responsive grid of **folder cards** (2-col desktop, 1-col mobile), one per project
in the active role.
Each card (`FolderCard`):
- Header: mono monogram icon (folder-hued), folder name (display), `short · N stops`,
  and a `done/total` count (mono).
- A **route track**: one tiny station segment per task (filled = done, pulsing =
  next), above a thin progress fill bar.
- A pinned **NEXT STOP** panel (dashed): label, the first incomplete task's title,
  its project chip(s); for a book it shows "next chapter" + `done/total ch`.
- Footer: "N remaining" + "View all N →" (accent). **Click opens the expanded route.**
- Left edge accent bar in folder hue (fieldguide: top border + circular icon instead).

### 5. Expanded **Route Map** (primary) — replaces `features/tree/Tree.tsx` + `Group.tsx` + `TaskRow.tsx`
This is the centerpiece. A folder opens into a **winding paved road** running top→bottom:

- **Route summary header** (`route-head`): "`{done}` of `{total}` stops cleared",
  overall `%`, a **segmented journey bar** (one colored segment per phase, each
  filled by its own progress), a **Destination · {goal}** line + "`N stops to go`",
  and a **legend** of clickable phase chips (dot + name + count). **Clicking a legend
  chip scrolls to that phase and expands it.**
- **Departure** marker (gray node, "where the route begins").
- For each phase: a **waypoint** marker — a numbered (01, 02…) rounded badge on the
  road + a phase band (phase-hued tint with a colored left edge + a divider rule
  above). Click toggles collapse. Shows `done/total` + chevron.
- **Stops** (tasks): each is a row of `[road rail | body]`.
  - The rail draws an SVG **road segment** that weaves left↔right between rows
    (entry/exit x alternate by row index → continuous S-curve), with three stacked
    strokes: edge (darker), base (asphalt / phase-hue when travelled), and a dashed
    center **lane line**. Travelled portion (up to & including the current stop) is
    painted in the phase hue; the road ahead is grey (`--road`/`--road-edge`/`--lane`
    tokens, defined per theme).
  - The **station node** is the checkbox: hollow ring = todo, filled + check = done,
    pulsing ring + "you are here" label = the next incomplete task.
  - Body: title (double-click to rename; ellipsis), project chips + context chips
    (chips hidden on mobile except project chips), and row actions (✎ rename, ✕
    delete) — hover-reveal on desktop, always visible on mobile.
- **Book stops** (`kind:'book'`): a stop whose node opens a **sub-route of chapters**.
  Shows a `▤` glyph, an inline mini-route of chapter dots + `done/total ch read`, a
  caret; expanding reveals a chapter checklist (indented, own connector line). The
  book counts as one stop in the parent route and is "done" only when all chapters are.
- **Add a stop**: a dashed `+` node + inline input, per phase.
- **Destination** marker at the end: a flag node + the goal; switches to a celebratory
  "Destination reached" state when the route is complete.

Exact geometry, the weave path math, and all node states are in
`source/components.jsx` (`RoadSeg`, `StopRow`, `BookRow`, `Tree`) and
`source/styles-app.css` (section "ROUTE MAP").

### 6. Filter — `features/folders/FilterPopover.tsx`
Three tag families (Where / Mode / Priority). **Where & Mode HIDE non-matching
tasks; Priority DIMS them to ~30% opacity** (kept on screen). Desktop = popover
anchored under the Filter button; mobile = bottom sheet (slides from bottom inside
the viewport, with backdrop). Each family is labeled with its behavior
("hides others" / "dims others"). Footer: active count + "Clear all".

### 7. Today's Log — `features/log/TodaysLog.tsx`
Lightweight, today-only. Mono "TODAY'S LOG" + date. Rows: tick + title + `@where` +
`Nm` duration + hover delete. Quick-add expands to: text + where `<select>` +
minutes + "Log it". Friendly empty state when nothing logged.

### 8. System states — `features/tree/EmptyState.tsx` (+ new)
- **Loading**: skeleton folder cards (shimmer).
- **Empty folder**: "This folder's a clean slate" + CTA.
- **All done**: "Every stop cleared" (green check) + back.
- **Error**: dismissible inline banner ("Couldn't save… you're offline. Edits kept
  locally."), retry/dismiss — must NOT blank the tree (matches current optimistic-
  write behavior).

### Cross-project / linked stops (NEW capability)
A task tagged with **more than one project** (`projects: ['dx','exercise']`) appears
in **both** folders' routes. When it surfaces under a folder it isn't "native" to,
mark it: a dashed station node + a `↗ {OtherProject}` link chip. The prototype seeds
two such "Cross-training · with Exercise" stops in the DX route that are shared with
the Exercise folder. Mechanism: just multi-tag the task and give it a `chapter`; the
route groups by chapter as usual. (Optional `linkedFrom` field drives the ↗ chip.)

---

## Interactions & Behavior

- **Switch role** → re-tints UI (`data-role`), swaps visible folders, resets to Focus.
- **Open folder** (card click / View all) → expanded route; **back** returns to Focus.
- **Toggle stop** (click node) → optimistic done flip; route fill + "you are here"
  advance to the next incomplete stop. Book node toggles all its chapters.
- **Toggle chapter** (inside a book) → updates the book's chapter progress; book
  becomes done when all chapters are read.
- **Collapse/expand phase** (waypoint click). **Legend chip** → scroll to + expand phase.
- **Rename**: double-click a stop (desktop) or ✎ (always on mobile). **Delete**: ✕.
- **Add stop**: inline per phase. **Filter**: hide (Where/Mode) / dim (Priority).
- **Quick-log** in Today's Log.
- **Motion**: progress widths animate `.4–.5s`; the "you are here" node pulses
  (`nodePulse`, 1.9s). Note: avoid relying on entrance animations for resting
  visibility (keep final state correct without the animation running).

---

## State Management

Reuse the existing store/hooks (Supabase-backed tasks, logs, settings). The redesign
adds only **view state** (client-only, not persisted to the schema):

- `activeRole: 'attackers' | 'midplayers' | 'defenders'` (one active at a time).
- `openProjectId: string | null` (Focus grid vs expanded route).
- `collapsedPhases: Record<string, boolean>` (per-phase collapse in a route).
- `filters` (existing) — Where/Mode hide, Priority dims.
- `direction: 'trailhead' | 'summit' | 'fieldguide'` — app-level theme; persist in
  `roadmap_user_settings.preferences` (there's already an `accent`/`density` pattern
  there) or localStorage.
- Existing mutations (toggle, add, edit, delete, log) are unchanged — the new node/
  chapter/book toggles map onto them. "Book read" = set all child chapters done.

The "phase hue" and "travelled/next" computations are pure derived values from the
task list (see `Tree` in `source/components.jsx`) — no new persisted data.

---

## Responsive (mobile ≤ 768px)

Drive responsiveness off an explicit breakpoint in the real app (normal media
queries / Tailwind `md:` — the prototype uses a `data-vp` attribute only because it
renders desktop + mobile frames in one window; you do NOT need that).
- Role tier & folder area: horizontal scroll, no wrap.
- Focus grid → single column.
- Filter → bottom sheet.
- Task rows: **context chips hidden, project chips kept**; row actions always visible.
- Mood tagline, `⌘K` hint, `Week NN` hidden.
- Road rail narrows 52 → 48px.

---

## Design Tokens — quick reference

See **Design Tokens** above and the authoritative source in `source/styles.css`
(`:root`/`[data-theme]`/`[data-role]` blocks) and `source/styles-app.css`
(components, road, chips, states). Road surface tokens:
```
trailhead  --road:#d4d7d1  --road-edge:#c3c7c0  --lane:#fff
summit     --road:#2b323f  --road-edge:#39414f  --lane:rgba(170,190,230,.5)
fieldguide --road:#dccfb2  --road-edge:#cbbd9b  --lane:#fcf8ef
travelled road = hsl(phaseHue 58% 52%), edge hsl(h 48% 40%), lane hsl(h 78% 90%)
```

## Assets
No external image assets. All icons are inline SVG strokes (chevrons, filter, back,
plus, edit, trash, route glyph). Project monograms are text. The flag/markers are
text glyphs (⚐ ⚑ ▤). Keep using inline SVG / your icon lib in the app.

## Files (in `source/`)
- `Roadmap Redesign.html` — entry; loads fonts + the four scripts; mounts the showcase.
- `styles.css` — base tokens, the three directions, **role personality**, header,
  role tier, subbar.
- `styles-app.css` — focus cards, **route map / road**, chips, filter, log, states.
- `data.js` — roles, projects (with `goal`), context families, the seeded task tree
  (incl. books with chapters + the shared cross-training stops), helpers
  (`isDone`, `bookProgress`, `phase` grouping, daypart). Mirrors your
  `src/types.ts` + `src/seed.ts`; use your real data, this is reference shape.
- `components.jsx` — all UI components (the parts to recreate): `RoleTier`,
  `FolderCard`, `Route`, `Tree` (route map), `StopRow`, `BookRow`, `RoadSeg`,
  `FilterPanel`, `TodaysLog`, system states, chips, icons.
- `app.jsx` — `RoadmapApp` (the real app structure + view-state wiring) **plus** a
  showcase shell (toolbar, device frames, States menu) that is **reference-only**.

## Suggested implementation order
1. Tokens: fonts + `[data-theme]` variable sets into `tailwind.config.ts` + `index.css`.
2. Header, role tier (+ `data-role` personality), subbar.
3. Focus folder cards (route track + next-stop).
4. The Route Map (waypoints, stops, road `RoadSeg`, nodes) — the biggest piece.
5. Books, cross-project linked stops, filter, log, system states.
6. Direction switch + role personality polish; responsive pass.
