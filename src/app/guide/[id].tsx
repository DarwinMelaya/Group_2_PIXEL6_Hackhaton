import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { IconTile } from '@/components/ui/IconTile'
import { Touchable } from '@/components/ui/Touchable'
import { getGuide } from '@/data/guides'
import { radius, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { goBack } from '@/utils/navigation'

export default function GuideSheet() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const guide = getGuide(id)
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [phaseIndex, setPhaseIndex] = useState(0)

  if (!guide) {
    return (
      <View style={[styles.missing, { backgroundColor: colors.surface }]}>
        <AppText variant="sheetTitle">Guide not found</AppText>
        <Touchable onPress={() => goBack('/guides')} style={styles.missingAction}><AppText tone="teal">Close</AppText></Touchable>
      </View>
    )
  }

  const phase = guide.phases[phaseIndex]
  return (
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={[styles.content, { paddingBottom: space[8] + insets.bottom }]}>
      <View style={styles.header}>
        <IconTile icon={guide.icon} tone={guide.tone} />
        <View style={styles.flex}>
          <AppText variant="eyebrow" tone="soft">{guide.kind === 'disaster' ? 'Safety guide' : 'First aid guide'}</AppText>
          <AppText variant="sheetTitle" accessibilityRole="header">{guide.name}</AppText>
        </View>
        <Touchable onPress={() => goBack('/guides')} accessibilityLabel="Close" style={[styles.close, { borderColor: colors.line, backgroundColor: colors.background }]}>
          <Icon name="close" size={18} color={colors.ink} />
        </Touchable>
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.line }]} accessibilityRole="tablist">
        {guide.phases.map((item, index) => {
          const active = index === phaseIndex
          return (
            <Touchable
              key={item.label}
              onPress={() => setPhaseIndex(index)}
              pressedScale={1}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && { borderBottomColor: colors.teal }]}
            >
              <AppText variant="small" weight="700" tone={active ? 'teal' : 'soft'} align="center">{item.label}</AppText>
            </Touchable>
          )
        })}
      </View>

      <View style={styles.steps}>
        {phase.steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.tealSoft }]}>
              <AppText variant="small" weight="800" tone="teal">{index + 1}</AppText>
            </View>
            <AppText style={styles.flex}>{step}</AppText>
          </View>
        ))}
      </View>

      <View style={[styles.verified, { backgroundColor: colors.tealSoft }]}>
        <Icon name="shield" size={18} color={colors.teal} />
        <AppText variant="small" weight="700" tone="teal">Verified guide · Available offline</AppText>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space[5], paddingTop: space[6] },
  header: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  close: { width: touchTarget, height: touchTarget, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginVertical: space[5], borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: space[2], minHeight: touchTarget, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  steps: { gap: space[4] },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  stepNumber: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  verified: { marginTop: space[5], padding: space[3], borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2] },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3], padding: space[6] },
  missingAction: { minHeight: touchTarget, justifyContent: 'center', borderRadius: radius.md },
})
