import type { CSSProperties } from 'react'
import type { Role, RoleOverride } from '../../types.ts'

type Props = {
  role: Role
  active: boolean
  override: RoleOverride
  onClick: () => void
}

export function RoleChip({ role, active, override, onClick }: Props) {
  const style = { '--h': role.hue } as CSSProperties
  const className = 'role' + (active ? ' active' : ' muted')
  const titleSuffix =
    override === 'auto'
      ? 'auto by time'
      : override === 'on'
        ? 'forced on'
        : 'muted'
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      title={`${role.label} · ${titleSuffix} — click to cycle`}
    >
      <span className="dot" />
      <span className="name">{role.label}</span>
      <span className="sub">{role.subtitle}</span>
      {override !== 'auto' && (
        <span className="pin">{override === 'on' ? 'PIN' : 'OFF'}</span>
      )}
    </button>
  )
}
