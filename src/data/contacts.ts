import type { Municipality } from './profile'

/** `pending` rows are placeholders with no verified number yet — never dialable. */
export type EmergencyContact = { label: string; number: string; pending?: boolean }

export const nationalContacts: EmergencyContact[] = [
  { label: 'National emergency (911)', number: '911' },
  { label: 'Philippine Red Cross', number: '143' },
]

export const provincialContacts: EmergencyContact[] = [
  { label: 'Marinduque PDRRMO', number: '(042) 332 1913' },
  { label: 'Coast Guard Station Marinduque', number: '0930 430 3182' },
  { label: 'Marinduque Provincial Government', number: '(042) 704 0144' },
]

/**
 * Municipal hotlines, compiled from public LGU / MDRRMO / BFP posts (Oct 2026); the
 * municipal hall landlines come from the DILG MIMAROPA LGU directory.
 * Draft: verify every number with each MDRRMO before release.
 */
export const municipalContacts: Record<Municipality, EmergencyContact[]> = {
  Boac: [
    { label: 'Boac MDRRMO 24/7 OpCen', number: '0960 585 8800' },
    { label: 'Boac Municipal Hall', number: '(042) 311 1378' },
  ],
  Buenavista: [
    { label: 'Buenavista MDRRMO', number: '0947 761 3187' },
    { label: 'Buenavista Fire Station', number: '(042) 704 0095' },
    { label: 'Buenavista Municipal Hall', number: '(042) 704 0062' },
  ],
  Gasan: [
    { label: 'Gasan Municipal Hall', number: '(042) 342 1074' },
    { label: 'Gasan Fire Station', number: '(042) 332 0477' },
    { label: 'Coast Guard Sub-Station Gasan', number: '0910 473 9932' },
  ],
  Mogpog: [
    { label: 'Mogpog MDRRMO', number: '0917 813 7880' },
    { label: 'Mogpog Municipal Hall', number: '(042) 332 1249' },
  ],
  'Santa Cruz': [
    { label: 'Santa Cruz MDRRMO', number: '0920 455 4034' },
    { label: 'Santa Cruz BFP', number: '0946 027 1055' },
    { label: 'Santa Cruz PNP', number: '0998 598 5806' },
  ],
  Torrijos: [
    { label: 'Torrijos Fire Station', number: '0999 102 8059' },
    { label: 'Torrijos Fire Station landline', number: '(042) 754 2817' },
  ],
}

/**
 * Barangay hall / BDRRMC hotlines keyed by municipality, then barangay name as listed in `BARANGAYS`.
 *
 * Intentionally empty: no public directory of Marinduque barangay hotlines exists (the few
 * published barangay contacts are Facebook pages, not phone lines). Never fill this in with
 * guessed or inferred numbers — a dead line dialled mid-emergency costs more than a missing row.
 * Only add entries confirmed directly with the barangay or its MDRRMO, and note the source here.
 */
export const barangayContacts: Partial<Record<Municipality, Record<string, EmergencyContact[]>>> = {}

/**
 * Stand-in row for a barangay with no confirmed hotline, so the section shows the barangay
 * GabAI matched instead of nothing. Carries no number at all: a placeholder that looks like a
 * real number would get dialled in an emergency and fail silently.
 */
export const barangayPlaceholder = (barangay: string): EmergencyContact => ({
  label: `Brgy. ${barangay} BDRRMC`,
  number: 'Number pending MDRRMO verification',
  pending: true,
})

export const getLocalContacts = (municipality: Municipality, barangay?: string): EmergencyContact[] => [
  ...(barangay ? barangayContacts[municipality]?.[barangay] ?? [barangayPlaceholder(barangay)] : []),
  ...municipalContacts[municipality],
]

export const toDialUri = (number: string) => `tel:${number.replace(/[^+\d]/g, '')}`
