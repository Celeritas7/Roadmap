// Shared task data, types, and tree helpers — exported to window so each
// variant script can pull them in (Babel script scopes don't share).

// ─────────────────────────────────────────────────────────────────────────────
// Roles — a layer above projects (folders).
//
// The user thinks about their day in 3 tiers:
//   • Attackers   — ambitions  (career-building work)
//   • Mid-players — life support  (food, exercise)
//   • Defenders   — self-care  (sleep, fashion)
//
// Each role has a default active time-of-day range and location rules. When a
// role is "muted" (manually or by time/location), its folders fade and its
// tasks are hidden from the tree — so the screen can give focus to whichever
// role is on duty right now.

const ROLES = [
  {
    id: 'attackers',  label: 'Attackers',   subtitle: 'ambitions',
    hue: 18,          // terracotta
    defaultStart: 9,  defaultEnd: 19,
    weekendActive: false,
    locations: ['home', 'office', 'train'],
  },
  {
    id: 'midplayers', label: 'Mid-players', subtitle: 'life support',
    hue: 158,         // emerald
    defaultStart: 19, defaultEnd: 21,
    weekendActive: true,
    locations: ['home', 'office'],
  },
  {
    id: 'defenders',  label: 'Defenders',   subtitle: 'self-care',
    hue: 252,         // violet
    defaultStart: 21, defaultEnd: 23,
    weekendActive: true,
    locations: ['home'],
  },
];

const ROLE_BY_ID = Object.fromEntries(ROLES.map(r => [r.id, r]));

// Projects (folders) — each belongs to exactly one role.
const PROJECTS = [
  // Attackers
  { id: 'dx',        label: 'DX Engineer', short: 'DX',     hue: 18,  role: 'attackers'  },
  { id: 'fullstack', label: 'Fullstack',   short: 'Full',   hue: 220, role: 'attackers'  },
  { id: 'lang',      label: 'Languages',   short: 'Lang',   hue: 138, role: 'attackers'  },
  { id: 'visa',      label: 'Visa',        short: 'Visa',   hue: 200, role: 'attackers'  },
  // Mid-players
  { id: 'food',      label: 'Food',        short: 'Food',   hue: 38,  role: 'midplayers' },
  { id: 'exercise',  label: 'Exercise',    short: 'Exer',   hue: 165, role: 'midplayers' },
  // Defenders
  { id: 'sleep',     label: 'Sleep',       short: 'Sleep',  hue: 250, role: 'defenders'  },
  { id: 'fashion',   label: 'Fashion',     short: 'Style',  hue: 320, role: 'defenders'  },
];

const PROJECT_BY_ID = Object.fromEntries(PROJECTS.map(p => [p.id, p]));

const CONTEXTS = {
  where:    [{ id: 'home', label: '@home' }, { id: 'train', label: '@train' }, { id: 'office', label: '@office' }],
  mode:     [{ id: 'audio-only', label: '@audio-only' }, { id: 'keyboard', label: '@keyboard' }, { id: 'short-burst', label: '@short-burst' }, { id: 'deep-focus', label: '@deep-focus' }],
  priority: [{ id: 'auto-interview', label: '@auto-interview' }, { id: 'daily-routine', label: '@daily-routine' }],
};

const CONTEXT_BY_ID = {};
for (const family of Object.keys(CONTEXTS)) {
  for (const c of CONTEXTS[family]) CONTEXT_BY_ID[c.id] = { ...c, family };
}

