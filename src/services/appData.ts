import type { SQLiteDatabase } from 'expo-sqlite'

import { deleteAllPhotoFiles } from '@/storage/photos'
import { deleteGeminiKey } from '@/storage/secrets'

/** Wipes all user data (profile, chat history, saved photos, preferences). Bundled guides are unaffected. */
export async function clearAllData(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM profile; DELETE FROM chat_messages; DELETE FROM photos; DELETE FROM settings; DELETE FROM token_usage;')
  })
  deleteAllPhotoFiles()
  await deleteGeminiKey()
}
