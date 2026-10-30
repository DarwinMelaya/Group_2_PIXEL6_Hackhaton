import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native'

import { AddressField } from '@/components/AddressField'
import { RandomAvatarPreview } from '@/components/AvatarArt'
import { OnboardingIllustration, type OnboardingScene } from '@/components/OnboardingIllustration'
import { ProfileFieldInput } from '@/components/ProfileFieldInput'
import { WelcomeShowcase } from '@/components/WelcomeShowcase'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Icon } from '@/components/ui/Icon'
import { Banner, TextButton } from '@/components/ui/Layout'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import {
  profileGroups,
  type ProfileField,
  type ProfileGroup,
  type ProfileInfo,
} from '@/data/profile'
import { validateField, validateProfile } from '@/data/profileValidation'
import { getProfile, saveProfile } from '@/db/profile'
import { NICKNAME_MAX_LENGTH } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import { radius, space, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

type FeatureSlide = {
  scene: OnboardingScene
  category: string
  title: string
  subtitle: string
  imageLabel: string
}

const FEATURE_SLIDES: readonly FeatureSlide[] = [
  {
    scene: 'disaster',
    category: 'Disaster Preparedness',
    title: 'Be Prepared. Stay Safe.',
    subtitle: 'Practical checklists and local hazard guides ready anytime, even offline.',
    imageLabel:
      'Marinduque Morion responder holding a disaster preparedness checklist with an emergency go-bag, water, and flashlight',
  },
  {
    scene: 'firstAid',
    category: 'First Aid Assistance',
    title: 'Know First Aid. Save Lives.',
    subtitle: 'Clear, step-by-step emergency care guides when every second counts.',
    imageLabel: 'Marinduque Morion responder performing CPR next to a first aid kit',
  },
  {
    scene: 'assistant',
    category: 'Offline AI Assistant',
    title: 'Your Safety Companion, Anytime.',
    subtitle: 'Instant safety and first aid guidance whenever you need it — no internet required.',
    imageLabel: 'Marinduque Morion responder consulting the offline GabAI assistant on a tablet',
  },
]

const WELCOME_STEP = 0
const FEATURE_START_STEP = 1
const FEATURE_END_STEP = FEATURE_START_STEP + FEATURE_SLIDES.length - 1
const IDENTITY_STEP = FEATURE_END_STEP + 1
const PERSONAL_STEP = IDENTITY_STEP + 1
const HEALTH_STEP = PERSONAL_STEP + 1
const TOTAL_STEPS = HEALTH_STEP + 1

const personalGroup = profileGroups.find((group) => group.id === 'personal')!
const healthGroup = profileGroups.find((group) => group.id === 'health')!
const pickFields = (group: ProfileGroup, keys: string[]) =>
  keys.map((key): ProfileField => group.fields.find((field) => field.key === key)!)

/** Personal page: name and phone as text cells, plus one combined Address (barangay + municipality) cell. */
const PERSONAL_TEXT_FIELDS = pickFields(personalGroup, ['name', 'phone'])
const PERSONAL_KEYS = ['name', 'phone', 'municipality', 'barangay']
const HEALTH_FIELDS = healthGroup.fields
const HEALTH_KEYS = HEALTH_FIELDS.map((field) => field.key)

export default function OnboardingScreen() {
  const db = useSQLiteContext()
  const { settings, updateSettings } = useSettings()
  const { colors, scale } = useTheme()
  const [step, setStep] = useState(WELCOME_STEP)
  const [nickname, setNickname] = useState(settings.nickname)
  const [nameFocused, setNameFocused] = useState(false)
  const [draft, setDraft] = useState<ProfileInfo>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const trimmedNickname = nickname.trim()

  const goToStep = (nextStep: number) => {
    Keyboard.dismiss()
    setError('')
    setStep(nextStep)
  }

  const updateField = (key: string, value: string) => {
    const next: ProfileInfo = { ...draft, [key]: value }
    setDraft(next)
    setErrors((current) => {
      const updated = { ...current }
      if (key in updated) {
        const message = validateField(key, value, next)
        if (message) updated[key] = message
        else delete updated[key]
      }
      return updated
    })
  }

  const updateAddress = ({ municipality, barangay }: { municipality: string; barangay: string }) => {
    setDraft((current) => ({ ...current, municipality, barangay }))
    setErrors(({ municipality: _m, barangay: _b, ...rest }) => rest)
  }

  /** Validates `keys`; returns false and highlights fields when any are invalid. */
  const validateKeys = (keys: string[]) => {
    const found = validateProfile(draft, keys)
    if (Object.keys(found).length) {
      setErrors(found)
      setError('Please fix the highlighted fields.')
      return false
    }
    return true
  }

  const nextFromPersonal = () => {
    if (validateKeys(PERSONAL_KEYS)) goToStep(HEALTH_STEP)
  }

  /** Skipping the personal page discards anything typed there, so it isn't saved later. */
  const skipPersonal = () => {
    setDraft(({ name: _n, phone: _p, municipality: _m, barangay: _b, ...rest }) => rest)
    setErrors({})
    goToStep(HEALTH_STEP)
  }

  /** Finishes onboarding, saving the non-empty values of `keys` into the profile. */
  const complete = async (keys: string[]) => {
    if (saving) return
    if (!validateKeys(keys)) return
    setSaving(true)
    setError('')
    try {
      const entries = keys
        .map((key) => [key, draft[key]?.trim() ?? ''] as const)
        .filter(([, value]) => value)
      if (entries.length) {
        const profile = await getProfile(db)
        await saveProfile(db, { ...profile, ...Object.fromEntries(entries) })
      }

      await updateSettings({
        nickname: trimmedNickname,
        avatarPreset: settings.avatarPhoto ? settings.avatarPreset : 'auto',
        onboarded: true,
      })
      router.replace('/')
    } catch {
      setError('Unable to save. Please try again.')
      setSaving(false)
    }
  }

  if (step === WELCOME_STEP) {
    return (
      <WelcomeShowcase
        totalSteps={TOTAL_STEPS}
        onGetStarted={() => goToStep(FEATURE_START_STEP)}
      />
    )
  }

  const activeFeature =
    step >= FEATURE_START_STEP && step <= FEATURE_END_STEP
      ? FEATURE_SLIDES[step - FEATURE_START_STEP]
      : null

  return (
    <Screen topInset bottomSpace={space[6]} contentStyle={styles.screenContent}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {activeFeature && (
          <View style={styles.fullStage}>
            <View style={styles.topRow}>
              <TextButton label="Skip" onPress={() => goToStep(IDENTITY_STEP)} />
            </View>

            <View style={styles.centeredStage}>
              <View style={styles.featureCard}>
                <OnboardingIllustration
                  variant={activeFeature.scene}
                  accessibilityLabel={activeFeature.imageLabel}
                />

                <View style={styles.featureCopy}>
                  <AppText
                    variant="caption"
                    tone="teal"
                    weight="600"
                    align="center"
                    style={styles.featureCategory}
                  >
                    {activeFeature.category}
                  </AppText>
                  <AppText
                    variant="heroTitle"
                    align="center"
                    accessibilityRole="header"
                    style={styles.featureTitle}
                  >
                    {activeFeature.title}
                  </AppText>
                  <AppText tone="soft" align="center" style={styles.featureSubtitle}>
                    {activeFeature.subtitle}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.bottomFooter}>
              <StepDots current={step} total={TOTAL_STEPS} />
              <View style={styles.bottomActions}>
                <Button label="Back" variant="secondary" onPress={() => goToStep(step - 1)} />
                <Button label="Next" onPress={() => goToStep(step + 1)} />
              </View>
            </View>
          </View>
        )}

        {step === IDENTITY_STEP && (
          <View style={styles.fullStage}>
            <View style={styles.topRow} />

            <View style={styles.centeredStage}>
              <View style={styles.identityCard}>
                <RandomAvatarPreview size={104} />

                <AppText
                  variant="heroTitle"
                  align="center"
                  accessibilityRole="header"
                  style={styles.identityTitle}
                >
                  What should we call you?
                </AppText>

                <View
                  style={[
                    styles.nicknameCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: nameFocused ? colors.teal : colors.line,
                    },
                  ]}
                >
                  <TextInput
                    value={nickname}
                    onChangeText={setNickname}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    placeholder="Your nickname"
                    placeholderTextColor={colors.inkSoft}
                    autoCapitalize="words"
                    autoComplete="off"
                    autoCorrect={false}
                    maxLength={NICKNAME_MAX_LENGTH}
                    returnKeyType="next"
                    onSubmitEditing={() => trimmedNickname && goToStep(PERSONAL_STEP)}
                    accessibilityLabel="Your nickname"
                    textAlign="center"
                    style={[
                      styles.nicknameInput,
                      {
                        color: colors.ink,
                        fontSize: typeRamp.bodyStrong.fontSize * scale,
                      },
                    ]}
                  />
                  {nickname.length > 0 && (
                    <Touchable
                      onPress={() => setNickname('')}
                      accessibilityLabel="Clear nickname"
                      hitSlop={10}
                      style={styles.clearButton}
                    >
                      <View style={[styles.clearBadge, { backgroundColor: colors.line }]}>
                        <Icon name="close" size={11} color={colors.inkSoft} />
                      </View>
                    </Touchable>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.bottomFooter}>
              <StepDots current={step} total={TOTAL_STEPS} />
              <View style={styles.bottomActions}>
                <Button
                  label="Back"
                  variant="secondary"
                  onPress={() => goToStep(FEATURE_END_STEP)}
                />
                <Button
                  label="Continue"
                  disabled={!trimmedNickname}
                  onPress={() => goToStep(PERSONAL_STEP)}
                />
              </View>
            </View>
          </View>
        )}

        {(step === PERSONAL_STEP || step === HEALTH_STEP) && (
          <View style={styles.detailsStage}>
            <View>
              <View style={styles.topRow}>
                <TextButton
                  label="Skip"
                  onPress={() =>
                    step === PERSONAL_STEP ? skipPersonal() : complete(PERSONAL_KEYS)
                  }
                />
              </View>

              <View style={styles.detailsTitleWrap}>
                <AppText
                  variant="heroTitle"
                  align="center"
                  accessibilityRole="header"
                >
                  {step === PERSONAL_STEP ? personalGroup.title : healthGroup.title}
                </AppText>
              </View>

              <GroupedCard>
                {(step === PERSONAL_STEP ? PERSONAL_TEXT_FIELDS : HEALTH_FIELDS).map((field) => (
                  <ProfileFieldInput
                    key={field.key}
                    field={field}
                    value={draft[field.key] ?? ''}
                    error={errors[field.key]}
                    onChange={(value) => updateField(field.key, value)}
                  />
                ))}
                {step === PERSONAL_STEP ? (
                  <AddressField
                    municipality={draft.municipality ?? ''}
                    barangay={draft.barangay ?? ''}
                    error={errors.municipality ?? errors.barangay}
                    onChange={updateAddress}
                  />
                ) : null}
              </GroupedCard>

              {error ? <Banner text={error} tone="error" /> : null}
            </View>

            <View style={styles.detailsFooter}>
              <StepDots current={step} total={TOTAL_STEPS} />
              <View style={styles.actions}>
                <Button
                  label="Back"
                  variant="secondary"
                  onPress={() => goToStep(step - 1)}
                />
                {step === PERSONAL_STEP ? (
                  <Button label="Next" onPress={nextFromPersonal} />
                ) : (
                  <Button
                    label="Finish"
                    onPress={() => complete([...PERSONAL_KEYS, ...HEALTH_KEYS])}
                    loading={saving}
                  />
                )}
              </View>
              <View style={styles.privacyRow}>
                <Icon name="shield" size={14} color={colors.inkSoft} />
                <AppText variant="small" tone="soft">
                  Stored only on this device
                </AppText>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  )
}

function StepDots({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme()
  return (
    <View style={styles.dots} accessible accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const active = index === current
        const completed = index < current
        return (
          <View
            key={index}
            style={[
              styles.dot,
              active && styles.dotActive,
              {
                backgroundColor: active || completed ? colors.teal : colors.line,
                opacity: completed ? 0.45 : 1,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  keyboard: {
    flex: 1,
  },
  fullStage: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  topRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  centeredStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: space[4],
  },
  featureCard: {
    width: '100%',
    maxWidth: 356,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    alignItems: 'center',
    marginTop: space[6],
    maxWidth: 320,
  },
  featureCategory: {
    letterSpacing: 0.4,
  },
  featureTitle: {
    marginTop: space[1],
  },
  featureSubtitle: {
    marginTop: space[2],
    maxWidth: 300,
  },
  bottomFooter: {
    width: '100%',
    maxWidth: 356,
    alignSelf: 'center',
    alignItems: 'center',
    gap: space[5],
    paddingTop: space[3],
  },
  bottomActions: {
    width: '100%',
    flexDirection: 'row',
    gap: space[3],
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
  },
  identityCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  identityTitle: {
    marginTop: space[5],
    marginBottom: space[5],
  },
  nicknameCard: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    borderRadius: radius.group,
    borderWidth: 1,
  },
  nicknameInput: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: space[8] + space[2],
    paddingVertical: space[3],
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  clearButton: {
    position: 'absolute',
    right: space[3],
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsStage: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  detailsTitleWrap: {
    alignItems: 'center',
    marginTop: space[3],
    marginBottom: space[6],
  },
  detailsFooter: {
    marginTop: space[6],
    gap: space[4],
  },
  actions: {
    flexDirection: 'row',
    gap: space[3],
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
  },
})
