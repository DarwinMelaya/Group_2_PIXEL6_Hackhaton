import * as Linking from 'expo-linking'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { BackButton, PageHeader } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { emergencyContacts, toDialUri, type EmergencyContact } from '@/data/contacts'
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

export default function EmergencyScreen() {
  const { colors } = useTheme()
  return (
    <Screen topInset>
      <BackButton />
      <PageHeader title="Emergency contacts" subtitle="Choose a service to call. Cellular service is required." />
      <View style={styles.list}>
        {emergencyContacts.map((contact) => (
          <Touchable
            key={contact.label}
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
        ))}
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
