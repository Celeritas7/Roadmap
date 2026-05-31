import { ROLES, PROJECT_BY_ID, CONTEXT_BY_ID } from '../seed.ts'
import type {
  FilterState,
  NowState,
  Role,
  RoleOverride,
  RoleOverrides,
  TaskRow,
} from '../types.ts'

// ─── role evaluation ──────────────────────────────────────────────────

function isInTimeRange(hour: number, start: number, end: number): boolean {
  if (start <= end) return hour >= start && hour < end
  return hour >= start || hour < end // wraps midnight
}

function effectiveWindow(role: Role, weekend: boolean): { start: number; end: number } {
  if (weekend && role.weekendStart !== undefined && role.weekendEnd !== undefined) {
    return { start: role.weekendStart, end: role.weekendEnd }
  }
  return { start: role.defaultStart, end: role.defaultEnd }
}

export function isRoleActive(
  role: Role,
  now: NowState,
  override: RoleOverride | undefined,
): boolean {
  if (override === 'on') return true
  if (override === 'off') return false
  const { start, end } = effectiveWindow(role, now.weekend)
  let active = isInTimeRange(now.hour, start, end)
  if (now.weekend && role.weekendActive) active = true
  if (now.location !== 'any' && !role.locations.includes(now.location)) active = false
  return active
}

export function activeRoleIds(now: NowState, overrides: RoleOverrides): Set<string> {
  const out = new Set<string>()
  for (const role of ROLES) {
    if (isRoleActive(role, now, overrides[role.id])) out.add(role.id)
  }
  return out
}

// ─── project visibility (gated by active roles) ───────────────────────

export function visibleProjectIds(activeRoles: Set<string>): Set<string> {
  const out = new Set<string>()
  for (const project of Object.values(PROJECT_BY_ID)) {
    if (activeRoles.has(project.role)) out.add(project.id)
  }
  return out
}

// ─── task pipeline: role gate → project OR → context AND ──────────────
// Plus campaign-mode dim: when a priority-family context filter is active,
// non-matching tasks are dimmed (opacity 0.3) rather than hidden. Other
// context families keep hide behavior.

export type PassResult = {
  pass: Set<string>
  dim: Set<string>
}

export function passingTaskIds(
  tasks: TaskRow[],
  activeRoles: Set<string>,
  filters: FilterState,
): PassResult {
  const pass = new Set<string>()
  const dim = new Set<string>()

  const dimFilters = new Set<string>()
  const hideFilters = new Set<string>()
  for (const id of filters.contexts) {
    const ctx = CONTEXT_BY_ID[id]
    if (ctx?.family === 'priority') dimFilters.add(id)
    else hideFilters.add(id)
  }

  for (const t of tasks) {
    if (t.kind !== 'task') continue

    // Role gate: any project tag must belong to an active role.
    // (Tasks with no project tag are considered ungated — visible.)
    const projectTags = t.tags.filter((tag) => tag in PROJECT_BY_ID)
    if (projectTags.length > 0) {
      const inActive = projectTags.some((p) => activeRoles.has(PROJECT_BY_ID[p].role))
      if (!inActive) continue
    }

    // Project filter (OR)
    if (filters.projects.size > 0) {
      const matched = projectTags.some((p) => filters.projects.has(p))
      if (!matched) continue
    }

    // Hide-family context filter (AND)
    let hidden = false
    for (const id of hideFilters) {
      if (!t.tags.includes(id)) {
        hidden = true
        break
      }
    }
    if (hidden) continue

    pass.add(t.id)

    // Dim-family (priority) filter — AND semantics: dim unless task has ALL.
    if (dimFilters.size > 0) {
      let allMatch = true
      for (const id of dimFilters) {
        if (!t.tags.includes(id)) {
          allMatch = false
          break
        }
      }
      if (!allMatch) dim.add(t.id)
    }
  }

  return { pass, dim }
}

// ─── group visibility (any descendant passes) ─────────────────────────

export function visibleGroupIds(tasks: TaskRow[], passingIds: Set<string>): Set<string> {
  const byParent = new Map<string | null, TaskRow[]>()
  for (const t of tasks) {
    const key = t.parent_id
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(t)
  }

  const out = new Set<string>()
  function rec(parentId: string | null): boolean {
    let anyVisible = false
    const children = byParent.get(parentId) ?? []
    for (const child of children) {
      if (child.kind === 'task') {
        if (passingIds.has(child.id)) anyVisible = true
      } else {
        const childVisible = rec(child.id)
        if (childVisible) {
          out.add(child.id)
          anyVisible = true
        }
      }
    }
    return anyVisible
  }
  rec(null)
  return out
}
