import { StyleSheet, TextInput, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Touchable } from '@/components/ui/Touchable'
import { MUNICIPALITIES, PROFILE_VALUE_MAX_LENGTH, type ProfileField } from '@/data/profile'
import { brand, radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

/** Editing row for a profile field: municipality chip radio group or a text input. */
export function ProfileFieldInput({ field, value, onChange }: { field: ProfileField; value: string; onChange: (value: string) => void }) {
  const { colors, scale } = useTheme()
  return (
    <View style={styles.row}>
      <AppText variant="small" tone="soft">{field.label}</AppText>
      {field.input === 'municipality' ? (
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={field.label}>
          {MUNICIPALITIES.map((name) => {
            const selected = value === name
            return (
              <Touchable
                key={name}
                onPress={() => onChange(name)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.chip, { borderColor: selected ? brand.primary : colors.line, backgroundColor: selected ? brand.primary : 'transparent' }]}
              >
                <AppText variant="caption" weight="600" style={selected ? { color: brand.onPrimary } : undefined}>{name}</AppText>
              </Touchable>
            )
          })}
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder ?? 'Add information'}
          placeholderTextColor={colors.inkSoft}
          keyboardType={field.keyboardType}
          autoComplete="off"
          maxLength={PROFILE_VALUE_MAX_LENGTH}
          accessibilityLabel={field.label}
          style={[styles.input, { color: colors.ink, fontSize: typeRamp.body.fontSize * scale }]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: space[1], minHeight: 54, paddingHorizontal: space[4], paddingVertical: space[3] },
  input: { minHeight: touchTarget, paddingVertical: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], paddingVertical: space[2] },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space[3], minHeight: 36, justifyContent: 'center' },
})
