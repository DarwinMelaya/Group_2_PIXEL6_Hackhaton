import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { Keyboard, Platform, StyleSheet, View } from 'react-native'

import {
  AVATAR_PALETTES,
  AnimatedAvatarSurface,
  ILLUSTRATED_AVATAR_META,
  getAvatarPalette,
  getInitials,
  pickRandomAvatarCombo,
  type AvatarVisualSnapshot,
  type RandomAvatarCombo,
} from '@/components/AvatarArt'
import { AvatarEditSheet } from '@/components/AvatarEditSheet'
import { AvatarPresetSection, AvatarToneSection } from '@/components/AvatarSheetPickers'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import type { AvatarPreset, AvatarTone } from '@/db/settings'
import { brand } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export { getAvatarPalette, getInitials } from '@/components/AvatarArt'

const AUTO_CYCLE_INTERVAL_MS = 2400

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  shape: 'oval',
  quality: 0.85,
  exif: false,
}

type ProfileAvatarPickerProps = {
  name: string
  photoUri?: string
  tone: AvatarTone
  preset: AvatarPreset
  size?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  nickname?: string
  onChangeNickname?: (nextNickname: string) => void | Promise<void>
  onPickPhoto: (sourceUri: string) => void | Promise<void>
  onRemovePhoto: () => void | Promise<void>
  onSelectTone: (tone: AvatarTone) => void
  onSelectPreset: (preset: AvatarPreset) => void
}

/**
 * Minimalist interactive profile avatar with auto-cycling random mode,
 * 8 handcrafted SVG character presets, monogram initials, 6 adaptive color themes,
 * camera/library photo upload, and inline Nickname customization.
 */
