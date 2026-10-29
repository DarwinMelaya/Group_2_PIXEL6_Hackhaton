type WebDatabaseLockState = {
  acquired: Promise<void>
  channel?: BroadcastChannel
}

type GlobalWithWebDatabaseLock = typeof globalThis & {
  __gabaiWebDatabaseLock?: WebDatabaseLockState
}

const LOCK_NAME = 'gabai-expo-sqlite-opfs'
const CHANNEL_NAME = 'gabai-database-handoff'
const PAUSED_KEY = 'gabai-database-paused'

export function isWebDatabasePaused(): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(PAUSED_KEY) === 'true'
}

/** Ask the current owner to park itself before this tab opens the same saved database. */
export function openWebDatabaseHere(): void {
  if (typeof BroadcastChannel === 'undefined') {
    window.location.reload()
    return
  }
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.postMessage({ type: 'open-here' })
  channel.close()
  if (isWebDatabasePaused()) {
    window.sessionStorage.removeItem(PAUSED_KEY)
    window.location.reload()
  }
}

function listenForHandoff(state: WebDatabaseLockState) {
  if (state.channel || typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(CHANNEL_NAME)
  state.channel = channel
  channel.onmessage = (event: MessageEvent) => {
    if (event.data?.type !== 'open-here') return
    // Closing a SQLite connection alone doesn't release Expo's OPFS handle pool.
    // Reload to terminate its worker (or cancel a queued lock request), then stay
    // parked until explicitly resumed. Only the requesting tab remains in the queue.
    window.sessionStorage.setItem(PAUSED_KEY, 'true')
    window.location.reload()
  }
}

/**
 * Expo SQLite's web VFS keeps OPFS access handles open for the lifetime of its worker.
 * Hold one origin-wide lock so another tab waits until this page closes before opening SQLite.
 * The global promise survives Fast Refresh, avoiding a second lock request from the same page.
 */
export function waitForWebDatabaseLock(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return Promise.resolve()
  }

  const globalWithLock = globalThis as GlobalWithWebDatabaseLock
  const existingState = globalWithLock.__gabaiWebDatabaseLock
  if (existingState) {
    listenForHandoff(existingState)
    return existingState.acquired
  }

  let resolveAcquired!: () => void
  let rejectAcquired!: (error: unknown) => void
  const acquired = new Promise<void>((resolve, reject) => {
    resolveAcquired = resolve
    rejectAcquired = reject
  })
  const state = { acquired }
  globalWithLock.__gabaiWebDatabaseLock = state
  listenForHandoff(state)

  const releaseState = (error: unknown) => {
    if (globalWithLock.__gabaiWebDatabaseLock === state) {
      delete globalWithLock.__gabaiWebDatabaseLock
    }
    rejectAcquired(error)
  }

  const holdLockForPageLifetime = new Promise<void>(() => {})
  try {
    void navigator.locks.request(LOCK_NAME, async () => {
      resolveAcquired()
      await holdLockForPageLifetime
    }).catch(releaseState)
  } catch (error) {
    releaseState(error)
  }

  return acquired
}
