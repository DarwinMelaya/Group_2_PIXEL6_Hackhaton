import { router, usePathname } from 'expo-router'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible'
import { brand, space } from '@/theme/tokens'

import { TAB_BAR_HEIGHT } from './TabBar'

export const FAB_SIZE = 56
/** Bottom padding tab screens should reserve so content is not hidden behind the FAB. */
export const FAB_CLEARANCE = FAB_SIZE + space[6] * 2
const CHAT_COMPOSER_CLEARANCE = 72

/** Persistent shortcut to emergency hotlines, shown above the tab bar on every tab except Capture. */
export function EmergencyFab() {
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const keyboardVisible = useKeyboardVisible()
  if (pathname === '/capture' || keyboardVisible) return null
  const bottom = TAB_BAR_HEIGHT + insets.bottom + space[4] + (pathname === '/chat' ? CHAT_COMPOSER_CLEARANCE : 0)
  return (
    <Touchable
      onPress={() => router.push('/emergency')}
      accessibilityLabel="Emergency contacts"
      accessibilityHint="Opens a list of emergency hotlines to call"
      pressedScale={0.94}
      style={[styles.fab, { bottom }]}
    >
      <Icon name="phone" size={24} color={brand.onPrimary} />
    </Touchable>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: space[5],
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.emergency,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
})
