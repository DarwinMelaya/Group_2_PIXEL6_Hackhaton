import { useLocalSearchParams } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { BackButton, Banner, Note, PageHeader, TextButton } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { ProfileFieldInput } from '@/components/ProfileFieldInput'
import { getProfileGroup, type ProfileField, type ProfileInfo } from '@/data/profile'
import { getProfile, saveProfile } from '@/db/profile'
import { space } from '@/theme/tokens'

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
  if (!editing) {
    return (
      <View style={styles.row}>
        <AppText style={styles.label}>{field.label}</AppText>
        <AppText variant={value ? 'body' : 'caption'} tone={value ? 'default' : 'soft'} align="right" style={styles.value}>{value || 'Not added'}</AppText>
      </View>
    )
  }
  return <ProfileFieldInput field={field} value={value} onChange={onChange} />
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space[4], minHeight: 54, paddingHorizontal: space[4], paddingVertical: space[3] },
  label: { flexShrink: 1 },
  value: { flexShrink: 1 },
  actions: { flexDirection: 'row', gap: space[3], marginTop: space[6] },
})
