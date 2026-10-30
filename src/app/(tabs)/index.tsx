import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { FAB_CLEARANCE } from '@/components/EmergencyFab'
import { MarinduqueScene } from '@/components/MarinduqueScene'
import { SafetyTipCard } from '@/components/SafetyTipCard'
import { WeatherCard } from '@/components/WeatherCard'
import { AppText } from '@/components/ui/AppText'
import { IconTile } from '@/components/ui/IconTile'
import { SectionHeader } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { disasterGuides } from '@/data/guides'
import { useSettings } from '@/providers/SettingsProvider'
import { radius, space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

const openGuide = (id: string) => router.push({ pathname: '/guide/[id]', params: { id } })

export default function HomeScreen() {
  const { settings } = useSettings()
  const { colors, scheme } = useTheme()

  return (
    <Screen bottomSpace={FAB_CLEARANCE}>
      <View style={[styles.hero, { backgroundColor: colors.background }]}>
        <View style={styles.scene} pointerEvents="none"><MarinduqueScene scheme={scheme} /></View>
        <View style={styles.welcome}>
          <AppText variant="caption" tone="soft">{settings.nickname ? `Magandang araw, ${settings.nickname}` : 'Magandang araw'}</AppText>
          <AppText variant="pageTitle" accessibilityRole="header">Stay ready.</AppText>
          <AppText variant="caption" tone="soft" style={styles.subcopy}>Your everyday safety companion.</AppText>
        </View>
        <WeatherCard />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Disaster guides" caption="Know what to do before, during & after" actionLabel="See all" onAction={() => router.navigate('/guides')} />
        <View style={styles.disasterRow}>
          {disasterGuides.map((guide) => (
            <Touchable
              key={guide.id}
              onPress={() => openGuide(guide.id)}
              accessibilityLabel={`Open ${guide.name} guide`}
              style={[styles.disasterCard, { backgroundColor: colors.surface }]}
            >
              <IconTile icon={guide.icon} tone={guide.tone} size="xl" />
              <AppText variant="small" weight="500" align="center">{guide.name}</AppText>
            </Touchable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Safety tip" />
        <SafetyTipCard />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { position: 'relative', marginTop: -space[6], marginHorizontal: -space[5], paddingTop: space[5], paddingHorizontal: space[5], paddingBottom: space[5] },
  scene: { position: 'absolute', right: 0, top: space[2], width: '55%', height: 120, opacity: 0.28 },
  welcome: { minHeight: 110, marginBottom: space[4], paddingTop: space[1], gap: space[1] },
  subcopy: { marginTop: space[1] },
  section: { marginTop: space[6] },
  disasterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space[2] },
  disasterCard: { width: '31.5%', minHeight: 112, borderRadius: radius.group, alignItems: 'center', justifyContent: 'center', gap: space[3], paddingHorizontal: space[2], paddingVertical: space[4] },
})
