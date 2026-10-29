import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { Pill } from '@/components/ui/Layout'
import { Touchable } from '@/components/ui/Touchable'
import { brand, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export const APP_HEADER_HEIGHT = 60

export function AppHeader() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top, height: APP_HEADER_HEIGHT + insets.top, backgroundColor: colors.background }]}>
      <View style={styles.brand} accessible accessibilityRole="header" accessibilityLabel="GabAI">
        <View style={styles.mark}><Icon name="shield" size={18} color={brand.onPrimary} /></View>
        <AppText variant="bodyStrong" weight="800" style={styles.wordmark}>
          Gab<AppText variant="bodyStrong" weight="800" tone="teal" style={styles.wordmark}>AI</AppText>
        </AppText>
      </View>
      <View style={styles.actions}>
        <Pill label="Offline ready" />
        <Touchable onPress={() => router.push('/settings')} accessibilityLabel="Open settings" style={styles.iconButton}>
          <Icon name="settings" size={20} color={colors.ink} />
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[5] },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  mark: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.primary },
  wordmark: { fontSize: 18, letterSpacing: -0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
})
