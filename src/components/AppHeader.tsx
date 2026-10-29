import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export const APP_HEADER_HEIGHT = 60

export function AppHeader() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top, height: APP_HEADER_HEIGHT + insets.top, backgroundColor: colors.background, borderBottomColor: colors.line }]}>
      <AppText variant="bodyStrong" weight="800" style={styles.wordmark} accessibilityRole="header" accessibilityLabel="GabAI">
        Gab<AppText variant="bodyStrong" weight="800" tone="teal" style={styles.wordmark}>AI</AppText>
      </AppText>
      <View style={styles.actions}>
        <Touchable onPress={() => router.push('/settings')} accessibilityLabel="Open settings" style={styles.iconButton}>
          <Icon name="settings" size={20} color={colors.ink} />
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[5], borderBottomWidth: StyleSheet.hairlineWidth },
  wordmark: { fontSize: 18, letterSpacing: -0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
})
