import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'

type TouchableProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; pressedScale?: number }

/** Opacity feedback by default; prominent actions can opt into a press scale. */
export function Touchable({ style, pressedScale = 1, accessibilityRole = 'button', ...rest }: TouchableProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      style={({ pressed }) => [style, pressed && { transform: [{ scale: pressedScale }], opacity: 0.7 }]}
      {...rest}
    />
  )
}
