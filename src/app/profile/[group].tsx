import { useLocalSearchParams } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { BackButton, Banner, Note, PageHeader, TextButton } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { MUNICIPALITIES, PROFILE_VALUE_MAX_LENGTH, getProfileGroup, type ProfileField, type ProfileInfo } from '@/data/profile'
import { getProfile, saveProfile } from '@/db/profile'
import { brand, radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

export default function ProfileGroupScreen() {
  const { group: groupId } = useLocalSearchParams<{ group: string }>()
  const group = getProfileGroup(groupId)
  const db = useSQLiteContext()
  const [profile, setProfile] = useState<ProfileInfo>({})
  const [draft, setDraft] = useState<ProfileInfo>({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProfile(db).then(setProfile).catch(() => setError('Unable to load your profile.'))
  }, [db])

  if (!group) {
    return (
      <Screen topInset>
        <BackButton label="Profile" />
        <PageHeader title="Section not found" />
      </Screen>
    )
  }

  const startEditing = () => { setDraft(profile); setEditing(true) }
  const updateField = (key: string, value: string) => setDraft((current) => ({
    ...current,
    [key]: value,
    ...(key === 'municipality' && value !== current.municipality ? { barangay: '' } : {}),
  }))
  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await saveProfile(db, draft)
      setProfile(Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value)))
      setEditing(false)
    } catch {
      setError('Unable to save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen topInset>
      <BackButton label="Profile" />
      <PageHeader title={group.title} subtitle={group.description} action={!editing ? <TextButton label="Edit" onPress={startEditing} /> : undefined} />
      <GroupedCard>
        {group.fields.map((field) => (
          <FieldRow key={field.key} field={field} editing={editing} value={(editing ? draft : profile)[field.key] ?? ''} onChange={(value) => updateField(field.key, value)} />
        ))}
      </GroupedCard>
      {error ? <Banner text={error} tone="error" /> : null}
      {editing && (
        <View style={styles.actions}>
          <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
          <Button label="Done" onPress={save} loading={saving} />
        </View>
      )}
      <Note>Stored only on this device. Avoid entering information you are not comfortable keeping on this phone.</Note>
    </Screen>
  )
}

function FieldRow({ field, editing, value, onChange }: { field: ProfileField; editing: boolean; value: string; onChange: (value: string) => void }) {
  const { colors, scale } = useTheme()
  if (!editing) {
    return (
      <View style={styles.row}>
        <AppText style={styles.label}>{field.label}</AppText>
        <AppText variant={value ? 'body' : 'caption'} tone={value ? 'default' : 'soft'} align="right" style={styles.value}>{value || 'Not added'}</AppText>
      </View>
    )
  }
  return (
    <View style={[styles.row, styles.editingRow]}>
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
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space[4], minHeight: 54, paddingHorizontal: space[4], paddingVertical: space[3] },
  editingRow: { flexDirection: 'column', alignItems: 'stretch', gap: space[1] },
  label: { flexShrink: 1 },
  value: { flexShrink: 1 },
  input: { minHeight: touchTarget, paddingVertical: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], paddingVertical: space[2] },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space[3], minHeight: 36, justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: space[3], marginTop: space[6] },
})
