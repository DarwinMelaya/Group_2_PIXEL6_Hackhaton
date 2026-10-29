import { Directory, File, Paths } from 'expo-file-system'

const photosDirectory = () => new Directory(Paths.document, 'photos')

/**
 * Only the file name is persisted in SQLite. Absolute URIs are resolved at runtime because the
 * app container path can change between installs/updates (notably on iOS).
 */
export const resolvePhotoUri = (fileName: string) => new File(photosDirectory(), fileName).uri

/** Copies a temporary picker/camera file into app-owned document storage. */
export async function persistPhoto(sourceUri: string): Promise<string> {
  const directory = photosDirectory()
  directory.create({ intermediates: true, idempotent: true })
  const source = new File(sourceUri)
  const fileName = `photo-${Date.now()}${source.extension || '.jpg'}`
  await source.copy(new File(directory, fileName))
  return fileName
}

export function deletePhotoFile(fileName: string) {
  const file = new File(photosDirectory(), fileName)
  if (file.exists) file.delete()
}

export function deleteAllPhotoFiles() {
  const directory = photosDirectory()
  if (directory.exists) directory.delete()
}
