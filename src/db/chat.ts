import type { SQLiteDatabase } from 'expo-sqlite'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = { id: number; role: ChatRole; body: string; createdAt: number }

type ChatRow = { id: number; role: ChatRole; body: string; created_at: number }

const toMessage = (row: ChatRow): ChatMessage => ({ id: row.id, role: row.role, body: row.body, createdAt: row.created_at })

export async function listMessages(db: SQLiteDatabase): Promise<ChatMessage[]> {
  const rows = await db.getAllAsync<ChatRow>('SELECT id, role, body, created_at FROM chat_messages ORDER BY id ASC')
  return rows.map(toMessage)
}

export async function addMessage(db: SQLiteDatabase, role: ChatRole, body: string): Promise<ChatMessage> {
  const createdAt = Date.now()
  const result = await db.runAsync('INSERT INTO chat_messages (role, body, created_at) VALUES (?, ?, ?)', role, body, createdAt)
  return { id: result.lastInsertRowId, role, body, createdAt }
}

export async function clearMessages(db: SQLiteDatabase) {
  await db.runAsync('DELETE FROM chat_messages')
}
