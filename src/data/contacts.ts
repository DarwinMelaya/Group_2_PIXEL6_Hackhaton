export type EmergencyContact = { label: string; number: string }

export const emergencyContacts: EmergencyContact[] = [
  { label: 'National emergency', number: '911' },
  { label: 'Marinduque PDRRMO', number: '(042) 332 1913' },
  { label: 'Philippine Red Cross', number: '143' },
]

export const toDialUri = (number: string) => `tel:${number.replace(/[^+\d]/g, '')}`
