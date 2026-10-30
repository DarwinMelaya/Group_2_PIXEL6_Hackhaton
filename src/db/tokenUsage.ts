import type { SQLiteDatabase } from 'expo-sqlite'

export type UsageSource = 'gemini' | 'local'

export type TokenUsage = { promptTokens: number; completionTokens: number }

export type SourceUsage = TokenUsage & { source: UsageSource; requests: number }

type UsageRow = { source: UsageSource; requests: number; prompt_tokens: number; completion_tokens: number }

const toUsage = (row: UsageRow): SourceUsage => ({ source: row.source, requests: row.requests, promptTokens: row.prompt_tokens, completionTokens: row.completion_tokens })

export async function recordTokenUsage(db: SQLiteDatabase, source: UsageSource, usage: TokenUsage) {
  await db.runAsync(
    `INSERT INTO token_usage (source, requests, prompt_tokens, completion_tokens) VALUES (?, 1, ?, ?)
     ON CONFLICT(source) DO UPDATE SET
       requests = requests + 1,
       prompt_tokens = prompt_tokens + excluded.prompt_tokens,
       completion_tokens = completion_tokens + excluded.completion_tokens`,
    source,
    usage.promptTokens,
    usage.completionTokens,
  )
}

export async function getTokenUsage(db: SQLiteDatabase): Promise<SourceUsage[]> {
  const rows = await db.getAllAsync<UsageRow>('SELECT source, requests, prompt_tokens, completion_tokens FROM token_usage')
  return rows.map(toUsage)
}

export async function resetTokenUsage(db: SQLiteDatabase, source: UsageSource) {
  await db.runAsync('DELETE FROM token_usage WHERE source = ?', source)
}
