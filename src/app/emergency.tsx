import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { BackButton, Note, PageHeader, SectionHeader, TextButton } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { getLocalContacts, nationalContacts, provincialContacts, toDialUri, type EmergencyContact } from '@/data/contacts'
import { MUNICIPALITIES, type Municipality } from '@/data/profile'
import { getProfile } from '@/db/profile'
import { getCurrentBarangay, type BarangayLookup } from '@/services/location'
import { brand, radius, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { showAlert } from '@/utils/dialogs'

type Address = { municipality: Municipality; barangay?: string }

async function call(contact: EmergencyContact) {
  try {
    await Linking.openURL(toDialUri(contact.number))
  } catch {
    showAlert('Unable to place call', `Dial ${contact.number} manually from your phone app.`)
  }
}

/** Explains the exact reason GPS produced no barangay, so a failed lookup is actionable. */
function lookupNote(lookup: BarangayLookup, hasSavedAddress: boolean): string | null {
  switch (lookup.status) {
    case 'ok':
      return null
    case 'denied':
      return 'Location access is off. Allow location for GabAI in your device settings to see hotlines for the barangay you are in.'
    case 'services-off':
      return 'Location services are turned off. Switch on GPS, then tap Retry.'
    case 'timeout':
      return 'Could not get a GPS fix in time. Move outdoors or near a window, then tap Retry.'
    case 'off-island':
      return `You are about ${Math.round(lookup.distanceKm)} km from Marinduque, so no municipal or barangay hotlines apply here.${hasSavedAddress ? '' : ' Provincial and national hotlines still work.'}`
    case 'unavailable':
      return 'Location is unavailable on this device. Set your barangay in Profile to see local hotlines.'
  }
}

function ContactRow({ contact }: { contact: EmergencyContact }) {
  const { colors } = useTheme()
  // Placeholders are plain views: nothing to dial, so nothing that can look tappable.
  if (contact.pending) {
    return (
      <View style={[styles.row, styles.pendingRow, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={styles.flex}>
          <AppText weight="600" tone="soft">{contact.label}</AppText>
          <AppText variant="caption" tone="soft" style={styles.number}>{contact.number}</AppText>
        </View>
        <Icon name="pin" size={20} color={colors.inkSoft} />
      </View>
    )
  }
  return (
    <Touchable
      onPress={() => call(contact)}
      accessibilityRole="link"
      accessibilityLabel={`Call ${contact.label}, ${contact.number}`}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}
    >
      <View style={styles.flex}>
        <AppText weight="600">{contact.label}</AppText>
        <AppText variant="caption" tone="soft" style={styles.number}>{contact.number}</AppText>
      </View>
      <View style={styles.callCircle}><Icon name="phone" size={20} color={brand.onPrimary} /></View>
    </Touchable>
  )
}

export default function EmergencyScreen() {
  const db = useSQLiteContext()
  const [lookup, setLookup] = useState<BarangayLookup | null>(null)
  const [saved, setSaved] = useState<Address | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    void getProfile(db).then((profile) => {
      const municipality = MUNICIPALITIES.find((m) => m === profile.municipality)
      if (active && municipality) setSaved({ municipality, barangay: profile.barangay || undefined })
    }).catch(() => {})
    return () => { active = false }
  }, [db])

  useEffect(() => {
    let active = true
    void getCurrentBarangay().then((result) => {
      if (active) setLookup(result)
    })
    return () => { active = false }
  }, [attempt])

  const retry = () => {
    setLookup(null)
    setAttempt((n) => n + 1)
  }

  const gps = lookup?.status === 'ok' ? lookup.barangay : null
  const fallback = lookup && !gps ? saved : null
  const address: Address | null = gps ?? fallback
  const localContacts = address ? getLocalContacts(address.municipality, address.barangay) : []
  const note = lookup && !gps ? lookupNote(lookup, Boolean(saved)) : null

  const localCaption = !lookup
    ? 'Finding your location…'
    : gps
      ? `Based on your current location: Brgy. ${gps.barangay}, ${gps.municipality}`
      : fallback
        ? `Based on your saved address: ${fallback.barangay ? `Brgy. ${fallback.barangay}, ` : ''}${fallback.municipality}`
        : undefined

  return (
    <Screen topInset>
      <BackButton />
      <PageHeader title="Emergency contacts" subtitle="Choose a service to call. Cellular service is required." />
      <View style={styles.list}>
        <SectionHeader
          title="Local hotlines"
          caption={localCaption}
          actionLabel={lookup && !gps ? 'Retry' : undefined}
          onAction={lookup && !gps ? retry : undefined}
        />
        {localContacts.map((contact) => <ContactRow key={contact.label} contact={contact} />)}
        {note ? <Note icon="pin">{note}</Note> : null}
        {lookup && !gps && !saved ? (
          <TextButton
            label="Set your barangay in Profile"
            onPress={() => router.push({ pathname: '/profile/[group]', params: { group: 'personal' } })}
          />
        ) : null}
        <SectionHeader title="Provincial" />
        {provincialContacts.map((contact) => <ContactRow key={contact.label} contact={contact} />)}
        <SectionHeader title="National" />
        {nationalContacts.map((contact) => <ContactRow key={contact.label} contact={contact} />)}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: space[3] },
  row: { flexDirection: 'row', alignItems: 'center', padding: space[3], paddingLeft: space[4], borderRadius: radius.group, borderWidth: 1 },
  pendingRow: { borderStyle: 'dashed', paddingRight: space[4] },
  number: { marginTop: 3 },
  callCircle: { width: touchTarget, height: touchTarget, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.emergency },
})
