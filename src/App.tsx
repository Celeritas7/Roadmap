import { useEffect } from 'react'
import { useStore } from './store/useStore.ts'
import { useNow } from './hooks/useNow.ts'
import { Header } from './features/header/Header.tsx'
import { RolesTier } from './features/roles-tier/RolesTier.tsx'
import { FoldersRow } from './features/folders/FoldersRow.tsx'
import { Tree } from './features/tree/Tree.tsx'
import { TodaysLog } from './features/log/TodaysLog.tsx'
import { DebugTimeSlider } from './features/debug/DebugTimeSlider.tsx'

export default function App() {
  const init = useStore((s) => s.init)
  const loading = useStore((s) => s.loading)
  const error = useStore((s) => s.error)
  const hasData = useStore((s) => s.tree.length > 0)
  const clearError = useStore((s) => s.clearError)

  useEffect(() => {
    void init()
  }, [init])

  useNow()

  // A load failure (no data yet) gets the full error screen. A failed mutation
  // after data is loaded must NOT blank the tree — it surfaces as a dismissible
  // banner while the optimistic rollback keeps the tree intact.
  const loadFailed = !!error && !hasData

  return (
    // ── Step 1 foundation flip ──────────────────────────────────────────────
    // The app root now carries `.rm` + the redesign's token context.
    //  • data-theme="trailhead": confirmed app default; activates the full
    //    [data-theme] variable set in index.css (previously dead CSS).
    //  • data-role="attackers": HARDCODED this slice. The store has no single
    //    active-role yet — only activeRoleIds() (a time-based Set). The single
    //    active-role view state lands in Step 2 (role chips), where this
    //    becomes data-role={activeRole}. Keep the value one of
    //    attackers/midplayers/defenders so it matches index.css [data-role].
    // `.rm-scroll` is the height-constrained inner scroll region; the portaled
    // mobile filter sheet and DebugTimeSlider sit on `.rm` itself, outside it.
    // The inner `.frame/.topbar/.main/.empty` classes are the old lattice
    // shell (dead CSS now) — re-skinned in Steps 2–5, left untouched here.
    <div className="rm" data-theme="trailhead" data-role="attackers">
      <div className="rm-scroll">
        <div className="frame">
          <header className="topbar">
            <Header />
            <RolesTier />
            <FoldersRow />
          </header>
          <main className="main">
            {loading ? (
              <div className="empty">
                <h2>Loading…</h2>
              </div>
            ) : loadFailed ? (
              <div className="empty">
                <h2>Couldn't load tasks</h2>
                <p>{error}</p>
              </div>
            ) : (
              <>
                {error && (
                  // .err-banner markup contract (index.css): icon + msg +
                  // dismiss. Retry is deferred to Step 5. Copy reflects the
                  // optimistic rollback — the failed edit is reverted, not
                  // "kept locally".
                  <div className="err-banner" role="alert">
                    <span className="eb-icon" aria-hidden="true">⚠</span>
                    <span className="eb-msg">
                      Couldn't save that change — it's been undone.
                    </span>
                    <button
                      type="button"
                      className="eb-dismiss"
                      onClick={() => clearError()}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                <Tree />
                <TodaysLog />
              </>
            )}
          </main>
        </div>
      </div>
      <DebugTimeSlider />
    </div>
  )
}
