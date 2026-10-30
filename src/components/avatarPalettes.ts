import {
  AVATAR_TONES,
  ILLUSTRATED_AVATARS,
  type AvatarPreset,
  type AvatarTone,
  type IllustratedAvatar,
} from '@/db/settings'
import type { ColorScheme } from '@/theme/tokens'

export type TonePalette = {
  bg: string
  fg: string
  ring: string
  swatch: string
  halo: string
}

export const AVATAR_PALETTES: Record<AvatarTone, { label: string; light: TonePalette; dark: TonePalette }> = {
  teal: {
    label: 'Teal',
    light: { bg: '#dff5f0', fg: '#087f75', ring: 'rgba(8, 127, 117, 0.24)', swatch: '#087f75', halo: '#bcebe2' },
    dark: { bg: '#153934', fg: '#55d8c8', ring: 'rgba(85, 216, 200, 0.32)', swatch: '#55d8c8', halo: '#1f524b' },
  },
  sky: {
    label: 'Ocean',
    light: { bg: '#e1f3fc', fg: '#1678a7', ring: 'rgba(22, 120, 167, 0.24)', swatch: '#1678a7', halo: '#bfe5f8' },
    dark: { bg: '#133142', fg: '#68c5f0', ring: 'rgba(104, 197, 240, 0.32)', swatch: '#68c5f0', halo: '#1c4760' },
  },
  blue: {
    label: 'Blue',
    light: { bg: '#e7efff', fg: '#306ac5', ring: 'rgba(48, 106, 197, 0.24)', swatch: '#306ac5', halo: '#c7daff' },
    dark: { bg: '#172847', fg: '#7baaf7', ring: 'rgba(123, 170, 247, 0.32)', swatch: '#7baaf7', halo: '#233c69' },
  },
  violet: {
    label: 'Indigo',
    light: { bg: '#efeaff', fg: '#6752ad', ring: 'rgba(103, 82, 173, 0.24)', swatch: '#6752ad', halo: '#d8cdfc' },
    dark: { bg: '#261e45', fg: '#b39ef5', ring: 'rgba(179, 158, 245, 0.32)', swatch: '#b39ef5', halo: '#382c66' },
  },
  rose: {
    label: 'Rose',
    light: { bg: '#ffe9ee', fg: '#c74961', ring: 'rgba(199, 73, 97, 0.24)', swatch: '#c74961', halo: '#fccbd5' },
    dark: { bg: '#3b1d25', fg: '#f4899e', ring: 'rgba(244, 137, 158, 0.32)', swatch: '#f4899e', halo: '#572a36' },
  },
  amber: {
    label: 'Amber',
    light: { bg: '#ffefd4', fg: '#a56616', ring: 'rgba(165, 102, 22, 0.24)', swatch: '#c57c1e', halo: '#fbdca6' },
    dark: { bg: '#382914', fg: '#f2b95e', ring: 'rgba(242, 185, 94, 0.32)', swatch: '#f2b95e', halo: '#523c1d' },
  },
}

export const ILLUSTRATED_AVATAR_META: Record<IllustratedAvatar, { label: string; description: string }> = {
  morion: { label: 'Morion', description: 'Marinduque guardian' },
  responder: { label: 'Hero', description: 'Safety responder' },
  gabai: { label: 'GabAI', description: 'Smart companion' },
  explorer: { label: 'Scout', description: 'Island explorer' },
  medic: { label: 'Medic', description: 'First aid helper' },
  islander: { label: 'Local', description: 'Sunny islander' },
  bantay: { label: 'Bantay', description: 'Loyal rescue pup' },
  ming: { label: 'Ming', description: 'Cozy island cat' },
}

export function getAvatarPalette(tone: AvatarTone, scheme: ColorScheme): TonePalette {
  return AVATAR_PALETTES[tone][scheme]
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getAvatarPresetLabel(preset: AvatarPreset): string {
  if (preset === 'auto') return 'Auto'
  if (preset === 'initials') return 'Initials'
  return ILLUSTRATED_AVATAR_META[preset].label
}

export type RandomAvatarCombo = {
  avatar: IllustratedAvatar
  tone: AvatarTone
}

export function pickRandomAvatarCombo(exclude?: Partial<RandomAvatarCombo>): RandomAvatarCombo {
  const avatarPool = ILLUSTRATED_AVATARS.filter((item) => item !== exclude?.avatar)
  const tonePool = AVATAR_TONES.filter((item) => item !== exclude?.tone)
  const avatar = avatarPool[Math.floor(Math.random() * avatarPool.length)] ?? ILLUSTRATED_AVATARS[0]
  const tone = tonePool[Math.floor(Math.random() * tonePool.length)] ?? AVATAR_TONES[0]
  return { avatar, tone }
}
