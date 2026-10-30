import type { SQLiteDatabase } from 'expo-sqlite'

import { isGeminiModelChoice, type GeminiModelChoice } from '@/data/ai'
import { textSizes, type TextSize } from '@/theme/tokens'

export const APPEARANCES = ['light', 'dark'] as const
export type Appearance = (typeof APPEARANCES)[number]

export const NICKNAME_MAX_LENGTH = 40

export const AI_MODES = ['local', 'cloud', 'custom'] as const
export type AiMode = (typeof AI_MODES)[number]

export const REPLY_LENGTHS = ['short', 'detailed'] as const
export type ReplyLength = (typeof REPLY_LENGTHS)[number]

export type Settings = { appearance: Appearance; textSize: TextSize; nickname: string; onboarded: boolean; aiMode: AiMode; localReplyLength: ReplyLength; geminiModel: GeminiModelChoice; backendUrl: string; backendModel: string }

export const defaultSettings: Settings = { appearance: 'light', textSize: 'standard', nickname: '', onboarded: false, aiMode: 'local', localReplyLength: 'short', geminiModel: 'auto', backendUrl: '', backendModel: '' }

export const isAppearance = (value: unknown): value is Appearance => APPEARANCES.includes(value as Appearance)
export const isTextSize = (value: unknown): value is TextSize => typeof value === 'string' && value in textSizes
export const isAiMode = (value: unknown): value is AiMode => AI_MODES.includes(value as AiMode)
export const isReplyLength = (value: unknown): value is ReplyLength => REPLY_LENGTHS.includes(value as ReplyLength)

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
    nickname: typeof stored.nickname === 'string' ? stored.nickname.trim().slice(0, NICKNAME_MAX_LENGTH) : '',
    onboarded: stored.onboarded === 'true',
    aiMode: isAiMode(stored.aiMode) ? stored.aiMode : defaultSettings.aiMode,
    localReplyLength: isReplyLength(stored.localReplyLength) ? stored.localReplyLength : defaultSettings.localReplyLength,
    geminiModel: isGeminiModelChoice(stored.geminiModel) ? stored.geminiModel : defaultSettings.geminiModel,
    backendUrl: typeof stored.backendUrl === 'string' ? stored.backendUrl.trim() : '',
    backendModel: typeof stored.backendModel === 'string' ? stored.backendModel.trim() : '',
  }
}

export async function writeSettings(db: SQLiteDatabase, settings: Partial<Settings>) {
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(settings)) {
      await db.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        key,
        String(value),
      )
    }
  })
}
