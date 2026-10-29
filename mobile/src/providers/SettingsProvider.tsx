import { useSQLiteContext } from 'expo-sqlite'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { defaultSettings, readSettings, writeSettings, type Settings } from '@/db/settings'

type SettingsContextValue = {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  /** Resets in-memory state only; persistence is handled by the caller (e.g. clearAllData). */
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Loads persisted settings before rendering children so the first frame uses the right theme. */
export function SettingsProvider({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const db = useSQLiteContext()
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    readSettings(db).then(setSettings).catch(() => setSettings(defaultSettings))
  }, [db])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((current) => ({ ...(current ?? defaultSettings), ...patch }))
    await writeSettings(db, patch)
  }, [db])

  const resetSettings = useCallback(() => setSettings(defaultSettings), [])

  const value = useMemo(() => settings && { settings, updateSettings, resetSettings }, [settings, updateSettings, resetSettings])
  if (!value) return fallback
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within <SettingsProvider>')
  return context
}
