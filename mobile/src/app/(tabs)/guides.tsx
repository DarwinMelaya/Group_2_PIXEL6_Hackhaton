import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { FAB_CLEARANCE } from '@/components/EmergencyFab'
import { AppText } from '@/components/ui/AppText'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Icon } from '@/components/ui/Icon'
import { IconTile } from '@/components/ui/IconTile'
import { PageHeader } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { guideKindLabel, guides, type GuideKind } from '@/data/guides'
import { brand, radius, space, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

const filters: { label: string; value: GuideKind | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Disasters', value: 'disaster' },
  { label: 'First aid', value: 'aid' },
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
  }, [query, filter])

  return (
    <Screen bottomSpace={FAB_CLEARANCE}>
      <PageHeader title="Safety library" subtitle="Verified guides saved on your device" />
      <View style={[styles.search, { backgroundColor: colors.surface }]}>
        <Icon name="search" size={20} color={colors.inkSoft} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search disasters or first aid"
          placeholderTextColor={colors.inkSoft}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search guides"
          style={[styles.input, { color: colors.ink, fontSize: typeRamp.body.fontSize * scale }]}
        />
      </View>
      <View style={styles.filters} accessibilityRole="radiogroup">
        {filters.map((item) => {
          const active = filter === item.value
          return (
            <Touchable
              key={item.value}
              onPress={() => setFilter(item.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.chip, { borderColor: active ? brand.primary : colors.line, backgroundColor: active ? brand.primary : 'transparent' }]}
            >
              <AppText variant="caption" weight="600" style={active ? { color: brand.onPrimary } : undefined}>{item.label}</AppText>
            </Touchable>
          )
        })}
      </View>
      {results.length ? (
        <GroupedCard>
          {results.map((guide) => (
            <ListRow
              key={guide.id}
              title={guide.name}
              subtitle={`${guideKindLabel[guide.kind]} · Available offline`}
              leading={<IconTile icon={guide.icon} tone={guide.tone} size="md" />}
              onPress={() => router.push({ pathname: '/guide/[id]', params: { id: guide.id } })}
            />
          ))}
        </GroupedCard>
      ) : (
        <AppText tone="soft" align="center" style={styles.empty}>No guides match “{query.trim()}”.</AppText>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  search: { height: 48, borderRadius: 14, paddingHorizontal: space[3], flexDirection: 'row', alignItems: 'center', gap: space[2] },
  input: { flex: 1, minWidth: 0, height: '100%' },
  filters: { flexDirection: 'row', gap: space[2], marginTop: space[3], marginBottom: space[4] },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space[3], paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  empty: { marginTop: space[6] },
})
