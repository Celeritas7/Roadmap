# Handoff: Roadmap — Personal Task Manager with Role-Gated Folders

## Overview

A personal task manager organized around three layers of life — **roles → folders → tasks** — with time-, location-, and rule-based folder visibility so the app automatically narrows what's on screen to what's appropriate for the current moment.

The novel idea: rather than a flat task list, you triage your life into three roles —

- **Attackers** — ambitions / career-building work (e.g. DX Engineer, Fullstack, Languages, Visa)
- **Mid-players** — life support (e.g. Food, Exercise)
- **Defenders** — self-care (e.g. Sleep, Fashion)

Each role has rules (active hours, weekend behavior, allowed locations). When a role is muted (manually or by rule), its folders fade out and its tasks vanish — so during work hours you only see Attackers; in the evening Mid-players + Defenders take over.

Solo use, sync across laptop + phone.

---

## About the Design Files

The HTML/JSX files in this bundle are **design references**, not production code to copy directly. They were prototyped in plain React + Babel (no build step) inside an HTML canvas. Your task is to **recreate them in a real codebase** using the recommended stack below — keeping the visual fidelity, but rebuilding the data layer, state, persistence, and sync properly.

Three visual variants were explored (Editorial, Lattice, Org Paper). **Pick one to ship** — the user's preference will be clarified during handoff, but a sensible default is **Lattice** for production (it's the densest, most Linear/Geist-like, and scales best to mobile). All three reuse the same data model and interactions, so swapping is purely a CSS/component-style change.

---

## Fidelity

**High-fidelity** for layout, typography, spacing, colors, and interactions. Recreate pixel-close in the target codebase. The HTML uses Geist / Newsreader / JetBrains Mono via Google Fonts — keep those or substitute equivalents your codebase already loads.

---

## Recommended Stack

| Concern | Pick | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | RSC for fast loads, PWA-ready, deploys free to Vercel |
| Hosting | **Vercel** | Zero-config Next.js, free for solo use |
| Database + Auth + Sync | **Supabase** | Postgres + Row-Level Security + Realtime + Auth in one. Free tier covers solo use indefinitely. Realtime subscriptions handle multi-device sync automatically. |
| Auth method | **Supabase Auth — Magic Link or Google OAuth** | Solo user, no password to forget |
| Styling | **Tailwind CSS + CSS variables for theming** | Variants use CSS custom properties heavily — keep that pattern |
| State | **Zustand** + **Supabase Realtime subscription** | Local-first feel, cloud-synced |
| Drag & Drop | **dnd-kit** | Accessible, works on touch + mouse |
| Offline / PWA | **next-pwa** + service worker + IndexedDB write queue | Works on the train (a stated use case) |
| Mobile install | **PWA installed to home screen** | Native feel without app store |
| Typography | Geist (sans + mono), Newsreader (serif), JetBrains Mono | Already used in mock |

---

## Data Model

### Tables (Supabase / Postgres)

```sql
-- Single-user app, but RLS on user_id keeps things clean and ready for sharing later.

create table roles (
  id text primary key,            -- 'attackers' | 'midplayers' | 'defenders'
  user_id uuid references auth.users not null,
  label text not null,
  subtitle text,
  hue int,                        -- HSL hue for tinting
  default_start int not null,     -- 0–23
  default_end int not null,       -- 0–23 (wraps midnight if start > end)
  weekend_active bool default false,
  allowed_locations text[] default '{}'::text[],  -- e.g. {'home','office'}
  sort_order int default 0,
  created_at timestamptz default now()
);

create table projects (
  id text primary key,            -- slug, e.g. 'dx', 'food', 'sleep'
  user_id uuid references auth.users not null,
  role_id text references roles not null,
  label text not null,
  short_label text,
  hue int,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table contexts (
  id text primary key,            -- slug, e.g. 'home', 'keyboard'
  user_id uuid references auth.users not null,
  family text not null check (family in ('where','mode','priority','custom')),
  label text not null,            -- e.g. '@home'
  sort_order int default 0
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  parent_group_id uuid references groups,  -- null = top-level
  title text not null,
  expanded bool default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  group_id uuid references groups not null,
  title text not null,
  done bool default false,
  sort_order int default 0,
  -- many-to-many: a task can have multiple project tags + context tags
  -- store as text[] for simplicity; a join table is overkill for solo use
  tags text[] default '{}'::text[],   -- mix of project ids and context ids
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table task_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  context_id text references contexts,
  duration text,                  -- '15 min', '30 min'…
  task_id uuid references tasks,  -- nullable; quick-log entries have no task
  logged_at timestamptz default now()
);

create table role_overrides (
  -- transient manual overrides set by clicking a role chip.
  -- Storing them server-side lets overrides sync across devices.
  user_id uuid references auth.users not null,
  role_id text references roles not null,
  state text not null check (state in ('auto','on','off')),
  set_at timestamptz default now(),
  primary key (user_id, role_id)
);

-- RLS for every table:
alter table roles enable row level security;
create policy "own roles" on roles for all using (auth.uid() = user_id);
-- (repeat for every table)
```

