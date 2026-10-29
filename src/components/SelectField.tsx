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

type SelectFieldProps = {
  label: string
  value: string
  placeholder: string
  options: readonly string[]
  onChange: (value: string) => void
  disabled?: boolean
  disabledHint?: string
  error?: boolean
}

/** Pressable field that opens a searchable option sheet. Works on iOS, Android, and web. */
export function SelectField({ label, value, placeholder, options, onChange, disabled, disabledHint, error }: SelectFieldProps) {
  const { colors, scale } = useTheme()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))

  const openPicker = () => {
    if (disabled) return
    setQuery('')
    setOpen(true)
  }

  return (
    <>
      <Touchable
        onPress={openPicker}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityRole="button"
        style={[styles.field, { borderColor: error ? colors.danger : colors.line, backgroundColor: colors.background }]}
      >
        <AppText tone={value ? 'default' : 'soft'} style={styles.value}>{value || placeholder}</AppText>
        <Icon name="chevronDown" size={18} color={colors.inkSoft} />
      </Touchable>
      {disabled && disabledHint ? <AppText variant="small" tone="soft" style={styles.hint}>{disabledHint}</AppText> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + space[4] }]}>
          <AppText variant="headline" style={styles.title}>{label}</AppText>
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
                  <AppText style={styles.value}>{item}</AppText>
                  {item === value && <Icon name="check" size={18} color={colors.teal} />}
                </Touchable>
              )}
            />
          )}
          <View style={styles.close}>
            <Button label="Close" variant="secondary" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], minHeight: touchTarget },
  value: { flex: 1, minWidth: 0 },
  hint: { marginTop: space[1] },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', borderTopLeftRadius: radius.group, borderTopRightRadius: radius.group, padding: space[4], gap: space[3] },
  title: { marginTop: space[1] },
  search: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], minHeight: touchTarget },
  empty: { paddingVertical: space[5] },
  option: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: touchTarget, paddingHorizontal: space[2] },
  close: { flexDirection: 'row' },
})
