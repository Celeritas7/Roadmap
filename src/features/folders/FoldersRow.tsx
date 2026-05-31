import { useStore } from '../../store/useStore.ts'
import { PROJECTS } from '../../seed.ts'
import { activeRoleIds, visibleProjectIds } from '../../store/selectors.ts'
import { countTasksWithTag } from '../../lib/tree.ts'
import { FolderTab } from './FolderTab.tsx'
import { FilterPopover } from './FilterPopover.tsx'

export function FoldersRow() {
  const tree = useStore((s) => s.tree)
  const now = useStore((s) => s.now)
  const settings = useStore((s) => s.settings)
  const filters = useStore((s) => s.filters)
  const toggleFilter = useStore((s) => s.toggleFilter)
  const clearFilters = useStore((s) => s.clearFilters)

  const overrides = settings?.role_overrides ?? {}
  const active = activeRoleIds(now, overrides)
  const visible = visibleProjectIds(active)
  const totalActive = filters.projects.size + filters.contexts.size

  return (
    <div className="fbar">
      <div className="folders">
        <span className="flabel">Folders</span>
        {PROJECTS.map((p) => (
          <FolderTab
            key={p.id}
            project={p}
            count={countTasksWithTag(tree, p.id)}
            muted={!visible.has(p.id)}
            on={filters.projects.has(p.id)}
            onClick={() => toggleFilter('project', p.id)}
          />
        ))}
      </div>
      <div className="ftools">
        <FilterPopover />
        <button
          type="button"
          className="clear"
          disabled={totalActive === 0}
          onClick={clearFilters}
        >
          {totalActive ? `Clear (${totalActive})` : 'Clear'}
        </button>
      </div>
    </div>
  )
}
