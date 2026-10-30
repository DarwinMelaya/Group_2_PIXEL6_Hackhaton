import { StyleSheet, View } from 'react-native'

import { SelectField } from '@/components/SelectField'
import { AppText } from '@/components/ui/AppText'
import { BARANGAYS } from '@/data/barangays'
import { MUNICIPALITIES, type Municipality } from '@/data/profile'
import { space } from '@/theme/tokens'

type Address = { municipality: string; barangay: string }

const formatAddress = (barangay: string, municipality: string) => `${barangay}, ${municipality}`

/** Every barangay on the island as "Barangay, Municipality", mapped back to its parts. */
const ADDRESS_OPTIONS = new Map<string, Address>(
  MUNICIPALITIES.flatMap((municipality) =>
    BARANGAYS[municipality as Municipality].map(
      (barangay) => [formatAddress(barangay, municipality), { municipality, barangay }] as const,
    ),
  ),
)
const ADDRESS_LABELS = [...ADDRESS_OPTIONS.keys()]

type AddressFieldProps = {
  municipality: string
  barangay: string
  onChange: (address: Address) => void
  error?: string
}

/**
 * Single "Address" cell (iOS inset grouped style) that picks a barangay and its
 * municipality in one searchable sheet. Stores the same `municipality`/`barangay`
 * profile keys used for local emergency hotlines.
 */
export function AddressField({ municipality, barangay, onChange, error }: AddressFieldProps) {
  const value = barangay && municipality ? formatAddress(barangay, municipality) : municipality

  return (
    <View style={styles.row}>
      <AppText variant="small" weight="500" tone={error ? 'danger' : 'soft'}>
        Address
      </AppText>
      <SelectField
        label="Address"
        value={value}
        placeholder="Search your barangay"
        options={ADDRESS_LABELS}
        onChange={(label) =>
          onChange(ADDRESS_OPTIONS.get(label) ?? { municipality: '', barangay: '' })
        }
        error={!!error}
        variant="plain"
        allowClear
      />
      {error ? (
        <AppText variant="small" tone="danger" accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: 2, minHeight: 58, paddingHorizontal: space[4], paddingVertical: 10 },
  error: { marginTop: 2 },
})
