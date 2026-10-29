import { Text, type TextProps, type TextStyle } from 'react-native'

import { typeRamp, type TextVariant, type TypeRampEntry } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export type TextTone = 'default' | 'soft' | 'teal' | 'danger' | 'inverse'

type AppTextProps = TextProps & {
  variant?: TextVariant
  tone?: TextTone
  weight?: TextStyle['fontWeight']
  align?: TextStyle['textAlign']
}

/** Theme-aware text. Applies the type ramp, the user's in-app text size, and color tone. */
export function AppText({ variant = 'body', tone = 'default', weight, align, style, ...rest }: AppTextProps) {
  const { colors, scale } = useTheme()
  const ramp: TypeRampEntry = typeRamp[variant]
  const color = { default: colors.ink, soft: colors.inkSoft, teal: colors.teal, danger: colors.danger, inverse: '#ffffff' }[tone]
  return (
    <Text
      {...rest}
      style={[
        {
          color,
          fontSize: ramp.fontSize * scale,
          lineHeight: ramp.lineHeight * scale,
          fontWeight: weight ?? ramp.fontWeight,
          letterSpacing: ramp.letterSpacing,
          textAlign: align,
          textTransform: variant === 'eyebrow' ? 'uppercase' : undefined,
        },
        style,
      ]}
    />
  )
}
