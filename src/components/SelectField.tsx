import { useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

const SEARCH_THRESHOLD = 10
const PLAIN_HIT_SLOP = { top: 20, bottom: 10, left: 16, right: 16 } as const

type SelectFieldProps = {
  label: string
  value: string
  placeholder: string
  options: readonly string[]
  onChange: (value: string) => void
  disabled?: boolean
  disabledHint?: string
  error?: boolean
  /** Shows the options as a centered dialog (default). Pass false for a bottom sheet. */
  centered?: boolean
  variant?: 'boxed' | 'plain'
  allowClear?: boolean
}

/** Pressable field that opens a searchable option sheet or dialog. Works on iOS, Android, and web. */
export function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
  disabledHint,
  error,
  centered = true,
  variant = 'boxed',
  allowClear,
}: SelectFieldProps) {
  const { colors, scale } = useTheme()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const isPlain = variant === 'plain'
  const filtered = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))

  const openPicker = () => {
    if (disabled) return
    setQuery('')
    setOpen(true)
  }

  const displayPlaceholder = isPlain && disabled && !value && disabledHint ? disabledHint : placeholder

  return (
    <>
      <Touchable
        onPress={openPicker}
        disabled={disabled}
        pressedScale={isPlain ? 1 : 0.975}
        hitSlop={isPlain ? PLAIN_HIT_SLOP : undefined}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        style={
          isPlain
            ? [styles.plainField, disabled && styles.plainDisabled]
            : [styles.field, { borderColor: error ? colors.danger : colors.line, backgroundColor: colors.background }]
        }
      >
        <AppText tone={value ? 'default' : 'soft'} style={styles.value}>{value || displayPlaceholder}</AppText>
        <Icon name="chevronDown" size={isPlain ? 16 : 18} color={colors.inkSoft} />
      </Touchable>
      {!isPlain && disabled && disabledHint ? <AppText variant="small" tone="soft" style={styles.hint}>{disabledHint}</AppText> : null}

      <Modal visible={open} transparent animationType={centered ? 'fade' : 'slide'} onRequestClose={() => setOpen(false)}>
        <View style={centered ? styles.centerWrap : styles.sheetWrap}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View
            style={[
              centered ? styles.dialog : styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: centered ? space[4] : insets.bottom + space[4] },
            ]}
          >
            {!centered && <View style={[styles.grabber, { backgroundColor: colors.line }]} />}
            <View style={styles.sheetHeader}>
              <AppText variant="headline" style={styles.value}>{label}</AppText>
              {allowClear && value ? (
                <Touchable onPress={() => { onChange(''); setOpen(false) }} hitSlop={8} style={styles.clearButton}>
                  <AppText variant="caption" tone="teal" weight="600">Clear</AppText>
                </Touchable>
              ) : null}
            </View>
            {options.length > SEARCH_THRESHOLD && (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor={colors.inkSoft}
                autoComplete="off"
                accessibilityLabel={`Search ${label}`}
                style={[styles.search, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.background, fontSize: typeRamp.body.fontSize * scale }]}
              />
            )}
            {filtered.length === 0 ? (
              <AppText tone="soft" align="center" style={styles.empty}>No matches</AppText>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Touchable
                    onPress={() => { onChange(item); setOpen(false) }}
                    accessibilityRole="button"
                    style={styles.option}
                  >
                    <AppText weight={item === value ? '600' : '400'} tone={item === value ? 'teal' : 'default'} style={styles.value}>{item}</AppText>
                    {item === value && <Icon name="check" size={18} color={colors.teal} />}
                  </Touchable>
                )}
              />
            )}
            <View style={styles.close}>
              <Button label="Close" variant="secondary" onPress={() => setOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], minHeight: touchTarget },
  plainField: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: 32, paddingVertical: 2 },
  plainDisabled: { opacity: 0.6 },
  value: { flex: 1, minWidth: 0 },
  hint: { marginTop: space[1] },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { flex: 1 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[5] },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', borderTopLeftRadius: radius.group, borderTopRightRadius: radius.group, padding: space[4], gap: space[3] },
  dialog: { width: '100%', maxWidth: 360, maxHeight: '70%', borderRadius: radius.group, padding: space[4], gap: space[3] },
  grabber: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  clearButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: space[1] },
  search: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], minHeight: touchTarget },
  empty: { paddingVertical: space[5] },
  option: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: touchTarget, paddingHorizontal: space[2] },
  close: { flexDirection: 'row' },
})
