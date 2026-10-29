import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { FAB_CLEARANCE } from '@/components/EmergencyFab'
import { MarinduqueScene } from '@/components/MarinduqueScene'
import { WeatherCard } from '@/components/WeatherCard'
import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
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
          <AppText variant="eyebrow" tone="soft">{settings.nickname ? `Magandang araw, ${settings.nickname}` : 'Magandang araw'}</AppText>
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
              <AppText variant="caption" weight="600" numberOfLines={1} align="center">{guide.name}</AppText>
            </Touchable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Safety tip" />
        <View style={[styles.tipCard, { backgroundColor: colors.tipBackground }]}>
          <View style={[styles.tipIcon, { backgroundColor: colors.tealSoft }]}>
            <Icon name="shield" size={23} color={colors.teal} />
          </View>
          <View style={styles.tipText}>
            <AppText variant="bodyStrong" style={{ color: colors.tipText }}>Never walk through floodwater.</AppText>
            <AppText variant="caption" style={[styles.tipCopy, { color: colors.tipText }]}>Even shallow, fast-moving water can knock you down. Move to higher ground and follow official evacuation orders.</AppText>
          </View>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { position: 'relative', marginTop: -space[6], marginHorizontal: -space[5], paddingTop: space[5], paddingHorizontal: space[5], paddingBottom: space[5] },
  scene: { position: 'absolute', right: 0, top: space[2], width: '68%', height: 120 },
  welcome: { minHeight: 100, marginBottom: space[3], paddingTop: space[1] },
  subcopy: { marginTop: space[1] },
  section: { marginTop: space[5] },
  disasterRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space[2] },
  disasterCard: { width: '31.5%', minHeight: 120, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: space[2], paddingHorizontal: space[1], paddingVertical: space[3] },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3], padding: space[5], borderRadius: radius.lg },
  tipIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1 },
  tipCopy: { marginTop: space[2], lineHeight: 21 },
})
