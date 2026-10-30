import { View } from 'react-native'

import { radius, tones, type Tone } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

import { Icon, type IconName } from './Icon'

const sizes = {
  xl: { box: 48, icon: 28, radius: radius.md },
  lg: { box: 44, icon: 25, radius: radius.md },
  md: { box: 42, icon: 23, radius: 14 },
  sm: { box: 35, icon: 21, radius: 11 },
}

export function IconTile({ icon, tone, size = 'lg' }: { icon: IconName; tone: Tone; size?: keyof typeof sizes }) {
  const dims = sizes[size]
  const { colors, scheme } = useTheme()
  return (
    <View style={{ width: dims.box, height: dims.box, borderRadius: dims.radius, alignItems: 'center', justifyContent: 'center', backgroundColor: scheme === 'dark' ? colors.tealSoft : tones[tone].bg }}>
      <Icon name={icon} size={dims.icon} color={scheme === 'dark' ? colors.teal : tones[tone].fg} />
    </View>
  )
}
