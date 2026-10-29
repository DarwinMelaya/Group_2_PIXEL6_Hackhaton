import * as DocumentPicker from 'expo-document-picker'

import type { ProfileInfo } from '@/data/profile'
import type { Settings } from '@/db/settings'

import { BackupError, MAX_BACKUP_BYTES, createBackup, parseBackup, type Backup } from './backupFormat'

/** Web implementation of `backup.ts`: downloads the JSON file through the browser. */
export async function shareBackup(profile: ProfileInfo, settings: Settings) {
  const { fileName, json } = createBackup(profile, settings)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function pickBackup(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], multiple: false })
  if (result.canceled) return null
  const asset = result.assets[0]
  if ((asset.size ?? 0) > MAX_BACKUP_BYTES) throw new BackupError('Choose a GabAI backup smaller than 64 KB.')
  const text = asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text()
  return parseBackup(text)
}
