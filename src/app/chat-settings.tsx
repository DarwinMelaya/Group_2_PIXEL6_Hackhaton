import * as Linking from 'expo-linking'
import { useEffect, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Icon, type IconName } from '@/components/ui/Icon'
import { BackButton, Banner, PageHeader, SettingsLabel } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { GEMINI_MODELS } from '@/data/ai'
import type { AiMode, ReplyLength } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import { GeminiError, testGeminiKey } from '@/services/gemini'
import { LOCAL_MODEL, useLocalModel } from '@/services/localModel'
import { deleteGeminiKey, getGeminiKey, setGeminiKey } from '@/storage/secrets'
import { radius, space, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { confirmAction } from '@/utils/dialogs'

type Feedback = { text: string; error?: boolean } | null

const AI_MODES: { value: AiMode; label: string; detail: string; icon: IconName }[] = [
  { value: 'local', label: 'Local AI', detail: 'Gemma 4 E2B on your phone. Works offline.', icon: 'shield' },
  { value: 'cloud', label: 'Cloud AI', detail: 'Google Gemini. Needs internet.', icon: 'chat' },
]

const REPLY_LENGTHS: { value: ReplyLength; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'detailed', label: 'Detailed' },
]

const SETUP_STEPS = [
  '1. Tap "Get free API key" below to open Google AI Studio.',
  '2. Sign in with your Google account.',
  '3. Tap "Create API key" and copy it.',
  '4. Come back to GabAI and paste it above, then tap Save.',
]

const MODEL_SIZE_GB = '2.8 GB'

