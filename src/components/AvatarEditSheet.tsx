import type { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'

import { AnimatedAvatarSurface, type AvatarVisualSnapshot } from '@/components/AvatarArt'
import { AppText } from '@/components/ui/AppText'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Icon } from '@/components/ui/Icon'
import { Banner, TextButton } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Touchable } from '@/components/ui/Touchable'
import { NICKNAME_MAX_LENGTH } from '@/db/settings'
import { radius, space, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export type AvatarSheetNickname = {
  value: string
  focused: boolean
  onChange: (value: string) => void
  onFocusChange: (focused: boolean) => void
  onClear: () => void
  onSubmit: () => void
}

type AvatarEditSheetProps = {
  open: boolean
  onShow: () => void
  onDismiss: () => void
  onDone: () => void
  snapshot: AvatarVisualSnapshot
  photoBorderColor: string
  onPhotoError: (uri: string) => void
  statusText: string
  nickname?: AvatarSheetNickname
  hasPhoto: boolean
  onPickPhoto: (source: 'camera' | 'library') => void
  onRemovePhoto: () => void
  error: string
  /** Extra sections rendered between the nickname field and the photo options. */
  children?: ReactNode
}

export function AvatarEditSheet({
  open,
  onShow,
  onDismiss,
  onDone,
  snapshot,
  photoBorderColor,
  onPhotoError,
  statusText,
  nickname,
  hasPhoto,
  onPickPhoto,
  onRemovePhoto,
  error,
  children,
}: AvatarEditSheetProps) {
  const { colors, scheme, scale } = useTheme()

  const sheetBackground = scheme === 'dark' ? '#121214' : colors.background

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onShow={onShow}
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.modalWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={onDismiss}
        />
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: sheetBackground,
              borderColor: scheme === 'dark' ? colors.line : 'transparent',
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.headerSpacer} />
            <AppText variant="bodyStrong" align="center" accessibilityRole="header">
              Edit Profile
            </AppText>
            <View style={styles.headerAction}>
              <TextButton label="Done" onPress={onDone} />
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
                snapshot={snapshot}
                size={80}
                scheme={scheme}
                photoBorderColor={photoBorderColor}
                onPhotoError={onPhotoError}
              />
              <AppText variant="small" tone="soft">
                {statusText}
              </AppText>
            </View>

            {/* Optional Nickname Editor */}
            {nickname && (
              <View style={styles.sectionBlock}>
                <AppText variant="small" tone="soft" weight="600" style={styles.sectionLabel}>
                  Nickname
                </AppText>
                <View
                  style={[
                    styles.nicknameFieldWrap,
                    {
                      backgroundColor: colors.surface,
                      borderColor: nickname.focused ? colors.teal : colors.line,
                    },
                  ]}
                >
                  <TextInput
                    value={nickname.value}
                    onChangeText={nickname.onChange}
                    onFocus={() => nickname.onFocusChange(true)}
                    onBlur={() => nickname.onFocusChange(false)}
                    placeholder="Your nickname"
                    placeholderTextColor={colors.inkSoft}
                    autoCapitalize="words"
                    autoComplete="off"
                    autoCorrect={false}
                    maxLength={NICKNAME_MAX_LENGTH}
                    returnKeyType="done"
                    onSubmitEditing={nickname.onSubmit}
                    accessibilityLabel="Nickname"
                    style={[
                      styles.nicknameField,
                      {
                        color: colors.ink,
                        fontSize: typeRamp.body.fontSize * scale,
                      },
                    ]}
                  />
                  {nickname.value.length > 0 && (
                    <Touchable
                      onPress={nickname.onClear}
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

            {children}

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
                  onPress={() => onPickPhoto('library')}
                />
                <ListRow
                  title="Take Photo"
                  subtitle="Use camera"
                  leading="camera"
                  onPress={() => onPickPhoto('camera')}
                />
                {hasPhoto && (
                  <ListRow
                    title="Remove Photo"
                    leading="trash"
                    destructive
                    trailing={<View />}
                    onPress={onRemovePhoto}
                  />
                )}
              </GroupedCard>
            </View>

            {error ? <Banner text={error} tone="error" /> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[5],
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[5],
    paddingTop: space[2],
    paddingBottom: space[4] + space[2],
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
})
