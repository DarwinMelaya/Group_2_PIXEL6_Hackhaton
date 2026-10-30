import type { SQLiteDatabase } from 'expo-sqlite'

import { resolvePhotoUri } from '@/storage/photos'

export type ChatRole = 'user' | 'assistant'

/** A photo attached to a message. `fileName` is a file name on native, a data URI on web. */
export type ChatPhoto = { fileName: string; mimeType: string; uri: string }

export type ChatMessage = { id: number; role: ChatRole; body: string; createdAt: number; photo?: ChatPhoto }

type ChatRow = { id: number; role: ChatRole; body: string; created_at: number; photo: string | null; photo_mime: string | null }

const toPhoto = (fileName: string | null, mimeType: string | null): ChatPhoto | undefined =>
  fileName ? { fileName, mimeType: mimeType ?? 'image/jpeg', uri: resolvePhotoUri(fileName) } : undefined

const toMessage = (row: ChatRow): ChatMessage => ({
  id: row.id,
  role: row.role,
  body: row.body,
  createdAt: row.created_at,
  photo: toPhoto(row.photo, row.photo_mime),
})

export async function listMessages(db: SQLiteDatabase): Promise<ChatMessage[]> {
  const rows = await db.getAllAsync<ChatRow>('SELECT id, role, body, created_at, photo, photo_mime FROM chat_messages ORDER BY id ASC')
  return rows.map(toMessage)
}

export async function addMessage(
  db: SQLiteDatabase,
  role: ChatRole,
  body: string,
  photo?: { fileName: string; mimeType: string },
): Promise<ChatMessage> {
  const createdAt = Date.now()
  const result = await db.runAsync(
    'INSERT INTO chat_messages (role, body, created_at, photo, photo_mime) VALUES (?, ?, ?, ?, ?)',
    role,
    body,
    createdAt,
    photo?.fileName ?? null,
    photo?.mimeType ?? null,
  )
  return toMessage({
    id: result.lastInsertRowId,
    role,
    body,
    created_at: createdAt,
    photo: photo?.fileName ?? null,
    photo_mime: photo?.mimeType ?? null,
  })
}

export async function clearMessages(db: SQLiteDatabase) {
  await db.runAsync('DELETE FROM chat_messages')
}