const INITIAL_TREE = [
  // ─── ATTACKERS ────────────────────────────────────────────────────────────
  {
    id: 'dx-roadmap', kind: 'group', title: 'DX Engineer Roadmap', expanded: true,
    children: [
      {
        id: 'apply', kind: 'group', title: 'Phase 0 · Apply & Outreach', expanded: true,
        children: [
          { id: 't1', kind: 'task', title: 'Decline 100 design offers in Keigo',         done: false, tags: ['dx', 'home', 'keyboard', 'short-burst'] },
          { id: 't2', kind: 'task', title: 'Build resume v.D — Software/DX hybrid',       done: false, tags: ['dx', 'fullstack', 'home', 'keyboard', 'deep-focus'] },
          { id: 't3', kind: 'task', title: 'Clean GH app, deploy demos',                  done: false, tags: ['dx', 'fullstack', 'home', 'deep-focus'] },
          { id: 't4', kind: 'task', title: 'Pick which 5 from 30+',                       done: true,  tags: ['dx', 'home'] },
          { id: 't5', kind: 'task', title: 'Update READMEs',                              done: false, tags: ['dx', 'fullstack', 'home'] },
          { id: 't6', kind: 'task', title: 'Deploy live demos',                           done: false, tags: ['dx', 'fullstack', 'home', 'deep-focus'] },
        ],
      },
      {
        id: 'phase1', kind: 'group', title: 'Phase 1 · Land bridge job', expanded: false,
        children: [
          { id: 't7', kind: 'task', title: 'Map the bridge-role market — 20 listings',   done: false, tags: ['dx', 'home', 'short-burst'] },
          { id: 't8', kind: 'task', title: 'Draft cold-outreach template v2',             done: false, tags: ['dx', 'home', 'keyboard'] },
        ],
      },
    ],
  },
  {
    id: 'languages', kind: 'group', title: 'Languages', expanded: true,
    children: [
      { id: 't9',  kind: 'task', title: 'Chinese HSK-1, 5 words today',          done: true,  tags: ['lang', 'train', 'audio-only', 'short-burst', 'daily-routine'] },
      { id: 't10', kind: 'task', title: 'Japanese N1 listening practice',         done: false, tags: ['lang', 'train', 'audio-only'] },
      { id: 't11', kind: 'task', title: 'Chinese conversation Excel update',      done: false, tags: ['lang', 'home', 'keyboard'] },
    ],
  },
  {
    id: 'visa', kind: 'group', title: 'Visa renewal · 1 item', expanded: false,
    children: [
      { id: 't12', kind: 'task', title: 'Book consulate appointment',             done: false, tags: ['visa', 'home', 'auto-interview'] },
    ],
  },

  // ─── MID-PLAYERS ──────────────────────────────────────────────────────────
  {
    id: 'food-grp', kind: 'group', title: 'Food', expanded: true,
    children: [
      { id: 'f1', kind: 'task', title: 'Meal prep · 3 lunches for the week',      done: false, tags: ['food', 'home', 'short-burst', 'daily-routine'] },
      { id: 'f2', kind: 'task', title: 'Grocery run — veg, protein, oats',         done: false, tags: ['food', 'home'] },
      { id: 'f3', kind: 'task', title: 'Try the ramen recipe I bookmarked',        done: false, tags: ['food', 'home', 'deep-focus'] },
      { id: 'f4', kind: 'task', title: 'Drink 2L water · all day',                 done: true,  tags: ['food', 'daily-routine'] },
    ],
  },
  {
    id: 'exercise-grp', kind: 'group', title: 'Exercise', expanded: true,
    children: [
      { id: 'e1', kind: 'task', title: '30-min easy run',                          done: false, tags: ['exercise', 'daily-routine'] },
      { id: 'e2', kind: 'task', title: 'Upper-body session · push/pull',           done: true,  tags: ['exercise', 'short-burst'] },
      { id: 'e3', kind: 'task', title: 'Evening stretch · 10 min',                 done: false, tags: ['exercise', 'home', 'daily-routine'] },
    ],
  },

  // ─── DEFENDERS ────────────────────────────────────────────────────────────
  {
    id: 'sleep-grp', kind: 'group', title: 'Sleep', expanded: true,
    children: [
      { id: 's1', kind: 'task', title: 'Lights out by 11 pm',                      done: false, tags: ['sleep', 'home', 'daily-routine'] },
      { id: 's2', kind: 'task', title: 'No screens after 10 pm',                   done: false, tags: ['sleep', 'home', 'daily-routine'] },
      { id: 's3', kind: 'task', title: 'Read 15 min before bed',                   done: false, tags: ['sleep', 'home', 'short-burst'] },
    ],
  },
  {
    id: 'fashion-grp', kind: 'group', title: 'Fashion', expanded: true,
    children: [
      { id: 'fa1', kind: 'task', title: 'Iron shirts for the week',                done: false, tags: ['fashion', 'home', 'short-burst'] },
      { id: 'fa2', kind: 'task', title: "Plan tomorrow's outfit",                  done: false, tags: ['fashion', 'home'] },
      { id: 'fa3', kind: 'task', title: 'Donate unused clothes',                   done: false, tags: ['fashion', 'home', 'deep-focus'] },
    ],
  },
];

