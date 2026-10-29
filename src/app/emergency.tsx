import * as Linking from 'expo-linking'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { BackButton, Note, PageHeader, SectionHeader } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { getLocalContacts, nationalContacts, provincialContacts, toDialUri, type EmergencyContact } from '@/data/contacts'
import { MUNICIPALITIES, type Municipality } from '@/data/profile'
import { getProfile } from '@/db/profile'
import { getCurrentBarangay } from '@/services/location'
import { brand, radius, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { showAlert } from '@/utils/dialogs'

async function call(contact: EmergencyContact) {
  try {
    await Linking.openURL(toDialUri(contact.number))
  } catch {
    showAlert('Unable to place call', `Dial ${contact.number} manually from your phone app.`)
  }
}

function ContactRow({ contact }: { contact: EmergencyContact }) {
  const { colors } = useTheme()
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

type LocalState = { source: 'gps' | 'profile'; municipality: Municipality; barangay?: string } | { source: 'none' }

export default function EmergencyScreen() {
  const db = useSQLiteContext()
  const [local, setLocal] = useState<LocalState | null>(null)

  useEffect(() => {
    let active = true
    let saved: LocalState = { source: 'none' }
    void getProfile(db).then((profile) => {
      const municipality = MUNICIPALITIES.find((m) => m === profile.municipality)
      if (municipality) {
        saved = { source: 'profile', municipality, barangay: profile.barangay || undefined }
        if (active) setLocal((prev) => (prev?.source === 'gps' ? prev : saved))
      }
    }).catch(() => {})
    void getCurrentBarangay().then((gps) => {
      if (!active) return
      setLocal(gps ? { source: 'gps', municipality: gps.municipality, barangay: gps.barangay } : saved)
    })
    return () => { active = false }
  }, [db])

  const localCaption =
    local?.source === 'gps'
      ? `Based on your current location: Brgy. ${local.barangay}, ${local.municipality}`
      : local?.source === 'profile'
        ? `Based on your saved address: ${local.barangay ? `Brgy. ${local.barangay}, ` : ''}${local.municipality}`
        : 'Finding your location…'
  const localContacts = local && local.source !== 'none' ? getLocalContacts(local.municipality, local.barangay) : []

  return (
    <Screen topInset>
      <BackButton />
      <PageHeader title="Emergency contacts" subtitle="Choose a service to call. Cellular service is required." />
      <View style={styles.list}>
        <SectionHeader title="Local hotlines" caption={localCaption} />
        {localContacts.map((contact) => <ContactRow key={contact.label} contact={contact} />)}
        {local?.source === 'none' ? (
          <Note>No local hotlines — allow location access or set your barangay in Profile to see municipal and barangay numbers.</Note>
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
  number: { marginTop: 3 },
  callCircle: { width: touchTarget, height: touchTarget, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.emergency },
})