export function ProfileAvatarPicker({
  name,
  photoUri,
  tone,
  preset,
  size = 92,
  open: controlledOpen,
  onOpenChange,
  nickname,
  onChangeNickname,
  onPickPhoto,
  onRemovePhoto,
  onSelectTone,
  onSelectPreset,
}: ProfileAvatarPickerProps) {
  const { colors, scheme } = useTheme()
  const [internalOpen, setInternalOpen] = useState(false)
  const [failedUri, setFailedUri] = useState<string | null>(null)
  const [sheetError, setSheetError] = useState('')
  const [autoCombo, setAutoCombo] = useState<RandomAvatarCombo>(() => pickRandomAvatarCombo())
  const [cycleSeed, setCycleSeed] = useState(0)
  const [draftNickname, setDraftNickname] = useState(nickname ?? '')
  const [nicknameFocused, setNicknameFocused] = useState(false)

  const open = controlledOpen ?? internalOpen
  const setModalOpen = (next: boolean) => {
    setInternalOpen(next)
    onOpenChange?.(next)
  }

  const hasPhoto = Boolean(photoUri) && photoUri !== failedUri
  const isAuto = !hasPhoto && preset === 'auto'
  const effectiveName = (onChangeNickname ? draftNickname.trim() || nickname || name : name).trim()
  const initials = getInitials(effectiveName)
  const activeTone: AvatarTone = isAuto ? autoCombo.tone : tone

  const badgeSize = size >= 100 ? 32 : 28
  const badgeIconSize = size >= 100 ? 14 : 13

  useEffect(() => {
    if (!isAuto) return
    const timer = setInterval(() => {
      setAutoCombo((prev) => pickRandomAvatarCombo(prev))
    }, AUTO_CYCLE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isAuto, cycleSeed])

  const activeSnapshot: AvatarVisualSnapshot = hasPhoto
    ? { key: `photo:${photoUri}:${tone}`, photoUri, tone }
    : preset === 'auto'
      ? { key: `char:${autoCombo.avatar}:${autoCombo.tone}`, character: autoCombo.avatar, tone: autoCombo.tone }
      : preset === 'initials'
        ? { key: `init:${initials || 'empty'}:${tone}`, initials, tone }
        : { key: `char:${preset}:${tone}`, character: preset, tone }

  const openSheet = () => {
    Keyboard.dismiss()
    setDraftNickname(nickname ?? '')
    setSheetError('')
    setModalOpen(true)
  }

  const closeAndCommitSheet = async (validateEmptyNickname: boolean) => {
    Keyboard.dismiss()
    if (onChangeNickname) {
      const trimmed = draftNickname.trim()
      if (!trimmed && nickname) {
        if (validateEmptyNickname) {
          setSheetError('Please enter a nickname.')
          return
        }
      } else if (trimmed && trimmed !== (nickname ?? '').trim()) {
        try {
          await onChangeNickname(trimmed)
        } catch {
          setSheetError('Unable to save nickname. Please try again.')
          return
        }
      }
    }
    setSheetError('')
    setModalOpen(false)
  }

  const handleRollLockedRandom = () => {
    Haptics.selectionAsync().catch(() => {})
    const currentCharacter =
      preset !== 'auto' && preset !== 'initials' ? preset : autoCombo.avatar
    const next = pickRandomAvatarCombo({ avatar: currentCharacter, tone: activeTone })
    onSelectPreset(next.avatar)
    onSelectTone(next.tone)
  }

  const handleSelectPresetTile = (nextPreset: AvatarPreset) => {
    Haptics.selectionAsync().catch(() => {})
    if (nextPreset === 'auto') {
      setAutoCombo((prev) => pickRandomAvatarCombo(prev))
      setCycleSeed((seed) => seed + 1)
    }
    onSelectPreset(nextPreset)
  }

  const handleSelectTone = (nextTone: AvatarTone) => {
    Haptics.selectionAsync().catch(() => {})
    if (isAuto) {
      onSelectPreset(autoCombo.avatar)
    }
    onSelectTone(nextTone)
  }

  const pickFromSource = async (source: 'camera' | 'library') => {
    setSheetError('')
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
          setSheetError(
            'Camera access is off. Enable camera permission in device settings, or choose a photo instead.',
          )
          return
        }
      }

      if (onChangeNickname) {
        const trimmed = draftNickname.trim()
        if (trimmed && trimmed !== (nickname ?? '').trim()) {
          await onChangeNickname(trimmed)
        }
      }

      setModalOpen(false)
      if (Platform.OS === 'ios') {
        await new Promise((resolve) => setTimeout(resolve, 320))
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              ...pickerOptions,
              cameraType: ImagePicker.CameraType.front,
            })
          : await ImagePicker.launchImageLibraryAsync(pickerOptions)

      if (!result.canceled && result.assets[0]?.uri) {
        setFailedUri(null)
        await onPickPhoto(result.assets[0].uri)
      }
    } catch {
      setModalOpen(true)
      setSheetError(
        source === 'camera'
          ? 'Unable to open the camera. Try again, or choose a photo from your library.'
          : 'Unable to open your photo library. Please try again.',
      )
    }
  }

  const handleRemovePhoto = async () => {
    Haptics.selectionAsync().catch(() => {})
    await onRemovePhoto()
  }

  const statusText = hasPhoto
    ? 'Custom photo'
    : preset === 'auto'
      ? 'Random · Auto-changing'
      : preset === 'initials'
        ? `Initials · ${AVATAR_PALETTES[tone].label}`
        : `${ILLUSTRATED_AVATAR_META[preset].label} · ${AVATAR_PALETTES[tone].label}`

  const tilePalette = getAvatarPalette(tone, scheme)

  return (
    <View style={styles.root}>
      <Touchable
        onPress={openSheet}
        pressedScale={0.96}
        accessibilityRole="button"
        accessibilityLabel="Customize profile"
        style={styles.avatarTouch}
      >
        <AnimatedAvatarSurface
          snapshot={activeSnapshot}
          size={size}
          scheme={scheme}
          photoBorderColor={colors.line}
          onPhotoError={(uri) => setFailedUri(uri)}
        />

        <View
          style={[
            styles.cornerBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: brand.primary,
              borderColor: colors.background,
            },
          ]}
        >
          <Icon name="edit" size={badgeIconSize} color={brand.onPrimary} />
        </View>
      </Touchable>

      <AvatarEditSheet
        open={open}
        onShow={() => {
          setDraftNickname(nickname ?? '')
          setSheetError('')
        }}
        onDismiss={() => closeAndCommitSheet(false)}
        onDone={() => closeAndCommitSheet(true)}
        snapshot={activeSnapshot}
        photoBorderColor={colors.line}
        onPhotoError={(uri) => setFailedUri(uri)}
        statusText={statusText}
        nickname={
          onChangeNickname
            ? {
                value: draftNickname,
                focused: nicknameFocused,
                onChange: (value) => {
                  setDraftNickname(value)
                  if (sheetError) setSheetError('')
                },
                onFocusChange: setNicknameFocused,
                onClear: () => setDraftNickname(''),
                onSubmit: () => closeAndCommitSheet(true),
              }
            : undefined
        }
        hasPhoto={hasPhoto}
        onPickPhoto={pickFromSource}
        onRemovePhoto={handleRemovePhoto}
        error={sheetError}
      >
        <AvatarPresetSection
          preset={preset}
          hasPhoto={hasPhoto}
          initials={initials}
          tilePalette={tilePalette}
          onRandomize={handleRollLockedRandom}
          onSelectPreset={handleSelectPresetTile}
        />
        <AvatarToneSection activeTone={activeTone} onSelectTone={handleSelectTone} />
      </AvatarEditSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  avatarTouch: {
    position: 'relative',
  },
  cornerBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
