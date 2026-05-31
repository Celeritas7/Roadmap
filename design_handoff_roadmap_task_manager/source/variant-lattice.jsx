// variant-lattice.jsx — B · Lattice
// Linear/Geist energy: light gray canvas, dense rows, segmented filter
// toolbar, project = dot + label chip, context = low-contrast text pill.

(function () {
  const { useState, useRef, useCallback } = React;

  if (!document.getElementById('lat-styles')) {
    const s = document.createElement('style');
    s.id = 'lat-styles';
    s.textContent = `
.lat{ --bg:#fafaf8; --panel:#ffffff; --ink:#1a1a18; --ink-2:#5f5f5b; --ink-3:#a3a39e; --ink-4:#c8c8c2;
      --rule:#ececea; --rule-strong:#d8d8d4; --hover:rgba(0,0,0,.035);
      --sans:'Geist', ui-sans-serif, system-ui, sans-serif;
      --serif:'Newsreader', ui-serif, Georgia, serif;
      --mono:'Geist Mono', ui-monospace, monospace;
      position:relative; width:100%; height:100%; overflow:auto;
      background:var(--bg); color:var(--ink); font-family:var(--sans); font-feature-settings:"ss01","cv11"; }
.lat.font-serif{ font-family:var(--serif); }
.lat.font-mono { font-family:var(--mono); letter-spacing:-.005em; }
.lat .frame{ display:grid; grid-template-rows:auto 1fr; min-height:100%; }

/* density */
.lat.den-compact { --rowh:30px; --base:13px;   --gap:0;    --pad:18px; }
.lat.den-cozy    { --rowh:36px; --base:13.5px; --gap:1px;  --pad:22px; }
.lat.den-comfy   { --rowh:44px; --base:14.5px; --gap:3px;  --pad:28px; }
.lat{ font-size:var(--base); }

/* topbar */
.lat .topbar{ position:sticky; top:0; z-index:5; background:rgba(250,250,248,.85);
              backdrop-filter:blur(12px); border-bottom:1px solid var(--rule);
              padding:14px var(--pad) 0; }
.lat .toprow{ display:flex; align-items:center; justify-content:space-between; gap:16px; }
.lat .title{ display:flex; align-items:baseline; gap:10px; }
.lat .title h1{ font-size:18px; font-weight:600; letter-spacing:-.01em; margin:0; color:var(--ink); }
.lat .title .kbd{ color:var(--ink-3); font-size:11px; font-family:var(--mono); }
.lat .right{ display:flex; align-items:center; gap:12px; color:var(--ink-3); font-size:12px; font-family:var(--mono); font-feature-settings:"tnum"; }
.lat .right .pill{ background:#fff; border:1px solid var(--rule-strong); padding:4px 10px; border-radius:6px; color:var(--ink-2); }

/* roles tier */
.lat .roles{ display:flex; align-items:center; gap:4px; padding:8px 0 4px;
             border-bottom:1px solid var(--rule); flex-wrap:wrap; }
.lat .daypart{ display:flex; align-items:center; gap:8px; padding:3px 10px 3px 4px;
               margin-right:6px; border-right:1px solid var(--rule); }
.lat .daypart .em{ font-size:16px; line-height:1; }
.lat .daypart .meta{ display:flex; flex-direction:column; line-height:1.2; }
.lat .daypart .meta .now{ font-size:11.5px; color:var(--ink); font-weight:500; }
.lat .daypart .meta .h{ font-size:10.5px; color:var(--ink-3); font-family:var(--mono); font-feature-settings:"tnum"; }

.lat .role{ appearance:none; border:0; cursor:default; font:inherit; padding:5px 10px 5px 8px;
            border-radius:6px; background:transparent; color:var(--ink-2);
            display:inline-flex; align-items:center; gap:7px; line-height:1.3;
            transition:background .12s, opacity .15s, color .12s, box-shadow .12s;
            box-shadow:inset 0 0 0 1px transparent; }
.lat .role:hover{ background:var(--hover); }
.lat .role .dot{ width:8px; height:8px; border-radius:50%; flex-shrink:0;
                 background:hsl(var(--h) 50% 60%); }
.lat .role .name{ font-size:12.5px; font-weight:500; color:var(--ink); }
.lat .role .sub{ font-size:11px; color:var(--ink-3); font-family:var(--mono); }
.lat .role.active{ background:#fff; box-shadow:inset 0 0 0 1px var(--rule-strong); }
.lat .role.active .dot{ background:hsl(var(--h) 55% 50%); box-shadow:0 0 0 3px hsl(var(--h) 70% 55% / .14); }
.lat .role.muted{ opacity:.42; }
.lat .role.muted .dot{ background:var(--ink-4); }
.lat .role.muted:hover{ opacity:.7; }
.lat .role .pin{ font-family:var(--mono); font-size:9px; padding:1px 5px; border-radius:3px;
                 letter-spacing:.04em; background:var(--bg); color:var(--ink-3); }
.lat .role.active .pin{ background:hsl(var(--h) 60% 92%); color:hsl(var(--h) 50% 32%); }

/* muted folder */
.lat .folder.muted{ opacity:.35; filter:saturate(.35); }
.lat .folder.muted:hover{ opacity:.6; }

/* folders + filters bar */
.lat .fbar{ display:flex; align-items:center; gap:10px; padding:14px 0; flex-wrap:wrap; }
.lat .folders{ display:flex; align-items:center; gap:6px; flex:1 1 auto; min-width:0; flex-wrap:wrap; }
.lat .flabel{ font-size:11px; color:var(--ink-3); text-transform:uppercase;
              letter-spacing:.08em; margin-right:6px; font-family:var(--mono); }

.lat .folder{ appearance:none; border:1px solid var(--rule-strong); background:#fff; cursor:default;
              padding:5px 10px 5px 8px; border-radius:7px; font:inherit;
              display:inline-flex; align-items:center; gap:7px; line-height:1.3;
              color:var(--ink-2); font-size:12.5px; transition:all .12s; min-height:30px; }
.lat .folder:hover{ border-color:var(--ink-3); background:#fdfdfb; }
.lat .folder.on{ border-color:hsl(var(--h) 50% 60%); background:hsl(var(--h) 60% 97%);
                 color:hsl(var(--h) 50% 28%); box-shadow:0 1px 2px rgba(0,0,0,.04); }
.lat .folder .ficon{ width:14px; height:14px; color:hsl(var(--h) 55% 50%); }
.lat .folder .fcount{ font-family:var(--mono); font-size:10px; color:var(--ink-3);
                      background:var(--bg); padding:1px 5px; border-radius:3px;
                      font-feature-settings:"tnum"; }
.lat .folder.on .fcount{ background:hsl(var(--h) 60% 92%); color:hsl(var(--h) 50% 32%); }

.lat .ftools{ display:flex; align-items:center; gap:6px; flex-shrink:0; }
.lat .fbtn{ appearance:none; border:1px solid var(--rule-strong); background:#fff; cursor:default;
            padding:5px 10px; border-radius:6px; font:inherit; font-size:12.5px;
            color:var(--ink-2); display:inline-flex; align-items:center; gap:7px; min-height:30px;
            transition:all .12s; }
.lat .fbtn:hover{ border-color:var(--ink-3); color:var(--ink); }
.lat .fbtn.has-active{ border-color:var(--accent); color:var(--accent); background:#fff; }
.lat .fbtn .badge{ background:var(--accent); color:#fff; font-family:var(--mono); font-size:10px;
                   padding:1px 6px; border-radius:8px; font-feature-settings:"tnum"; }
.lat .fbtn .chev{ width:10px; height:10px; transition:transform .15s; opacity:.6; }
.lat .fbtn.open .chev{ transform:rotate(180deg); }
.lat .filterwrap{ position:relative; }
.lat .clear{ font-size:11px; color:var(--ink-3); border:1px solid transparent; background:transparent;
             padding:5px 8px; border-radius:6px; cursor:default; font-family:inherit; }
.lat .clear:hover:not(:disabled){ color:var(--ink); background:var(--hover); }
.lat .clear:disabled{ opacity:.35; }

.lat .pop{ position:absolute; top:calc(100% + 6px); right:0; z-index:20; min-width:340px;
           background:#fff; border:1px solid var(--rule-strong); border-radius:8px;
           box-shadow:0 10px 32px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.02);
           padding:4px; display:flex; flex-direction:column; }
.lat .pop .group{ padding:8px 10px; margin:0; border-top:1px solid var(--rule); }
.lat .pop .group:first-child{ border-top:0; }
.lat .pop .glabel{ font-size:10.5px; color:var(--ink-3); text-transform:uppercase;
                   letter-spacing:.08em; font-family:var(--mono); margin-bottom:6px; display:block; }
.lat .pop .opts{ display:flex; flex-wrap:wrap; gap:3px; }
.lat .pop .fchip{ appearance:none; border:0; background:transparent; color:var(--ink-2);
                  padding:4px 8px; font-size:12px; font-family:inherit; border-radius:5px;
                  cursor:default; transition:background .12s, color .12s; line-height:1.3;
                  display:inline-flex; align-items:center; gap:5px; }
.lat .pop .fchip:hover{ background:var(--hover); color:var(--ink); }
.lat .pop .fchip.on{ background:var(--accent); color:#fff; }
.lat .pop .fchip .at{ opacity:.6; }
.lat .pop .fchip.on .at{ opacity:.8; }
.lat .pop .popfoot{ padding:8px 10px; border-top:1px solid var(--rule);
                    display:flex; justify-content:space-between; align-items:center; }
.lat .pop .popfoot .ct{ font-size:11px; color:var(--ink-3); font-family:var(--mono); }

/* main content scroll area */
.lat .main{ padding:0 var(--pad) 80px; }

/* tree */
.lat .group{ margin-top:18px; }
.lat .group.depth-0 > .ghead{ padding:14px 0 10px; border-top:1px solid var(--rule); display:flex; align-items:center; gap:8px; cursor:default; user-select:none; }
.lat .group.depth-0:first-child > .ghead{ border-top:0; padding-top:10px; }
.lat .group.depth-1 > .ghead{ padding:8px 0 6px 22px; display:flex; align-items:center; gap:8px; cursor:default; user-select:none; }
.lat .ghead .twist{ font-family:var(--mono); font-size:10px; color:var(--ink-3); width:12px; transition:transform .15s; }
.lat .ghead.col .twist{ transform:rotate(-90deg); }
.lat .ghead h2{ margin:0; font-size:13px; font-weight:600; color:var(--ink); letter-spacing:-.005em; }
.lat .group.depth-1 .ghead h2{ font-size:12px; color:var(--ink-2); font-weight:500; }
.lat .ghead .meta{ margin-left:auto; display:flex; gap:6px; align-items:center; color:var(--ink-3);
                   font-size:11px; font-family:var(--mono); font-feature-settings:"tnum"; }
.lat .ghead .bar{ width:60px; height:3px; background:var(--rule); border-radius:2px; position:relative; overflow:hidden; }
.lat .ghead .bar::after{ content:''; position:absolute; inset:0 auto 0 0; background:var(--accent); width:var(--pct,0%); }

/* task row */
.lat .rows{ display:flex; flex-direction:column; gap:var(--gap); }
.lat .group.depth-1 .rows{ padding-left:22px; }
.lat .row{ display:grid; grid-template-columns:22px 18px 1fr auto; gap:10px; align-items:center;
           min-height:var(--rowh); padding:0 8px 0 0; border-radius:6px; position:relative; cursor:default;
           transition:background .1s; }
.lat .row:hover{ background:var(--hover); }
.lat .row.drag-over-top::before{ content:''; position:absolute; left:30px; right:0; top:-1px; height:2px; background:var(--accent); border-radius:1px; }
.lat .row.drag-over-bot::after { content:''; position:absolute; left:30px; right:0; bottom:-1px; height:2px; background:var(--accent); border-radius:1px; }
.lat .row.dragging{ opacity:.35; }
.lat .grip{ color:var(--ink-3); font-size:10px; opacity:0; cursor:grab; user-select:none;
            font-family:var(--mono); text-align:center; padding:4px 0; line-height:1; }
.lat .row:hover .grip{ opacity:.7; }
.lat .check{ appearance:none; width:14px; height:14px; border-radius:4px; cursor:default;
             border:1.5px solid var(--ink-4); background:#fff; padding:0;
             display:inline-flex; align-items:center; justify-content:center;
             transition:background .12s, border-color .12s; }
.lat .check:hover{ border-color:var(--accent); }
.lat .check.done{ background:var(--accent); border-color:var(--accent); }
.lat .check.done::after{ content:''; width:6px; height:3px; border-left:1.5px solid #fff;
                         border-bottom:1.5px solid #fff; transform:rotate(-45deg) translateY(-1px); }
.lat .title-c{ color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lat .row.done .title-c{ color:var(--ink-3); text-decoration:line-through; text-decoration-color:var(--ink-4); }
.lat .tags{ display:flex; align-items:center; gap:6px; flex-wrap:nowrap; font-size:11px; flex-shrink:0; }

/* tag styles */
.lat .tag{ display:inline-flex; align-items:center; gap:5px; padding:2px 8px; border-radius:5px;
           font-family:var(--sans); font-size:11px; line-height:1.4; letter-spacing:-.005em; }
.lat.font-mono .tag{ font-family:var(--mono); font-size:10.5px; }
.lat .tag.proj{ background:hsl(var(--h) 50% 96%); color:hsl(var(--h) 45% 30%);
                box-shadow:inset 0 0 0 1px hsl(var(--h) 35% 88%); }
.lat .tag.proj .pdot{ width:6px; height:6px; border-radius:50%; background:hsl(var(--h) 55% 50%); }
.lat .tag.ctx{ background:transparent; color:var(--ink-3); padding:2px 4px; font-family:var(--mono); font-size:10.5px; }
.lat .tag.ctx .at{ color:var(--ink-4); }

.lat.ts-bracket .tag.ctx{ color:var(--ink-2); }
.lat.ts-bracket .tag.proj{ background:transparent; box-shadow:none; color:hsl(var(--h) 50% 32%); padding:2px 4px; font-family:var(--mono); }
.lat.ts-bracket .tag.proj .pdot{ display:none; }
.lat.ts-underline .tag.ctx{ text-decoration:underline; text-decoration-color:var(--ink-4); text-underline-offset:3px; }
.lat.ts-underline .tag.proj{ background:transparent; box-shadow:none; color:hsl(var(--h) 45% 32%); padding:2px 4px; }
.lat.ts-hashtag .tag.ctx{ color:var(--ink-2); }
.lat.ts-hashtag .tag.proj{ background:transparent; box-shadow:none; color:hsl(var(--h) 45% 32%); padding:2px 4px; }

/* add task */
.lat .addrow{ display:grid; grid-template-columns:22px 18px 1fr; gap:10px; align-items:center;
              min-height:var(--rowh); padding:0 8px 0 0; color:var(--ink-3); }
.lat .addrow .check{ border-style:dashed; }
.lat .addrow input{ border:0; background:transparent; outline:none; font:inherit; color:var(--ink); width:100%; }
.lat .addrow input::placeholder{ color:var(--ink-3); }

/* empty state */
.lat .empty{ padding:48px 20px 60px; text-align:center; max-width:480px; margin:32px auto 0;
             border:1px dashed var(--rule-strong); border-radius:12px; background:#fff; }
.lat .empty h2{ margin:0 0 8px; font-size:14px; font-weight:600; color:var(--ink); letter-spacing:-.005em; }
.lat .empty p{ color:var(--ink-3); font-size:12.5px; margin:0 0 20px; line-height:1.5; }
.lat .empty kbd{ background:var(--bg); border:1px solid var(--rule-strong); border-bottom-width:2px;
                 padding:1px 6px; border-radius:4px; font-family:var(--mono); font-size:11px;
                 color:var(--ink-2); margin:0 1px; }
.lat .empty .pickfrom{ display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
.lat .empty .pickbtn{ appearance:none; border:1px solid var(--rule-strong); background:#fff;
                      color:hsl(var(--h) 50% 30%); padding:6px 12px; border-radius:6px; cursor:default;
                      font:inherit; font-size:12.5px; display:inline-flex; align-items:center; gap:7px;
                      transition:all .12s; }
.lat .empty .pickbtn:hover{ border-color:hsl(var(--h) 50% 60%); background:hsl(var(--h) 60% 97%); transform:translateY(-1px); }
.lat .empty .pickbtn .ficon{ width:13px; height:13px; color:hsl(var(--h) 55% 50%); }

/* log section */
.lat .log{ margin-top:40px; padding:18px 0 0; border-top:1px solid var(--rule); }
.lat .log h3{ margin:0 0 10px; font-size:11px; font-weight:600; letter-spacing:.08em;
              text-transform:uppercase; color:var(--ink-3); font-family:var(--mono); }
.lat .log h3 .date{ color:var(--ink-2); margin-left:8px; font-family:var(--sans); font-weight:500; text-transform:none; letter-spacing:0; }
.lat.font-mono .log h3 .date{ font-family:var(--mono); }
.lat .logrow{ display:grid; grid-template-columns:14px 1fr auto auto; gap:10px; align-items:center;
              padding:7px 0; font-size:13px; }
.lat .logrow .tick{ color:var(--accent); font-size:11px; line-height:1; }
.lat .logrow .t{ color:var(--ink-2); }
.lat .logrow .where{ font-family:var(--mono); font-size:11px; color:var(--ink-3); }
.lat .logrow .dur{ font-family:var(--mono); font-size:11px; color:var(--ink-2); font-feature-settings:"tnum"; }
.lat .logadd{ display:grid; grid-template-columns:14px 1fr; gap:10px; align-items:center;
              padding:8px 0 0; border-top:1px dashed var(--rule); margin-top:4px; }
.lat .logadd .plus{ color:var(--accent); }
.lat .logadd input{ border:0; background:transparent; outline:none; font:inherit; width:100%;
                    color:var(--ink); padding:2px 0; }
.lat .logadd input::placeholder{ color:var(--ink-3); }
`;
    document.head.appendChild(s);
  }

  // count tasks tagged with a given id
  function countTasksWithTag(tree, tagId) {
    let n = 0;
    window.visitTasks(tree, t => { if (t.tags.includes(tagId)) n++; });
    return n;
  }

  function FilterChip({ active, label, onClick }) {
    const at = label.startsWith('@');
    return (
      <button className={'fchip' + (active ? ' on' : '')} onClick={onClick}>
        {at ? <React.Fragment><span className="at">@</span>{label.slice(1)}</React.Fragment> : label}
      </button>
    );
  }

  const FolderSVG = () => (
    <svg className="ficon" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M1 3.5C1 2.7 1.7 2 2.5 2H6L7.5 3.5H13.5C14.3 3.5 15 4.2 15 5V11.5C15 12.3 14.3 13 13.5 13H2.5C1.7 13 1 12.3 1 11.5V3.5Z" fill="currentColor" fillOpacity="0.22"/>
    </svg>
  );

  function FolderTab({ project, count, active, muted, onClick }) {
    return (
      <button
        className={'folder' + (active ? ' on' : '') + (muted ? ' muted' : '')}
        style={{ '--h': project.hue }}
        onClick={onClick}
        title={muted ? `${project.label} — role inactive` : project.label}
      >
        <FolderSVG />
        <span>{project.label}</span>
        <span className="fcount">{count}</span>
      </button>
    );
  }

  function FilterDropdown({ filters, toggleFilter, clearFilters }) {
    const [open, setOpen] = useState(false);
    const wrap = useRef(null);
    React.useEffect(() => {
      if (!open) return;
      const onDoc = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
      const onKey = e => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
      return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);
    const ctxActive = filters.contexts.size;
    return (
      <div className="filterwrap" ref={wrap}>
        <button className={'fbtn' + (ctxActive ? ' has-active' : '') + (open ? ' open' : '')} onClick={() => setOpen(o => !o)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 3h8M3.5 6h5M5 9h2"/></svg>
          <span>Filter</span>
          {ctxActive > 0 && <span className="badge">{ctxActive}</span>}
          <svg className="chev" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4l3 3 3-3"/></svg>
        </button>
        {open && (
          <div className="pop">
            <PopGroup label="Where"    items={window.CONTEXTS.where}    activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
            <PopGroup label="Mode"     items={window.CONTEXTS.mode}     activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
            <PopGroup label="Priority" items={window.CONTEXTS.priority} activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
            <div className="popfoot">
              <span className="ct">{ctxActive === 0 ? '—' : `${ctxActive} active`}</span>
              <button className="clear" disabled={!ctxActive} onClick={() => {
                for (const id of Array.from(filters.contexts)) toggleFilter('context', id);
              }}>Clear</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function PopGroup({ label, items, activeSet, onToggle }) {
    return (
      <div className="group">
        <span className="glabel">{label}</span>
        <div className="opts">
          {items.map(it => (
            <FilterChip key={it.id} label={it.label} active={activeSet.has(it.id)} onClick={() => onToggle(it.id)} />
          ))}
        </div>
      </div>
    );
  }

  function Tag({ tagId, tagStyle }) {
    const f = window.formatTag(tagId, tagStyle);
    if (f.kind === 'project') {
      const proj = window.PROJECT_BY_ID[tagId];
      return (
        <span className="tag proj" style={{ '--h': proj.hue }}>
          {tagStyle === 'chip' && <span className="pdot" />}
          {f.text}
        </span>
      );
    }
    const bare = f.text.replace(/^@/, '').replace(/^#/, '').replace(/^\[@/, '[@');
    return (
      <span className="tag ctx">
        {tagStyle === 'chip' || tagStyle === 'underline' ? <React.Fragment><span className="at">@</span>{f.raw.slice(1)}</React.Fragment> : f.text}
      </span>
    );
  }

  function TaskRow({ task, onToggle, tagStyle, dragOver, drag }) {
    return (
      <div
        className={'row' + (task.done ? ' done' : '') + (dragOver === 'top' ? ' drag-over-top' : '') + (dragOver === 'bot' ? ' drag-over-bot' : '') + (dragOver === 'self' ? ' dragging' : '')}
        draggable
        onDragStart={drag.onDragStart}
        onDragOver={drag.onDragOver}
        onDrop={drag.onDrop}
        onDragEnd={drag.onDragEnd}
      >
        <span className="grip" aria-hidden>⋮⋮</span>
        <button className={'check' + (task.done ? ' done' : '')} onClick={() => onToggle(task.id)} aria-label="toggle" />
        <span className="title-c">{task.title}</span>
        <span className="tags">
          {task.tags.map(t => <Tag key={t} tagId={t} tagStyle={tagStyle} />)}
        </span>
      </div>
    );
  }

  function AddRow({ groupId, onAdd }) {
    const [v, setV] = useState('');
    return (
      <div className="addrow">
        <span className="grip" aria-hidden>+</span>
        <span className="check" aria-hidden />
        <input
          placeholder="Add task… (enter to commit)"
          value={v}
          onChange={e => setV(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && v.trim()) { onAdd(groupId, v.trim()); setV(''); }
            if (e.key === 'Escape') setV('');
          }}
        />
      </div>
    );
  }

  function GroupNode({ node, depth, ctx, dragState }) {
    const collapsed = !node.expanded;
    const tasksHere = node.children.filter(c => c.kind === 'task');
    const total = tasksHere.length;
    const done = tasksHere.filter(t => t.done).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    return (
      <div className={'group depth-' + depth}>
        <div className={'ghead' + (collapsed ? ' col' : '')} onClick={() => ctx.toggleGroup(node.id)}>
          <span className="twist">▾</span>
          <h2>{node.title}</h2>
          {depth === 0 && total > 0 && (
            <span className="meta">
              <span>{done}/{total}</span>
              <span className="bar" style={{ '--pct': pct + '%' }} />
            </span>
          )}
          {depth > 0 && total > 0 && <span className="meta"><span>{done}/{total}</span></span>}
        </div>
        {!collapsed && (
          <div className="rows">
            {node.children.map((c, idx) => {
              if (c.kind === 'group') return <GroupNode key={c.id} node={c} depth={depth + 1} ctx={ctx} dragState={dragState} />;
              if (ctx.filterActive && !ctx.passingTaskIds.has(c.id)) return null;
              const ds = dragState.state;
              let dragOver = null;
              if (ds.dragId === c.id) dragOver = 'self';
              else if (ds.overId === c.id) dragOver = ds.overPos;
              return (
                <TaskRow
                  key={c.id}
                  task={c}
                  tagStyle={ctx.tagStyle}
                  onToggle={ctx.toggleTask}
                  dragOver={dragOver}
                  drag={{
                    onDragStart: e => { dragState.set({ dragId: c.id, fromGroup: node.id }); e.dataTransfer.effectAllowed = 'move'; },
                    onDragOver: e => {
                      e.preventDefault();
                      const r = e.currentTarget.getBoundingClientRect();
                      const pos = (e.clientY - r.top) < r.height / 2 ? 'top' : 'bot';
                      if (ds.overId !== c.id || ds.overPos !== pos) {
                        dragState.set({ overId: c.id, overGroup: node.id, overPos: pos });
                      }
                    },
                    onDrop: e => {
                      e.preventDefault();
                      const s = dragState.state;
                      if (!s.dragId) return;
                      const idx = node.children.indexOf(c) + (s.overPos === 'bot' ? 1 : 0);
                      ctx.moveTask(s.dragId, node.id, idx);
                      dragState.set({ dragId: null, overId: null, overPos: null });
                    },
                    onDragEnd: () => dragState.set({ dragId: null, overId: null, overPos: null }),
                  }}
                />
              );
            })}
            {tasksHere.length === node.children.length && <AddRow groupId={node.id} onAdd={ctx.addTask} />}
          </div>
        )}
      </div>
    );
  }

  function useDragState() {
    const [state, setState] = useState({ dragId: null, overId: null, overPos: null });
    const set = useCallback(patch => setState(s => ({ ...s, ...patch })), []);
    return { state, set };
  }

  function RolesBar({ activeRoles, roleOverrides, cycleRole, now, daypart }) {
    return (
      <section className="roles">
        <div className="daypart">
          <span className="em">{daypart.emoji}</span>
          <div className="meta">
            <span className="now">{daypart.label}</span>
            <span className="h">{window.formatHour12(now.hour)}{now.weekend ? ' · weekend' : ''}</span>
          </div>
        </div>
        {window.ROLES.map(r => {
          const ov = roleOverrides[r.id] || 'auto';
          const active = activeRoles.has(r.id);
          return (
            <button
              key={r.id}
              className={'role' + (active ? ' active' : ' muted')}
              style={{ '--h': r.hue }}
              onClick={() => cycleRole(r.id)}
              title={`${r.label} · ${ov === 'auto' ? 'auto by time' : ov === 'on' ? 'forced on' : 'muted'} — click to cycle`}
            >
              <span className="dot" />
              <span className="name">{r.label}</span>
              <span className="sub">{r.subtitle}</span>
              {ov !== 'auto' && <span className="pin">{ov === 'on' ? 'PIN' : 'OFF'}</span>}
            </button>
          );
        })}
      </section>
    );
  }

  function VariantLattice(props) {
    const { tree, log, filters, tweaks, passingTaskIds, visibleGroups, filterActive,
            toggleTask, toggleGroup, addTask, moveTask, toggleFilter, clearFilters, logTask,
            activeRoles, visibleProjectIds, roleOverrides, cycleRole, now, daypart } = props;
    const drag = useDragState();
    const [logInput, setLogInput] = useState('');

    const cssVars = { '--accent': tweaks.accent };

    const ctx = {
      passingTaskIds, filterActive,
      toggleTask, toggleGroup, addTask, moveTask,
      tagStyle: tweaks.tagStyle, accent: tweaks.accent,
    };

    const totalActive = filters.projects.size + filters.contexts.size;

    return (
      <div className={'lat' + ' font-' + tweaks.font + ' den-' + tweaks.density + ' ts-' + tweaks.tagStyle} style={cssVars}>
        <div className="frame">
          <header className="topbar">
            <div className="toprow">
              <div className="title">
                <h1>Roadmap</h1>
                <span className="kbd">⌘K to jump</span>
              </div>
              <div className="right">
                <span className="pill">Sat · May 23</span>
                <span>Week 21</span>
              </div>
            </div>
            <RolesBar
              activeRoles={activeRoles}
              roleOverrides={roleOverrides}
              cycleRole={cycleRole}
              now={now}
              daypart={daypart}
            />
            <div className="fbar">
              <div className="folders">
                <span className="flabel">Folders</span>
                {window.PROJECTS.map(p => (
                  <FolderTab
                    key={p.id}
                    project={p}
                    count={countTasksWithTag(tree, p.id)}
                    active={filters.projects.has(p.id)}
                    muted={!visibleProjectIds.has(p.id)}
                    onClick={() => toggleFilter('project', p.id)}
                  />
                ))}
              </div>
              <div className="ftools">
                <FilterDropdown filters={filters} toggleFilter={toggleFilter} clearFilters={clearFilters} />
                <button className="clear" disabled={!totalActive} onClick={clearFilters}>
                  {totalActive ? `Clear (${totalActive})` : 'Clear'}
                </button>
              </div>
            </div>
          </header>

          <main className="main">
            {filters.projects.size === 0 ? (
              <div className="empty">
                <h2>No folder selected</h2>
                <p>{activeRoles.size === 0
                    ? 'All roles are muted. Un-mute a role above to bring its folders back.'
                    : `On duty: ${[...activeRoles].map(id => window.ROLE_BY_ID[id].label).join(' · ')}`}</p>
                <div className="pickfrom">
                  {window.PROJECTS.filter(p => visibleProjectIds.has(p.id)).map(p => (
                    <button key={p.id} className="pickbtn" style={{'--h': p.hue}} onClick={() => toggleFilter('project', p.id)}>
                      <FolderSVG />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : tree.map(node => {
              if (filterActive && node.kind === 'group' && !visibleGroups.has(node.id)) return null;
              return <GroupNode key={node.id} node={node} depth={0} ctx={ctx} dragState={drag} />;
            })}

            <section className="log">
              <h3>Today's log <span className="date">Sat, May 23</span></h3>
              {log.map(l => (
                <div key={l.id} className="logrow">
                  <span className="tick">●</span>
                  <span className="t">{l.title}</span>
                  <span className="where">@{l.context}</span>
                  <span className="dur">{l.duration}</span>
                </div>
              ))}
              <div className="logadd">
                <span className="plus">+</span>
                <input
                  placeholder="Log something I just finished…"
                  value={logInput}
                  onChange={e => setLogInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && logInput.trim()) {
                      logTask(logInput.trim(), 'home', '15 min');
                      setLogInput('');
                    }
                  }}
                />
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  window.VariantLattice = VariantLattice;
})();
