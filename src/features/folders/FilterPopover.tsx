import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../../store/useStore.ts'
import { useMediaQuery } from '../../hooks/useMediaQuery.ts'
import { CONTEXTS_BY_FAMILY } from '../../seed.ts'

export function FilterPopover() {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement | null>(null)
  const filters = useStore((s) => s.filters)
  const toggleFilter = useStore((s) => s.toggleFilter)
  const active = filters.contexts.size
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    // Desktop only: click-outside / Escape dismiss. On mobile the sheet is
    // portaled outside `wrap`, so this would mis-fire — the backdrop and the
    // close button handle dismissal there instead.
    if (!open || isMobile) return
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, isMobile])

  // Shared panel. On desktop it renders in place (absolute popover). On mobile
  // it's portaled (with a backdrop) into the `.lat` root — escaping the topbar's
  // `backdrop-filter`, which would otherwise be the containing block for the
  // fixed-position sheet and anchor it to the topbar instead of the viewport.
  const panel = (
    <div className="pop" role="dialog" aria-label="Filters">
      <div className="sheethead">
        <span className="sheettitle">Filter</span>
        <button
          type="button"
          className="sheetclose"
          aria-label="Close filters"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </div>
      <PopGroup
        label="Where"
        items={CONTEXTS_BY_FAMILY.where}
        activeSet={filters.contexts}
        onToggle={(id) => toggleFilter('context', id)}
      />
      <PopGroup
        label="Mode"
        items={CONTEXTS_BY_FAMILY.mode}
        activeSet={filters.contexts}
        onToggle={(id) => toggleFilter('context', id)}
      />
      <PopGroup
        label="Priority"
        items={CONTEXTS_BY_FAMILY.priority}
        activeSet={filters.contexts}
        onToggle={(id) => toggleFilter('context', id)}
      />
      <div className="popfoot">
        <span className="ct">{active === 0 ? '—' : `${active} active`}</span>
        <button
          type="button"
          className="clear"
          disabled={!active}
          onClick={() => {
            for (const id of Array.from(filters.contexts)) toggleFilter('context', id)
          }}
        >
          Clear
        </button>
      </div>
    </div>
  )

  const portalTarget = wrap.current?.closest('.lat') ?? null

  return (
    <div className="filterwrap" ref={wrap}>
      <button
        type="button"
        className={'fbtn' + (active ? ' has-active' : '') + (open ? ' open' : '')}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M2 3h8M3.5 6h5M5 9h2" />
        </svg>
        <span>Filter</span>
        {active > 0 && <span className="badge">{active}</span>}
        <svg className="chev" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>
      {open &&
        (isMobile && portalTarget
          ? createPortal(
              <>
                <div className="popbackdrop" onClick={() => setOpen(false)} aria-hidden />
                {panel}
              </>,
              portalTarget,
            )
          : panel)}
    </div>
  )
}

function PopGroup({
  label,
  items,
  activeSet,
  onToggle,
}: {
  label: string
  items: { id: string; label: string }[]
  activeSet: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="popgroup">
      <span className="glabel">{label}</span>
      <div className="opts">
        {items.map((it) => (
          <FilterChip
            key={it.id}
            label={it.label}
            active={activeSet.has(it.id)}
            onClick={() => onToggle(it.id)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  const at = label.startsWith('@')
  return (
    <button type="button" className={'fchip' + (active ? ' on' : '')} onClick={onClick}>
      {at ? (
        <>
          <span className="at">@</span>
          {label.slice(1)}
        </>
      ) : (
        label
      )}
    </button>
  )
}
