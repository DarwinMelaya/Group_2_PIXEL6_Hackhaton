import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { radius, space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

/** iOS-style grouped surface. Inserts leading-inset hairline separators between children. */
export function GroupedCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme()
  const items = Children.toArray(children).filter(isValidElement)
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, style]}>
      {items.map((child, index) => (
        <Fragment key={child.key ?? index}>
          {index > 0 && <View style={[styles.separator, { backgroundColor: colors.line }]} />}
          {child}
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.group, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: space[4] },
})
