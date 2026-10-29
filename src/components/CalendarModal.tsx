import { useMemo, useRef, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { parseIsoDate, toIsoDate } from '@/data/profileValidation'
import { brand, radius, space, touchTarget } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const YEAR_ITEM_HEIGHT = 56

type ViewMode = 'days' | 'months' | 'years'

type CalendarModalProps = {
  visible: boolean
  value?: string
  onSelect: (iso: string) => void
  onClose: () => void
  maxDate?: Date
  minYear?: number
}

const firstOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

/** Pure-JS month/months/years calendar sheet. */
export function CalendarModal({ visible, value, onSelect, onClose, maxDate = new Date(), minYear = 1900 }: CalendarModalProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<ViewMode>('days')
  const [shown, setShown] = useState<Date>(() => {
    const parsed = value ? parseIsoDate(value) : null
    const today = new Date()
    return firstOfMonth(parsed ?? new Date(today.getFullYear() - 30, 0, 1))
  })
  const years = useMemo(() => {
    const list: number[] = []
    for (let year = maxDate.getFullYear(); year >= minYear; year--) list.push(year)
    return list
  }, [maxDate, minYear])
  const yearsList = useRef<FlatList<number>>(null)

  const maxMonth = firstOfMonth(maxDate)
  const canGoNext = shown < maxMonth
  const moveMonth = (delta: number) => setShown((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  const openYears = () => {
    setMode('years')
    requestAnimationFrame(() => yearsList.current?.scrollToIndex({ index: Math.max(0, years.indexOf(shown.getFullYear())), viewPosition: 0.3 }))
  }

  const todayIso = toIsoDate(new Date())
  const selectedIso = value && parseIsoDate(value) ? toIsoDate(parseIsoDate(value)!) : null
  const maxIso = toIsoDate(maxDate)

  const daysGrid = useMemo(() => {
    const first = new Date(shown.getFullYear(), shown.getMonth(), 1)
    const daysInMonth = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate()
    const cells: (string | null)[] = Array(first.getDay()).fill(null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(`${shown.getFullYear()}-${String(shown.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    }
    return cells
  }, [shown])

  const pick = (iso: string) => {
    onSelect(iso)
    onClose()
  }

  // Unmount while closed so a reopened calendar starts from the current value.
  if (!visible) return null

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + space[4] }]}>
        <View style={styles.header}>
          <Touchable onPress={() => moveMonth(-1)} disabled={mode !== 'days'} accessibilityLabel="Previous month" style={[styles.navButton, { transform: [{ scaleX: -1 }] }, mode !== 'days' && styles.hidden]}>
            <Icon name="chevron" size={20} color={colors.ink} />
          </Touchable>
          <Touchable onPress={() => (mode === 'days' ? openYears() : setMode('days'))} accessibilityLabel="Choose year" style={styles.titleButton}>
            <AppText weight="600">{mode === 'years' ? 'Choose a year' : mode === 'months' ? String(shown.getFullYear()) : `${MONTH_NAMES[shown.getMonth()]} ${shown.getFullYear()}`}</AppText>
            {mode === 'days' && <Icon name="chevronDown" size={14} color={colors.inkSoft} />}
          </Touchable>
          <Touchable onPress={() => moveMonth(1)} disabled={mode !== 'days' || !canGoNext} accessibilityLabel="Next month" style={[styles.navButton, (mode !== 'days' || !canGoNext) && styles.hidden]}>
            <Icon name="chevron" size={20} color={colors.ink} />
          </Touchable>
        </View>

        {mode === 'years' ? (
          <FlatList
            ref={yearsList}
            data={years}
            keyExtractor={(item) => String(item)}
            style={styles.yearList}
            getItemLayout={(_, index) => ({ length: YEAR_ITEM_HEIGHT, offset: YEAR_ITEM_HEIGHT * index, index })}
            initialScrollIndex={Math.max(0, years.indexOf(shown.getFullYear()))}
            renderItem={({ item }) => (
              <Touchable
                onPress={() => { setShown(new Date(item, shown.getMonth(), 1)); setMode('months') }}
                accessibilityRole="button"
                style={[styles.yearRow, { height: YEAR_ITEM_HEIGHT, backgroundColor: item === shown.getFullYear() ? colors.tealSoft : 'transparent' }]}
              >
                <AppText weight={item === shown.getFullYear() ? '600' : '400'} tone={item === shown.getFullYear() ? 'teal' : 'default'}>{item}</AppText>
              </Touchable>
            )}
          />
        ) : mode === 'months' ? (
          <View style={styles.monthGrid}>
            {MONTH_NAMES.map((name, index) => {
              const target = new Date(shown.getFullYear(), index, 1)
              const disabled = target > maxMonth
              return (
                <Touchable
                  key={name}
                  onPress={() => { setShown(target); setMode('days') }}
                  disabled={disabled}
                  accessibilityRole="button"
                  style={[styles.monthCell, index === shown.getMonth() && { backgroundColor: colors.tealSoft }]}
                >
                  <AppText tone={disabled ? 'soft' : index === shown.getMonth() ? 'teal' : 'default'} weight={index === shown.getMonth() ? '600' : '400'}>{name.slice(0, 3)}</AppText>
                </Touchable>
              )
            })}
          </View>
        ) : (
          <View>
            <View style={styles.weekdays}>
              {WEEKDAY_LABELS.map((label) => (
                <AppText key={label} variant="small" tone="soft" align="center" style={styles.dayCell}>{label}</AppText>
              ))}
            </View>
            <View style={styles.grid}>
              {daysGrid.map((iso, index) => {
                if (!iso) return <View key={`empty-${index}`} style={styles.dayCell} />
                const disabled = iso > maxIso
                const selected = iso === selectedIso
                const isToday = iso === todayIso
                return (
                  <Touchable
                    key={iso}
                    onPress={() => pick(iso)}
                    disabled={disabled}
                    accessibilityLabel={iso}
                    accessibilityState={{ selected, disabled }}
                    style={[
                      styles.dayCell,
                      selected && { backgroundColor: brand.primary },
                      isToday && !selected && { borderWidth: 1, borderColor: colors.teal },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={selected ? { color: brand.onPrimary } : undefined}
                      tone={disabled ? 'soft' : 'default'}
                    >{Number(iso.slice(8))}</AppText>
                  </Touchable>
                )
              })}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Touchable onPress={() => { onSelect(''); onClose() }} accessibilityLabel="Clear date" style={styles.footerButton}>
            <AppText tone="teal">Clear</AppText>
          </Touchable>
          <Touchable onPress={onClose} accessibilityLabel="Cancel" style={styles.footerButton}>
            <AppText tone="teal">Cancel</AppText>
          </Touchable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.group, borderTopRightRadius: radius.group, padding: space[4] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space[3] },
  navButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
  titleButton: { flexDirection: 'row', alignItems: 'center', gap: space[1], minHeight: touchTarget },
  weekdays: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: '33.3333%', minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  yearList: { maxHeight: YEAR_ITEM_HEIGHT * 6 },
  yearRow: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: space[4], marginTop: space[3] },
  footerButton: { minHeight: touchTarget, justifyContent: 'center', paddingHorizontal: space[3] },
})
