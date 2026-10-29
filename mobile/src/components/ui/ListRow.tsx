import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { radius, space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

import { AppText } from './AppText'
import { Icon, type IconName } from './Icon'
import { Touchable } from './Touchable'

type ListRowProps = {
  title: string
  subtitle?: string
  /** Leading visual. Pass an `IconName` for the default soft-teal badge, or any node (e.g. `<IconTile/>`). */
  leading?: IconName | ReactNode
  trailing?: ReactNode
  destructive?: boolean
  onPress?: () => void
  accessibilityLabel?: string
}

export function ListRow({ title, subtitle, leading, trailing, destructive, onPress, accessibilityLabel }: ListRowProps) {
  const { colors } = useTheme()
  const accent = destructive ? colors.danger : colors.teal
  const leadingNode = typeof leading === 'string'
    ? <View style={[styles.badge, { backgroundColor: destructive ? colors.dangerSoft : colors.tealSoft }]}><Icon name={leading as IconName} size={20} color={accent} /></View>
    : leading
  return (
    <Touchable onPress={onPress} disabled={!onPress} pressedScale={1} accessibilityLabel={accessibilityLabel ?? title} style={[styles.row, { backgroundColor: colors.surface }]}>
      {leadingNode}
      <View style={styles.body}>
        <AppText tone={destructive ? 'danger' : 'default'} weight="500">{title}</AppText>
        {subtitle ? <AppText variant="small" tone="soft" style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chevron" size={18} color={destructive ? colors.danger : colors.muted} /> : null)}
    </Touchable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[4], paddingVertical: space[3], minHeight: 64 },
  badge: { width: space[8], height: space[8], borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 2 },
})
