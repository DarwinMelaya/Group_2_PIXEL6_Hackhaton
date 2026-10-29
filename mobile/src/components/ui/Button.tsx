import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import { brand, radius, space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

import { AppText } from './AppText'
import { Icon, type IconName } from './Icon'
import { Touchable } from './Touchable'

type ButtonProps = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'destructive'
  icon?: IconName
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style }: ButtonProps) {
  const { colors } = useTheme()
  const background = variant === 'primary' ? brand.primary : variant === 'destructive' ? brand.emergency : colors.surface
  const foreground = variant === 'secondary' ? colors.teal : brand.onPrimary
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[styles.button, { backgroundColor: background, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={foreground} /> : icon ? <Icon name={icon} size={20} color={foreground} /> : null}
      <AppText variant="bodyStrong" style={{ color: foreground }}>{label}</AppText>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  button: { flex: 1, minHeight: 48, borderRadius: radius.group, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], paddingHorizontal: space[4] },
})
