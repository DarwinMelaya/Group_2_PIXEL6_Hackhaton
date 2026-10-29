import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { FAB_CLEARANCE } from '@/components/EmergencyFab'
import { AppText } from '@/components/ui/AppText'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { IconTile } from '@/components/ui/IconTile'
import { SectionHeader } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { disasterGuides, firstAidGuides } from '@/data/guides'
import { space } from '@/theme/tokens'

const openGuide = (id: string) => router.push({ pathname: '/guide/[id]', params: { id } })

export default function HomeScreen() {
  return (
    <Screen bottomSpace={FAB_CLEARANCE}>
      <View style={styles.welcome}>
        <AppText variant="eyebrow" tone="soft">Magandang araw</AppText>
        <AppText variant="pageTitle" accessibilityRole="header">Stay ready.</AppText>
        <AppText variant="caption" tone="soft" style={styles.subcopy}>Your everyday safety companion.</AppText>
      </View>

      <SectionHeader title="Disaster guides" caption="Know what to do before, during & after" actionLabel="See all" onAction={() => router.navigate('/guides')} />
      <View style={styles.disasterRow}>
        {disasterGuides.map((guide) => (
          <Touchable key={guide.id} onPress={() => openGuide(guide.id)} accessibilityLabel={`${guide.name} guide`} style={styles.disasterCard}>
            <IconTile icon={guide.icon} tone={guide.tone} />
            <AppText variant="tab" numberOfLines={1}>{guide.name}</AppText>
          </Touchable>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title="First aid" caption="Quick help for common emergencies" />
        <GroupedCard>
          {firstAidGuides.map((guide) => (
            <ListRow key={guide.id} title={guide.name} subtitle={guide.detail} leading={<IconTile icon={guide.icon} tone={guide.tone} size="sm" />} onPress={() => openGuide(guide.id)} />
          ))}
        </GroupedCard>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  welcome: { marginBottom: space[6] },
  subcopy: { marginTop: space[1] },
  disasterRow: { flexDirection: 'row', gap: space[1] },
  disasterCard: { flex: 1, alignItems: 'center', gap: space[2], minHeight: 86, justifyContent: 'center' },
  section: { marginTop: space[6] },
})
