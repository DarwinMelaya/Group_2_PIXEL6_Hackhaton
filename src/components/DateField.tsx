import { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { CalendarModal } from '@/components/CalendarModal'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { formatDateInput } from '@/data/profileValidation'
import { radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

type DateFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: boolean
}

/** ISO date entry: free typing with auto-dashes plus a calendar picker. */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const { colors, scale } = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(formatDateInput(text))}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.inkSoft}
        keyboardType="number-pad"
        maxLength={10}
        autoComplete="off"
        accessibilityLabel={label}
        style={[styles.input, { color: colors.ink, borderColor: error ? colors.danger : colors.line, backgroundColor: colors.background, fontSize: typeRamp.body.fontSize * scale }]}
      />
      <Touchable onPress={() => setOpen(true)} accessibilityLabel="Open calendar" style={[styles.iconButton, { borderColor: error ? colors.danger : colors.line }]}>
        <Icon name="calendar" size={20} color={colors.ink} />
      </Touchable>
      <CalendarModal visible={open} value={value} onSelect={onChange} onClose={() => setOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2] },
  input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], minHeight: touchTarget },
  iconButton: { width: touchTarget, height: touchTarget, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
})
