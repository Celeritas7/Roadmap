// app.jsx — top-level state + DesignCanvas with three artboard variants + Tweaks.

const { useState, useMemo, useCallback, useRef, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#c96442",
  "tagStyle": "chip",
  "font": "sans",
  "density": "cozy",
  "simulatedHour": 20,
  "weekendMode": "auto",
  "currentWhere": "any",
  "attkStart": 9,  "attkEnd": 19, "attkWeekend": false, "attkLocs": "home,office,train",
  "midStart":  19, "midEnd":  21, "midWeekend":  true,  "midLocs":  "home,office",
  "defStart":  21, "defEnd":  23, "defWeekend":  true,  "defLocs":  "home"
}/*EDITMODE-END*/;

function useRoadmapState() {
  const [tree, setTree]       = useState(window.INITIAL_TREE);
  const [log,  setLog]        = useState(window.INITIAL_LOG);
  const [filters, setFilters] = useState({ projects: new Set(), contexts: new Set() });
  // Per-role manual override: 'auto' | 'on' | 'off'
  const [roleOverrides, setRoleOverrides] = useState({
    attackers: 'auto', midplayers: 'auto', defenders: 'auto',
  });

  const toggleTask = useCallback(id => {
    setTree(t => window.mapTree(t, n => n.id === id ? { ...n, done: !n.done } : n));
  }, []);
  const toggleGroup = useCallback(id => setTree(t => window.toggleNode(t, id, 'expanded')), []);
  const addTask     = useCallback((groupId, title) => {
    const id = 'n' + Math.random().toString(36).slice(2, 8);
    setTree(t => window.appendTaskToGroup(t, groupId, {
      id, kind: 'task', title, done: false, tags: [],
    }));
  }, []);
  const moveTask    = useCallback((id, toGroupId, toIdx) => {
    setTree(t => window.moveTask(t, id, toGroupId, toIdx));
  }, []);
  const removeTask  = useCallback(id => setTree(t => window.removeNode(t, id)), []);

  const toggleFilter = useCallback((family, id) => {
    setFilters(prev => {
      const key = family === 'project' ? 'projects' : 'contexts';
      const next = new Set(prev[key]);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...prev, [key]: next };
    });
  }, []);

  const clearFilters = useCallback(() => setFilters({ projects: new Set(), contexts: new Set() }), []);

  const logTask = useCallback((title, context, duration) => {
    const id = 'l' + Math.random().toString(36).slice(2, 8);
    setLog(l => [{ id, title, context, duration }, ...l]);
  }, []);

  // Cycle a role's manual override: auto → on → off → auto
  const cycleRole = useCallback(roleId => {
    setRoleOverrides(o => {
      const cur = o[roleId] || 'auto';
      const next = cur === 'auto' ? 'on' : cur === 'on' ? 'off' : 'auto';
      return { ...o, [roleId]: next };
    });
  }, []);

  return {
    tree, log, filters, roleOverrides,
    toggleTask, toggleGroup, addTask, moveTask, removeTask,
    toggleFilter, clearFilters, logTask, cycleRole,
  };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const state = useRoadmapState();

  // Current "now" for role auto-evaluation. Simulated hour wins; -1 = live.
  const now = useMemo(() => {
    const d = new Date();
    const hour = t.simulatedHour >= 0 && t.simulatedHour <= 23 ? Number(t.simulatedHour) : d.getHours();
    let weekend = (d.getDay() === 0 || d.getDay() === 6);
    if (t.weekendMode === 'on')  weekend = true;
    if (t.weekendMode === 'off') weekend = false;
    return { hour, weekend, dow: d.getDay(), date: d };
  }, [t.simulatedHour, t.weekendMode]);

  const daypart = useMemo(() => window.getDaypart(now.hour), [now.hour]);

  // Compose per-role rules from flat tweak keys. Flat keys persist cleanly via
  // the host's shallow-merge __edit_mode_set_keys protocol.
  const roleRules = useMemo(() => {
    const parseLocs = s => (s || '').split(',').map(x => x.trim()).filter(Boolean);
    return {
      attackers:  { defaultStart: t.attkStart, defaultEnd: t.attkEnd,  weekendActive: !!t.attkWeekend, locations: parseLocs(t.attkLocs) },
      midplayers: { defaultStart: t.midStart,  defaultEnd: t.midEnd,   weekendActive: !!t.midWeekend,  locations: parseLocs(t.midLocs)  },
      defenders:  { defaultStart: t.defStart,  defaultEnd: t.defEnd,   weekendActive: !!t.defWeekend,  locations: parseLocs(t.defLocs)  },
    };
  }, [t.attkStart, t.attkEnd, t.attkWeekend, t.attkLocs,
      t.midStart,  t.midEnd,  t.midWeekend,  t.midLocs,
      t.defStart,  t.defEnd,  t.defWeekend,  t.defLocs]);

  // Set of currently-active role ids — drives folder visibility + content gating.
  const activeRoles = useMemo(
    () => window.computeActiveRoles({
      hour: now.hour,
      weekend: now.weekend,
      location: t.currentWhere === 'any' ? null : t.currentWhere,
      overrides: state.roleOverrides,
      rules: roleRules,
    }),
    [now.hour, now.weekend, t.currentWhere, state.roleOverrides, roleRules],
  );

  // Visible projects = projects whose role is active.
  const visibleProjectIds = useMemo(() => {
    const out = new Set();
    for (const p of window.PROJECTS) {
      if (activeRoles.has(p.role)) out.add(p.id);
    }
    return out;
  }, [activeRoles]);

  // Pre-compute filter passes (tasks + groups) accounting for active roles.
  // We treat muted roles as if they're not in the picture — their tasks are
  // dropped from the visible set entirely.
  const passingTaskIds = useMemo(() => {
    const out = new Set();
    window.visitTasks(state.tree, task => {
      // 1. Active-role gate: the task must reference at least one active project.
      const inActiveRole = task.tags.some(tag => visibleProjectIds.has(tag));
      if (!inActiveRole) return;
      // 2. Project filter
      if (state.filters.projects.size > 0) {
        const has = task.tags.some(tag => state.filters.projects.has(tag));
        if (!has) return;
      }
      // 3. Context filter (AND across selected contexts)
      if (state.filters.contexts.size > 0) {
        for (const c of state.filters.contexts) {
          if (!task.tags.includes(c)) return;
        }
      }
      out.add(task.id);
    });
    return out;
  }, [state.tree, state.filters, visibleProjectIds]);

  const visibleGroups = useMemo(
    () => window.visibleGroupIds(state.tree, passingTaskIds),
    [state.tree, passingTaskIds],
  );
  const filterActive = state.filters.projects.size + state.filters.contexts.size > 0;

  const shared = {
    ...state,
    tweaks: t,
    passingTaskIds, visibleGroups, filterActive,
    activeRoles, visibleProjectIds,
    now, daypart,
  };

  return (
    <React.Fragment>
      <DesignCanvas>
        <DCSection id="variants" title="Roadmap — main screen"
                   subtitle="Roles (Attackers · Mid-players · Defenders) gate which folders are on duty. Mute by time, location, or by hand.">
          <DCArtboard id="editorial" label="A · Editorial" width={1180} height={1300}>
            <VariantEditorial {...shared} />
          </DCArtboard>
          <DCArtboard id="lattice" label="B · Lattice" width={1180} height={1300}>
            <VariantLattice {...shared} />
          </DCArtboard>
          <DCArtboard id="orgpaper" label="C · Org Paper" width={1180} height={1300}>
            <VariantOrgPaper {...shared} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel>
        <TweakSection label="Now" />
        <TweakSlider
          label="Hour of day"
          value={t.simulatedHour}
          min={0} max={23} step={1}
          format={v => `${v}:00 · ${window.getDaypart(v).label}`}
          onChange={v => setTweak('simulatedHour', v)}
        />
        <TweakRadio
          label="Weekend"
          value={t.weekendMode}
          options={['auto', 'on', 'off']}
          onChange={v => setTweak('weekendMode', v)}
        />
        <TweakSelect
          label="Where am I"
          value={t.currentWhere}
          options={['any', 'home', 'office', 'train']}
          onChange={v => setTweak('currentWhere', v)}
        />

        <TweakSection label="Rules · Attackers (ambitions)" />
        <TweakSlider label="Start hour" value={t.attkStart} min={0} max={23} step={1} unit=":00" onChange={v => setTweak('attkStart', v)} />
        <TweakSlider label="End hour"   value={t.attkEnd}   min={0} max={23} step={1} unit=":00" onChange={v => setTweak('attkEnd', v)} />
        <TweakToggle label="Active on weekends" value={!!t.attkWeekend} onChange={v => setTweak('attkWeekend', v)} />
        <TweakText   label="Locations" value={t.attkLocs} onChange={v => setTweak('attkLocs', v)} />

        <TweakSection label="Rules · Mid-players (life support)" />
        <TweakSlider label="Start hour" value={t.midStart} min={0} max={23} step={1} unit=":00" onChange={v => setTweak('midStart', v)} />
        <TweakSlider label="End hour"   value={t.midEnd}   min={0} max={23} step={1} unit=":00" onChange={v => setTweak('midEnd', v)} />
        <TweakToggle label="Active on weekends" value={!!t.midWeekend} onChange={v => setTweak('midWeekend', v)} />
        <TweakText   label="Locations" value={t.midLocs} onChange={v => setTweak('midLocs', v)} />

        <TweakSection label="Rules · Defenders (self-care)" />
        <TweakSlider label="Start hour" value={t.defStart} min={0} max={23} step={1} unit=":00" onChange={v => setTweak('defStart', v)} />
        <TweakSlider label="End hour"   value={t.defEnd}   min={0} max={23} step={1} unit=":00" onChange={v => setTweak('defEnd', v)} />
        <TweakToggle label="Active on weekends" value={!!t.defWeekend} onChange={v => setTweak('defWeekend', v)} />
        <TweakText   label="Locations" value={t.defLocs} onChange={v => setTweak('defLocs', v)} />

        <TweakSection label="Theme" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={['#c96442', '#2a6fdb', '#1f8a5b', '#7a5ae0', '#1c1a17']}
          onChange={v => setTweak('accent', v)}
        />
        <TweakRadio
          label="Font"
          value={t.font}
          options={['sans', 'serif', 'mono']}
          onChange={v => setTweak('font', v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'cozy', 'comfy']}
          onChange={v => setTweak('density', v)}
        />
        <TweakSelect
          label="Tag style"
          value={t.tagStyle}
          options={['chip', 'underline', 'bracket', 'hashtag']}
          onChange={v => setTweak('tagStyle', v)}
        />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
