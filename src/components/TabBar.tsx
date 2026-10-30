import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible'
import { brand, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export const TAB_BAR_HEIGHT = 60

const tabs: Record<string, { label: string; icon: IconName; raised?: boolean }> = {
  index: { label: 'Home', icon: 'home' },
  guides: { label: 'Guides', icon: 'book' },
  capture: { label: 'Capture', icon: 'camera', raised: true },
  chat: { label: 'AI Chatbot', icon: 'chat' },
  profile: { label: 'Profile', icon: 'profile' },
}

/** Minimal destinations with the original raised Capture action. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme()
  const keyboardVisible = useKeyboardVisible()
  const focusedRoute = state.routes[state.index]
  if (keyboardVisible && descriptors[focusedRoute.key].options.tabBarHideOnKeyboard) return null
  return (
    <View
      accessibilityRole="tabbar"
      style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom, backgroundColor: colors.surface, borderTopColor: colors.line }]}
    >
      {state.routes.map((route, index) => {
        const tab = tabs[route.name]
        if (!tab) return null
        const focused = state.index === index
        const color = focused ? colors.teal : colors.inkSoft
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) {
            Haptics.selectionAsync().catch(() => {})
            navigateToTab(route.key)
          }
        }
        return (
          <Touchable
            key={route.key}
            onPress={onPress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            pressedScale={tab.raised ? 0.94 : 1}
            style={styles.item}
          >
            {tab.raised ? (
              <View style={[styles.raised, { borderColor: colors.surface }]}>
                <Icon name={tab.icon} size={22} color={brand.onPrimary} />
              </View>
            ) : (
              <View style={styles.iconSlot}>
                <Icon name={tab.icon} size={24} color={color} />
              </View>
            )}
            <AppText variant="tab" numberOfLines={1} style={{ color, fontWeight: focused ? '600' : '500' }}>{tab.label}</AppText>
          </Touchable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space[2] },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[1], minWidth: 0, minHeight: touchTarget },
  raised: {
    width: 56,
    height: 56,
    marginTop: -28,
    borderWidth: 4,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.primary,
    shadowColor: brand.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  iconSlot: {
    width: touchTarget,
    maxWidth: '100%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
