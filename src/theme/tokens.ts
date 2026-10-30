import type { TextStyle } from 'react-native'

export const palette = {
  light: {
    ink: '#1c1c1e',
    inkSoft: '#636366',
    background: '#f2f2f7',
    surface: '#ffffff',
    line: '#e5e5ea',
    teal: '#d9480f',
    tealDark: '#b93d0a',
    tealSoft: '#fff0e5',
    muted: '#a89b94',
    danger: '#c83d3d',
    dangerSoft: '#fbe6e6',
    tipText: '#755815',
    tipBackground: '#fff4d9',
    overlay: 'rgba(24, 16, 15, 0.45)',
    weatherAccent: '#3275a4',
    weatherDetailInk: '#25485e',
  },
  dark: {
    ink: '#ffffff',
    inkSoft: 'rgba(255, 255, 255, 0.72)',
    background: '#000000',
    surface: '#1c1c1e',
    line: '#38383a',
    teal: '#ff7426',
    tealDark: '#ffa066',
    tealSoft: '#381812',
    muted: 'rgba(255, 255, 255, 0.56)',
    danger: '#ff8585',
    dangerSoft: '#3a1f1f',
    tipText: 'rgba(255, 255, 255, 0.72)',
    tipBackground: '#1c1c1e',
    overlay: 'rgba(0, 0, 0, 0.6)',
    weatherAccent: '#afd9ec',
    weatherDetailInk: '#e1f3fb',
  },
} as const

export type ColorScheme = keyof typeof palette
export type Colors = { [K in keyof (typeof palette)['light']]: string }

/** Fixed brand colors that do not change between light and dark mode. */
export const brand = {
  primary: '#e8590c',
  emergency: '#c83d3d',
  onPrimary: '#ffffff',
} as const

export const tones = {
  sky: { fg: '#1678a7', bg: '#e4f4fb' },
  blue: { fg: '#306ac5', bg: '#eaf1ff' },
  amber: { fg: '#a56616', bg: '#fff1d9' },
  violet: { fg: '#6752ad', bg: '#f0ecff' },
  indigo: { fg: '#6752ad', bg: '#f0ecff' },
  coral: { fg: '#d45938', bg: '#fff0e8' },
  orange: { fg: '#d45938', bg: '#fff0e8' },
  rose: { fg: '#c74961', bg: '#ffebef' },
  teal: { fg: '#d9480f', bg: '#fff0e5' },
} as const

export type Tone = keyof typeof tones

export const darkTones: Record<Tone, { fg: string; bg: string }> = {
  sky: { fg: '#7ccbf2', bg: '#133140' },
  blue: { fg: '#8cb4ff', bg: '#172947' },
  amber: { fg: '#f4c26b', bg: '#382c18' },
  violet: { fg: '#b9a8f5', bg: '#272042' },
  indigo: { fg: '#b9a8f5', bg: '#272042' },
  coral: { fg: '#f59c82', bg: '#3b221a' },
  orange: { fg: '#f59c82', bg: '#3b221a' },
  rose: { fg: '#ff8da1', bg: '#3b1d25' },
  teal: { fg: '#ff7426', bg: '#381812' },
}

export function resolveTone(tone: Tone, scheme: ColorScheme) {
  return scheme === 'dark' ? darkTones[tone] : tones[tone]
}

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const

export const radius = { sm: 8, md: 12, group: 16, lg: 24, pill: 999 } as const

export const touchTarget = 44

export const textSizes = {
  standard: { label: 'Standard', scale: 1 },
  large: { label: 'Large', scale: 1.15 },
  extra: { label: 'Extra large', scale: 1.3 },
} as const

export type TextSize = keyof typeof textSizes

export type TypeRampEntry = {
  fontSize: number
  lineHeight: number
  fontWeight: TextStyle['fontWeight']
  letterSpacing?: number
}

/** System-font hierarchy, scaled by both device and in-app text preferences. */
export const typeRamp = {
  pageTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -0.6, lineHeight: 41 },
  heroTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, lineHeight: 34 },
  sheetTitle: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3, lineHeight: 26 },
  sectionTitle: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3, lineHeight: 26 },
  headline: { fontSize: 22, fontWeight: '600', letterSpacing: -0.4, lineHeight: 28 },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 24 },
  bodyStrong: { fontSize: 17, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 15, fontWeight: '400', lineHeight: 21 },
  small: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  eyebrow: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, lineHeight: 16 },
  tab: { fontSize: 11, fontWeight: '500', lineHeight: 14 },
} as const satisfies Record<string, TypeRampEntry>

export type TextVariant = keyof typeof typeRamp
