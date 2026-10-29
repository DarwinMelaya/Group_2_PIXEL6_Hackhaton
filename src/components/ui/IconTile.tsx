import { View } from 'react-native'

import { radius, tones, type Tone } from '@/theme/tokens'

import { Icon, type IconName } from './Icon'

const sizes = { lg: { box: 48, icon: 27, radius: radius.group }, md: { box: 42, icon: 23, radius: 14 }, sm: { box: 35, icon: 21, radius: 11 } }

export function IconTile({ icon, tone, size = 'lg' }: { icon: IconName; tone: Tone; size?: keyof typeof sizes }) {
  const dims = sizes[size]
  return (
    <View style={{ width: dims.box, height: dims.box, borderRadius: dims.radius, alignItems: 'center', justifyContent: 'center', backgroundColor: tones[tone].bg }}>
      <Icon name={icon} size={dims.icon} color={tones[tone].fg} />
    </View>
  )
}
