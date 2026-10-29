import { useMemo } from 'react'
import { useColorScheme } from 'react-native'

import { useSettings } from '@/providers/SettingsProvider'

import { palette, textSizes, type ColorScheme, type Colors } from './tokens'

export type Theme = { scheme: ColorScheme; colors: Colors; scale: number }

export function useTheme(): Theme {
  const { settings } = useSettings()
  const system = useColorScheme()
  const scheme: ColorScheme = settings.appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : settings.appearance
  const scale = textSizes[settings.textSize].scale
  return useMemo(() => ({ scheme, colors: palette[scheme], scale }), [scheme, scale])
}
