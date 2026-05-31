// variant-orgpaper.jsx — C · Org Paper
// JetBrains Mono throughout. Cream paper, ASCII-leaning tree, bracketed
// tags by default, `[ ]` text-style checkboxes, key:value filter rows.
// Faithful to the original Figma sketch — but polished to publication grade.

(function () {
  const { useState, useRef, useCallback } = React;

  if (!document.getElementById('org-styles')) {
    const s = document.createElement('style');
    s.id = 'org-styles';
    s.textContent = `
.org{ --bg:#f5ecd6; --paper:#fbf4dd; --ink:#23201a; --ink-2:#5d5546; --ink-3:#8a8067; --ink-4:#c1b69a;
      --rule:#d8c89e; --rule-soft:#e8dcb6;
      --mono:'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
      --serif:'Newsreader', ui-serif, Georgia, serif;
      --sans:'Geist', ui-sans-serif, system-ui, sans-serif;
      position:relative; width:100%; height:100%; overflow:auto;
      background:var(--bg); color:var(--ink);
      font-family:var(--mono); font-feature-settings:"ss01","cv11","cv02";
      letter-spacing:-.005em;
    }
.org.font-sans{ font-family:var(--sans); letter-spacing:0; }
.org.font-serif{ font-family:var(--serif); letter-spacing:0; }

.org .sheet{ max-width:920px; margin:0 auto; padding:0 56px;
             background:var(--paper);
             background-image:repeating-linear-gradient(0deg,
               transparent 0px, transparent 27px,
               rgba(120,90,40,.05) 27px, rgba(120,90,40,.05) 28px);
             box-shadow:0 0 0 1px var(--rule), 0 18px 60px rgba(80,55,15,.12);
             min-height:100%; }

/* density */
.org.den-compact { --rowh:22px; --line:22px; --base:13px;   --pad:32px; }
.org.den-cozy    { --rowh:28px; --line:28px; --base:14px;   --pad:40px; }
.org.den-comfy   { --rowh:32px; --line:32px; --base:14.5px; --pad:52px; }
.org{ font-size:var(--base); line-height:var(--line); }
.org .sheet{ padding-top:var(--pad); padding-bottom:calc(var(--pad) + 40px); }
.org .sheet{ background-size:auto var(--line); background-position:0 calc(var(--pad) - 2px); }

/* header */
.org .hd{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px;
          padding-bottom:14px; border-bottom:2px solid var(--ink); }
.org .hd h1{ font-family:var(--mono); font-size:38px; font-weight:700; letter-spacing:-.02em;
             margin:0; color:var(--ink); line-height:1; }
.org.font-serif .hd h1{ font-family:var(--serif); font-style:italic; font-weight:500; font-size:48px; }
.org.font-sans .hd h1{ font-family:var(--sans); font-weight:700; }
.org .hd h1::before{ content:'# '; color:var(--ink-3); font-weight:400; }
.org.font-serif .hd h1::before, .org.font-sans .hd h1::before{ content:''; }
.org .hd .meta{ text-align:right; color:var(--ink-2); font-size:11px; line-height:1.5;
                font-feature-settings:"tnum"; font-family:var(--mono); }
.org .hd .meta .day{ color:var(--ink); font-weight:600; font-size:13px; }

/* roles tier */
.org .roles{ display:flex; align-items:center; gap:6px; padding:10px 0 8px;
             border-bottom:1px dashed var(--rule); margin-bottom:18px; flex-wrap:wrap; }
.org .daypart{ display:flex; align-items:center; gap:8px; padding:2px 12px 2px 0;
               margin-right:6px; border-right:1px solid var(--rule); }
.org .daypart .em{ font-size:18px; line-height:1; }
.org .daypart .meta{ display:flex; flex-direction:column; line-height:1.25; font-family:var(--mono); }
.org .daypart .meta .now{ font-size:12px; color:var(--ink); font-weight:600; }
.org .daypart .meta .h{ font-size:10.5px; color:var(--ink-3); font-feature-settings:"tnum"; }

.org .role{ appearance:none; border:0; cursor:default; font:inherit; font-family:var(--mono);
            padding:3px 8px; border-radius:3px; background:transparent; color:var(--ink-2);
            display:inline-flex; align-items:center; gap:6px; line-height:1.4;
            transition:background .12s, opacity .15s, color .12s; }
.org .role:hover{ background:rgba(80,55,15,.08); }
.org .role .bracket{ color:var(--ink-3); }
.org .role .marker{ color:var(--ink-3); font-size:11px; line-height:1; }
.org .role.active .marker{ color:hsl(var(--h) 60% 45%); }
.org .role .name{ color:var(--ink); font-size:13px; font-weight:600; }
.org .role .sub{ color:var(--ink-3); font-size:11px; }
.org .role.active{ background:hsl(var(--h) 50% 92%); }
.org .role.active .name{ color:hsl(var(--h) 70% 18%); }
.org .role.muted{ opacity:.42; }
.org .role.muted:hover{ opacity:.7; }
.org .role .pin{ font-size:9px; color:var(--ink-3); border:1px solid var(--rule);
                 padding:0 4px; border-radius:2px; letter-spacing:.04em; }
.org .role.active .pin{ border-color:hsl(var(--h) 50% 60%); color:hsl(var(--h) 60% 30%); }

/* muted folder */
.org .folder.muted{ opacity:.35; filter:saturate(.3); }
.org .folder.muted:hover{ opacity:.6; }
.org .folder.muted::before{ opacity:.35; }

/* folders + filters bar */
.org .ribbon{ display:flex; align-items:flex-end; gap:14px; flex-wrap:wrap;
              margin-bottom:24px; padding-bottom:14px; border-bottom:1px dashed var(--rule); }
.org .folders{ display:flex; align-items:flex-end; gap:6px; flex:1 1 auto; flex-wrap:wrap; }
.org .flabel{ color:var(--ink-2); font-size:13px; padding-bottom:4px; font-family:var(--mono); }
.org .flabel::after{ content:':'; color:var(--ink-3); margin-left:1px; }

/* folder = ASCII-tinted manila tab */
.org .folder{ appearance:none; border:1px solid var(--rule); background:hsl(var(--h) 50% 92%);
              color:hsl(var(--h) 55% 25%); cursor:default; font:inherit; font-family:var(--mono);
              padding:5px 10px 5px 8px; border-radius:4px 8px 0 0; line-height:1.3;
              display:inline-flex; align-items:center; gap:6px; font-size:13px;
              transition:transform .12s, background .12s, box-shadow .12s; position:relative; }
.org .folder::before{ content:''; position:absolute; left:8px; top:-4px; width:32px; height:6px;
                      background:inherit; border-radius:3px 3px 0 0; border:1px solid var(--rule); border-bottom:none; }
.org .folder:hover{ transform:translateY(-1px); background:hsl(var(--h) 55% 88%); }
.org .folder.on{ background:hsl(var(--h) 60% 75%); color:hsl(var(--h) 60% 18%);
                 box-shadow:inset 0 0 0 1px hsl(var(--h) 55% 45%); border-color:hsl(var(--h) 55% 45%); }
.org .folder.on::before{ background:hsl(var(--h) 60% 75%); border-color:hsl(var(--h) 55% 45%); }
.org .folder .ficon{ width:13px; height:13px; opacity:.8; }
.org .folder .fcount{ font-size:10.5px; padding:0 4px; border-radius:2px;
                      background:hsl(var(--h) 60% 80%); color:hsl(var(--h) 60% 25%);
                      font-feature-settings:"tnum"; }
.org .folder.on .fcount{ background:hsl(var(--h) 60% 65%); color:hsl(var(--h) 70% 15%); }

.org .ftools{ display:flex; align-items:center; gap:6px; position:relative; padding-bottom:4px; }
.org .fbtn{ appearance:none; border:1px solid var(--rule); background:transparent; cursor:default;
            padding:4px 9px; border-radius:3px; font:inherit; font-family:var(--mono); font-size:12.5px;
            color:var(--ink-2); display:inline-flex; align-items:center; gap:6px; transition:all .12s; }
.org .fbtn:hover{ color:var(--ink); border-color:var(--ink-3); }
.org .fbtn.has-active{ color:var(--accent); border-color:var(--accent); }
.org .fbtn .badge{ background:var(--accent); color:var(--paper); padding:1px 5px; border-radius:2px;
                   font-size:10px; font-feature-settings:"tnum"; }
.org .fbtn::before{ content:'▾'; font-size:10px; opacity:.6; transition:transform .12s; }
.org .fbtn.open::before{ transform:rotate(180deg); }
.org .clear{ font-size:11px; color:var(--ink-3); border:0; background:transparent; padding:4px 6px;
             cursor:default; font-family:var(--mono); border-radius:3px; }
.org .clear:hover:not(:disabled){ color:var(--ink); background:rgba(80,55,15,.08); }
.org .clear:disabled{ opacity:.35; }

.org .pop{ position:absolute; top:calc(100% + 6px); right:0; z-index:20; min-width:340px;
           background:var(--paper); border:1px solid var(--rule);
           box-shadow:0 14px 36px rgba(80,55,15,.18); border-radius:4px;
           padding:12px 14px; display:flex; flex-direction:column; gap:8px; font-family:var(--mono); font-size:13px; }
.org .pop::before{ content:''; position:absolute; top:-6px; right:24px; width:10px; height:10px;
                   background:var(--paper); border-left:1px solid var(--rule); border-top:1px solid var(--rule); transform:rotate(45deg); }
.org .pop .row{ display:grid; grid-template-columns:80px 1fr; gap:10px; align-items:baseline; }
.org .pop .row .k{ color:var(--ink-2); font-size:12px; }
.org .pop .row .k::after{ content:':'; color:var(--ink-3); margin-left:1px; }
.org .pop .opts{ display:flex; flex-wrap:wrap; align-items:baseline; }
.org .pop .fchip{ appearance:none; border:0; background:transparent; color:var(--ink-2);
                  padding:1px 6px; margin:1px 2px 1px 0; font:inherit; font-family:var(--mono); cursor:default;
                  border-radius:3px; transition:background .12s, color .12s; line-height:1.5; font-size:12.5px; }
.org .pop .fchip:hover{ background:rgba(80,55,15,.08); color:var(--ink); }
.org .pop .fchip.on{ background:var(--accent); color:var(--paper); }
.org .pop .sep{ color:var(--ink-4); margin:0 2px; }
.org .pop .popfoot{ display:flex; justify-content:space-between; align-items:center;
                    border-top:1px dashed var(--rule); padding-top:8px; margin-top:2px; font-size:11px; color:var(--ink-3); }

/* tree */
.org .tree{ display:flex; flex-direction:column; }
.org .group{ position:relative; }
.org .ghead{ display:grid; grid-template-columns:18px 1fr auto; align-items:baseline;
             padding:8px 0 4px; cursor:default; user-select:none; gap:8px; }
.org .ghead .twist{ color:var(--ink-3); width:14px; transition:transform .12s; display:inline-block; }
.org .ghead.col .twist{ transform:rotate(-90deg); }
.org .ghead h2{ margin:0; font-size:16px; font-weight:700; color:var(--ink); letter-spacing:0; }
.org.font-serif .ghead h2{ font-family:var(--serif); font-style:italic; font-weight:500; font-size:20px; }
.org.font-sans .ghead h2{ font-family:var(--sans); font-weight:700; }
.org .ghead h2::before{ content:'* '; color:var(--ink-3); font-weight:400; }
.org.font-serif .ghead h2::before, .org.font-sans .ghead h2::before{ content:''; }
.org .group.depth-1 .ghead h2{ font-size:14px; font-weight:600; color:var(--ink-2); }
.org .group.depth-1 .ghead h2::before{ content:'** '; }
.org.font-serif .group.depth-1 .ghead h2::before, .org.font-sans .group.depth-1 .ghead h2::before{ content:''; }
.org .ghead .count{ color:var(--ink-3); font-size:11px; font-family:var(--mono); }

/* indent rail */
.org .group.depth-1{ padding-left:22px; position:relative; }
.org .group.depth-1::before{ content:''; position:absolute; left:9px; top:0; bottom:8px;
                             border-left:1px dashed var(--rule); }

/* task row */
.org .rows{ display:flex; flex-direction:column; }
.org .row{ display:grid; grid-template-columns:18px 28px 1fr auto; gap:6px; align-items:baseline;
           padding:2px 0; position:relative; cursor:default; }
.org .row:hover{ background:rgba(80,55,15,.04); border-radius:3px; }
.org .row.drag-over-top::before{ content:''; position:absolute; left:46px; right:0; top:-1px; height:1px; background:var(--accent); }
.org .row.drag-over-bot::after { content:''; position:absolute; left:46px; right:0; bottom:-1px; height:1px; background:var(--accent); }
.org .row.dragging{ opacity:.4; }
.org .grip{ color:var(--ink-3); opacity:0; font-size:11px; line-height:var(--line); text-align:center;
            cursor:grab; user-select:none; }
.org .row:hover .grip{ opacity:.6; }
.org .check{ font-family:var(--mono); color:var(--ink); font-size:13px; line-height:var(--line);
             cursor:default; user-select:none; border:0; background:transparent; padding:0; text-align:left; }
.org .check:hover{ color:var(--accent); }
.org .check.done{ color:var(--accent); }
.org .title-c{ color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
               min-width:0; }
.org .row.done .title-c{ color:var(--ink-3); text-decoration:line-through;
                         text-decoration-color:var(--ink-4); }
.org .tags{ display:flex; gap:0; align-items:baseline; flex-shrink:0; font-size:12px;
            font-family:var(--mono); }

/* tags */
.org .tag{ display:inline-flex; align-items:baseline; padding:0 4px; font-family:var(--mono);
           color:var(--ink-2); font-size:12px; line-height:var(--line); white-space:nowrap; }
.org .tag.proj{ color:hsl(var(--h) 55% 32%); font-weight:600; }
.org.font-serif .tag, .org.font-sans .tag{ font-family:var(--mono); font-size:11px; }
/* default = bracket */
.org .tag::before{ content:'['; color:var(--ink-4); }
.org .tag::after { content:']'; color:var(--ink-4); }
.org.ts-chip .tag::before, .org.ts-chip .tag::after{ content:''; }
.org.ts-chip .tag{ background:rgba(80,55,15,.08); border-radius:3px; padding:0 6px; margin:0 1px; }
.org.ts-chip .tag.proj{ background:hsl(var(--h) 55% 90%); color:hsl(var(--h) 55% 30%); }
.org.ts-underline .tag::before, .org.ts-underline .tag::after{ content:''; }
.org.ts-underline .tag.ctx{ text-decoration:underline; text-decoration-color:var(--ink-4); text-underline-offset:3px; }
.org.ts-underline .tag.ctx .at{ color:var(--ink-3); }
.org.ts-hashtag  .tag::before, .org.ts-hashtag  .tag::after{ content:''; }
.org.ts-hashtag  .tag.ctx::before{ content:'#'; color:var(--ink-4); }
.org.ts-hashtag  .tag.proj::before{ content:'#'; color:var(--ink-4); }

/* add row */
.org .addrow{ display:grid; grid-template-columns:18px 28px 1fr; gap:6px; align-items:baseline;
              padding:2px 0; color:var(--ink-3); }
.org .addrow .check{ color:var(--ink-4); }
.org .addrow input{ border:0; background:transparent; font:inherit; outline:none; color:var(--ink);
                    width:100%; padding:0; line-height:var(--line); }
.org .addrow input::placeholder{ color:var(--ink-3); font-style:italic; }
.org.font-serif .addrow input{ font-family:var(--serif); }
.org.font-sans .addrow input{ font-family:var(--sans); }

/* empty state */
.org .empty{ padding:48px 0 60px; font-family:var(--mono);
             color:var(--ink-2); font-size:13px; line-height:var(--line); }
.org.font-serif .empty, .org.font-sans .empty{ font-family:var(--mono); }
.org .empty .com{ color:var(--ink-3); }
.org .empty .pickfrom{ display:flex; flex-wrap:wrap; gap:6px; margin-top:18px; padding-left:24px; }
.org .empty .pickbtn{ appearance:none; border:1px solid hsl(var(--h) 50% 60%);
                      background:hsl(var(--h) 50% 92%); color:hsl(var(--h) 60% 22%); cursor:default;
                      font:inherit; font-family:var(--mono); font-size:13px; padding:4px 10px 4px 8px;
                      border-radius:3px; display:inline-flex; align-items:center; gap:6px;
                      transition:transform .12s; }
.org .empty .pickbtn:hover{ transform:translateY(-1px); background:hsl(var(--h) 55% 86%); }
.org .empty .pickbtn .ficon{ width:13px; height:13px; opacity:.8; }

/* log */
.org .log{ margin-top:36px; padding-top:14px; border-top:2px solid var(--ink); }
.org .log h3{ margin:0 0 10px; font-size:11px; font-family:var(--mono); font-weight:700;
              letter-spacing:.16em; text-transform:uppercase; color:var(--ink); }
.org.font-serif .log h3{ font-family:var(--serif); font-style:italic; font-weight:500;
                         font-size:14px; text-transform:none; letter-spacing:0; }
.org.font-sans .log h3{ font-family:var(--sans); font-weight:600; }
.org .logrow{ display:grid; grid-template-columns:18px 1fr auto auto; gap:10px; align-items:baseline;
              padding:1px 0; font-family:var(--mono); font-size:13px; }
.org .logrow .tick{ color:var(--accent); }
.org .logrow .t{ color:var(--ink); }
.org.font-serif .logrow .t, .org.font-sans .logrow .t{ font-family:inherit; }
.org .logrow .where, .org .logrow .dur{ color:var(--ink-2); font-size:12px; font-feature-settings:"tnum"; }
.org .logrow .dur::before{ content:'· '; color:var(--ink-4); }

.org .logadd{ display:grid; grid-template-columns:18px 1fr; gap:10px; align-items:baseline; padding:4px 0 0; }
.org .logadd .plus{ color:var(--accent); }
.org .logadd input{ border:0; background:transparent; font:inherit; outline:none;
                    width:100%; color:var(--ink); padding:0; font-family:var(--mono);
                    line-height:var(--line); }
.org .logadd input::placeholder{ color:var(--ink-3); }
.org.font-serif .logadd input{ font-family:var(--serif); }
.org.font-sans .logadd input{ font-family:var(--sans); }
`;
    document.head.appendChild(s);
  }

  // count tasks tagged with a given id
  function countTasksWithTag(tree, tagId) {
    let n = 0;
    window.visitTasks(tree, t => { if (t.tags.includes(tagId)) n++; });
    return n;
  }

  const FolderSVG = () => (
    <svg className="ficon" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M1 3.5C1 2.7 1.7 2 2.5 2H6L7.5 3.5H13.5C14.3 3.5 15 4.2 15 5V11.5C15 12.3 14.3 13 13.5 13H2.5C1.7 13 1 12.3 1 11.5V3.5Z" fill="currentColor" fillOpacity="0.25"/>
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

  function FilterChip({ active, label, onClick, first }) {
    return (
      <React.Fragment>
        {!first && <span className="sep">·</span>}
        <button className={'fchip' + (active ? ' on' : '')} onClick={onClick}>{label}</button>
      </React.Fragment>
    );
  }

  function Tag({ tagId, tagStyle }) {
    const f = window.formatTag(tagId, tagStyle);
    if (f.kind === 'project') {
      const proj = window.PROJECT_BY_ID[tagId];
      return <span className="tag proj" style={{ '--h': proj.hue }}>{proj.short}</span>;
    }
    const bare = f.raw.replace(/^@/, '');
    return (
      <span className="tag ctx">
        {tagStyle === 'hashtag' ? bare :
         tagStyle === 'underline' ? <React.Fragment><span className="at">@</span>{bare}</React.Fragment> :
         f.raw}
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
        <span className="grip">⋮</span>
        <button className={'check' + (task.done ? ' done' : '')} onClick={() => onToggle(task.id)}>
          {task.done ? '[x]' : '[ ]'}
        </button>
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
        <span className="check">[ ]</span>
        <input
          placeholder="new task…"
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
    return (
      <div className={'group depth-' + depth}>
        <div className={'ghead' + (collapsed ? ' col' : '')} onClick={() => ctx.toggleGroup(node.id)}>
          <span className="twist">▾</span>
          <h2>{node.title}</h2>
          {total > 0 && <span className="count">{done}/{total}</span>}
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
                    onDragStart: e => { dragState.set({ dragId: c.id }); e.dataTransfer.effectAllowed = 'move'; },
                    onDragOver: e => {
                      e.preventDefault();
                      const r = e.currentTarget.getBoundingClientRect();
                      const pos = (e.clientY - r.top) < r.height / 2 ? 'top' : 'bot';
                      if (ds.overId !== c.id || ds.overPos !== pos) dragState.set({ overId: c.id, overPos: pos });
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
              <span className="marker">{active ? '●' : '○'}</span>
              <span className="name">{r.label}</span>
              <span className="sub">{r.subtitle}</span>
              {ov !== 'auto' && <span className="pin">{ov === 'on' ? 'PIN' : 'OFF'}</span>}
            </button>
          );
        })}
      </section>
    );
  }

  function VariantOrgPaper(props) {
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

    return (
      <div className={'org' + ' font-' + tweaks.font + ' den-' + tweaks.density + ' ts-' + tweaks.tagStyle} style={cssVars}>
        <div className="sheet">
          <header className="hd">
            <h1>Roadmap</h1>
            <div className="meta">
              <div className="day">Sat, May 23</div>
              <div>2026-W21 · day 143</div>
            </div>
          </header>

          <RolesBar
            activeRoles={activeRoles}
            roleOverrides={roleOverrides}
            cycleRole={cycleRole}
            now={now}
            daypart={daypart}
          />

          <Ribbon
            tree={tree}
            filters={filters}
            toggleFilter={toggleFilter}
            clearFilters={clearFilters}
            visibleProjectIds={visibleProjectIds}
          />

          <section className="tree">
            {filters.projects.size === 0 ? (
              <div className="empty">
                <div className="com">// no folder selected</div>
                <div className="com">{activeRoles.size === 0
                  ? '// all roles muted — un-mute one above'
                  : `// on duty: ${[...activeRoles].map(id => window.ROLE_BY_ID[id].label.toLowerCase()).join(', ')}`}</div>
                <div className="com">// folders = projects · tags within = contexts</div>
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
          </section>

          <section className="log">
            <h3>// today's log</h3>
            {log.map(l => (
              <div key={l.id} className="logrow">
                <span className="tick">[x]</span>
                <span className="t">{l.title}</span>
                <span className="where">@{l.context}</span>
                <span className="dur">{l.duration}</span>
              </div>
            ))}
            <div className="logadd">
              <span className="plus">[+]</span>
              <input
                placeholder="log a completed task…"
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
        </div>
      </div>
    );
  }

  function Ribbon({ tree, filters, toggleFilter, clearFilters, visibleProjectIds }) {
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
    const totalActive = filters.projects.size + ctxActive;

    return (
      <section className="ribbon">
        <div className="folders">
          <span className="flabel">folders</span>
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
        <div className="ftools" ref={wrap}>
          <button className={'fbtn' + (ctxActive ? ' has-active' : '') + (open ? ' open' : '')} onClick={() => setOpen(o => !o)}>
            <span>filters</span>
            {ctxActive > 0 && <span className="badge">{ctxActive}</span>}
          </button>
          <button className="clear" disabled={!totalActive} onClick={clearFilters}>[reset]</button>
          {open && (
            <div className="pop">
              <PopRow label="where"    items={window.CONTEXTS.where}    activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
              <PopRow label="mode"     items={window.CONTEXTS.mode}     activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
              <PopRow label="priority" items={window.CONTEXTS.priority} activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
              <div className="popfoot">
                <span>{ctxActive === 0 ? '— no context filters —' : `${ctxActive} active`}</span>
                <button className="clear" disabled={!ctxActive} onClick={() => {
                  for (const id of Array.from(filters.contexts)) toggleFilter('context', id);
                }}>[clear]</button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  function PopRow({ label, items, activeSet, onToggle }) {
    return (
      <div className="row">
        <span className="k">{label}</span>
        <span className="opts">
          {items.map((c, i) => (
            <FilterChip key={c.id} first={i === 0} active={activeSet.has(c.id)}
                        label={c.label} onClick={() => onToggle(c.id)} />
          ))}
        </span>
      </div>
    );
  }

  function FRow({ label, children }) {
    return (
      <div className="frow">
        <span className="k">{label}</span>
        <span className="opts">{children}</span>
      </div>
    );
  }

  window.VariantOrgPaper = VariantOrgPaper;
})();