export default function ChatSettingsScreen() {
  const { settings, updateSettings } = useSettings()
  const { colors, scale } = useTheme()
  const model = useLocalModel()
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getGeminiKey().then((key) => setSavedKey(key ?? '')).catch(() => setSavedKey(''))
  }, [])

  const modelStatusLabel = () => {
    switch (model.status) {
      case 'downloading': return `Downloading ${Math.round(model.progress * 100)}%`
      case 'ready': return 'Ready'
      case 'unsupported': return 'Not available on web'
      default: return `Not downloaded (${MODEL_SIZE_GB})`
    }
  }

  const downloadModel = async () => {
    setFeedback(null)
    const confirmed = await confirmAction({
      title: 'Download Gemma 4 E2B?',
      message: 'This is a 2.8 GB download. Use Wi-Fi and keep GabAI open until it finishes. About 3.5 GB of free space is needed.',
      confirmLabel: 'Download',
    })
    if (!confirmed) return
    await model.download()
  }

  const deleteModel = async () => {
    setFeedback(null)
    const confirmed = await confirmAction({
      title: 'Delete the AI model?',
      message: 'You can download it again later. GabAI will answer from the built-in guides until then.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!confirmed) return
    setBusy(true)
    try {
      await model.remove()
    } finally {
      setBusy(false)
    }
  }

  const saveKey = async () => {
    setFeedback(null)
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setFeedback({ text: 'Paste your API key first.', error: true })
      return
    }
    setBusy(true)
    try {
      await setGeminiKey(trimmed)
      setSavedKey(trimmed)
      setApiKey('')
      setFeedback({ text: 'API key saved.' })
    } catch {
      setFeedback({ text: 'Unable to save the API key. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const removeKey = async () => {
    setFeedback(null)
    const confirmed = await confirmAction({ title: 'Remove the API key?', message: 'Cloud AI will be unavailable until you add a new key.', confirmLabel: 'Remove', destructive: true })
    if (!confirmed) return
    setBusy(true)
    try {
      await deleteGeminiKey()
      setSavedKey('')
    } catch {
      setFeedback({ text: 'Unable to remove the API key. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const testConnection = async () => {
    setFeedback(null)
    if (!savedKey) return
    setBusy(true)
    try {
      await testGeminiKey(savedKey, settings.geminiModel)
      setFeedback({ text: 'Connected to Gemini.' })
    } catch (error) {
      setFeedback({ text: error instanceof GeminiError ? error.message : 'Unable to reach Gemini. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen topInset>
      <BackButton />
      <PageHeader title="Chatbot settings" subtitle="Control how GabAI Assistant handles your conversations." />

      <View style={styles.section}>
        <SettingsLabel>AI mode</SettingsLabel>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.modeRow} accessibilityRole="radiogroup" accessibilityLabel="AI mode">
            {AI_MODES.map((option) => {
              const selected = settings.aiMode === option.value
              return (
                <Touchable
                  key={option.value}
                  onPress={() => updateSettings({ aiMode: option.value })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${option.label} AI mode`}
                  style={[styles.modeOption, { borderColor: selected ? colors.teal : colors.line, backgroundColor: selected ? colors.tealSoft : 'transparent' }]}
                >
                  <View style={styles.modeHeader}>
                    <Icon name={option.icon} size={18} color={colors.ink} />
                    <AppText weight="600">{option.label}</AppText>
                    {selected && <Icon name="check" size={16} color={colors.teal} />}
                  </View>
                  <AppText variant="small" tone="soft">{option.detail}</AppText>
                </Touchable>
              )
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SettingsLabel>{`Local AI · ${LOCAL_MODEL.name}`}</SettingsLabel>
        <GroupedCard>
          <ListRow title={modelStatusLabel()} subtitle={model.error} leading="download" />
        </GroupedCard>
        {model.status === 'downloading' && (
          <View style={[styles.progressTrack, { backgroundColor: colors.line }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.teal, width: `${Math.round(model.progress * 100)}%` }]} />
          </View>
        )}
        <View style={styles.actions}>
          {model.status === 'downloading' ? (
            <Button label="Cancel" variant="secondary" onPress={model.cancel} />
          ) : model.status === 'ready' ? (
            <Button label="Delete model" variant="destructive" loading={busy} onPress={deleteModel} />
          ) : model.status === 'missing' ? (
            <Button label={`Download (${MODEL_SIZE_GB})`} icon="download" onPress={downloadModel} />
          ) : null}
        </View>
        <View style={[styles.card, styles.replyLength, { backgroundColor: colors.surface }]}>
          <AppText>Reply length</AppText>
          <View style={[styles.segmented, { backgroundColor: colors.background }]} accessibilityRole="radiogroup" accessibilityLabel="Reply length">
            {REPLY_LENGTHS.map((option) => {
              const selected = settings.localReplyLength === option.value
              return (
                <Touchable
                  key={option.value}
                  onPress={() => updateSettings({ localReplyLength: option.value })}
                  pressedScale={1}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.segment, selected && [styles.segmentSelected, { backgroundColor: colors.surface }]]}
                >
                  <AppText variant="small" tone={selected ? 'teal' : 'default'} weight={selected ? '600' : '400'}>{option.label}</AppText>
                </Touchable>
              )
            })}
          </View>
        </View>
        <AppText variant="small" tone="soft" style={styles.footnote}>Runs entirely on this device. Nothing you type leaves your phone. Without the model, GabAI answers from the built-in safety guides.</AppText>
      </View>

      <View style={styles.section}>
        <SettingsLabel>Cloud AI · Google Gemini</SettingsLabel>
        {savedKey ? (
          <GroupedCard>
            <ListRow title="API key saved" subtitle={`•••• ${savedKey.slice(-4)}`} leading="check" />
            <ListRow title="Remove API key" subtitle="Delete the saved Gemini key" leading="trash" destructive onPress={removeKey} />
          </GroupedCard>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Paste your Gemini API key"
              placeholderTextColor={colors.inkSoft}
              accessibilityLabel="Gemini API key"
              style={[styles.input, { color: colors.ink, borderColor: colors.line, fontSize: typeRamp.body.fontSize * scale }]}
            />
            <View style={styles.actions}>
              <Button label="Save" loading={busy} onPress={saveKey} />
            </View>
          </View>
        )}
        <View style={[styles.card, styles.models, { backgroundColor: colors.surface }]} accessibilityRole="radiogroup" accessibilityLabel="Gemini model">
          {GEMINI_MODELS.map((option) => {
            const selected = settings.geminiModel === option.id
            return (
              <Touchable
                key={option.id}
                onPress={() => updateSettings({ geminiModel: option.id })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={styles.modelRow}
              >
                <View style={styles.modelBody}>
                  <AppText weight="500">{option.label}</AppText>
                  <AppText variant="small" tone="soft">{option.detail}</AppText>
                </View>
                {selected && <Icon name="check" size={18} color={colors.teal} />}
              </Touchable>
            )
          })}
        </View>
        <View style={styles.actions}>
          <Button label="Test connection" variant="secondary" disabled={!savedKey} loading={busy} onPress={testConnection} />
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AppText weight="600" style={styles.guideTitle}>Get a free Gemini API key</AppText>
          {SETUP_STEPS.map((step) => (
            <AppText key={step} variant="caption" tone="soft" style={styles.guideStep}>{step}</AppText>
          ))}
          <View style={styles.actions}>
            <Button label="Get free API key" variant="secondary" onPress={() => Linking.openURL('https://aistudio.google.com/apikey')} />
          </View>
        </View>
        <AppText variant="small" tone="soft" style={styles.footnote}>The free tier has daily limits. When Cloud AI is on, your messages are sent to Google to generate replies. Avoid sharing personal health details. If the cloud is unavailable, GabAI answers offline.</AppText>
      </View>

      <View style={styles.section}>
        <SettingsLabel>Language</SettingsLabel>
        <GroupedCard>
          <ListRow title="English, Tagalog & Taglish" subtitle="GabAI understands all three automatically. No setup needed." leading="check" />
        </GroupedCard>
      </View>

      {feedback && <Banner text={feedback.text} tone={feedback.error ? 'error' : 'info'} />}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { marginTop: space[6] },
  card: { borderRadius: radius.group, padding: space[4] },
  modeRow: { flexDirection: 'row', gap: space[2] },
  modeOption: { flex: 1, gap: space[2], padding: space[3], borderWidth: 1, borderRadius: radius.group },
  modeHeader: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  progressTrack: { height: 6, borderRadius: 3, marginTop: space[3], marginHorizontal: space[1], overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row', marginTop: space[3] },
  replyLength: { marginTop: space[3], gap: space[3] },
  segmented: { flexDirection: 'row', gap: space[1], padding: space[1], borderRadius: radius.md },
  segment: { flex: 1, minHeight: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[3] },
  models: { marginTop: space[3], padding: space[1] },
  modelRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3] },
  modelBody: { flex: 1, minWidth: 0 },
  guideTitle: { marginBottom: space[2] },
  guideStep: { marginBottom: space[1] },
  footnote: { marginTop: space[2], marginHorizontal: space[4] },
})
