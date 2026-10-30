import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  AVATAR_PALETTES,
  AnimatedAvatarSurface,
  ILLUSTRATED_AVATAR_META,
  IllustratedAvatarSvg,
  getAvatarPalette,
  getInitials,
  pickRandomAvatarCombo,
  type AvatarVisualSnapshot,
  type RandomAvatarCombo,
} from '@/components/AvatarArt'
import { AppText } from '@/components/ui/AppText'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Icon } from '@/components/ui/Icon'
import { Banner, TextButton } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Touchable } from '@/components/ui/Touchable'
import {
  AVATAR_PRESETS,
  AVATAR_TONES,
  NICKNAME_MAX_LENGTH,
  type AvatarPreset,
  type AvatarTone,
} from '@/db/settings'
import { brand, radius, space, touchTarget, typeRamp } from '@/theme/tokens'
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
  const { colors, scheme, scale } = useTheme()
  const insets = useSafeAreaInsets()
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

  const sheetBackground = scheme === 'dark' ? '#121214' : colors.background
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

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onShow={() => {
          setDraftNickname(nickname ?? '')
          setSheetError('')
        }}
        onRequestClose={() => closeAndCommitSheet(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={[styles.backdrop, { backgroundColor: colors.overlay }]}
            onPress={() => closeAndCommitSheet(false)}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: sheetBackground,
                borderColor: scheme === 'dark' ? colors.line : 'transparent',
                paddingBottom: Math.max(insets.bottom, space[4]) + space[2],
              },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.muted }]} />

            <View style={styles.sheetHeader}>
              <View style={styles.headerSpacer} />
              <AppText variant="bodyStrong" align="center" accessibilityRole="header">
                Edit Profile
              </AppText>
              <View style={styles.headerAction}>
                <TextButton label="Done" onPress={() => closeAndCommitSheet(true)} />
              </View>
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetScroll}
            >
              {/* Clean Live Preview */}
              <View style={styles.previewArea}>
                <AnimatedAvatarSurface
                  snapshot={activeSnapshot}
                  size={80}
                  scheme={scheme}
                  photoBorderColor={colors.line}
                  onPhotoError={(uri) => setFailedUri(uri)}
                />
                <AppText variant="small" tone="soft">
                  {statusText}
                </AppText>
              </View>

              {/* Optional Nickname Editor */}
              {onChangeNickname && (
                <View style={styles.sectionBlock}>
                  <AppText variant="small" tone="soft" weight="600" style={styles.sectionLabel}>
                    Nickname
                  </AppText>
                  <View
                    style={[
                      styles.nicknameFieldWrap,
                      {
                        backgroundColor: colors.surface,
                        borderColor: nicknameFocused ? colors.teal : colors.line,
                      },
                    ]}
                  >
                    <TextInput
                      value={draftNickname}
                      onChangeText={(value) => {
                        setDraftNickname(value)
                        if (sheetError) setSheetError('')
                      }}
                      onFocus={() => setNicknameFocused(true)}
                      onBlur={() => setNicknameFocused(false)}
                      placeholder="Your nickname"
                      placeholderTextColor={colors.inkSoft}
                      autoCapitalize="words"
                      autoComplete="off"
                      autoCorrect={false}
                      maxLength={NICKNAME_MAX_LENGTH}
                      returnKeyType="done"
                      onSubmitEditing={() => closeAndCommitSheet(true)}
                      accessibilityLabel="Nickname"
                      style={[
                        styles.nicknameField,
                        {
                          color: colors.ink,
                          fontSize: typeRamp.body.fontSize * scale,
                        },
                      ]}
                    />
                    {draftNickname.length > 0 && (
                      <Touchable
                        onPress={() => setDraftNickname('')}
                        accessibilityLabel="Clear nickname"
                        hitSlop={10}
                        style={styles.clearNicknameBtn}
                      >
                        <View style={[styles.clearNicknameBadge, { backgroundColor: colors.line }]}>
                          <Icon name="close" size={11} color={colors.inkSoft} />
                        </View>
                      </Touchable>
                    )}
                  </View>
                </View>
              )}

              {/* Organized 2x5 Avatar Grid */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionRow}>
                  <AppText variant="small" tone="soft" weight="600">
                    Avatar
                  </AppText>
                  <Touchable
                    onPress={handleRollLockedRandom}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Pick a random avatar and color"
                    style={styles.randomizeBtn}
                  >
                    <Icon name="shuffle" size={13} color={colors.teal} />
                    <AppText variant="small" tone="teal" weight="600">
                      Randomize
                    </AppText>
                  </Touchable>
                </View>

                <View
                  style={[styles.presetGridCard, { backgroundColor: colors.surface }]}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Avatar style"
                >
                  {AVATAR_PRESETS.map((item) => {
                    const selected = !hasPhoto && preset === item
                    const label =
                      item === 'auto'
                        ? 'Auto'
                        : item === 'initials'
                          ? 'Initials'
                          : ILLUSTRATED_AVATAR_META[item].label

                    return (
                      <Touchable
                        key={item}
                        onPress={() => handleSelectPresetTile(item)}
                        pressedScale={0.93}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={
                          item === 'auto'
                            ? 'Auto-changing random avatar'
                            : item === 'initials'
                              ? 'Initials monogram avatar'
                              : `${ILLUSTRATED_AVATAR_META[item].label} avatar`
                        }
                        style={styles.presetTile}
                      >
                        <View
                          style={[
                            styles.presetRing,
                            { borderColor: selected ? colors.teal : 'transparent' },
                          ]}
                        >
                          <View
                            style={[
                              styles.presetCircle,
                              {
                                backgroundColor:
                                  item === 'auto' ? colors.tealSoft : tilePalette.bg,
                                borderColor: selected ? colors.teal : tilePalette.ring,
                              },
                            ]}
                          >
                            {item === 'auto' ? (
                              <Icon name="shuffle" size={19} color={colors.teal} />
                            ) : item === 'initials' ? (
                              <Text
                                allowFontScaling={false}
                                style={[styles.tileMonogram, { color: tilePalette.fg }]}
                              >
                                {initials || 'Aa'}
                              </Text>
                            ) : (
                              <IllustratedAvatarSvg
                                variant={item}
                                palette={tilePalette}
                                size={44}
                              />
                            )}
                          </View>
                        </View>
                        <AppText
                          variant="tab"
                          tone={selected ? 'teal' : 'soft'}
                          weight={selected ? '700' : '500'}
                          numberOfLines={1}
                        >
                          {label}
                        </AppText>
                      </Touchable>
                    )
                  })}
                </View>
              </View>

              {/* Color Swatches */}
              <View style={styles.sectionBlock}>
                <AppText variant="small" tone="soft" weight="600" style={styles.sectionLabel}>
                  Color
                </AppText>
                <View
                  style={[styles.swatchCard, { backgroundColor: colors.surface }]}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Avatar color"
                >
                  {AVATAR_TONES.map((item) => {
                    const selected = item === activeTone
                    const itemPalette = AVATAR_PALETTES[item][scheme]
                    return (
                      <Touchable
                        key={item}
                        onPress={() => handleSelectTone(item)}
                        pressedScale={0.92}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${AVATAR_PALETTES[item].label} color`}
                        style={styles.swatchTouch}
                      >
                        <View
                          style={[
                            styles.swatchOuter,
                            { borderColor: selected ? itemPalette.swatch : 'transparent' },
                          ]}
                        >
                          <View style={[styles.swatchDot, { backgroundColor: itemPalette.swatch }]}>
                            {selected && (
                              <Icon
                                name="check"
                                size={14}
                                color={scheme === 'dark' ? '#000000' : '#ffffff'}
                              />
                            )}
                          </View>
                        </View>
                      </Touchable>
                    )
                  })}
                </View>
              </View>

              {/* Photo Options */}
              <View style={styles.sectionBlock}>
                <AppText variant="small" tone="soft" weight="600" style={styles.sectionLabel}>
                  Photo
                </AppText>
                <GroupedCard>
                  <ListRow
                    title="Choose Photo"
                    subtitle="From library"
                    leading="image"
                    onPress={() => pickFromSource('library')}
                  />
                  <ListRow
                    title="Take Photo"
                    subtitle="Use camera"
                    leading="camera"
                    onPress={() => pickFromSource('camera')}
                  />
                  {hasPhoto && (
                    <ListRow
                      title="Remove Photo"
                      leading="trash"
                      destructive
                      trailing={<View />}
                      onPress={handleRemovePhoto}
                    />
                  )}
                </GroupedCard>
              </View>

              {sheetError ? <Banner text={sheetError} tone="error" /> : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[5],
    paddingTop: space[2],
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    opacity: 0.45,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginTop: space[1],
    marginBottom: space[2],
  },
  headerSpacer: {
    width: 56,
  },
  headerAction: {
    width: 56,
    alignItems: 'flex-end',
  },
  sheetScroll: {
    gap: space[4],
    paddingBottom: space[3],
  },
  previewArea: {
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[1],
  },
  sectionBlock: {
    gap: space[2],
  },
  sectionLabel: {
    marginHorizontal: space[1],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: space[1],
  },
  randomizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  nicknameFieldWrap: {
    position: 'relative',
    justifyContent: 'center',
    borderRadius: radius.group,
    borderWidth: 1,
  },
  nicknameField: {
    minHeight: 48,
    paddingLeft: space[4],
    paddingRight: space[8] + space[2],
    paddingVertical: space[2],
    fontWeight: '500',
  },
  clearNicknameBtn: {
    position: 'absolute',
    right: space[3],
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearNicknameBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetGridCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space[3],
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    borderRadius: radius.group,
  },
  presetTile: {
    width: '18.8%',
    alignItems: 'center',
    gap: 5,
  },
  presetRing: {
    padding: 2,
    borderRadius: 28,
    borderWidth: 2,
  },
  presetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileMonogram: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  swatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: space[1],
    paddingHorizontal: space[2],
    borderRadius: radius.group,
  },
  swatchTouch: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
