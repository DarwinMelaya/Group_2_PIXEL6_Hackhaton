import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native'

import { ProfileFieldInput } from '@/components/ProfileFieldInput'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { IconTile } from '@/components/ui/IconTile'
import { Banner, Note, PageHeader } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { profileGroups, type ProfileField, type ProfileInfo } from '@/data/profile'
import { getProfile, saveProfile } from '@/db/profile'
import { NICKNAME_MAX_LENGTH } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import { space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

const ABOUT_KEYS = ['municipality', 'barangay', 'blood', 'allergies', 'contactName', 'contactPhone']
const aboutFields: ProfileField[] = ABOUT_KEYS.map((key) => profileGroups.flatMap((group) => group.fields).find((field) => field.key === key)!)

export default function OnboardingScreen() {
  const db = useSQLiteContext()
  const { updateSettings } = useSettings()
  const { colors, scale } = useTheme()
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [draft, setDraft] = useState<ProfileInfo>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const trimmedNickname = nickname.trim()

  const updateField = (key: string, value: string) => setDraft((current) => ({
    ...current,
    [key]: value,
    ...(key === 'municipality' && value !== current.municipality ? { barangay: '' } : {}),
  }))

  const complete = async (withDetails: boolean) => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      if (withDetails) {
        const profile = await getProfile(db)
        const merged = { ...profile }
        for (const [key, value] of Object.entries(draft)) {
          const trimmed = value.trim()
          if (trimmed) merged[key] = trimmed
        }
        await saveProfile(db, merged)
      }
      await updateSettings({ nickname: trimmedNickname, onboarded: true })
      router.replace('/')
    } catch {
      setError('Unable to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Screen topInset>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dots} accessibilityLabel={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.dot, { backgroundColor: index <= step ? colors.teal : colors.line }]} />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.welcome}>
            <IconTile icon="shield" tone="teal" />
            <AppText variant="pageTitle" align="center" accessibilityRole="header" style={styles.welcomeTitle}>Welcome to GabAI</AppText>
            <AppText tone="soft" align="center">
              Your offline-first safety companion for Marinduque — disaster guides, first aid steps, and emergency hotlines. Everything works without internet.
            </AppText>
            <View style={styles.singleAction}>
              <Button label="Get started" onPress={() => setStep(1)} />
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <PageHeader title="What should we call you?" subtitle="Used to greet you in the app. Stored only on this device." />
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Your nickname"
              placeholderTextColor={colors.inkSoft}
              autoFocus
              autoCapitalize="words"
              autoComplete="off"
              maxLength={NICKNAME_MAX_LENGTH}
              returnKeyType="next"
              onSubmitEditing={() => trimmedNickname && setStep(2)}
              accessibilityLabel="Nickname"
              style={[styles.nameInput, { color: colors.ink, backgroundColor: colors.surface, fontSize: typeRamp.body.fontSize * scale }]}
            />
            <View style={styles.actions}>
              <Button label="Back" variant="secondary" onPress={() => setStep(0)} />
              <Button label="Continue" disabled={!trimmedNickname} onPress={() => setStep(2)} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <PageHeader title="A few details" subtitle="Helps responders and the app help you. You can skip this and add it later in Profile." />
            <GroupedCard>
              {aboutFields.map((field) => (
                <ProfileFieldInput key={field.key} field={field} value={draft[field.key] ?? ''} onChange={(value) => updateField(field.key, value)} />
              ))}
            </GroupedCard>
            {error ? <Banner text={error} tone="error" /> : null}
            <View style={styles.actions}>
              <Button label="Skip" variant="secondary" onPress={() => complete(false)} />
              <Button label="Finish" onPress={() => complete(true)} loading={saving} />
            </View>
            <Note>Stored only on this device.</Note>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: space[2], marginBottom: space[6] },
  dot: { width: 8, height: 8, borderRadius: 4 },
  welcome: { alignItems: 'center', gap: space[4], paddingTop: space[8] },
  welcomeTitle: { marginTop: space[2] },
  singleAction: { alignSelf: 'stretch', flexDirection: 'row', marginTop: space[4] },
  nameInput: { minHeight: touchTarget, borderRadius: 12, paddingHorizontal: space[4], paddingVertical: 0 },
  actions: { flexDirection: 'row', gap: space[3], marginTop: space[6] },
})
