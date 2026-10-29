import type { SQLiteDatabase } from 'expo-sqlite'

import { textSizes, type TextSize } from '@/theme/tokens'

export const APPEARANCES = ['system', 'light', 'dark'] as const
export type Appearance = (typeof APPEARANCES)[number]

export type Settings = { appearance: Appearance; textSize: TextSize }

export const defaultSettings: Settings = { appearance: 'system', textSize: 'standard' }

export const isAppearance = (value: unknown): value is Appearance => APPEARANCES.includes(value as Appearance)
export const isTextSize = (value: unknown): value is TextSize => typeof value === 'string' && value in textSizes

/**
 * Async on purpose: expo-sqlite's synchronous API on web requires SharedArrayBuffer
 * (cross-origin isolation), which the Expo dev server does not provide for every page.
 */
export async function readSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings')
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  return {
    appearance: isAppearance(stored.appearance) ? stored.appearance : defaultSettings.appearance,
    textSize: isTextSize(stored.textSize) ? stored.textSize : defaultSettings.textSize,
  }
}

export async function writeSettings(db: SQLiteDatabase, settings: Partial<Settings>) {
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(settings)) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        value,
      )
    }
  })
}
