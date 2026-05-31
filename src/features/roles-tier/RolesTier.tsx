import { useStore } from '../../store/useStore.ts'
import { ROLES } from '../../seed.ts'
import { activeRoleIds } from '../../store/selectors.ts'
import { DaypartPill } from './DaypartPill.tsx'
import { RoleChip } from './RoleChip.tsx'

export function RolesTier() {
  const now = useStore((s) => s.now)
  const settings = useStore((s) => s.settings)
  const cycleRole = useStore((s) => s.cycleRole)
  const overrides = settings?.role_overrides ?? {}
  const active = activeRoleIds(now, overrides)

  return (
    <section className="roles">
      <DaypartPill />
      {ROLES.map((r) => (
        <RoleChip
          key={r.id}
          role={r}
          active={active.has(r.id)}
          override={overrides[r.id] ?? 'auto'}
          onClick={() => void cycleRole(r.id)}
        />
      ))}
    </section>
  )
}
