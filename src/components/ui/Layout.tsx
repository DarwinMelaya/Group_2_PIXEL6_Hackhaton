import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { radius, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { goBack } from '@/utils/navigation'

import { AppText } from './AppText'
import { Icon, type IconName } from './Icon'
import { Touchable } from './Touchable'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.pageHead}>
      <View style={styles.row}>
        <AppText variant="pageTitle" accessibilityRole="header" style={styles.flex}>{title}</AppText>
        {action}
      </View>
      {subtitle ? <AppText variant="caption" tone="soft" style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  )
}

export function SectionHeader({ title, caption, actionLabel, onAction }: { title: string; caption?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={[styles.row, styles.sectionHead]}>
      <View style={styles.flex}>
        <AppText variant="sectionTitle" accessibilityRole="header">{title}</AppText>
        {caption ? <AppText variant="small" tone="soft" style={styles.caption}>{caption}</AppText> : null}
      </View>
      {actionLabel && onAction ? <TextButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  )
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} style={styles.textButton} hitSlop={8}>
      <AppText variant="caption" tone="teal" weight="600">{label}</AppText>
    </Touchable>
  )
}

export function BackButton({ label = 'Back', onPress = () => goBack() }: { label?: string; onPress?: () => void }) {
  const { colors } = useTheme()
  return (
    <Touchable onPress={onPress} style={styles.back} accessibilityLabel={`Go back to ${label}`} hitSlop={8}>
      <Icon name="arrowLeft" size={20} color={colors.teal} />
      <AppText tone="teal">{label}</AppText>
    </Touchable>
  )
}

/** Footnote with leading icon (prototype's `.privacy-note`). */
export function Note({ children, icon = 'shield' }: { children: string; icon?: IconName }) {
  const { colors } = useTheme()
  return (
    <View style={styles.note}>
      <Icon name={icon} size={18} color={colors.inkSoft} />
      <AppText variant="small" tone="soft" style={styles.flex}>{children}</AppText>
    </View>
  )
}

export function Pill({ label, icon = 'wifiOff' }: { label: string; icon?: IconName }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.pill, { backgroundColor: colors.tealSoft }]}>
      <Icon name={icon} size={13} color={colors.tealDark} />
      <AppText variant="tab" weight="700" style={{ color: colors.tealDark }}>{label}</AppText>
    </View>
  )
}

export function Banner({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' }) {
  const { colors } = useTheme()
  return (
    <View accessibilityLiveRegion="polite" style={[styles.banner, { backgroundColor: tone === 'error' ? colors.dangerSoft : colors.tealSoft }]}>
      <AppText variant="caption" style={{ color: tone === 'error' ? colors.ink : colors.tealDark }}>{text}</AppText>
    </View>
  )
}

export function SettingsLabel({ children }: { children: string }) {
  return <AppText variant="caption" tone="soft" weight="500" style={styles.settingsLabel}>{children}</AppText>
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  pageHead: { marginBottom: space[5] },
  subtitle: { marginTop: space[1] },
  sectionHead: { marginBottom: space[3] },
  caption: { marginTop: 2 },
  textButton: { minHeight: touchTarget, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: space[1], minHeight: touchTarget, alignSelf: 'flex-start', marginBottom: space[3] },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2], paddingTop: space[5], paddingHorizontal: space[2] },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill, alignSelf: 'center' },
  banner: { marginTop: space[4], padding: space[4], borderRadius: radius.group },
  settingsLabel: { marginHorizontal: space[4], marginBottom: space[2] },
})
