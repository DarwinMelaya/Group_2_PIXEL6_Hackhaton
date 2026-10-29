import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg'

import type { ColorScheme } from '@/theme/tokens'

const scene = {
  light: {
    skyStart: '#c8e5df', skyEnd: '#b9d9d5', sunStart: '#f7dfaa', sunEnd: '#f7ecd0',
    cloud: '#e2edf0', farIsland: '#d6e8e3', island: '#a8cfca', coast: '#91bdb6', trees: '#6b9d94', fade: '#f2f2f7',
  },
  dark: {
    skyStart: '#164f52', skyEnd: '#082326', sunStart: '#28716e', sunEnd: '#13413f',
    cloud: '#164e50', farIsland: '#0b3035', island: '#092b2e', coast: '#061a1d', trees: '#020e12', fade: '#000000',
  },
} as const

/** Marinduque landscape artwork adapted from project/public/marinduque-*.svg. */
export function MarinduqueScene({ scheme }: { scheme: ColorScheme }) {
  const colors = scene[scheme]
  return (
    <Svg width="100%" height="100%" viewBox="0 0 440 150" preserveAspectRatio="xMaxYMid meet">
      <Defs>
        <LinearGradient id="scene-sky" x1="180" y1="0" x2="180" y2="150" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={colors.skyStart} />
          <Stop offset="1" stopColor={colors.skyEnd} />
        </LinearGradient>
        <LinearGradient id="scene-sun" x1="340" y1="10" x2="340" y2="100" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={colors.sunStart} />
          <Stop offset="1" stopColor={colors.sunEnd} />
        </LinearGradient>
        <LinearGradient id="scene-fade" x1="0" y1="70" x2="260" y2="70" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={colors.fade} />
          <Stop offset="1" stopColor={colors.fade} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Circle cx="342" cy="54" r="39" fill="url(#scene-sun)" />
      <Path d="M201 35h76c-2-5-7-7-13-6-4-12-20-14-25-2-4-6-14-5-17 3-9-2-17 0-21 5Z" fill={colors.cloud} />
      <Path d="M384 43c9-22 31-33 56-26v68h-82c3-22 11-36 26-42Z" fill={colors.farIsland} />
      <Path d="m130 112 70-22 30 5 48-29 37 26 22-14 42 27 61-17v62H130Z" fill="url(#scene-sky)" />
      <Path d="M150 87h81c-4-8-13-11-23-8-7-15-28-13-34 1-11-5-21-2-24 7ZM252 69h92c-3-7-11-10-20-8-5-18-28-22-38-5-12-9-27-2-28 7-3 1-5 3-6 6Z" fill={colors.cloud} />
      <Path d="m110 130 69-20 46 8 56-22 53 20 52-15 54 14v35H110Z" fill={colors.island} />
      <Path d="M290 139h150v11H245l45-11Z" fill={colors.coast} />
      <G fill={colors.trees}>
        <Path d="M377 145c1-23 4-49 10-73l5 1c-7 25-7 47-5 72Z" />
        <Path d="M389 77c-2-11-13-19-23-18l14 12c-16-5-28 1-33 11l19-5-15 13c14-2 27-7 37-11-4 12-1 22 5 31l1-27 12 17c0-14-4-23-14-27 12 2 20 8 28 15-1-14-14-23-28-18 6-9 14-13 23-16-15-4-23 4-26 23Z" />
        <Path d="M420 148c-2-27-1-53 2-81l4 1c-4 29-2 55 5 80Z" />
        <Path d="M423 73c-5-13-18-19-27-15l18 10c-17-1-27 8-29 18l23-11-12 17c15-7 22-13 26-19 0 15 6 22 14 28l-8-22 12 7V65c-6-1-10 0-15 3 4-10 9-16 15-20-12 0-17 12-17 25Z" />
        <Path d="M327 147c1-16 1-32-2-50h3c4 17 6 33 6 50Z" />
        <Path d="M326 102c-5-11-15-13-22-8l15 4c-12 2-17 8-18 15l18-10-6 12 13-11 9 13-4-15 15 9c-3-9-9-12-17-12 3-8 9-11 16-12-12-3-19 3-19 15Z" />
      </G>
      <Path d="M0 0h440v150H0Z" fill="url(#scene-fade)" />
    </Svg>
  )
}
