import { useState, type ComponentRef, type RefObject } from 'react'
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
  variant?: 'boxed' | 'plain'
  inputRef?: RefObject<ComponentRef<typeof TextInput> | null>
}

/** ISO date entry: free typing with auto-dashes plus a calendar picker. */
export function DateField({ label, value, onChange, error, variant = 'boxed', inputRef }: DateFieldProps) {
  const { colors, scale } = useTheme()
  const [open, setOpen] = useState(false)
  const isPlain = variant === 'plain'
  return (
    <View style={styles.row}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(formatDateInput(text))}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.inkSoft}
        keyboardType="number-pad"
        maxLength={10}
        autoComplete="off"
        accessibilityLabel={label}
        style={
          isPlain
            ? [styles.plainInput, { color: colors.ink, fontSize: typeRamp.body.fontSize * scale }]
            : [styles.input, { color: colors.ink, borderColor: error ? colors.danger : colors.line, backgroundColor: colors.background, fontSize: typeRamp.body.fontSize * scale }]
        }
      />
      <Touchable
        onPress={() => setOpen(true)}
        hitSlop={isPlain ? 8 : undefined}
        accessibilityLabel="Open calendar"
        style={isPlain ? styles.plainIconButton : [styles.iconButton, { borderColor: error ? colors.danger : colors.line }]}
      >
        <Icon name="calendar" size={isPlain ? 18 : 20} color={isPlain ? colors.teal : colors.ink} />
      </Touchable>
      <CalendarModal visible={open} value={value} onSelect={onChange} onClose={() => setOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], minHeight: touchTarget },
  plainInput: { flex: 1, minHeight: 32, paddingVertical: 2 },
  iconButton: { width: touchTarget, height: touchTarget, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  plainIconButton: { width: 32, height: 32, alignItems: 'flex-end', justifyContent: 'center' },
})
