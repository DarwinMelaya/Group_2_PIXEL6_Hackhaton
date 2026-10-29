import type { SQLiteDatabase } from 'expo-sqlite'

import { PROFILE_KEYS, type ProfileInfo } from '@/data/profile'

export async function getProfile(db: SQLiteDatabase): Promise<ProfileInfo> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM profile')
  return Object.fromEntries(rows.filter((row) => PROFILE_KEYS.includes(row.key)).map((row) => [row.key, row.value]))
}

/** Replaces the stored profile. Empty values are removed rather than stored. */
export async function saveProfile(db: SQLiteDatabase, info: ProfileInfo) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM profile')
    for (const key of PROFILE_KEYS) {
      const value = info[key]?.trim()
      if (value) await db.runAsync('INSERT INTO profile (key, value) VALUES (?, ?)', key, value)
    }
  })
}