### Seed data on first sign-in

When a new user signs in, seed defaults:

**Roles**
| id | label | subtitle | hue | start | end | weekend | locations |
|---|---|---|---|---|---|---|---|
| attackers | Attackers | ambitions | 18 | 9 | 19 | false | {home,office,train} |
| midplayers | Mid-players | life support | 158 | 19 | 21 | true | {home,office} |
| defenders | Defenders | self-care | 252 | 21 | 23 | true | {home} |

**Projects (folders)** — see `data.jsx` for the canonical list (8 projects across the 3 roles).

**Contexts** — see `data.jsx` `CONTEXTS` constant (3 where, 4 mode, 2 priority).

**Sample tree** — optional, but the mock includes a realistic seed in `INITIAL_TREE`. Use it for first-run delight.

---

## Screens / Views

### 1. Main screen (this is the only screen for v1)

Top-to-bottom layout, scrollable, single column:

```
┌─────────────────────────────────────────────────────────┐
│  Roadmap                              Sat, May 23      │  ← header
│                                       Week 21 · 2026   │
├─────────────────────────────────────────────────────────┤
│  🌆 evening   8:00 PM · weekend                         │  ← roles tier
│  ● Attackers ambitions  ● Mid-players life support      │     (active/muted)
│  ○ Defenders self-care                                  │
├─────────────────────────────────────────────────────────┤
│  Folders   [📁 DX] [📁 Full] [📁 Lang] [📁 Visa]        │  ← folders row
│            [📁 Food] [📁 Exer] [📁 Sleep] [📁 Style]    │     (muted = dim)
│                                       [Filter ▾] [Clear]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  (empty state until folder picked OR tree of tasks)     │  ← main content
│                                                         │
│  ▾ Food                                          0/4    │
│    [ ] Meal prep · 3 lunches  [Food][@home]…            │
│    [ ] Grocery run — veg…     [Food][@home]             │
│    + Add task…                                          │
│                                                         │
│  ▾ Exercise                                      1/3    │
│    [ ] 30-min easy run        [Exer][@daily-routine]    │
│    [x] Upper-body session…    [Exer][@short-burst]      │
│    + Add task…                                          │
├─────────────────────────────────────────────────────────┤
│  TODAY'S LOG                                            │
│  ✓ Chinese HSK-1, 5 new words      @train · 15 min      │
│  + Log a completed task…                                │
└─────────────────────────────────────────────────────────┘
```

#### Roles tier

- Sticky-ish or top section, NOT sticky on mobile (keep it visible on page load only).
- **Daypart pill** (left): emoji that changes with hour (`🌅` morning 5–11, `☀️` day 11–17, `🌆` evening 17–21, `🌙` night 21–5), label below, formatted hour ("8:00 PM") and `· weekend` suffix if applicable.
- **3 role chips**: dot + name + subtitle. Active = colored bg + bold dot. Muted = ~40% opacity, gray dot.
- **Click a role chip** to cycle `auto → PIN (force on) → OFF (force muted) → auto`. Show `PIN`/`OFF` badge when not auto. Persist to `role_overrides` table.

#### Folders row

- 8 folder tabs (one per project). Each shows folder icon, label, and a small count badge of total tasks tagged with that project.
- **Muted folders** (project belongs to muted role) render at ~35% opacity with reduced saturation. Still clickable (you can override).
- **Active filter** state has a stronger background tint matching the project's hue.
- **Filter dropdown button** on the right opens a popover with three sections: Where / Mode / Priority — each a row of clickable context chips. Badge shows active count.
- **Clear button**: deactivates all project + context filters.

#### Main content

