import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native'

import { ProfileFieldInput } from '@/components/ProfileFieldInput'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Banner, Note, PageHeader } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { BARANGAYS } from '@/data/barangays'
import { profileGroups, type Municipality, type ProfileField, type ProfileInfo } from '@/data/profile'
import { validateField, validateProfile } from '@/data/profileValidation'
import { getProfile, saveProfile } from '@/db/profile'
import { NICKNAME_MAX_LENGTH } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import { radius, space, touchTarget, typeRamp } from '@/theme/tokens'
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const trimmedNickname = nickname.trim()

  const updateField = (key: string, value: string) => {
    const next: ProfileInfo = {
      ...draft,
      [key]: value,
      ...(key === 'municipality' && value !== draft.municipality ? { barangay: '' } : {}),
    }
    setDraft(next)
    setErrors((current) => {
      const updated = { ...current }
      const revalidate = (name: string) => {
        const message = validateField(name, next[name] ?? '', next)
        if (message) updated[name] = message
        else delete updated[name]
      }
      if (key in updated) revalidate(key)
      if (key === 'municipality') delete updated.barangay
      if (key === 'phone' && 'contactPhone' in updated) revalidate('contactPhone')
      return updated
    })
  }

  const complete = async (withDetails: boolean) => {
    if (saving) return
    if (withDetails) {
      const found = validateProfile(draft, ABOUT_KEYS)
      if (Object.keys(found).length) {
        setErrors(found)
        setError('Please fix the highlighted fields.')
        return
      }
    }
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
    <Screen topInset contentStyle={step === 0 ? styles.welcomeScreen : undefined}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.dots, step === 0 && styles.centeredDots]} accessibilityLabel={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.dot, { backgroundColor: index <= step ? colors.teal : colors.line }]} />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.welcome}>
            <View style={styles.illustrations}>
              <Image source={require('../../assets/onboarding/prepare.png')} accessibilityLabel="A family preparing an emergency go bag" style={[styles.heroImage, { backgroundColor: colors.surface }]} resizeMode="cover" />
              <View style={styles.supportingImages}>
                <Image source={require('../../assets/onboarding/evacuate.png')} accessibilityLabel="A family moving safely to an evacuation shelter" style={[styles.supportingImage, { backgroundColor: colors.surface }]} resizeMode="cover" />
                <Image source={require('../../assets/onboarding/community.png')} accessibilityLabel="Neighbors planning together for emergencies" style={[styles.supportingImage, { backgroundColor: colors.surface }]} resizeMode="cover" />
              </View>
            </View>
            <AppText variant="eyebrow" tone="teal" align="center">Prepare. Stay safe. Help each other.</AppText>
            <AppText variant="pageTitle" align="center" accessibilityRole="header" style={styles.welcomeTitle}>Welcome to GabAI</AppText>
            <AppText tone="soft" align="center" style={styles.welcomeIntro}>
              Be ready for emergencies. Safety guides, first aid, and hotlines—even offline.
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
                <ProfileFieldInput key={field.key} field={field} value={draft[field.key] ?? ''} error={errors[field.key]} options={field.key === 'barangay' ? BARANGAYS[draft.municipality as Municipality] : undefined} onChange={(value) => updateField(field.key, value)} />
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
  welcomeScreen: { flexGrow: 1, justifyContent: 'center' },
  centeredDots: { justifyContent: 'center' },
  welcome: { alignItems: 'center', gap: space[4], width: '100%', maxWidth: 480, alignSelf: 'center' },
  illustrations: { flexDirection: 'row', gap: space[3], width: '100%', aspectRatio: 1.3, maxHeight: 320, marginBottom: space[2] },
  heroImage: { flex: 1.35, height: '100%', borderRadius: radius.lg },
  supportingImages: { flex: 1, gap: space[3] },
  supportingImage: { flex: 1, width: '100%', borderRadius: radius.group },
  welcomeTitle: { width: '100%' },
  welcomeIntro: { maxWidth: 340 },
  singleAction: { alignSelf: 'stretch', flexDirection: 'row', marginTop: space[4] },
  nameInput: { minHeight: touchTarget, borderRadius: 12, paddingHorizontal: space[4], paddingVertical: 0 },
  actions: { flexDirection: 'row', gap: space[3], marginTop: space[6] },
})
