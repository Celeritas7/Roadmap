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
    <div className="lat den-cozy">
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
                <div className="errbanner" role="alert">
                  <span>Couldn't save your last change: {error}</span>
                  <button type="button" onClick={() => clearError()}>
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
      <DebugTimeSlider />
    </div>
  )
}