- **Empty state** when no folder is selected: friendly message + a row of clickable folder buttons (only currently-active folders, so users don't pick muted ones).
- **Tree view** when ≥1 folder selected:
  - **Groups** (depth 0 and 1) — collapsible, show "completed/total" count.
  - **Tasks** — checkbox, title, inline tags (one chip per project tag + one per context tag).
  - **Inline add row** at the bottom of each group — typed task gets appended via Enter.
  - **Drag-to-reorder** — show grip on hover; drop indicator line between rows.
  - Strike-through completed tasks; show with muted color.

#### Today's Log

- Bottom section, always visible (not gated by folder selection).
- Lists completed/logged tasks with `@context · duration`.
- Quick-log input at the bottom — Enter to add a free-text entry.

---

## Interactions & Behavior

### Filtering logic

- **Project filters (OR)**: pick DX + Languages → tasks tagged either DX or Languages show.
- **Context filters (AND across contexts)**: pick @home + @keyboard → tasks must have both tags.
- **Active-role gate (AND)**: tasks belonging to muted-role projects are always hidden, regardless of filters.
- **Order of operations**: role gate → project filter → context filter.

### Role rule evaluation

```ts
function isRoleActive(role, { hour, weekend, location, override }) {
  if (override === 'on')  return true;
  if (override === 'off') return false;
  // 1. Time window (wraps midnight if start > end)
  let active = role.default_start <= role.default_end
    ? hour >= role.default_start && hour < role.default_end
    : hour >= role.default_start || hour < role.default_end;
  // 2. Weekend boost
  if (weekend && role.weekend_active) active = true;
  // 3. Location gate (AND — only narrows)
  if (location && role.allowed_locations.length &&
      !role.allowed_locations.includes(location)) active = false;
  return active;
}
```

Re-evaluate on every hour change, weekend change, location change, or override change. Use a Zustand selector with shallow equality so only affected components re-render.

### Drag & drop

- Use `@dnd-kit/core` + `@dnd-kit/sortable`.
- Allow reorder **within a group** and **across groups** (drop on a group's children area).
- On drop, write `sort_order` (use a sparse integer or fractional indexing — recommend [fractional-indexing](https://github.com/rocicorp/fractional-indexing) so you never have to renumber).

### Optimistic updates + sync

- All mutations write to local Zustand state first (instant UI), then queue to Supabase.
- Use Supabase Realtime to listen for changes from other devices and merge in.
- On reconnect after offline, replay the IndexedDB-buffered write queue.

### Animations

- Checkbox check: 150ms ease-out for the fill + check mark.
- Group collapse/expand: 200ms ease-out on height.
- Filter changes: a brief fade (120ms) on rows that drop out.
- Folder mute transition: 200ms on opacity + saturation.
- Drag indicator: 100ms slide on the insertion line.

### Hover states

- Tasks: subtle background tint, grip icon fades in on the left.
- Folder tabs: lift 1px on `translateY` and saturation up.
- Role chips: background tint.

### Keyboard

- Per the mock, ⌘K for jump (not implemented — leave as a stub or remove for v1).
- `Enter` in add-task / log inputs commits the entry.
- `Escape` clears the input.

### Responsive behavior

- **Desktop (≥1024px)**: layout as designed, max content width 920px centered.
- **Tablet (640–1024px)**: same single-column, narrower padding.
- **Mobile (<640px)**:
  - Folders row → horizontal-scroll strip.
  - Roles tier → collapse subtitle text; only show role names.
  - Filter dropdown → opens as a bottom sheet, not a popover.
  - Folder tabs become wider and tap-friendlier (min 44px height).
  - Daypart pill becomes compact (icon + hour only).

---

## State Management

### Zustand store shape

```ts
type Store = {
  // Server-mirrored
  tree: TreeNode[];               // groups + tasks, nested
  log: LogEntry[];
  roles: Role[];
  projects: Project[];
  contexts: Record<Family, Context[]>;
  roleOverrides: Record<RoleId, 'auto' | 'on' | 'off'>;

  // Client-only
  filters: { projects: Set<string>; contexts: Set<string> };
  simulatedHour: number | null;   // null = use real clock
  currentLocation: 'any' | 'home' | 'office' | 'train';
  weekendMode: 'auto' | 'on' | 'off';

  // Derived (computed selectors, not stored)
  // activeRoleIds, visibleProjectIds, passingTaskIds — recomputed on every change

  // Mutations (all optimistic + queued to Supabase)
  toggleTask(id: string): void;
  toggleGroup(id: string): void;
  addTask(groupId: string, title: string): void;
  moveTask(id: string, toGroup: string, toIdx: number): void;
  toggleFilter(family: 'project' | 'context', id: string): void;
  cycleRole(roleId: string): void;
  setHour(h: number | null): void;
  setLocation(loc: string): void;
  // …etc
};
```

Persist `filters`, `simulatedHour`, `currentLocation`, `weekendMode` to localStorage (per-device, not synced).
Persist everything else to Supabase (cloud, multi-device).

---

## Design Tokens

### Color (Lattice variant — recommended for production)

```
--bg:           #fafaf8   (light gray canvas)
--panel:        #ffffff
--ink:          #1a1a18
--ink-2:        #5f5f5b
--ink-3:        #a3a39e
--ink-4:        #c8c8c2
--rule:         #ececea
--rule-strong:  #d8d8d4
--hover:        rgba(0,0,0,0.035)
--accent:       #c96442   (default; user-switchable to #2a6fdb #1f8a5b #7a5ae0 #1c1a17)
```

### Project + role hues (HSL hue values; saturation/lightness derived per usage)

| Entity | hue |
|---|---|
| Attackers role / DX | 18 (terracotta) |
| Fullstack | 220 (blue) |
| Languages | 138 (emerald-leaning green) |
| Visa | 200 (blue) |
| Mid-players role | 158 (emerald) |
| Food | 38 (amber) |
| Exercise | 165 (mint) |
| Defenders role / Sleep | 250 (violet) |
| Fashion | 320 (pink-magenta) |

Apply with `hsl(var(--h) 50% 96%)` for bg, `hsl(var(--h) 45% 30%)` for ink, `hsl(var(--h) 35% 88%)` for borders. Folder tab "active" state shifts saturation + lightness higher.

### Spacing

Tailwind defaults work. The mock uses:
- Row min-height: 30px (compact), 36px (cozy), 44px (comfy)
- Section padding: 18px–28px depending on density
- Inter-row gap: 0–3px

Expose `compact / cozy / comfy` as a setting.

### Typography

| Use | Family | Size | Weight | Notes |
|---|---|---|---|---|
| Page title (Roadmap) | Geist | 18px | 600 | letter-spacing -0.01em |
| Group title | Geist | 13px | 600 | |
| Subgroup title | Geist | 12px | 500 | |
| Task title | Geist | 13.5px | 400 | |
| Task tag | Geist Mono | 11px | 400 | for context tags |
| Project tag | Geist | 11px | 500 | with hue-tinted bg |
| Daypart hour | Geist Mono | 10.5px | 400 | tnum |
| Section labels | Geist Mono | 10.5–11px | 600 | uppercase, letter-spacing 0.08em |

### Border radius

- Tasks / rows: 6px
- Folder tabs: 7px
- Filter popover: 8px
- Buttons: 6px
- Tag chips: 5px
- Checkbox: 4px

### Shadows

- Popover: `0 10px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)`
- Active folder tab: `0 1px 2px rgba(0,0,0,0.04)`
- No drop shadows on rest of the UI — flat.

---

## Tweaks panel (live in mock; reduce/cut for v1)

The mock has a "Tweaks" panel for demoing variations (font, density, accent, tag style, simulated hour, weekend, location, per-role rules). For production:

- **Keep for v1**: density, accent (3–4 presets), per-role rule editors (start, end, weekend, locations).
- **Cut for v1**: font swap, tag-style swap — these were exploration knobs.
- **Where to put it**: a settings page (`/settings`) with sub-pages "Appearance" and "Rules". Not a floating panel in production.

---

## Files in this handoff

| File | What it is |
|---|---|
| `index.html` | Entry point, loads Babel + the JSX files |
| `data.jsx` | **Canonical data model** — roles, projects, contexts, seed tree, all helpers (filter, move, format, role-active eval). **Read this first.** |
| `app.jsx` | Top-level React component — state hooks, role evaluation, Tweaks wiring |
| `variant-lattice.jsx` | **Recommended visual** — production-ready Linear-style design |
| `variant-editorial.jsx` | Alt visual — warmer editorial serif treatment |
| `variant-orgpaper.jsx` | Alt visual — mono/org-mode aesthetic |
| `design-canvas.jsx` | Just for showing 3 variants side-by-side — not part of the app |
| `tweaks-panel.jsx` | Tweaks shell — replaced by `/settings` in production |

**Implementation order suggestion:**
1. Read `data.jsx` end-to-end — the data model, role rules, and filter logic transfer 1:1 to the production codebase.
2. Set up Next.js + Supabase + Tailwind + Zustand.
3. Build the Lattice variant's layout from `variant-lattice.jsx` — folder tabs, role chips, tree, log.
4. Wire data + sync.
5. Add PWA manifest + service worker.
6. Deploy to Vercel.

---

## Stretch / V2 ideas

These are in the mock as concepts but worth flagging:

- **In-app rules editor** (currently in Tweaks panel) → settings page.
- **Weekly schedule heatmap** — visualize when each role is on duty across the week.
- **Custom contexts** — let user add their own `@tag` families.
- **Bulk actions** — multi-select tasks for batch move / tag.
- **Search** — ⌘K palette to jump to any task by title.
- **Mobile gestures** — swipe-to-complete, long-press for actions menu.
- **Streak tracking** — `daily-routine`-tagged tasks could show a streak count.

---

## Questions to clarify with the user before building

1. Which **visual variant** to ship as default? (Lattice recommended.)
2. **Real-time clock** or keep the simulated-hour slider? (Recommend real, with debug toggle.)
3. **GPS-based location detection** or keep manual? (Manual is simpler; GPS adds value if Defenders' "home only" rule should auto-apply when geofenced.)
4. **iOS/Android native** version later, or PWA forever? (PWA forever is fine for solo use.)
5. **Notifications** when a role becomes active? (e.g. "🌆 Mid-players are on. Time to cook.")
