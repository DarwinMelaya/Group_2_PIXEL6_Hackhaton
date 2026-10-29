import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { brand, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export const TAB_BAR_HEIGHT = 64

const tabs: Record<string, { label: string; icon: IconName; raised?: boolean }> = {
  index: { label: 'Home', icon: 'home' },
  guides: { label: 'Guides', icon: 'book' },
  capture: { label: 'Capture', icon: 'camera', raised: true },
  chat: { label: 'AI Chatbot', icon: 'chat' },
  profile: { label: 'Profile', icon: 'profile' },
}

/** Custom bottom navigation matching the prototype, including the raised center Capture action. */
export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme()
  return (
    <View
      accessibilityRole="tabbar"
      style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom, backgroundColor: colors.surface, borderTopColor: colors.line }]}
    >
      {state.routes.map((route, index) => {
        const tab = tabs[route.name]
        if (!tab) return null
        const focused = state.index === index
        const color = tab.raised ? colors.teal : focused ? colors.teal : colors.inkSoft
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
            accessibilityLabel={tab.raised ? 'Open image capture' : tab.label}
            pressedScale={tab.raised ? 0.94 : 1}
            style={styles.item}
          >
            {tab.raised ? (
              <View style={[styles.raised, { borderColor: colors.surface }]}>
                <Icon name={tab.icon} size={22} color={brand.onPrimary} />
              </View>
            ) : (
              <Icon name={tab.icon} size={22} color={color} />
            )}
            <AppText variant="tab" numberOfLines={1} style={{ color }}>{tab.label}</AppText>
          </Touchable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space[2] },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: touchTarget },
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
})
