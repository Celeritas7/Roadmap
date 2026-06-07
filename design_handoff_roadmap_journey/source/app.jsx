/* ═══════════════════════════════════════════════════════════════
   ROADMAP — app state + product assembly + showcase shell
   State lives in the shell so the desktop & mobile frames stay
   perfectly in sync (toggle a task in one, it updates the other).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const { useState, useEffect, useRef, useCallback, useLayoutEffect } = React;
  const RM = window.RM;
  const U = window.RMUI;

  const DATE_PILL = 'Sun · May 31';
  const DATE_LOG = 'Sun, May 31';

  // ─── THE PRODUCT ───────────────────────────────────────────
  function RoadmapApp(props) {
    const {
      theme, vp, hour,
      activeRole, setActiveRole,
      openProject, setOpenProject,
      tasks, toggleTask, deleteTask, editTask, addTask,
      log, addLog, deleteLog,
      filters, toggleFilter, clearFilters,
      filterOpen, setFilterOpen,
      demoState, setDemoState, toggleChapter,
    } = props;

    window.__TASKS = tasks; // RoleTier reads counts off this

    // filter visibility logic: where/mode HIDE, priority DIMS
    const visState = useCallback((task) => {
      const active = { where: [], mode: [], priority: [] };
      filters.forEach(id => { const fam = RM.FAMILY_OF[id]; if (fam) active[fam].push(id); });
      let hidden = false, dimmed = false;
      if (active.where.length && !active.where.includes(task.where)) hidden = true;
      if (active.mode.length && !active.mode.includes(task.mode)) hidden = true;
      if (active.priority.length && !active.priority.includes(task.priority)) dimmed = true;
      return { hidden, dimmed };
    }, [filters]);

    const projects = RM.projectsForRole(activeRole);
    const openProj = openProject ? RM.PROJECT_BY_ID[openProject] : null;
    const openTasks = openProj ? RM.tasksForProject(tasks, openProj.id) : [];

    const closeFilter = () => setFilterOpen(false);

    // ── body ──
    let body;
    if (demoState === 'loading') {
      body = <U.SkeletonGrid mobile={vp === 'mobile'} />;
    } else if (demoState === 'empty') {
      body = <U.EmptyState onAdd={() => setDemoState(null)} />;
    } else if (demoState === 'allDone') {
      body = <U.AllDoneState onBack={() => { setDemoState(null); setOpenProject(null); }} />;
    } else if (openProj) {
      const allDone = openTasks.length > 0 && openTasks.every(t => t.done);
      if (allDone) body = <U.AllDoneState onBack={() => setOpenProject(null)} />;
      else if (openTasks.length === 0) body = <U.EmptyState onAdd={() => {}} />;
      else body = <U.Tree project={openProj} tasks={openTasks} visState={visState}
        onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask} onAdd={addTask} onToggleChapter={toggleChapter} />;
    } else {
      body = (
        <div className="focus-grid">
          {projects.map(p => (
            <U.FolderCard key={p.id} project={p} tasks={RM.tasksForProject(tasks, p.id)}
              onOpen={() => setOpenProject(p.id)} />
          ))}
        </div>
      );
    }

    return (
      <div className="rm" data-theme={theme} data-vp={vp} data-role={activeRole}>
        <div className="rm-scroll">
          <header className="rm-header">
            <div className="rm-toprow">
              <div className="rm-brand">
                <h1 className="rm-mark">
                  <span className="glyph">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="5" cy="19" r="2.4" fill="var(--accent)" stroke="none"/>
                      <circle cx="19" cy="5" r="2.4"/>
                      <path d="M5 16.6C5 11 9 9 12 9s5-1.6 5-4" strokeDasharray="0.1 3.4"/>
                    </svg>
                  </span>
                  Roadmap
                </h1>
                <span className="rm-kbd">⌘K to jump</span>
                <span className="rm-mood">{RM.ROLE_BY_ID[activeRole].mood}</span>
              </div>
              <div className="rm-meta">
                <span className="rm-datepill">{DATE_PILL}</span>
                <span className="rm-week">Week 22</span>
              </div>
            </div>

            <U.RoleTier activeRole={activeRole} hour={hour}
              onSelect={(id) => { setActiveRole(id); setOpenProject(null); setDemoState(null); }} />

            <div className="rm-subbar">
              {openProj ? (
                <div className="rm-viewtitle">
                  <button className="vt-back" onClick={() => setOpenProject(null)} aria-label="back">{U.I.back}</button>
                  <span style={{ '--h': openProj.hue }}>{openProj.label}</span>
                  <span className="vt-crumb">/ {RM.ROLE_BY_ID[activeRole].label}</span>
                </div>
              ) : (
                <div className="rm-viewtitle">
                  <span>Focus</span>
                  <span className="vt-crumb">/ {RM.ROLE_BY_ID[activeRole].label}</span>
                </div>
              )}
              <div className="rm-tools">
                <div className="filterwrap">
                  <button className={'rm-btn rm-filter-btn' + (filters.size ? ' live' : '')}
                    onClick={() => setFilterOpen(o => !o)}>
                    {U.I.filter}<span>Filter</span>
                    {filters.size > 0 && <span className="badge">{filters.size}</span>}
                  </button>
                  {vp === 'desktop' && filterOpen && (
                    <U.FilterPanel filters={filters} onToggle={toggleFilter} onClear={clearFilters} onClose={closeFilter} />
                  )}
                </div>
                <button className="rm-clear" disabled={!filters.size} onClick={clearFilters}>Clear</button>
              </div>
            </div>
          </header>

          <main className="rm-pad">
            {demoState === 'error' && <U.ErrorBanner onRetry={() => setDemoState(null)} onDismiss={() => setDemoState(null)} />}
            {body}
            <U.TodaysLog log={log} dateStr={DATE_LOG} onAdd={addLog} onDelete={deleteLog} />
          </main>
        </div>

        {vp === 'mobile' && filterOpen && (
          <U.FilterPanel filters={filters} onToggle={toggleFilter} onClear={clearFilters} onClose={closeFilter} />
        )}
      </div>
    );
  }

  // ─── DEVICE FRAMES ─────────────────────────────────────────
  function DesktopFrame({ children }) {
    return (
      <window.ChromeWindow width={1040} height={720} url="roadmap.app/focus"
        tabs={[{ title: 'Roadmap — Focus' }, { title: 'GitHub' }]} activeIndex={0}>
        <div style={{ height: '100%' }}>{children}</div>
      </window.ChromeWindow>
    );
  }
  function MobileFrame({ dark, children }) {
    return (
      <window.IOSDevice width={384} height={812} dark={dark}>
        <div style={{ height: '100%' }}>{children}</div>
      </window.IOSDevice>
    );
  }

  // ─── SHOWCASE SHELL ────────────────────────────────────────
  const DIRECTIONS = [
    { id: 'trailhead',  name: 'Trailhead',  blurb: 'clean · the route line', sw: '#3b6ef0', dark: false },
    { id: 'summit',     name: 'Summit',     blurb: 'dark · the ascent',      sw: '#5b8cff', dark: true  },
    { id: 'fieldguide', name: 'Field Guide', blurb: 'warm · the expedition',  sw: '#2f64df', dark: false },
  ];
  const VPS = [
    { id: 'both', label: 'Both' },
    { id: 'desktop', label: 'Desktop' },
    { id: 'mobile', label: 'Mobile' },
  ];

  function Shell() {
    const [theme, setTheme] = useState('trailhead');
    const [vpMode, setVpMode] = useState('both');
    const [hour] = useState(14);

    const [activeRole, setActiveRole] = useState('attackers');
    const [openProject, setOpenProject] = useState(null);
    const [tasks, setTasks] = useState(() => RM.TASKS.map(t => ({ ...t })));
    const [log, setLog] = useState(() => RM.INITIAL_LOG.map(l => ({ ...l })));
    const [filters, setFilters] = useState(() => new Set());
    const [filterOpenD, setFilterOpenD] = useState(false);
    const [filterOpenM, setFilterOpenM] = useState(false);
    const [demoState, setDemoState] = useState(null);
    const [statesMenu, setStatesMenu] = useState(false);

    // auto-clear loading
    useEffect(() => {
      if (demoState === 'loading') { const t = setTimeout(() => setDemoState(null), 1700); return () => clearTimeout(t); }
    }, [demoState]);

    // ── mutations ──
    const toggleTask = useCallback((id) => setTasks(ts => ts.map(t => {
      if (t.id !== id) return t;
      if (t.kind === 'book' && t.chapters) {
        const allRead = t.chapters.every(c => c.done);
        return { ...t, chapters: t.chapters.map(c => ({ ...c, done: !allRead })) };
      }
      return { ...t, done: !t.done };
    })), []);
    const toggleChapter = useCallback((id, idx) => setTasks(ts => ts.map(t => {
      if (t.id !== id || !t.chapters) return t;
      return { ...t, chapters: t.chapters.map((c, i) => i === idx ? { ...c, done: !c.done } : c) };
    })), []);
    const deleteTask = useCallback((id) => setTasks(ts => ts.filter(t => t.id !== id)), []);
    const editTask = useCallback((id, title) => setTasks(ts => ts.map(t => t.id === id ? { ...t, title } : t)), []);
    const addTask = useCallback((projectId, chapter, title) => setTasks(ts => {
      const nt = { id: 'task-new-' + Date.now(), title, done: false, projects: [projectId], chapter: chapter || null, where: null, mode: null, priority: null };
      // insert after last task of that project
      let lastIdx = -1; ts.forEach((t, i) => { if (t.projects.includes(projectId)) lastIdx = i; });
      const copy = ts.slice(); copy.splice(lastIdx + 1, 0, nt); return copy;
    }), []);
    const addLog = useCallback((title, where, mins) => setLog(ls => [...ls, { id: 'log-new-' + Date.now(), title, where, mins }]), []);
    const deleteLog = useCallback((id) => setLog(ls => ls.filter(l => l.id !== id)), []);
    const toggleFilter = useCallback((id) => setFilters(f => { const n = new Set(f); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
    const clearFilters = useCallback(() => setFilters(new Set()), []);

    const shared = {
      theme, hour, activeRole, setActiveRole, openProject, setOpenProject,
      tasks, toggleTask, deleteTask, editTask, addTask,
      log, addLog, deleteLog, filters, toggleFilter, clearFilters,
      demoState, setDemoState, toggleChapter,
    };

    const showDesktop = vpMode === 'both' || vpMode === 'desktop';
    const showMobile = vpMode === 'both' || vpMode === 'mobile';
    const dark = DIRECTIONS.find(d => d.id === theme).dark;

    // fit-to-stage scaling
    const stageRef = useRef(null);
    const [scale, setScale] = useState(1);
    const contentW = (showDesktop ? 1040 : 0) + (showMobile ? 384 : 0) + (showDesktop && showMobile ? 56 : 0);
    const contentH = vpMode === 'mobile' ? 812 : 720;
    useLayoutEffect(() => {
      const fit = () => {
        if (!stageRef.current) return;
        const r = stageRef.current.getBoundingClientRect();
        const s = Math.min((r.width - 80) / contentW, (r.height - 80) / contentH, 1);
        setScale(Math.max(s, 0.32));
      };
      fit();
      window.addEventListener('resize', fit);
      return () => window.removeEventListener('resize', fit);
    }, [contentW, contentH, vpMode]);

    return (
      <div style={SS.root}>
        {/* ── TOOLBAR ── */}
        <div style={SS.toolbar}>
          <div style={SS.tbLeft}>
            <div style={SS.logo}>
              <span style={SS.logoDot} />Roadmap
            </div>
            <span style={SS.tbTag}>redesign · 3 directions</span>
          </div>

          <div style={SS.dirTabs}>
            {DIRECTIONS.map(d => {
              const on = theme === d.id;
              return (
                <button key={d.id} onClick={() => setTheme(d.id)} className={'dir-tab' + (on ? ' on' : '')}>
                  <span style={{ ...SS.dirSw, background: d.sw, boxShadow: on ? `0 0 0 3px ${d.sw}33` : 'none' }} />
                  <span style={SS.dirText}>
                    <span className="dt-name">{d.name}</span>
                    <span style={SS.dirBlurb}>{d.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div style={SS.tbRight}>
            <div style={SS.seg}>
              {VPS.map(v => (
                <button key={v.id} onClick={() => setVpMode(v.id)}
                  style={{ ...SS.segBtn, ...(vpMode === v.id ? SS.segBtnOn : {}) }}>{v.label}</button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <button style={{ ...SS.statesBtn, ...(demoState ? SS.statesBtnOn : {}) }} onClick={() => setStatesMenu(s => !s)}>
                States {demoState ? `· ${demoState}` : ''} ▾
              </button>
              {statesMenu && (
                <div style={SS.statesMenu} onMouseLeave={() => setStatesMenu(false)}>
                  {[['normal', 'Normal'], ['loading', 'Loading'], ['empty', 'Empty folder'], ['allDone', 'All done'], ['error', 'Error banner']].map(([k, lbl]) => (
                    <button key={k} style={{ ...SS.statesItem, ...((demoState || 'normal') === k ? SS.statesItemOn : {}) }}
                      onClick={() => { setDemoState(k === 'normal' ? null : k); setStatesMenu(false); }}>{lbl}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── STAGE ── */}
        <div style={SS.stage} ref={stageRef}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 56, transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform .2s' }}>
            {showDesktop && (
              <div style={SS.frameWrap}>
                <DesktopFrame>
                  <RoadmapApp {...shared} vp="desktop" filterOpen={filterOpenD} setFilterOpen={setFilterOpenD} />
                </DesktopFrame>
                <div style={SS.frameLabel}>Desktop · 1040×720</div>
              </div>
            )}
            {showMobile && (
              <div style={SS.frameWrap}>
                <MobileFrame dark={dark}>
                  <RoadmapApp {...shared} vp="mobile" filterOpen={filterOpenM} setFilterOpen={setFilterOpenM} />
                </MobileFrame>
                <div style={SS.frameLabel}>Mobile · iPhone</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── SHELL STYLES (dark neutral stage, theme-independent) ──
  const SS = {
    root: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#0e0f13', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" },
    toolbar: { display: 'flex', alignItems: 'center', gap: 20, padding: '13px 22px', background: '#15171d', borderBottom: '1px solid #23262f', flexWrap: 'wrap', zIndex: 10 },
    tbLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
    logo: { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600, fontSize: 15, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' },
    logoDot: { width: 9, height: 9, borderRadius: '50%', background: '#3b6ef0', boxShadow: '0 0 10px #3b6ef0' },
    tbTag: { fontSize: 11, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em' },
    dirTabs: { display: 'flex', gap: 6, margin: '0 auto', background: '#0e0f13', padding: 5, borderRadius: 12, border: '1px solid #23262f' },
    dirTab: { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 13px', borderRadius: 9, borderWidth: 1, borderStyle: 'solid', cursor: 'pointer', transition: 'background .14s, border-color .14s' },
    dirSw: { width: 13, height: 13, borderRadius: 4, flexShrink: 0, transition: 'box-shadow .14s' },
    dirText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.25 },
    dirName: { fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' },
    dirBlurb: { fontSize: 10, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" },
    tbRight: { display: 'flex', alignItems: 'center', gap: 10 },
    seg: { display: 'flex', gap: 2, background: '#0e0f13', padding: 3, borderRadius: 9, border: '1px solid #23262f' },
    segBtn: { appearance: 'none', border: 0, background: 'transparent', color: '#9aa0ac', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' },
    segBtnOn: { background: '#2f64df', color: '#fff' },
    statesBtn: { appearance: 'none', border: '1px solid #2c3140', background: '#0e0f13', color: '#9aa0ac', fontSize: 12, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" },
    statesBtnOn: { borderColor: '#3b6ef0', color: '#9db8ff' },
    statesMenu: { position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#1a1d24', border: '1px solid #2c3140', borderRadius: 10, padding: 5, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 150, zIndex: 50, boxShadow: '0 16px 40px rgba(0,0,0,.5)' },
    statesItem: { appearance: 'none', border: 0, background: 'transparent', color: '#cbd2de', fontSize: 12.5, textAlign: 'left', padding: '8px 11px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' },
    statesItemOn: { background: '#22252e', color: '#fff' },
    stage: { flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 40 },
    frameWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
    frameLabel: { fontSize: 11, color: '#6b7280', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' },
  };

  window.__mountRoadmap = function (el) {
    ReactDOM.createRoot(el).render(<Shell />);
  };
})();
