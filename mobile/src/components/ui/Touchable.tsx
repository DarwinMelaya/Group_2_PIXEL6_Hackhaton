import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'

type TouchableProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; pressedScale?: number }

/** Pressable with the subtle press-down scale used across the prototype (`transform: scale(.975)`). */
export function Touchable({ style, pressedScale = 0.975, accessibilityRole = 'button', ...rest }: TouchableProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      style={({ pressed }) => [style, pressed && { transform: [{ scale: pressedScale }], opacity: 0.92 }]}
      {...rest}
    />
  )
}
