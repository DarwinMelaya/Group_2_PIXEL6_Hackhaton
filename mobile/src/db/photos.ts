import type { SQLiteDatabase } from 'expo-sqlite'

import { resolvePhotoUri } from '@/storage/photos'

export type Photo = { id: number; fileName: string; uri: string; width: number | null; height: number | null; createdAt: number }

type PhotoRow = { id: number; file_name: string; width: number | null; height: number | null; created_at: number }

const toPhoto = (row: PhotoRow): Photo => ({
  id: row.id,
  fileName: row.file_name,
  uri: resolvePhotoUri(row.file_name),
  width: row.width,
  height: row.height,
  createdAt: row.created_at,
})

export async function listPhotos(db: SQLiteDatabase): Promise<Photo[]> {
  const rows = await db.getAllAsync<PhotoRow>('SELECT id, file_name, width, height, created_at FROM photos ORDER BY created_at DESC')
  return rows.map(toPhoto)
}

export async function insertPhoto(db: SQLiteDatabase, photo: { fileName: string; width?: number; height?: number }): Promise<Photo> {
  const createdAt = Date.now()
  const result = await db.runAsync(
    'INSERT INTO photos (file_name, width, height, created_at) VALUES (?, ?, ?, ?)',
    photo.fileName,
    photo.width ?? null,
    photo.height ?? null,
    createdAt,
  )
  return toPhoto({ id: result.lastInsertRowId, file_name: photo.fileName, width: photo.width ?? null, height: photo.height ?? null, created_at: createdAt })
}

export async function deletePhotoRow(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM photos WHERE id = ?', id)
}
