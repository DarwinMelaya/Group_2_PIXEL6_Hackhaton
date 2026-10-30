/**
 * Web implementation of `photos.ts`. expo-file-system is not available on web, so the image is
 * stored inline as a data URI in the `file_name` column. Intended for browser previews only.
 */
export const resolvePhotoUri = (fileName: string) => fileName

const toDataUri = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result as string)
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(blob)
})

export async function persistPhoto(sourceUri: string): Promise<string> {
  if (sourceUri.startsWith('data:')) return sourceUri
  const response = await fetch(sourceUri)
  return toDataUri(await response.blob())
}

/** Photos are data URIs on web, so the base64 payload is everything after the comma. */
export async function readPhotoBase64(fileName: string): Promise<string> {
  const comma = fileName.indexOf(',')
  if (!fileName.startsWith('data:') || comma < 0) throw new Error('This photo is not stored inline.')
  return fileName.slice(comma + 1)
}

export function deletePhotoFile(_fileName: string) {}

export function deleteAllPhotoFiles() {}
