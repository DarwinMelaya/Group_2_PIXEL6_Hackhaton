import { StyleSheet, TextInput, View } from 'react-native'

import { RandomAvatarPreview } from '@/components/AvatarArt'
import {
  onboardingStyles,
  StageFooter,
} from '@/components/onboarding/OnboardingChrome'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { NICKNAME_MAX_LENGTH } from '@/db/settings'
import { radius, space, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export function IdentityStep({
  nickname,
  focused,
  onNicknameChange,
  onFocusChange,
  onClear,
  current,
  total,
  onBack,
  onContinue,
}: {
  nickname: string
  focused: boolean
  onNicknameChange: (value: string) => void
  onFocusChange: (focused: boolean) => void
  onClear: () => void
  current: number
  total: number
  onBack: () => void
  onContinue: () => void
}) {
  const { colors, scale } = useTheme()
  const trimmedNickname = nickname.trim()

  return (
    <View style={onboardingStyles.fullStage}>
      <View style={onboardingStyles.topRow} />

      <View style={onboardingStyles.centeredStage}>
        <View style={styles.identityCard}>
          <RandomAvatarPreview size={104} />

          <AppText
            variant="heroTitle"
            align="center"
            accessibilityRole="header"
            style={styles.identityTitle}
          >
            What should we call you?
          </AppText>

          <View
            style={[
              styles.nicknameCard,
              {
                backgroundColor: colors.surface,
                borderColor: focused ? colors.teal : colors.line,
              },
            ]}
          >
            <TextInput
              value={nickname}
              onChangeText={onNicknameChange}
              onFocus={() => onFocusChange(true)}
              onBlur={() => onFocusChange(false)}
              placeholder="Your nickname"
              placeholderTextColor={colors.inkSoft}
              autoCapitalize="words"
              autoComplete="off"
              autoCorrect={false}
              maxLength={NICKNAME_MAX_LENGTH}
              returnKeyType="next"
              onSubmitEditing={() => trimmedNickname && onContinue()}
              accessibilityLabel="Your nickname"
              textAlign="center"
              style={[
                styles.nicknameInput,
                {
                  color: colors.ink,
                  fontSize: typeRamp.bodyStrong.fontSize * scale,
                },
              ]}
            />
            {nickname.length > 0 && (
              <Touchable
                onPress={onClear}
                accessibilityLabel="Clear nickname"
                hitSlop={10}
                style={styles.clearButton}
              >
                <View style={[styles.clearBadge, { backgroundColor: colors.line }]}>
                  <Icon name="close" size={11} color={colors.inkSoft} />
                </View>
              </Touchable>
            )}
          </View>
        </View>
      </View>

      <StageFooter current={current} total={total}>
        <Button label="Back" variant="secondary" onPress={onBack} />
        <Button label="Continue" disabled={!trimmedNickname} onPress={onContinue} />
      </StageFooter>
    </View>
  )
}

const styles = StyleSheet.create({
  identityCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  identityTitle: {
    marginTop: space[5],
    marginBottom: space[5],
  },
  nicknameCard: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    borderRadius: radius.group,
    borderWidth: 1,
  },
  nicknameInput: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: space[8] + space[2],
    paddingVertical: space[3],
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  clearButton: {
    position: 'absolute',
    right: space[3],
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
