/* ═══════════════════════════════════════════════════════════════
   ROADMAP — shared UI components (themed via CSS; behavior shared)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const { useState, useRef, useEffect } = React;
  const RM = window.RM;

  // phase colors: widely-spaced hues so each leg is clearly its own colour
  const PHASE_OFFSET = [0, 132, 256, 64, 196, 320];
  const phaseHue = (base, ci) => (base + PHASE_OFFSET[((ci % PHASE_OFFSET.length) + PHASE_OFFSET.length) % PHASE_OFFSET.length]) % 360;

  // ─── tiny icon set (simple strokes only) ───
  const I = {
    chevR: <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2l4 4-4 4"/></svg>,
    arrowR: <svg width="13" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6h11M8 2l4 4-4 4"/></svg>,
    back: <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 6H2M6 2L2 6l4 4"/></svg>,
    filter: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3h12M3 7h8M5 11h4"/></svg>,
    chevD: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l4 4 4-4"/></svg>,
    plus: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2.5l2.5 2.5M2 12l1-3 7-7 2 2-7 7-3 1z"/></svg>,
    trash: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3.5h10M5 3.5V2h4v1.5M3.5 3.5l.5 8.5h6l.5-8.5"/></svg>,
  };

  // ─── chips ───
  function ProjectChip({ pid }) {
    const p = RM.PROJECT_BY_ID[pid];
    if (!p) return null;
    return (
      <span className="chip-proj" style={{ '--h': p.hue }}>
        <span className="pdot" />{p.short}
      </span>
    );
  }
  function ContextChip({ id, family }) {
    return (
      <span className={'chip-ctx fam-' + family}>
        <span className="at">@</span>{RM.CONTEXT_LABEL[id] || id}
      </span>
    );
  }

  // ─── ROUTE — journey progress track (one station per task) ───
  function Route({ tasks }) {
    const total = tasks.length;
    const done = tasks.filter(RM.isDone).length;
    const firstTodo = tasks.findIndex(t => !RM.isDone(t));
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
      <div className="route">
        <div className="route-stations">
          {tasks.map((t, i) => {
            let cls = 'station';
            if (RM.isDone(t)) cls += ' done';
            else if (i === firstTodo) cls += ' next';
            return <span key={t.id} className={cls} />;
          })}
        </div>
        <div className="route-track"><div className="route-fill" style={{ '--pct': pct + '%' }} /></div>
      </div>
    );
  }

  // ─── ROLE TIER (formation) ───
  function RoleTier({ activeRole, onSelect, hour }) {
    const dp = RM.daypart(hour);
    const onDuty = RM.onDutyRole(hour);
    return (
      <div className="rm-roles">
        <div className="daypart">
          <span className="dp-glyph">{dp.glyph}</span>
          <div className="dp-meta">
            <span className="dp-now">{dp.label}</span>
            <span className="dp-h">{RM.fmtHour12(hour)}</span>
          </div>
        </div>
        {RM.ROLES.map(r => {
          const active = activeRole === r.id;
          const n = RM.projectsForRole(r.id).reduce((a, p) => {
            const c = RM.counts(window.__TASKS, p.id); return { d: a.d + c.done, t: a.t + c.total };
          }, { d: 0, t: 0 });
          return (
            <button key={r.id}
              className={'role-chip' + (active ? ' active' : (r.id === onDuty ? '' : ' idle'))}
              style={{ '--h': r.hue }}
              onClick={() => onSelect(r.id)}>
              <span className="rc-badge">{r.line}</span>
              <span className="rc-text">
                <span className="rc-name">{r.label}</span>
                <span className="rc-sub">{r.subtitle}</span>
              </span>
              <span className="rc-mini">{n.d}/{n.t}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── FOLDER CARD (focus view) ───
  function FolderCard({ project, tasks, onOpen }) {
    const c = { total: tasks.length, done: tasks.filter(RM.isDone).length };
    const next = tasks.find(t => !RM.isDone(t)) || null;
    const allDone = c.total > 0 && c.done === c.total;
    return (
      <div className="folder-card clickable" style={{ '--h': project.hue }} onClick={onOpen}>
        <div className="fc-head">
          <span className="fc-icon">{project.mono}</span>
          <div className="fc-titles">
            <h2 className="fc-name">{project.label}</h2>
            <div className="fc-sub">{project.short} · {c.total} {c.total === 1 ? 'stop' : 'stops'}</div>
          </div>
          <span className="fc-count"><span className="c-done">{c.done}</span><span className="c-slash">/</span>{c.total}</span>
        </div>
        <Route tasks={tasks} />
        {allDone ? (
          <div className="fc-next empty">
            <div className="nx-body"><div className="nx-title">✦ Route complete — every stop cleared.</div></div>
          </div>
        ) : next ? (
          <div className="fc-next">
            <div className="nx-body">
              <div className="nx-label">{next.kind === 'book' ? 'next chapter' : 'next stop'}</div>
              <div className="nx-title">{next.title}</div>
              <div className="nx-meta">
                {next.projects.map(p => <ProjectChip key={p} pid={p} />)}
                {next.kind === 'book' && (() => { const pr = RM.bookProgress(next); return <span className="nx-book">▤ {pr.done}/{pr.total} ch</span>; })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="fc-next empty">
            <div className="nx-body"><div className="nx-title">No stops yet — add the first.</div></div>
          </div>
        )}
        <div className="fc-foot">
          <span>{c.total - c.done} remaining</span>
          <span className="expand">View all {c.total} {I.arrowR}</span>
        </div>
      </div>
    );
  }

  // ─── ROAD segment — a paved, weaving piece of the route ───
  function RoadSeg({ idx, reached, half }) {
    const even = idx % 2 === 0;
    const entry = even ? 15 : 37;
    const exit = even ? 37 : 15;
    let d;
    if (half === 'bottom') d = `M26 52 C 26 70, ${exit} 78, ${exit} 100`;
    else if (half === 'top') d = `M${entry} 0 C ${entry} 22, 26 30, 26 52`;
    else d = `M${entry} 0 C ${entry} 50, ${exit} 50, ${exit} 100`;
    return (
      <svg className={'road-seg' + (reached ? ' traveled' : '')} viewBox="0 0 52 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="road-edge" d={d} />
        <path className="road-base" d={d} />
        <path className="road-lane" d={d} />
      </svg>
    );
  }

  // ─── ROUTE STOP (task = station on the road) ───
  function StopRow({ task, idx, reached, hue, onToggle, onDelete, onEdit, dimmed, done, next }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(task.title);
    const inputRef = useRef(null);
    useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
    const commit = () => { if (val.trim()) onEdit(task.id, val.trim()); setEditing(false); };
    const ctx = RM.contextChips(task);
    return (
      <div className={'rt-row stop' + (done ? ' done' : (next ? ' next' : '')) + (dimmed ? ' dimmed' : '')}
           style={{ '--h': hue }}
           onDoubleClick={() => setEditing(true)}>
        <div className="rt-rail">
          <RoadSeg idx={idx} reached={reached} />
          <button className={'node stop-node' + (done ? ' done' : '') + (next ? ' next' : '') + (task.linkedFrom ? ' linked' : '')}
            onClick={() => onToggle(task.id)} aria-label="toggle done" />
        </div>
        <div className="rt-body">
          <div className="t-main">
            {next && <span className="here-pip">you are here</span>}
            {editing ? (
              <input ref={inputRef} className="add-input" value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(task.title); setEditing(false); } }}
                onBlur={commit} style={{ borderBottom: 'none' }} />
            ) : (
              <span className="t-title">{task.title}</span>
            )}
          </div>
          <span className="t-tags">
            {task.projects.map(p => <ProjectChip key={p} pid={p} />)}
            {task.linkedFrom && <span className="chip-link" title={'Shared with ' + RM.PROJECT_BY_ID[task.linkedFrom].label}>↗ {RM.PROJECT_BY_ID[task.linkedFrom].label}</span>}
            {ctx.map(c => <ContextChip key={c.id} id={c.id} family={c.family} />)}
          </span>
          <span className="t-actions">
            <button className="act-btn" onClick={() => setEditing(true)} aria-label="rename">{I.edit}</button>
            <button className="act-btn del" onClick={() => onDelete(task.id)} aria-label="delete">{I.trash}</button>
          </span>
        </div>
      </div>
    );
  }

  // ─── BOOK STOP (opens into its own little route of chapters) ───
  function BookRow({ task, idx, reached, hue, onToggleBook, onToggleChapter, onDelete, dimmed, done, next }) {
    const [open, setOpen] = useState(false);
    const pr = RM.bookProgress(task);
    const firstUnread = task.chapters.findIndex(c => !c.done);
    return (
      <React.Fragment>
        <div style={{ '--h': hue }} className={'rt-row book' + (done ? ' done' : (next ? ' next' : '')) + (dimmed ? ' dimmed' : '') + (open ? ' open' : '')}>
          <div className="rt-rail">
            <RoadSeg idx={idx} reached={reached} />
            <button className={'node stop-node book-node' + (done ? ' done' : '') + (next ? ' next' : '')}
              onClick={() => onToggleBook(task.id)} aria-label="mark book read" />
          </div>
          <div className="rt-body">
            <button className="book-main" onClick={() => setOpen(o => !o)}>
              {next && <span className="here-pip">you are here</span>}
              <span className="book-titleline">
                <span className="book-glyph" aria-hidden>▤</span>
                <span className="t-title">{task.title}</span>
                <span className={'book-caret' + (open ? ' open' : '')} aria-hidden>{I.chevD}</span>
              </span>
              <span className="book-route">
                <span className="book-stations">
                  {task.chapters.map((c, i) => (
                    <span key={i} className={'b-stop' + (c.done ? ' done' : (i === firstUnread ? ' next' : ''))} />
                  ))}
                </span>
                <span className="book-count">{pr.done}/{pr.total} ch read</span>
              </span>
            </button>
            <span className="t-tags">
              {task.projects.map(p => <ProjectChip key={p} pid={p} />)}
              {task.mode && <ContextChip id={task.mode} family="mode" />}
            </span>
            <span className="t-actions">
              <button className="act-btn del" onClick={() => onDelete(task.id)} aria-label="delete">{I.trash}</button>
            </span>
          </div>
        </div>
        {open && (
          <div className="chapter-list rt-chapters" style={{ '--h': hue }}>
            {task.chapters.map((c, i) => (
              <button key={i} className={'chapter-row' + (c.done ? ' done' : '')} onClick={() => onToggleChapter(task.id, i)}>
                <span className={'ch-check' + (c.done ? ' done' : '')} />
                <span className="ch-idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="ch-name">{c.title}</span>
              </button>
            ))}
          </div>
        )}
      </React.Fragment>
    );
  }

  // ─── EXPANDED VIEW = the route map (a real road: departure → waypoints → destination) ───
  function Tree({ project, tasks, visState, onToggle, onDelete, onEdit, onAdd, onToggleChapter }) {
    const [collapsed, setCollapsed] = useState({});
    const [adding, setAdding] = useState(null);
    const [draft, setDraft] = useState('');
    const rootRef = useRef(null);

    const jumpToPhase = (key) => {
      setCollapsed(s => { const n = { ...s }; delete n[key]; return n; });
      setTimeout(() => {
        const root = rootRef.current; if (!root) return;
        const sc = root.closest('.rm-scroll'); if (!sc) return;
        const el = (key === '__flat__') ? root : root.querySelector('[data-phase="' + key + '"]');
        if (!el) return;
        const headerH = (sc.querySelector('.rm-header') || {}).offsetHeight || 0;
        const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - headerH - 12;
        try { sc.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' }); } catch (e) {}
        sc.scrollTop = Math.max(top, 0);
      }, 40);
    };

    // group by chapter, preserving order
    const chapters = [];
    const byChap = new Map();
    tasks.forEach(t => {
      const key = t.chapter || '__flat__';
      if (!byChap.has(key)) { byChap.set(key, []); chapters.push(key); }
      byChap.get(key).push(t);
    });

    const total = tasks.length;
    const doneCount = tasks.filter(RM.isDone).length;
    const pct = total ? Math.round(doneCount / total * 100) : 0;
    const nextTask = tasks.find(t => !RM.isDone(t));
    const nextId = nextTask ? nextTask.id : null;
    const complete = total > 0 && doneCount === total;
    // per-phase legs for the journey overview bar
    const legs = chapters.map((key) => {
      const list = byChap.get(key);
      const ci = chapters.filter(k => k !== '__flat__').indexOf(key);
      const hue = key === '__flat__' ? project.hue : phaseHue(project.hue, ci);
      return { key, hue, total: list.length, done: list.filter(RM.isDone).length };
    });
    const commitAdd = (chapKey) => { if (draft.trim()) onAdd(project.id, chapKey === '__flat__' ? null : chapKey, draft.trim()); setDraft(''); setAdding(null); };

    // build the ordered list of rail items so the road weaves & lights up continuously
    const items = [{ type: 'departure' }];
    chapters.forEach((key) => {
      const list = byChap.get(key);
      const isFlat = key === '__flat__';
      const ci = chapters.filter(k => k !== '__flat__').indexOf(key);
      const hue = isFlat ? project.hue : phaseHue(project.hue, ci);
      const cDone = list.filter(RM.isDone).length;
      if (!isFlat) items.push({ type: 'waypoint', key, ci, hue, cDone, total: list.length, chDone: cDone === list.length, chCurrent: list.some(t => t.id === nextId), col: !!collapsed[key] });
      if (!collapsed[key]) {
        list.forEach(t => { if (!visState(t).hidden) items.push({ type: t.kind === 'book' ? 'book' : 'stop', task: t, hue, dimmed: visState(t).dimmed }); });
        items.push({ type: 'add', key, hue });
      }
    });
    items.push({ type: 'destination' });
    // road is "reached" (paved in colour) up to & including the current stop
    let passed = false;
    items.forEach(it => { it.reached = !passed; if (it.task && it.task.id === nextId) passed = true; });

    return (
      <div className="route-tree" style={{ '--h': project.hue }} ref={rootRef}>
        <div className="route-head">
          <div className="rh-top">
            <span className="rh-stat"><b>{doneCount}</b> of {total} stops cleared</span>
            <span className="rh-pct">{pct}%</span>
          </div>
          <div className="rh-bar seg">
            {legs.map(s => (
              <div key={s.key} className="rh-seg" style={{ flexGrow: s.total, '--h': s.hue }} title={`${s.key === '__flat__' ? 'Tasks' : s.key}: ${s.done}/${s.total}`}>
                <div className="rh-seg-fill" style={{ width: (s.total ? s.done / s.total * 100 : 0) + '%' }} />
              </div>
            ))}
          </div>
          <div className="rh-goal">
            <span className="rh-left"><span className="rh-flag">⚐</span> Destination · {project.goal}</span>
            <span className="rh-dist">{complete ? 'Arrived' : `${total - doneCount} ${total - doneCount === 1 ? 'stop' : 'stops'} to go`}</span>
          </div>
          {legs.length > 1 && (
            <div className="rh-legend">
              {legs.map(s => (
                <button key={s.key} className="rh-leg" style={{ '--h': s.hue }} onClick={() => jumpToPhase(s.key)} title={'Jump to ' + (s.key === '__flat__' ? 'tasks' : s.key)}>
                  <span className="rh-leg-dot" />{s.key === '__flat__' ? 'Tasks' : s.key.split(' · ')[0]}
                  <span className="rh-leg-ct">{s.done}/{s.total}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.map((it, idx) => {
          if (it.type === 'departure') return (
            <div className="rt-row marker start" key="dep">
              <div className="rt-rail"><RoadSeg idx={idx} reached={it.reached} half="bottom" /><span className="node start-node" /></div>
              <div className="rt-body"><span className="rt-marker-title">Departure</span><span className="rt-marker-sub">where the route begins</span></div>
            </div>
          );
          if (it.type === 'waypoint') return (
            <div key={it.key} style={{ '--h': it.hue }} data-phase={it.key} className={'rt-row marker waypoint' + (it.chDone ? ' filled' : (it.chCurrent ? ' current' : ''))}
                 onClick={() => setCollapsed(s => ({ ...s, [it.key]: !s[it.key] }))}>
              <div className="rt-rail"><RoadSeg idx={idx} reached={it.reached} /><span className="node wp-node">{String(it.ci + 1).padStart(2, '0')}</span></div>
              <div className="rt-body wp-body">
                <span className="wp-title">{it.key}</span>
                <span className="wp-meta"><span className="wp-count">{it.cDone}/{it.total}</span><span className={'wp-twist' + (it.col ? ' col' : '')}>{I.chevD}</span></span>
              </div>
            </div>
          );
          if (it.type === 'stop') return <StopRow key={it.task.id} task={it.task} idx={idx} reached={it.reached} hue={it.hue} dimmed={it.dimmed} done={RM.isDone(it.task)} next={it.task.id === nextId} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />;
          if (it.type === 'book') return <BookRow key={it.task.id} task={it.task} idx={idx} reached={it.reached} hue={it.hue} dimmed={it.dimmed} done={RM.isDone(it.task)} next={it.task.id === nextId} onToggleBook={onToggle} onToggleChapter={onToggleChapter} onDelete={onDelete} />;
          if (it.type === 'add') return (
            <div className="rt-row addstop" style={{ '--h': it.hue }} key={'add-' + it.key}>
              <div className="rt-rail"><RoadSeg idx={idx} reached={it.reached} /><span className="node add-node">{I.plus}</span></div>
              <div className="rt-body">
                {adding === it.key ? (
                  <input autoFocus className="add-input" placeholder="Name this stop… (enter to add)" value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitAdd(it.key); if (e.key === 'Escape') { setDraft(''); setAdding(null); } }}
                    onBlur={() => { setDraft(''); setAdding(null); }} />
                ) : (
                  <button className="add-btn-rt" onClick={() => setAdding(it.key)}>Add a stop</button>
                )}
              </div>
            </div>
          );
          // destination
          return (
            <div key="dest" className={'rt-row marker destination' + (complete ? ' reached' : '')}>
              <div className="rt-rail"><RoadSeg idx={idx} reached={it.reached || complete} half="top" /><span className="node dest-node" aria-hidden>⚑</span></div>
              <div className="rt-body">
                <span className="rt-marker-title">{complete ? 'Destination reached' : 'Destination'}</span>
                <span className="rt-marker-sub">{complete ? `You made it — ${project.goal.toLowerCase()}.` : project.goal}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ─── FILTER PANEL (popover desktop / sheet mobile) ───
  function FilterPanel({ filters, onToggle, onClear, onClose }) {
    const wrapRef = useRef(null);
    useEffect(() => {
      const onKey = e => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, []);
    const total = filters.size;
    const groups = [
      { fam: 'where', label: 'Where', mode: 'hides others' },
      { fam: 'mode', label: 'Mode', mode: 'hides others' },
      { fam: 'priority', label: 'Priority', mode: 'dims others' },
    ];
    return (
      <React.Fragment>
        <div className="filter-backdrop" onClick={onClose} />
        <div className="filter-pop" ref={wrapRef}>
          <div className="filter-head">
            <h4>Filter</h4>
            <button className="filter-close" onClick={onClose} aria-label="close">×</button>
          </div>
          {groups.map(g => (
            <div className="filter-group" key={g.fam}>
              <div className="filter-glabel">{g.label}<span className="tag-mode">{g.mode}</span></div>
              <div className="filter-opts">
                {RM.CONTEXTS[g.fam].map(c => (
                  <button key={c.id}
                    className={'fchip' + (filters.has(c.id) ? ' on' : '') + (g.fam === 'priority' ? ' prio' : '')}
                    onClick={() => onToggle(c.id)}>
                    <span className="at">@</span>{c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="filter-foot">
            <span className="ct">{total ? total + ' active' : 'no filters'}</span>
            <button className="rm-clear" disabled={!total} onClick={onClear}>Clear all</button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  // ─── TODAY'S LOG ───
  function TodaysLog({ log, onAdd, onDelete, dateStr }) {
    const [drafting, setDrafting] = useState(false);
    const [note, setNote] = useState('');
    const [where, setWhere] = useState('home');
    const [dur, setDur] = useState('');
    const commit = () => {
      if (!note.trim()) return;
      onAdd(note.trim(), where, parseInt(dur, 10) || 15);
      setNote(''); setDur(''); setDrafting(false);
    };
    return (
      <section className="rm-log">
        <div className="rm-log-head">
          <h3>Today's Log</h3>
          <span className="ld-date">{dateStr}</span>
        </div>
        {log.length === 0 ? (
          <div className="log-empty">
            <span className="le-glyph">✎</span>
            <span>Nothing logged yet today — capture the first thing you finished and watch the day fill in.</span>
          </div>
        ) : log.map(l => (
          <div className="log-row" key={l.id}>
            <span className="l-tick">●</span>
            <span className="l-title">{l.title}</span>
            <span className="l-where">@{l.where}</span>
            <span className="l-dur">{l.mins}m</span>
            <button className="act-btn del logdel" onClick={() => onDelete(l.id)} aria-label="delete log">{I.trash}</button>
          </div>
        ))}
        {drafting ? (
          <div className="log-draft">
            <input className="ld-note" autoFocus placeholder="What did you finish?" value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setDrafting(false); }} />
            <select value={where} onChange={e => setWhere(e.target.value)}>
              {RM.CONTEXTS.where.map(w => <option key={w.id} value={w.id}>@{w.label}</option>)}
            </select>
            <input className="ld-dur" type="number" min="1" placeholder="min" value={dur} onChange={e => setDur(e.target.value)} />
            <button className="ld-commit" onClick={commit}>Log it</button>
            <button className="ld-cancel" onClick={() => setDrafting(false)}>Cancel</button>
          </div>
        ) : (
          <div className="log-add">
            <button className="la-trigger" onClick={() => setDrafting(true)}>{I.plus} Log something I just finished</button>
          </div>
        )}
      </section>
    );
  }

  // ─── SYSTEM STATES ───
  function SkeletonGrid({ mobile }) {
    const n = mobile ? 2 : 4;
    return (
      <div className="focus-grid">
        {Array.from({ length: n }).map((_, i) => (
          <div className="skel-card" key={i}>
            <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 16 }}>
              <div className="skel" style={{ width: 34, height: 34, borderRadius: 9 }} />
              <div style={{ flex: 1 }}>
                <div className="skel" style={{ width: '60%', height: 13, marginBottom: 7 }} />
                <div className="skel" style={{ width: '35%', height: 9 }} />
              </div>
            </div>
            <div className="skel" style={{ width: '100%', height: 4, marginBottom: 16 }} />
            <div className="skel" style={{ width: '100%', height: 52, borderRadius: 9 }} />
          </div>
        ))}
      </div>
    );
  }
  function EmptyState({ onAdd }) {
    return (
      <div className="state-block">
        <div className="sb-glyph">○</div>
        <h2>This folder's a clean slate</h2>
        <p>No stops on this route yet. Drop in the first task and the path starts drawing itself.</p>
        <button className="sb-cta" onClick={onAdd}>Add the first stop</button>
      </div>
    );
  }
  function AllDoneState({ onBack }) {
    return (
      <div className="state-block done-state">
        <div className="sb-glyph">✓</div>
        <h2>Every stop cleared</h2>
        <p>You've reached the end of this route. Nothing left to do here — take the win.</p>
        <button className="sb-cta" onClick={onBack}>Back to focus</button>
      </div>
    );
  }
  function ErrorBanner({ onRetry, onDismiss }) {
    return (
      <div className="err-banner">
        <span className="eb-icon">⚠</span>
        <span className="eb-msg">Couldn't save that change — you're offline. Your edits are kept locally.</span>
        <button className="eb-retry" onClick={onRetry}>Retry</button>
        <button className="eb-dismiss" onClick={onDismiss}>Dismiss</button>
      </div>
    );
  }

  Object.assign(window, {
    RMUI: { I, ProjectChip, ContextChip, Route, RoleTier, FolderCard, StopRow, BookRow, Tree,
      FilterPanel, TodaysLog, SkeletonGrid, EmptyState, AllDoneState, ErrorBanner },
  });
})();
