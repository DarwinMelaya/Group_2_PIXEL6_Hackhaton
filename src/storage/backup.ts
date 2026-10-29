import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'

import type { ProfileInfo } from '@/data/profile'
import type { Settings } from '@/db/settings'

import { BackupError, MAX_BACKUP_BYTES, createBackup, parseBackup, type Backup } from './backupFormat'

/** Writes a JSON backup to the cache directory and opens the system share sheet. */
export async function shareBackup(profile: ProfileInfo, settings: Settings) {
  if (!(await Sharing.isAvailableAsync())) throw new BackupError('Sharing is not available on this device.')
  const { fileName, json } = createBackup(profile, settings)
  const file = new File(Paths.cache, fileName)
  file.create({ overwrite: true })
  await file.write(json)
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save GabAI backup' })
}

/** Opens the document picker and returns a validated backup, or `null` if the user cancelled. */
export async function pickBackup(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true, multiple: false })
  if (result.canceled) return null
  const asset = result.assets[0]
  const file = new File(asset.uri)
  if ((asset.size ?? file.size ?? 0) > MAX_BACKUP_BYTES) throw new BackupError('Choose a GabAI backup smaller than 64 KB.')
  return parseBackup(await file.text())
}
