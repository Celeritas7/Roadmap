// variant-editorial.jsx — A · Editorial
// Warm paper, Newsreader serif headlines, Geist body, pastel pill tags,
// italic-underline contexts as an alternate. Generous breathing room.

(function () {
  const { useState, useRef, useCallback } = React;

  // ─── styles ────────────────────────────────────────────────────────────
  if (!document.getElementById('ed-styles')) {
    const s = document.createElement('style');
    s.id = 'ed-styles';
    s.textContent = `
.ed{ --bg:#faf6ee; --ink:#1f1c17; --ink-2:#5b554b; --ink-3:#8a8275; --rule:#e8e0d0;
     --card:#ffffff; --paper:#fff9ee;
     --serif:'Newsreader', ui-serif, Georgia, 'Times New Roman', serif;
     --sans:'Geist', ui-sans-serif, system-ui, sans-serif;
     --mono:'Geist Mono', ui-monospace, monospace;
     position:relative; width:100%; height:100%; overflow:auto;
     background:var(--bg); color:var(--ink);
     font-family:var(--sans); font-feature-settings:"ss01","cv11";
   }
.ed.font-serif{ font-family:var(--serif); }
.ed.font-mono { font-family:var(--mono); letter-spacing:-.01em; }
.ed .stage{ max-width:920px; margin:0 auto; padding:56px 72px 80px; }

/* density */
.ed.den-compact { --rowy:7px;  --gap:14px; --base:13.5px; }
.ed.den-cozy    { --rowy:10px; --gap:18px; --base:14.5px; }
.ed.den-comfy   { --rowy:14px; --gap:22px; --base:15.5px; }
.ed .stage     { font-size:var(--base); }

/* header */
.ed .hd{ display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:36px; }
.ed .hd h1{ font-family:var(--serif); font-weight:400; font-style:italic;
            font-size:64px; line-height:.95; letter-spacing:-.03em; margin:0; color:var(--ink); }
.ed.font-mono .hd h1{ font-family:var(--mono); font-style:normal; letter-spacing:-.04em; font-size:54px; }
.ed .hd .meta{ text-align:right; color:var(--ink-3); font-size:13px; line-height:1.4;
               font-feature-settings:"tnum"; white-space:nowrap; }
.ed .hd .meta .day{ font-family:var(--serif); font-size:18px; color:var(--ink-2); font-style:italic; }
.ed.font-mono .hd .meta .day{ font-family:var(--mono); font-style:normal; }

/* roles tier */
.ed .roles{ display:flex; align-items:center; gap:14px; padding:14px 0 12px;
            border-bottom:1px solid var(--rule); margin-bottom:18px; flex-wrap:wrap; }
.ed .daypart{ display:flex; align-items:center; gap:10px; padding-right:8px;
              border-right:1px solid var(--rule); margin-right:4px; }
.ed .daypart .em{ font-size:22px; line-height:1; }
.ed .daypart .lbl{ display:flex; flex-direction:column; line-height:1.25; }
.ed .daypart .lbl .now{ font-family:var(--serif); font-style:italic; color:var(--ink-2); font-size:14px; }
.ed.font-mono .daypart .lbl .now{ font-family:var(--mono); font-style:normal; font-size:12px; }
.ed .daypart .lbl .h{ color:var(--ink-3); font-size:11px; font-family:var(--mono); font-feature-settings:"tnum"; }

.ed .role{ appearance:none; border:0; cursor:default; font:inherit; padding:7px 12px 7px 10px;
           border-radius:10px; background:transparent; color:var(--ink-2);
           display:inline-flex; align-items:center; gap:8px; line-height:1.2;
           transition:background .15s, color .15s, opacity .2s, transform .15s;
           box-shadow:inset 0 0 0 1px transparent; }
.ed .role:hover{ background:rgba(0,0,0,.03); }
.ed .role .dot{ width:9px; height:9px; border-radius:50%; flex-shrink:0;
                background:hsl(var(--h) 50% 60%); box-shadow:0 0 0 0 hsl(var(--h) 60% 55% / 0); }
.ed .role .name{ font-weight:500; font-size:13.5px; color:var(--ink); }
.ed .role .sub{ color:var(--ink-3); font-style:italic; font-size:11.5px; font-family:var(--serif); }
.ed.font-mono .role .sub{ font-family:var(--mono); font-style:normal; }

.ed .role.active{ background:hsl(var(--h) 55% 96%); box-shadow:inset 0 0 0 1px hsl(var(--h) 40% 86%); }
.ed .role.active .dot{ background:hsl(var(--h) 60% 50%); box-shadow:0 0 0 3px hsl(var(--h) 70% 55% / .15); }
.ed .role.active .name{ color:hsl(var(--h) 55% 25%); }
.ed .role.muted{ opacity:.45; }
.ed .role.muted .dot{ background:var(--ink-4); box-shadow:none; }
.ed .role.muted:hover{ opacity:.7; }
.ed .role .pin{ font-family:var(--mono); font-size:9px; color:var(--ink-3); margin-left:2px;
                padding:1px 5px; border-radius:999px; background:rgba(0,0,0,.05); letter-spacing:.04em; }
.ed .role.active .pin{ background:hsl(var(--h) 50% 86%); color:hsl(var(--h) 55% 30%); }

/* muted folder treatment */
.ed .folder.muted{ opacity:.32; filter:saturate(.4); cursor:default; }
.ed .folder.muted:hover{ opacity:.55; }
.ed .folder.muted .fcount{ background:rgba(0,0,0,.06); color:var(--ink-3); }

/* folders + filters bar */
.ed .ribbon{ border-top:1px solid var(--rule); border-bottom:1px solid var(--rule);
             padding:20px 0; margin-bottom:32px;
             display:flex; align-items:flex-end; gap:18px; flex-wrap:wrap; }
.ed .folders{ display:flex; align-items:flex-end; gap:8px; flex:1 1 auto; flex-wrap:wrap; }
.ed .flabel{ font-family:var(--serif); font-style:italic; color:var(--ink-3); font-size:13px;
             padding-bottom:8px; margin-right:4px; letter-spacing:.02em; }
.ed.font-mono .flabel{ font-family:var(--mono); font-style:normal; text-transform:uppercase; font-size:11px; }

/* folder tab — pastel manila tab with a notched corner */
.ed .folder{ position:relative; appearance:none; border:0; cursor:default; font:inherit;
             padding:9px 16px 9px 14px; min-width:104px;
             background:hsl(var(--h) 55% 96%); color:hsl(var(--h) 50% 28%);
             box-shadow:inset 0 0 0 1px hsl(var(--h) 40% 85%);
             border-radius:6px 14px 0 0;
             display:inline-flex; align-items:center; gap:9px; line-height:1.2;
             transition:transform .12s, background .12s, box-shadow .12s; }
.ed .folder::before{ content:''; position:absolute; left:10px; top:-5px; width:38px; height:8px;
                     background:inherit; border-radius:4px 4px 0 0;
                     box-shadow:inset 0 0 0 1px hsl(var(--h) 40% 85%); border-bottom:none; clip-path:inset(0 0 1px 0); }
.ed .folder:hover{ background:hsl(var(--h) 55% 92%); transform:translateY(-1px); }
.ed .folder.on{ background:hsl(var(--h) 60% 88%); color:hsl(var(--h) 60% 22%);
                box-shadow:inset 0 0 0 1.5px hsl(var(--h) 50% 65%); }
.ed .folder .ficon{ width:14px; height:14px; flex-shrink:0; opacity:.75; }
.ed .folder .fcount{ font-family:var(--mono); font-size:10.5px; opacity:.65;
                     padding:1px 5px; border-radius:3px; background:hsl(var(--h) 50% 78% / .5);
                     font-feature-settings:"tnum"; }
.ed .folder.on .fcount{ background:hsl(var(--h) 60% 75%); opacity:.9; }

/* filters dropdown button */
.ed .filterbtn{ position:relative; padding-bottom:0; display:flex; align-items:center; gap:8px; }
.ed .fbtn{ appearance:none; border:1px solid var(--rule); background:#fff; color:var(--ink-2);
           font:inherit; font-size:13px; padding:8px 12px 8px 11px; border-radius:8px;
           cursor:default; display:inline-flex; align-items:center; gap:8px; line-height:1; transition:border-color .12s, background .12s; }
.ed .fbtn:hover{ border-color:var(--ink-3); color:var(--ink); }
.ed .fbtn.has-active{ border-color:var(--accent-line); background:var(--accent-soft); color:var(--accent); }
.ed .fbtn .badge{ background:var(--accent); color:#fff; font-family:var(--mono); font-size:10px;
                  border-radius:10px; padding:2px 7px; font-feature-settings:"tnum"; }
.ed .fbtn .chev{ width:10px; height:10px; transition:transform .15s; }
.ed .fbtn.open .chev{ transform:rotate(180deg); }

.ed .clear{ font-size:11px; color:var(--ink-3); border:0; background:transparent; cursor:default;
            padding:6px 8px; border-radius:4px; font-family:inherit; }
.ed .clear:hover{ color:var(--ink); background:rgba(0,0,0,.04); }
.ed .clear:disabled{ opacity:.35; }

/* popover */
.ed .pop{ position:absolute; top:calc(100% + 8px); right:0; z-index:20;
          background:#fff; border:1px solid var(--rule); border-radius:10px;
          box-shadow:0 12px 36px rgba(50,40,20,.12), 0 0 0 1px rgba(0,0,0,.02);
          padding:14px 18px; min-width:320px; max-width:520px;
          display:flex; flex-direction:column; gap:12px; }
.ed .pop .row{ display:grid; grid-template-columns:80px 1fr; gap:14px; align-items:baseline; padding:0; border:none; }
.ed .pop .key{ font-family:var(--serif); font-style:italic; color:var(--ink-3); font-size:12px;
               text-transform:lowercase; }
.ed.font-mono .pop .key{ font-family:var(--mono); font-style:normal; text-transform:uppercase; font-size:11px; }
.ed .pop .opts{ display:flex; flex-wrap:wrap; gap:5px; }
.ed .pop .popfoot{ display:flex; justify-content:space-between; align-items:center;
                   border-top:1px dashed var(--rule); padding-top:8px; margin-top:2px; }
.ed .pop .popfoot .ct{ font-size:11px; color:var(--ink-3); }

/* filter chips (used in popover only now) */
.ed .fchip{ appearance:none; border:0; background:transparent; color:var(--ink-2);
            padding:4px 10px; border-radius:999px; font-size:13px; font-family:inherit;
            cursor:default; transition:background .12s, color .12s, box-shadow .12s;
            display:inline-flex; align-items:center; gap:6px; line-height:1.4; }
.ed .fchip:hover{ background:rgba(0,0,0,.05); color:var(--ink); }
.ed .fchip.on{ background:var(--accent-soft); color:var(--accent); box-shadow:inset 0 0 0 1px var(--accent-line); }

/* tree */
.ed .tree{ display:flex; flex-direction:column; gap:var(--gap); }
.ed .group{ break-inside:avoid; }
.ed .grouptitle{ display:flex; align-items:baseline; gap:10px; cursor:default;
                 padding:10px 0 10px; border-bottom:1px solid var(--rule); margin-bottom:10px; user-select:none; }
.ed .grouptitle h2{ font-family:var(--serif); font-weight:500; font-style:normal;
                    font-size:22px; letter-spacing:-.01em; margin:0; color:var(--ink);
                    flex:1 1 auto; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ed.font-mono .grouptitle h2{ font-family:var(--mono); font-size:18px; text-transform:uppercase; letter-spacing:.02em; }
.ed .grouptitle .twist{ font-family:var(--mono); font-size:11px; color:var(--ink-3); width:14px; flex-shrink:0; transition:transform .15s; }
.ed .grouptitle.col .twist{ transform:rotate(-90deg); }
.ed .grouptitle .count{ font-size:12px; color:var(--ink-3); flex-shrink:0;
                        font-family:var(--mono); font-feature-settings:"tnum"; }
.ed .subgroup .grouptitle{ padding:6px 0 6px; border-bottom:1px dashed var(--rule); margin-bottom:6px; }
.ed .subgroup .grouptitle h2{ font-size:15px; font-style:italic; color:var(--ink-2); font-weight:400; }
.ed.font-mono .subgroup .grouptitle h2{ font-style:normal; font-size:14px; text-transform:none; letter-spacing:0; }
.ed .subgroup{ padding-left:22px; border-left:1px solid var(--rule); margin-top:12px; margin-bottom:8px; }

/* task row */
.ed .row{ display:grid; grid-template-columns:22px 1fr; column-gap:10px; align-items:start;
          padding:var(--rowy) 0; border-bottom:1px dashed rgba(0,0,0,.05); position:relative; }
.ed .row:last-child{ border-bottom:0; }
.ed .row.drag-over-top::before{ content:''; position:absolute; left:32px; right:0; top:-1px;
                                height:2px; background:var(--accent); border-radius:1px; }
.ed .row.drag-over-bot::after { content:''; position:absolute; left:32px; right:0; bottom:-1px;
                                height:2px; background:var(--accent); border-radius:1px; }
.ed .row.dragging{ opacity:.4; }
.ed .check{ appearance:none; border:0; background:transparent; padding:0; margin-top:3px;
            width:18px; height:18px; border-radius:50%; cursor:default;
            display:inline-flex; align-items:center; justify-content:center;
            border:1.5px solid var(--ink-3); transition:background .15s, border-color .15s; }
.ed .check:hover{ border-color:var(--accent); }
.ed .check.done{ background:var(--accent); border-color:var(--accent); }
.ed .check.done::after{ content:''; width:9px; height:5px; border-left:1.5px solid #fff;
                        border-bottom:1.5px solid #fff; transform:rotate(-45deg) translate(0,-1px); }
.ed .grip{ position:absolute; left:-18px; top:50%; transform:translateY(-50%); width:14px;
           color:var(--ink-3); opacity:0; cursor:grab; user-select:none; font-size:11px;
           font-family:var(--mono); line-height:1; }
.ed .row:hover .grip{ opacity:.7; }
.ed .body{ display:flex; flex-direction:column; gap:6px; min-width:0; }
.ed .title{ color:var(--ink); line-height:1.45; }
.ed .row.done .title{ color:var(--ink-3); text-decoration:line-through;
                      text-decoration-color:rgba(0,0,0,.25); text-decoration-thickness:1px; }
.ed .tags{ display:flex; flex-wrap:wrap; gap:6px; font-size:12px; }

/* tag styles */
.ed .tag{ display:inline-flex; align-items:center; gap:5px; padding:2px 9px;
          border-radius:999px; line-height:1.5; font-family:var(--sans);
          font-size:11.5px; letter-spacing:.005em; }
.ed.font-mono .tag{ font-family:var(--mono); font-size:11px; }
.ed .tag.proj{ background:hsl(var(--h) 60% 95%); color:hsl(var(--h) 50% 28%);
               box-shadow:inset 0 0 0 1px hsl(var(--h) 50% 88%); }
.ed .tag.ctx{ background:rgba(0,0,0,.04); color:var(--ink-2); }
.ed.ts-bracket .tag{ background:transparent !important; box-shadow:none !important;
                     padding:0 1px; color:var(--ink-2); font-family:var(--mono); font-size:11.5px; }
.ed.ts-bracket .tag.proj{ color:hsl(var(--h) 55% 32%); }
.ed.ts-underline .tag.ctx{ background:transparent; padding:0; font-style:italic;
                           text-decoration:underline; text-decoration-color:rgba(0,0,0,.2);
                           text-underline-offset:3px; }
.ed.ts-underline .tag.proj{ background:transparent; box-shadow:none; padding:0;
                            color:hsl(var(--h) 55% 32%); font-weight:500; }
.ed.ts-hashtag .tag.ctx{ background:transparent; padding:0; color:var(--ink-2); }
.ed.ts-hashtag .tag.proj{ background:transparent; box-shadow:none; padding:0;
                          color:hsl(var(--h) 55% 32%); font-weight:500; }

/* add task */
.ed .addrow{ display:grid; grid-template-columns:22px 1fr; gap:10px; padding:var(--rowy) 0; }
.ed .addrow .check{ border-style:dashed; border-color:rgba(0,0,0,.18); }
.ed .addrow input{ width:100%; border:0; background:transparent; outline:none;
                   font:inherit; color:var(--ink); padding:2px 0;
                   border-bottom:1px solid transparent; }
.ed .addrow input::placeholder{ color:var(--ink-3); font-style:italic; }
.ed.font-mono .addrow input::placeholder{ font-style:normal; }
.ed .addrow input:focus{ border-bottom-color:var(--accent); }

/* empty state */
.ed .empty{ text-align:center; padding:80px 40px 100px; max-width:520px; margin:0 auto; }
.ed .empty h2{ font-family:var(--serif); font-style:italic; font-weight:400; font-size:32px;
               margin:0 0 12px; color:var(--ink-2); letter-spacing:-.01em; line-height:1.2; }
.ed.font-mono .empty h2{ font-family:var(--mono); font-style:normal; font-size:24px; }
.ed .empty p{ color:var(--ink-3); font-size:14px; line-height:1.6; margin:0 0 28px; }
.ed .empty .arrow{ display:inline-block; font-family:var(--mono); color:var(--ink-3); margin-bottom:14px;
                   font-size:24px; }
.ed .empty .pickfrom{ display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:8px; }
.ed .empty .pickbtn{ appearance:none; border:1px solid hsl(var(--h) 50% 80%); background:hsl(var(--h) 55% 96%);
                     color:hsl(var(--h) 50% 28%); padding:8px 16px; border-radius:6px; cursor:default;
                     font:inherit; font-size:13px; display:inline-flex; align-items:center; gap:7px;
                     transition:transform .12s, background .12s; }
.ed .empty .pickbtn:hover{ background:hsl(var(--h) 55% 92%); transform:translateY(-1px); }
.ed .empty .pickbtn .ficon{ width:14px; height:14px; opacity:.75; }

/* log */
.ed .log{ margin-top:48px; padding-top:28px; border-top:2px solid var(--ink); }
.ed .log h3{ font-family:var(--serif); font-weight:500; font-size:13px; letter-spacing:.14em;
             text-transform:uppercase; margin:0 0 16px; color:var(--ink); }
.ed.font-mono .log h3{ font-family:var(--mono); }
.ed .logrow{ display:grid; grid-template-columns:18px 1fr auto; gap:12px; align-items:baseline;
             padding:8px 0; border-bottom:1px dotted rgba(0,0,0,.08); }
.ed .logrow .tick{ color:var(--accent); font-size:14px; line-height:1; }
.ed .logrow .t{ color:var(--ink-2); }
.ed .logrow .meta{ color:var(--ink-3); font-family:var(--mono); font-size:11px; letter-spacing:.02em;
                   font-feature-settings:"tnum"; }
.ed .logadd{ display:grid; grid-template-columns:18px 1fr; gap:12px; padding:12px 0 0; }
.ed .logadd .plus{ color:var(--accent); font-size:14px; line-height:1.2; }
.ed .logadd input{ border:0; background:transparent; font:inherit; outline:none;
                   color:var(--ink); padding:2px 0; width:100%;
                   border-bottom:1px solid transparent; }
.ed .logadd input::placeholder{ color:var(--ink-3); font-style:italic; }
.ed .logadd input:focus{ border-bottom-color:var(--accent); }
`;
    document.head.appendChild(s);
  }

  function softenHex(hex, mix = 0.85) {
    // not used currently but kept for future
    return hex;
  }
  function hexToHsl(hex) {
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (!m) return [0, 0, 0];
    const r = parseInt(m[1].slice(0,2),16)/255;
    const g = parseInt(m[1].slice(2,4),16)/255;
    const b = parseInt(m[1].slice(4,6),16)/255;
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
    let h = 0, s = 0, l = (mx+mn)/2;
    if (mx !== mn) {
      const d = mx-mn;
      s = l > 0.5 ? d/(2-mx-mn) : d/(mx+mn);
      switch (mx) {
        case r: h = (g-b)/d + (g < b ? 6 : 0); break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h *= 60;
    }
    return [h, s*100, l*100];
  }

  // ─── small bits ────────────────────────────────────────────────────────
  function FilterChip({ active, label, onClick, hue }) {
    const style = hue != null ? { '--h': hue } : null;
    return (
      <button
        className={'fchip' + (active ? ' on' : '')}
        onClick={onClick}
        style={style}
      >
        {label}
      </button>
    );
  }

  // Count how many tasks tag a given project
  function countTasksWithTag(tree, tagId) {
    let n = 0;
    window.visitTasks(tree, t => { if (t.tags.includes(tagId)) n++; });
    return n;
  }

  const FolderSVG = () => (
    <svg className="ficon" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M1 3.5C1 2.7 1.7 2 2.5 2H6L7.5 3.5H13.5C14.3 3.5 15 4.2 15 5V11.5C15 12.3 14.3 13 13.5 13H2.5C1.7 13 1 12.3 1 11.5V3.5Z" fill="currentColor" fillOpacity="0.18"/>
    </svg>
  );

  function FolderTab({ project, count, active, muted, onClick }) {
    return (
      <button
        className={'folder' + (active ? ' on' : '') + (muted ? ' muted' : '')}
        style={{ '--h': project.hue }}
        onClick={onClick}
        title={muted ? `${project.label} — muted (role inactive)` : project.label}
      >
        <FolderSVG />
        <span>{project.label}</span>
        <span className="fcount">{count}</span>
      </button>
    );
  }

  function Ribbon({ tree, filters, toggleFilter, clearFilters, passingTaskIds, visibleProjectIds }) {
    const [open, setOpen] = useState(false);
    const popRef = useRef(null);
    React.useEffect(() => {
      if (!open) return;
      const onDoc = e => { if (popRef.current && !popRef.current.contains(e.target)) setOpen(false); };
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
        <div className="filterbtn" ref={popRef}>
          <button
            className={'fbtn' + (ctxActive ? ' has-active' : '') + (open ? ' open' : '')}
            onClick={() => setOpen(o => !o)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 3h8M3.5 6h5M5 9h2"/></svg>
            <span>Filters</span>
            {ctxActive > 0 && <span className="badge">{ctxActive}</span>}
            <svg className="chev" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4l3 3 3-3"/></svg>
          </button>
          <button className="clear" disabled={!totalActive} onClick={clearFilters}>Clear all</button>
          {open && (
            <div className="pop">
              <PopRow label="where"    items={window.CONTEXTS.where}    activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
              <PopRow label="mode"     items={window.CONTEXTS.mode}     activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
              <PopRow label="priority" items={window.CONTEXTS.priority} activeSet={filters.contexts} onToggle={id => toggleFilter('context', id)} />
              <div className="popfoot">
                <span className="ct">{ctxActive === 0 ? 'No context filters' : `${ctxActive} active`}</span>
                <button className="clear" disabled={!ctxActive} onClick={() => {
                  for (const id of Array.from(filters.contexts)) toggleFilter('context', id);
                }}>Clear contexts</button>
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
        <span className="key">{label}</span>
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
      return <span className="tag proj" style={{ '--h': f.hue }}>{f.text}</span>;
    }
    return <span className="tag ctx">{f.text}</span>;
  }

  function TaskRow({ task, onToggle, onDragStart, onDragEnter, onDragEnd, onDragOver, onDrop, dragOver, tagStyle, accent }) {
    return (
      <div
        className={'row' + (task.done ? ' done' : '') + (dragOver === 'top' ? ' drag-over-top' : '') + (dragOver === 'bot' ? ' drag-over-bot' : '') + (dragOver === 'self' ? ' dragging' : '')}
        draggable
        onDragStart={onDragStart}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      >
        <span className="grip" aria-hidden>⋮⋮</span>
        <button className={'check' + (task.done ? ' done' : '')} onClick={() => onToggle(task.id)} aria-label="toggle" />
        <div className="body">
          <div className="title">{task.title}</div>
          {task.tags.length > 0 && (
            <div className="tags">
              {task.tags.map(t => <Tag key={t} tagId={t} tagStyle={tagStyle} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  function AddRow({ groupId, onAdd }) {
    const [v, setV] = useState('');
    const inp = useRef(null);
    return (
      <div className="addrow">
        <span className="check" aria-hidden />
        <input
          ref={inp}
          placeholder="Add a task…"
          value={v}
          onChange={e => setV(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && v.trim()) { onAdd(groupId, v.trim()); setV(''); }
            if (e.key === 'Escape') { setV(''); inp.current.blur(); }
          }}
        />
      </div>
    );
  }

  function GroupNode({ node, depth, ctx, dragState }) {
    const passing = ctx.passingTaskIds;
    const filterActive = ctx.filterActive;
    const collapsed = !node.expanded;
    const tasksInGroup = node.children.filter(c => c.kind === 'task');
    const passingHere = tasksInGroup.filter(t => !filterActive || passing.has(t.id));
    const total = tasksInGroup.length;
    const done = tasksInGroup.filter(t => t.done).length;

    return (
      <div className={'group' + (depth > 0 ? ' subgroup' : '')}>
        <div className={'grouptitle' + (collapsed ? ' col' : '')} onClick={() => ctx.toggleGroup(node.id)}>
          <span className="twist">▾</span>
          <h2>{node.title}</h2>
          {tasksInGroup.length > 0 && <span className="count">{done}/{total}</span>}
        </div>
        {!collapsed && (
          <React.Fragment>
            {node.children.map((c, idx) => {
              if (c.kind === 'group') {
                return <GroupNode key={c.id} node={c} depth={depth + 1} ctx={ctx} dragState={dragState} />;
              }
              if (filterActive && !passing.has(c.id)) return null;
              const ds = dragState.state;
              let dragOver = null;
              if (ds.dragId === c.id) dragOver = 'self';
              else if (ds.overId === c.id) dragOver = ds.overPos;
              return (
                <TaskRow
                  key={c.id}
                  task={c}
                  tagStyle={ctx.tagStyle}
                  accent={ctx.accent}
                  onToggle={ctx.toggleTask}
                  dragOver={dragOver}
                  onDragStart={e => { dragState.set({ dragId: c.id, fromGroup: node.id }); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragEnter={e => {
                    e.preventDefault();
                    const r = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientY - r.top) < r.height / 2 ? 'top' : 'bot';
                    dragState.set({ overId: c.id, overGroup: node.id, overPos: pos, overIdx: node.children.indexOf(c) });
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    const r = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientY - r.top) < r.height / 2 ? 'top' : 'bot';
                    if (ds.overId !== c.id || ds.overPos !== pos) {
                      dragState.set({ overId: c.id, overGroup: node.id, overPos: pos, overIdx: node.children.indexOf(c) });
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const s = dragState.state;
                    if (!s.dragId) return;
                    const idx = node.children.indexOf(c) + (s.overPos === 'bot' ? 1 : 0);
                    ctx.moveTask(s.dragId, node.id, idx);
                    dragState.set({ dragId: null, overId: null, overPos: null, overIdx: null });
                  }}
                  onDragEnd={() => dragState.set({ dragId: null, overId: null, overPos: null, overIdx: null })}
                />
              );
            })}
            {tasksInGroup.length === node.children.length && (
              <AddRow groupId={node.id} onAdd={ctx.addTask} />
            )}
          </React.Fragment>
        )}
      </div>
    );
  }

  function useDragState() {
    const [state, setState] = useState({ dragId: null, overId: null, overPos: null, overIdx: null, fromGroup: null });
    const set = useCallback(patch => setState(s => ({ ...s, ...patch })), []);
    return { state, set };
  }

  function RolesBar({ activeRoles, roleOverrides, cycleRole, now, daypart }) {
    return (
      <section className="roles">
        <div className="daypart">
          <span className="em">{daypart.emoji}</span>
          <div className="lbl">
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
              title={`${r.label} · ${ov === 'auto' ? 'auto by time' : ov === 'on' ? 'forced on' : 'muted'}`}
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

  function VariantEditorial(props) {
    const { tree, log, filters, tweaks, passingTaskIds, visibleGroups, filterActive,
            toggleTask, toggleGroup, addTask, moveTask, toggleFilter, clearFilters, logTask,
            activeRoles, visibleProjectIds, roleOverrides, cycleRole, now, daypart } = props;
    const drag = useDragState();
    const [logInput, setLogInput] = useState('');
    const [h, s, l] = hexToHsl(tweaks.accent);
    const cssVars = {
      '--accent': tweaks.accent,
      '--accent-soft': `hsl(${h} ${Math.min(s, 50)}% ${Math.min(l + 40, 95)}%)`,
      '--accent-line': `hsl(${h} ${Math.min(s, 60)}% ${Math.min(l + 30, 85)}%)`,
    };

    const ctx = {
      passingTaskIds, filterActive,
      toggleTask, toggleGroup, addTask, moveTask,
      tagStyle: tweaks.tagStyle, accent: tweaks.accent,
    };

    return (
      <div className={'ed' + ' font-' + tweaks.font + ' den-' + tweaks.density + ' ts-' + tweaks.tagStyle} style={cssVars}>
        <div className="stage">
          <header className="hd">
            <h1>Roadmap</h1>
            <div className="meta">
              <div className="day">Sat, May 23</div>
              <div>Week 21 · 2026</div>
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
            passingTaskIds={passingTaskIds}
            visibleProjectIds={visibleProjectIds}
          />

          <section className="tree">
            {filters.projects.size === 0 ? (
              <div className="empty">
                <div className="arrow">↑</div>
                <h2>Pick a folder to begin.</h2>
                <p>{activeRoles.size === 0
                    ? 'All roles are muted right now. Un-mute one above, or set the hour from Tweaks.'
                    : `On duty: ${[...activeRoles].map(id => window.ROLE_BY_ID[id].label).join(' · ')}.`}</p>
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
            <h3>Today's Log</h3>
            {log.map(l => (
              <div key={l.id} className="logrow">
                <span className="tick">✓</span>
                <span className="t">{l.title}</span>
                <span className="meta">{l.context} · {l.duration}</span>
              </div>
            ))}
            <div className="logadd">
              <span className="plus">+</span>
              <input
                placeholder="Log a completed task…"
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

  window.VariantEditorial = VariantEditorial;
})();
