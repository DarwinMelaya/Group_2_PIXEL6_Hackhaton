import { StyleSheet, TextInput, View } from 'react-native'

import { DateField } from '@/components/DateField'
import { SelectField } from '@/components/SelectField'
import { AppText } from '@/components/ui/AppText'
import { BLOOD_TYPES, MUNICIPALITIES, PROFILE_VALUE_MAX_LENGTH, type ProfileField } from '@/data/profile'
import { radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

type ProfileFieldInputProps = {
  field: ProfileField
  value: string
  onChange: (value: string) => void
  options?: readonly string[]
  error?: string
}

/** Editing row for a profile field: select sheet, date field, or text input. */
export function ProfileFieldInput({ field, value, onChange, options, error }: ProfileFieldInputProps) {
  const { colors, scale } = useTheme()
  const labelTone = error ? 'danger' : 'soft'
  return (
    <View style={styles.row}>
      <AppText variant="small" tone={labelTone}>{field.label}</AppText>
      {field.input === 'municipality' || field.input === 'bloodType' ? (
        <SelectField
          label={field.label}
          value={value}
          placeholder={field.placeholder ?? 'Choose'}
          options={field.input === 'municipality' ? MUNICIPALITIES : BLOOD_TYPES}
          onChange={onChange}
          error={!!error}
        />
      ) : field.input === 'barangay' ? (
        <SelectField
          label={field.label}
          value={value}
          placeholder={field.placeholder ?? 'Choose'}
          options={options ?? []}
          onChange={onChange}
          disabled={!options?.length}
          disabledHint="Choose a municipality first"
          error={!!error}
        />
      ) : field.input === 'date' ? (
        <DateField label={field.label} value={value} onChange={onChange} error={!!error} />
      ) : (
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder ?? 'Add information'}
          placeholderTextColor={colors.inkSoft}
          keyboardType={field.input === 'phone' ? 'phone-pad' : field.keyboardType}
          autoComplete="off"
          maxLength={PROFILE_VALUE_MAX_LENGTH}
          accessibilityLabel={field.label}
          style={[styles.input, { color: colors.ink, fontSize: typeRamp.body.fontSize * scale }, error && { borderColor: colors.danger, borderWidth: 1, paddingHorizontal: space[3] }]}
        />
      )}
      {error ? <AppText variant="small" tone="danger" accessibilityLiveRegion="polite" style={styles.error}>{error}</AppText> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: space[1], minHeight: 54, paddingHorizontal: space[4], paddingVertical: space[3] },
  input: { minHeight: touchTarget, paddingVertical: 0, borderRadius: radius.md },
  error: { marginTop: space[1] },
})
