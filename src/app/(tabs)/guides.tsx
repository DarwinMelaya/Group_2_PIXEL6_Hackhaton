import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { FAB_CLEARANCE } from '@/components/EmergencyFab'
import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { IconTile } from '@/components/ui/IconTile'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { ListRow } from '@/components/ui/ListRow'
import { Note, PageHeader } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { guides, type GuideKind } from '@/data/guides'
import { brand, radius, space, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

const filters: { label: string; value: GuideKind | 'all' }[] = [
  { label: 'All guides', value: 'all' },
  { label: 'Disasters', value: 'disaster' },
  { label: 'First aid', value: 'aid' },
]

const sections: { title: string; kind: GuideKind }[] = [
  { title: 'Disaster preparedness', kind: 'disaster' },
  { title: 'First aid', kind: 'aid' },
]

export default function GuidesScreen() {
  const { colors, scale } = useTheme()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<GuideKind | 'all'>('all')
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return guides.filter((guide) =>
      (filter === 'all' || guide.kind === filter) &&
      (!needle || guide.name.toLowerCase().includes(needle) || guide.keywords.some((keyword) => keyword.includes(needle))))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [query, filter])

  return (
    <Screen bottomSpace={FAB_CLEARANCE}>
      <PageHeader title="Guides" subtitle="Preparedness and first aid, organized for quick reference." />

      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Icon name="search" size={20} color={colors.inkSoft} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search guides"
          placeholderTextColor={colors.inkSoft}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search guides"
          style={[styles.input, { color: colors.ink, fontSize: typeRamp.body.fontSize * scale }]}
        />
      </View>

      <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Guide categories">
        {filters.map((item) => {
          const active = filter === item.value
          return (
            <Touchable
              key={item.value}
              onPress={() => setFilter(item.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.chip, { backgroundColor: active ? brand.primary : colors.surface, borderColor: active ? brand.primary : colors.line }]}
            >
              <AppText variant="caption" weight="600" style={active ? { color: brand.onPrimary } : undefined}>{item.label}</AppText>
            </Touchable>
          )
        })}
      </View>

      <View style={styles.results}>
        {sections.map((section) => {
          const items = results.filter((guide) => guide.kind === section.kind)
          if (!items.length) return null

          return (
            <View key={section.kind} style={styles.section}>
              <AppText variant="eyebrow" tone="soft" style={styles.sectionTitle}>{section.title}</AppText>
              <GroupedCard>
                {items.map((guide) => (
                  <ListRow
                    key={guide.id}
                    title={guide.name}
                    subtitle={guide.detail}
                    leading={<IconTile icon={guide.icon} tone={guide.tone} size="sm" />}
                    onPress={() => router.push({ pathname: '/guide/[id]', params: { id: guide.id } })}
                    accessibilityLabel={`Open ${guide.name}, ${section.title.toLowerCase()} guide`}
                  />
                ))}
              </GroupedCard>
            </View>
          )
        })}
        {!results.length ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Icon name="search" size={22} color={colors.inkSoft} />
            <AppText variant="caption" tone="soft" align="center">No guides match “{query.trim()}”. Try another search.</AppText>
          </View>
        ) : null}
      </View>

      <Note>Guides are general learning content. Follow local authorities and seek professional care when needed.</Note>
    </Screen>
  )
}

const styles = StyleSheet.create({
  search: { height: 48, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: space[3], flexDirection: 'row', alignItems: 'center', gap: space[2] },
  input: { flex: 1, minWidth: 0, height: '100%' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[3], marginBottom: space[4] },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space[3], paddingVertical: 6, minHeight: 36, justifyContent: 'center' },
  results: { gap: space[5] },
  section: { gap: space[2] },
  sectionTitle: { marginHorizontal: space[1] },
  empty: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: space[3], padding: space[6], borderWidth: 1, borderRadius: radius.group },
})
