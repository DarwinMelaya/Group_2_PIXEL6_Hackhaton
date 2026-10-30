import * as ImagePicker from 'expo-image-picker'
import { router, useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { BackButton, Banner, Note, PageHeader, SectionHeader } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { deletePhotoRow, insertPhoto, listPhotos, type Photo } from '@/db/photos'
import { attachmentFromStored, stageAttachment, AttachmentError, type Attachment } from '@/services/attachment'
import { deletePhotoFile, persistPhoto } from '@/storage/photos'
import { radius, space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { confirmAction } from '@/utils/dialogs'

const pickerOptions: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, exif: false }

export default function CaptureScreen() {
  const db = useSQLiteContext()
  const { colors } = useTheme()
  const [pending, setPending] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useFocusEffect(useCallback(() => {
    listPhotos(db).then(setPhotos).catch(() => setError('Unable to load saved photos.'))
  }, [db]))

  const pick = async (source: 'camera' | 'library') => {
    setError('')
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
          setError('Camera access is blocked. Allow camera permission in your device settings, or choose a photo instead.')
          return
        }
      }
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(pickerOptions) : await ImagePicker.launchImageLibraryAsync(pickerOptions)
      if (!result.canceled) setPending(result.assets[0])
    } catch {
      setError(source === 'camera' ? 'Unable to open the camera. Try again, or choose a photo instead.' : 'Unable to open your photos.')
    }
  }

  /**
   * Stages a photo for the chat composer. For a just-captured photo we persist it
   * first so the attachment and its file name stay consistent.
   */
  const analyze = async (attachment: Attachment) => {
    stageAttachment(attachment)
    router.push('/chat')
  }

  const analyzePending = async () => {
    if (!pending) return
    setSaving(true)
    try {
      const fileName = await persistPhoto(pending.uri)
      await analyze(await attachmentFromStored(fileName, pending.mimeType, pending.uri))
    } catch (error) {
      setError(error instanceof AttachmentError ? error.message : 'Unable to prepare that photo.')
    } finally {
      setSaving(false)
    }
  }

  const analyzeSaved = async (photo: Photo) => {
    try {
      await analyze(await attachmentFromStored(photo.fileName, undefined, photo.uri))
    } catch (error) {
      setError(error instanceof AttachmentError ? error.message : 'Unable to read that photo.')
    }
  }

  const save = async () => {
    if (!pending) return
    setSaving(true)
    try {
      const fileName = await persistPhoto(pending.uri)
      const photo = await insertPhoto(db, { fileName, width: pending.width, height: pending.height })
      setPhotos((current) => [photo, ...current])
      setPending(null)
    } catch {
      setError('Unable to save this photo. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async (photo: Photo) => {
    const confirmed = await confirmAction({ title: 'Delete photo?', message: 'This permanently removes the photo from this device.', confirmLabel: 'Delete', destructive: true })
    if (!confirmed) return
    try {
      await deletePhotoRow(db, photo.id)
      deletePhotoFile(photo.fileName)
      setPhotos((current) => current.filter((item) => item.id !== photo.id))
    } catch {
      setError('Unable to delete this photo. Please try again.')
    }
  }

  return (
    <Screen>
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} />
      <PageHeader title="Capture an image" subtitle="Take a clear photo from a safe distance." />

      <View style={[styles.viewfinder, { backgroundColor: colors.surface }]}>
        {pending ? (
          <Image source={{ uri: pending.uri }} style={styles.preview} resizeMode="contain" accessibilityLabel="Your captured photo" />
        ) : (
          <View style={styles.placeholder}>
            <View style={[styles.placeholderIcon, { backgroundColor: colors.tealSoft }]}><Icon name="camera" size={32} color={colors.teal} /></View>
            <AppText variant="bodyStrong">Ready when you are</AppText>
            <AppText variant="caption" align="center" tone="soft">Open the camera or choose a photo.</AppText>
          </View>
        )}
      </View>

      {error ? <Banner text={error} tone="error" /> : null}

      {pending ? (
        <>
          <View style={styles.ready} accessibilityLiveRegion="polite">
            <Icon name="check" size={18} color={colors.teal} />
            <AppText variant="caption" tone="teal">Photo captured · Not yet saved</AppText>
          </View>
          <View style={styles.actions}>
            <Button label="Ask GabAI" icon="chat" onPress={analyzePending} loading={saving} />
          </View>
          <View style={styles.actions}>
            <Button label="Discard" variant="secondary" onPress={() => setPending(null)} />
            <Button label="Save photo" onPress={save} loading={saving} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.actions}><Button label="Open camera" icon="camera" onPress={() => pick('camera')} /></View>
          <View style={styles.actions}><Button label="Choose photo" icon="image" variant="secondary" onPress={() => pick('library')} /></View>
        </>
      )}

      {photos.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Saved on this device" caption="Tap to delete · GabAI icon sends it to the chatbot" />
          <View style={styles.grid}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.thumbWrap}>
                <Touchable onPress={() => confirmDelete(photo)} accessibilityLabel={`Saved photo from ${new Date(photo.createdAt).toLocaleString()}. Tap to delete.`}>
                  <Image source={{ uri: photo.uri }} style={[styles.thumb, { backgroundColor: colors.surface }]} />
                </Touchable>
                <Touchable onPress={() => analyzeSaved(photo)} accessibilityLabel="Ask GabAI about this photo" style={[styles.thumbAction, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <Icon name="chat" size={14} color={colors.ink} />
                </Touchable>
              </View>
            ))}
          </View>
        </View>
      )}

      <Note>Photos are stored on this device. They only leave your phone if you ask the chatbot to analyze one — then the photo is sent to Google Gemini. It never diagnoses; it only describes and suggests safety steps.</Note>
    </Screen>
  )
}

const styles = StyleSheet.create({
  viewfinder: { width: '100%', aspectRatio: 4 / 5, maxHeight: 360, borderRadius: radius.group, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  preview: { ...StyleSheet.absoluteFill },
  placeholder: { alignItems: 'center', padding: space[6], gap: space[2] },
  placeholderIcon: { width: 64, height: 64, borderRadius: radius.group, alignItems: 'center', justifyContent: 'center', marginBottom: space[3] },
  ready: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], marginTop: space[4] },
  actions: { flexDirection: 'row', gap: space[3], marginTop: space[4] },
  section: { marginTop: space[6] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space[1] },
  thumbWrap: { width: '33.333%', padding: space[1] },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: radius.md },
  thumbAction: { position: 'absolute', top: space[2], right: space[2], width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
})
