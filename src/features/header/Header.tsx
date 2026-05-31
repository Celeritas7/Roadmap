import { format, getISOWeek } from 'date-fns'

export function Header() {
  const now = new Date()
  const pill = format(now, 'EEE · MMM d')
  const week = `Week ${getISOWeek(now)}`

  return (
    <div className="toprow">
      <div className="title">
        <h1>Roadmap</h1>
        <span className="kbd">⌘K to jump</span>
      </div>
      <div className="right">
        <span className="pill">{pill}</span>
        <span>{week}</span>
      </div>
    </div>
  )
}
