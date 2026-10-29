import type { KeyboardTypeOptions } from 'react-native'

import type { IconName } from '@/components/ui/Icon'

export const MUNICIPALITIES = ['Boac', 'Buenavista', 'Gasan', 'Mogpog', 'Santa Cruz', 'Torrijos'] as const

export const PROFILE_VALUE_MAX_LENGTH = 180

export type ProfileField = {
  key: string
  label: string
  placeholder?: string
  keyboardType?: KeyboardTypeOptions
  input?: 'text' | 'municipality'
}

export type ProfileGroup = {
  id: 'personal' | 'health' | 'contact'
  title: string
  description: string
  icon: IconName
  fields: ProfileField[]
}

export const profileGroups: ProfileGroup[] = [
  {
    id: 'personal',
    title: 'Personal information',
    description: 'Your details and address in Marinduque.',
    icon: 'profile',
    fields: [
      { key: 'name', label: 'Full name' },
      { key: 'birthday', label: 'Date of birth', placeholder: 'YYYY-MM-DD', keyboardType: 'numbers-and-punctuation' },
      { key: 'phone', label: 'Phone number', keyboardType: 'phone-pad' },
      { key: 'municipality', label: 'Municipality', input: 'municipality' },
      { key: 'barangay', label: 'Barangay', placeholder: 'Enter your barangay' },
    ],
  },
  {
    id: 'health',
    title: 'Health information',
    description: 'Important details about your health.',
    icon: 'heart',
    fields: [
      { key: 'blood', label: 'Blood type' },
      { key: 'allergies', label: 'Allergies' },
      { key: 'conditions', label: 'Medical conditions' },
      { key: 'medications', label: 'Current medications' },
    ],
  },
  {
    id: 'contact',
    title: 'Emergency contact',
    description: 'Someone to reach in an emergency.',
    icon: 'phone',
    fields: [
      { key: 'contactName', label: 'Contact name' },
      { key: 'relationship', label: 'Relationship' },
      { key: 'contactPhone', label: 'Phone number', keyboardType: 'phone-pad' },
    ],
  },
]

export const PROFILE_KEYS = profileGroups.flatMap((group) => group.fields.map((field) => field.key))

export type ProfileInfo = Record<string, string>

export const getProfileGroup = (id: string | undefined) => profileGroups.find((group) => group.id === id)