const INITIAL_LOG = [
  { id: 'l1', title: 'Chinese HSK-1, 5 new words', context: 'train', duration: '15 min' },
  { id: 'l2', title: 'Pick 5 apps from GitHub',     context: 'home',  duration: '30 min' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Time / daypart / role-activity helpers

function getDaypart(hour) {
  if (hour >= 5 && hour < 11)  return { id: 'morning', emoji: '🌅', label: 'morning' };
  if (hour >= 11 && hour < 17) return { id: 'day',     emoji: '☀️', label: 'afternoon' };
  if (hour >= 17 && hour < 21) return { id: 'evening', emoji: '🌆', label: 'evening' };
  return { id: 'night', emoji: '🌙', label: 'night' };
}

function isInTimeRange(hour, start, end) {
  if (start <= end) return hour >= start && hour < end;
  return hour >= start || hour < end; // wraps midnight
}

// Given current hour / weekend / location / per-role manual overrides + custom
// rules, return a Set of role-ids currently "on".
//
// override values: 'on' (force-active), 'off' (force-muted), 'auto' (default).
// rules: optional per-role { start, end, locations[], weekendActive } overrides.
function computeActiveRoles({ hour, weekend, location, overrides = {}, rules = {} }) {
  const result = new Set();
  for (const role of ROLES) {
    const ov = overrides[role.id];
    if (ov === 'on')  { result.add(role.id); continue; }
    if (ov === 'off') { continue; }
    const r = { ...role, ...(rules[role.id] || {}) };
    let active = isInTimeRange(hour, r.defaultStart, r.defaultEnd);
    if (weekend && r.weekendActive) active = true;
    if (location && location !== 'any' && r.locations && !r.locations.includes(location)) active = false;
    if (active) result.add(role.id);
  }
  return result;
}

function formatHour12(h) {
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:00 ${h < 12 ? 'AM' : 'PM'}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tree helpers — immutable updates over the nested children structure.

function visitTasks(tree, fn) {
  for (const node of tree) {
    if (node.kind === 'group') visitTasks(node.children, fn);
    else fn(node);
  }
}

function mapTree(tree, fn) {
  return tree.map(node => {
    const next = fn(node);
    if (next.kind === 'group') return { ...next, children: mapTree(next.children, fn) };
    return next;
  });
}

function toggleNode(tree, id, key) {
  return mapTree(tree, n => n.id === id ? { ...n, [key]: !n[key] } : n);
}

function setNodeField(tree, id, key, val) {
  return mapTree(tree, n => n.id === id ? { ...n, [key]: val } : n);
}

function appendTaskToGroup(tree, groupId, task) {
  return tree.map(node => {
    if (node.kind !== 'group') return node;
    if (node.id === groupId) return { ...node, children: [...node.children, task] };
    return { ...node, children: appendTaskToGroup(node.children, groupId, task) };
  });
}

function removeNode(tree, id) {
  const out = [];
  for (const node of tree) {
    if (node.id === id) continue;
    if (node.kind === 'group') out.push({ ...node, children: removeNode(node.children, id) });
    else out.push(node);
  }
  return out;
}

function moveTask(tree, id, toGroupId, toIdx) {
  let moving = null;
  function extract(nodes) {
    const out = [];
    for (const n of nodes) {
      if (n.id === id) { moving = n; continue; }
      if (n.kind === 'group') out.push({ ...n, children: extract(n.children) });
      else out.push(n);
    }
    return out;
  }
  let next = extract(tree);
  if (!moving) return tree;
  function insert(nodes, gid) {
    if (gid == null) {
      const out = [...nodes];
      out.splice(Math.min(toIdx, out.length), 0, moving);
      return out;
    }
    return nodes.map(n => {
      if (n.kind !== 'group') return n;
      if (n.id === gid) {
        const out = [...n.children];
        out.splice(Math.min(toIdx, out.length), 0, moving);
        return { ...n, children: out };
      }
      return { ...n, children: insert(n.children, gid) };
    });
  }
  return insert(next, toGroupId);
}

function filteredTaskIds(tree, filters) {
  const out = new Set();
  visitTasks(tree, t => {
    if (filters.projects.size > 0) {
      const has = t.tags.some(tag => filters.projects.has(tag));
      if (!has) return;
    }
    if (filters.contexts.size > 0) {
      for (const c of filters.contexts) {
        if (!t.tags.includes(c)) return;
      }
    }
    out.add(t.id);
  });
  return out;
}

function visibleGroupIds(tree, passingTaskIds) {
  const out = new Set();
  function rec(nodes) {
    let anyVisible = false;
    for (const n of nodes) {
      if (n.kind === 'task') {
        if (passingTaskIds.has(n.id)) anyVisible = true;
      } else {
        const childVisible = rec(n.children);
        if (childVisible) { out.add(n.id); anyVisible = true; }
      }
    }
    return anyVisible;
  }
  rec(tree);
  return out;
}

function formatTag(tagId, tagStyle) {
  const proj = PROJECT_BY_ID[tagId];
  if (proj) {
    const raw = proj.short;
    return { kind: 'project', raw, text: raw, hue: proj.hue, id: tagId };
  }
  const ctx = CONTEXT_BY_ID[tagId];
  if (!ctx) return { kind: 'unknown', raw: tagId, text: tagId };
  const bare = ctx.label.replace(/^@/, '');
  let text = ctx.label;
  if (tagStyle === 'bracket') text = `[${ctx.label}]`;
  else if (tagStyle === 'hashtag') text = `#${bare}`;
  else if (tagStyle === 'underline') text = bare;
  return { kind: 'context', raw: ctx.label, text, family: ctx.family, id: tagId };
}

Object.assign(window, {
  ROLES, ROLE_BY_ID,
  PROJECTS, PROJECT_BY_ID, CONTEXTS, CONTEXT_BY_ID,
  INITIAL_TREE, INITIAL_LOG,
  getDaypart, isInTimeRange, computeActiveRoles, formatHour12,
  visitTasks, mapTree, toggleNode, setNodeField,
  appendTaskToGroup, removeNode, moveTask,
  filteredTaskIds, visibleGroupIds, formatTag,
});
