/* ─────────────────────────────────────────────────────────────
   Roadmap — data layer (ported from src/seed.ts + design handoff)
   Plain JS, exposed on window. The data model & IA are FIXED:
   roles → folders(projects) → tasks(nest), 3 tag families.
   ───────────────────────────────────────────────────────────── */
(function () {
  // ─── ROLE TIERS (formation) ───────────────────────────────
  const ROLES = [
    { id: 'attackers',  label: 'Attackers',  subtitle: 'ambitions',    line: 'FWD', hue: 18,  start: 9,  end: 19, mood: 'Push your ambitions forward' },
    { id: 'midplayers', label: 'Mid-players', subtitle: 'life support', line: 'MID', hue: 158, start: 19, end: 21, mood: 'Keep the engine running' },
    { id: 'defenders',  label: 'Defenders',  subtitle: 'self-care',     line: 'DEF', hue: 252, start: 21, end: 23, mood: 'Guard your base' },
  ];
  const ROLE_BY_ID = Object.fromEntries(ROLES.map(r => [r.id, r]));

  // ─── FOLDERS (projects) — each carries its own identity hue ──
  const PROJECTS = [
    { id: 'dx',        label: 'DX Engineer', short: 'DX',    mono: 'DX', hue: 18,  role: 'attackers',  goal: 'Land a DX Engineer role' },
    { id: 'fullstack', label: 'Fullstack',   short: 'Full',  mono: 'FS', hue: 220, role: 'attackers',  goal: 'Ship a full-stack portfolio' },
    { id: 'lang',      label: 'Languages',   short: 'Lang',  mono: '语', hue: 138, role: 'attackers',  goal: 'Conversational fluency' },
    { id: 'visa',      label: 'Visa',        short: 'Visa',  mono: 'V',  hue: 200, role: 'attackers',  goal: 'Visa secured' },
    { id: 'food',      label: 'Food',        short: 'Food',  mono: 'F',  hue: 38,  role: 'midplayers', goal: 'Eat well, consistently' },
    { id: 'exercise',  label: 'Exercise',    short: 'Exer',  mono: 'E',  hue: 165, role: 'midplayers', goal: 'Stronger every week' },
    { id: 'sleep',     label: 'Sleep',       short: 'Sleep', mono: 'S',  hue: 250, role: 'defenders',  goal: 'Restful nights, every night' },
    { id: 'fashion',   label: 'Fashion',     short: 'Style', mono: 'St', hue: 320, role: 'defenders',  goal: 'A sharper wardrobe' },
  ];
  const PROJECT_BY_ID = Object.fromEntries(PROJECTS.map(p => [p.id, p]));

  // ─── CONTEXT TAG FAMILIES (per brief) ──────────────────────
  // Where + Mode → filters HIDE non-matches. Priority → DIMS to 30%.
  const CONTEXTS = {
    where:    [ { id: 'home', label: 'home' }, { id: 'office', label: 'office' }, { id: 'train', label: 'train' } ],
    mode:     [ { id: 'keyboard', label: 'keyboard' }, { id: 'reading', label: 'reading' }, { id: 'audio-only', label: 'audio-only' } ],
    priority: [ { id: 'deep-focus', label: 'deep-focus' }, { id: 'daily-routine', label: 'daily-routine' }, { id: 'short-burst', label: 'short-burst' } ],
  };
  const FAMILY_OF = {};
  Object.entries(CONTEXTS).forEach(([fam, arr]) => arr.forEach(c => { FAMILY_OF[c.id] = fam; }));
  const CONTEXT_LABEL = {};
  Object.values(CONTEXTS).flat().forEach(c => { CONTEXT_LABEL[c.id] = c.label; });

  // ─── TASKS ─────────────────────────────────────────────────
  // A task may belong to several folders via `projects`. `chapter`
  // groups tasks into nested sub-folders in the expanded tree.
  // where / mode / priority hold the 3 tag families (any may be null).
  let _seq = 0;
  const T = (title, opts) => ({
    id: 'task-' + (++_seq),
    title,
    kind: opts.kind || 'task',
    done: !!opts.done,
    projects: opts.projects,
    chapter: opts.chapter || null,
    where: opts.where || null,
    mode: opts.mode || null,
    priority: opts.priority || null,
    chapters: opts.chapters || null, // book stops
    linkedFrom: opts.linkedFrom || null, // task shared with another project
  });

  const TASKS = [
    // ── DX Engineer Roadmap ──
    T('Decline 100 design offers in Keigo',   { projects: ['dx'],              chapter: 'Phase 0 · Apply & Outreach', where: 'home', mode: 'keyboard', priority: 'short-burst' }),
    T('Build resume v.D — Software/DX hybrid', { projects: ['dx', 'fullstack'], chapter: 'Phase 0 · Apply & Outreach', where: 'home', mode: 'keyboard', priority: 'deep-focus' }),
    T('Clean GH app, deploy demos',           { projects: ['dx', 'fullstack'], chapter: 'Phase 0 · Apply & Outreach', where: 'home', mode: 'keyboard', priority: 'deep-focus' }),
    T('Pick which 5 from 30+',                 { projects: ['dx'], done: true,  chapter: 'Phase 0 · Apply & Outreach', where: 'home', priority: 'short-burst' }),
    T('Update READMEs',                        { projects: ['dx', 'fullstack'], chapter: 'Phase 0 · Apply & Outreach', where: 'home', mode: 'keyboard' }),
    T('Deploy live demos',                     { projects: ['dx', 'fullstack'], chapter: 'Phase 0 · Apply & Outreach', where: 'home', mode: 'keyboard', priority: 'deep-focus' }),
    T('Map the bridge-role market — 20 listings', { projects: ['dx'],           chapter: 'Phase 1 · Land bridge job',  where: 'home', mode: 'reading', priority: 'short-burst' }),
    T('Draft cold-outreach template v2',       { projects: ['dx'],              chapter: 'Phase 1 · Land bridge job',  where: 'home', mode: 'keyboard', priority: 'deep-focus' }),

    // ── DX Engineer · Reading list (book = route, chapters = stops) ──
    T('Docs for Developers — Bhatti et al.', { kind: 'book', projects: ['dx'], chapter: 'Reading list · fuels DX', where: 'train', mode: 'reading',
      chapters: [
        { title: 'Understanding your audience', done: true },
        { title: 'Planning your documentation', done: true },
        { title: 'Drafting documentation',       done: true },
        { title: 'Editing for clarity',          done: true },
        { title: 'Integrating code samples',     done: true },
        { title: 'Adding visual content',        done: false },
        { title: 'Publishing & maintaining',     done: false },
        { title: 'Measuring doc quality',        done: false },
      ] }),
    T('Team Topologies — Skelton & Pais', { kind: 'book', projects: ['dx'], chapter: 'Reading list · fuels DX', where: 'home', mode: 'reading',
      chapters: [
        { title: 'The problem with org charts', done: true },
        { title: "Conway's law & its reverse",  done: true },
        { title: 'Team-first thinking',         done: false },
        { title: 'Static team topologies',      done: false },
        { title: 'The four fundamental types',  done: false },
        { title: 'Team interaction modes',      done: false },
        { title: 'Evolving the topologies',     done: false },
      ] }),

    // ── DX Engineer · Cross-training (stops SHARED with the Exercise folder) ──
    T('Wrist & posture mobility · 8 min', { projects: ['dx', 'exercise'], chapter: 'Cross-training · with Exercise', linkedFrom: 'exercise', where: 'home', priority: 'daily-routine' }),
    T('Pomodoro stretch breaks · ×4',     { projects: ['dx', 'exercise'], chapter: 'Cross-training · with Exercise', linkedFrom: 'exercise', where: 'home', priority: 'short-burst' }),

    // ── Languages ──
    T('Chinese HSK-1, 5 words today',          { projects: ['lang'], done: true, where: 'train', mode: 'audio-only', priority: 'daily-routine' }),
    T('Japanese N1 listening practice',        { projects: ['lang'],             where: 'train', mode: 'audio-only', priority: 'daily-routine' }),
    T('Chinese conversation Excel update',     { projects: ['lang'],             where: 'home',  mode: 'keyboard', priority: 'short-burst' }),

    // ── Visa ──
    T('Book consulate appointment',            { projects: ['visa'],             where: 'home',  mode: 'keyboard', priority: 'deep-focus' }),

    // ── Food ──
    T('Meal prep · 3 lunches for the week',    { projects: ['food'],             where: 'home',  priority: 'short-burst' }),
    T('Grocery run — veg, protein, oats',      { projects: ['food'],             where: 'home',  priority: 'daily-routine' }),
    T('Try the ramen recipe I bookmarked',     { projects: ['food'],             where: 'home',  mode: 'reading', priority: 'deep-focus' }),
    T('Drink 2L water · all day',              { projects: ['food'], done: true,                 priority: 'daily-routine' }),

    // ── Exercise ──
    T('30-min easy run',                       { projects: ['exercise'],         priority: 'daily-routine' }),
    T('Upper-body session · push/pull',        { projects: ['exercise'], done: true,             priority: 'short-burst' }),
    T('Evening stretch · 10 min',              { projects: ['exercise'],         where: 'home',  priority: 'daily-routine' }),

    // ── Sleep ──
    T('Lights out by 11 pm',                   { projects: ['sleep'],            where: 'home',  priority: 'daily-routine' }),
    T('No screens after 10 pm',                { projects: ['sleep'],            where: 'home',  priority: 'daily-routine' }),
    T('Read 15 min before bed',                { projects: ['sleep'],            where: 'home',  mode: 'reading', priority: 'short-burst' }),

    // ── Fashion ──
    T('Iron shirts for the week',              { projects: ['fashion'],          where: 'home',  priority: 'short-burst' }),
    T("Plan tomorrow's outfit",                { projects: ['fashion'],          where: 'home',  priority: 'daily-routine' }),
    T('Donate unused clothes',                 { projects: ['fashion'],          where: 'home',  mode: 'reading', priority: 'deep-focus' }),
  ];

  // ─── TODAY'S LOG (seed) ────────────────────────────────────
  let _lseq = 0;
  const L = (title, where, mins) => ({ id: 'log-' + (++_lseq), title, where, mins });
  const INITIAL_LOG = [
    L('Chinese HSK-1, 5 new words', 'train', 15),
    L('Pick 5 apps from GitHub',    'home',  30),
  ];

  // ─── HELPERS ───────────────────────────────────────────────
  // A book stop counts as done only when every chapter is read.
  function isDone(task) {
    if (task.kind === 'book' && task.chapters) return task.chapters.every(c => c.done);
    return task.done;
  }
  function bookProgress(task) {
    if (!task.chapters) return null;
    return { total: task.chapters.length, done: task.chapters.filter(c => c.done).length };
  }
  function tasksForProject(tasks, projectId) {
    return tasks.filter(t => t.projects.includes(projectId));
  }
  function counts(tasks, projectId) {
    const list = tasksForProject(tasks, projectId);
    return { total: list.length, done: list.filter(isDone).length };
  }
  function nextTask(tasks, projectId) {
    return tasksForProject(tasks, projectId).find(t => !isDone(t)) || null;
  }
  function projectsForRole(roleId) {
    return PROJECTS.filter(p => p.role === roleId);
  }
  // tags of a task in display order: family chips
  function contextChips(task) {
    const out = [];
    if (task.where)    out.push({ id: task.where,    family: 'where' });
    if (task.mode)     out.push({ id: task.mode,     family: 'mode' });
    if (task.priority) out.push({ id: task.priority, family: 'priority' });
    return out;
  }

  // daypart from hour
  function daypart(hour) {
    if (hour < 6)  return { key: 'night',     label: 'Night',     glyph: '☾' };
    if (hour < 12) return { key: 'morning',   label: 'Morning',   glyph: '☀' };
    if (hour < 17) return { key: 'afternoon', label: 'Afternoon', glyph: '☀' };
    if (hour < 21) return { key: 'evening',   label: 'Evening',   glyph: '◐' };
    return { key: 'night', label: 'Night', glyph: '☾' };
  }
  function onDutyRole(hour) {
    const r = ROLES.find(r => hour >= r.start && hour < r.end);
    return r ? r.id : 'attackers';
  }
  function fmtHour12(h) {
    const am = h < 12; const x = h % 12 === 0 ? 12 : h % 12;
    return x + ':00 ' + (am ? 'AM' : 'PM');
  }

  window.RM = {
    ROLES, ROLE_BY_ID, PROJECTS, PROJECT_BY_ID, CONTEXTS, FAMILY_OF, CONTEXT_LABEL,
    TASKS, INITIAL_LOG,
    tasksForProject, counts, nextTask, projectsForRole, contextChips,
    isDone, bookProgress,
    daypart, onDutyRole, fmtHour12,
  };
})();
