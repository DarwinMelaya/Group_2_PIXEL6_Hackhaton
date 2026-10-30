import * as Linking from 'expo-linking'
import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { SelectField } from '@/components/SelectField'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Icon } from '@/components/ui/Icon'
import { BackButton, Banner, PageHeader, SettingsLabel } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Screen } from '@/components/ui/Screen'
import { Touchable } from '@/components/ui/Touchable'
import { GEMINI_MODELS, getModelInfo } from '@/data/ai'
import type { AiMode, ReplyLength } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import { getDeviceSpecs, localAiCapability, OFFLINE_AI_MIN_FREE_GB, OFFLINE_AI_RECOMMENDED_RAM_GB } from '@/services/deviceSpecs'
import { BackendError, testBackend } from '@/services/customBackend'
import { GeminiError, testGeminiKey } from '@/services/gemini'
import { clearModelCache, fetchAvailableModels, modelLabel, resolveModel } from '@/services/geminiModels'
import { LOCAL_MODEL, useLocalModel } from '@/services/localModel'
import { deleteBackendToken, deleteGeminiKey, getBackendToken, getGeminiKey, setBackendToken, setGeminiKey } from '@/storage/secrets'
import { radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { confirmAction } from '@/utils/dialogs'

type Feedback = { text: string; error?: boolean } | null

const AI_MODES: { value: AiMode; label: string; detail: string }[] = [
  { value: 'local', label: 'Local AI', detail: 'Gemma 4 E2B on your phone. Works offline.' },
  { value: 'cloud', label: 'Cloud AI', detail: 'Google Gemini. Needs internet.' },
  { value: 'custom', label: 'Custom backend', detail: 'Your own OpenAI-compatible server (Ollama, LM Studio, llama.cpp…).' },
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
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl)
  const [backendModel, setBackendModel] = useState(settings.backendModel)
  const [backendToken, setBackendTokenDraft] = useState('')
  const [savedToken, setSavedToken] = useState('')
  const [modelPickerOpen, setModelPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [specs] = useState(getDeviceSpecs)
  /** Model ids this API key can reach; null while unknown (never fetched). */
  const [available, setAvailable] = useState<string[] | null>(null)

  const selectedMode = AI_MODES.find((option) => option.value === settings.aiMode) ?? AI_MODES[0]
  const capability = localAiCapability(specs)
  const selectedModelLabel = settings.geminiModel === 'auto'
    ? (available?.length ? `Automatic · ${modelLabel(available[0])}` : 'Automatic')
    : modelLabel(settings.geminiModel)

  // The popup lists every model the key can call, not just the curated catalog.
  // Catalog entries the key cannot reach stay visible but disabled.
  const pickerModels = useMemo(() => {
    if (available === null) {
      return GEMINI_MODELS.map((option) => ({ id: option.id, label: option.label, detail: option.detail, unavailable: false }))
    }
    const rows = available.map((id) => {
      const info = getModelInfo(id)
      return { id, label: info?.label ?? modelLabel(id), detail: info?.detail ?? 'Available on your API key', unavailable: false }
    })
    for (const option of GEMINI_MODELS) {
      if (!available.includes(option.id)) {
        rows.push({ id: option.id, label: option.label, detail: 'Not available on this API key', unavailable: true })
      }
    }
    return rows
  }, [available])
  const { height: windowHeight } = useWindowDimensions()

  useEffect(() => {
    getGeminiKey().then((key) => setSavedKey(key ?? '')).catch(() => setSavedKey(''))
    getBackendToken().then((token) => setSavedToken(token ?? '')).catch(() => setSavedToken(''))
  }, [])

  // Discover which catalog models the saved key can actually call.
  useEffect(() => {
    if (settings.aiMode !== 'cloud' || !savedKey) return
    let cancelled = false
    fetchAvailableModels(savedKey).then((models) => {
      if (!cancelled) setAvailable(models)
    })
    return () => { cancelled = true }
  }, [savedKey, settings.aiMode])

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
      clearModelCache()
      setSavedKey(trimmed)
      setAvailable(null)
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
      setAvailable(null)
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
      const resolved = await resolveModel(savedKey, settings.geminiModel)
      await testGeminiKey(savedKey, resolved.model)
      setFeedback({ text: `Connected to Gemini (${resolved.model}).` })
    } catch (error) {
      setFeedback({ text: error instanceof GeminiError ? error.message : 'Unable to reach Gemini. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const saveBackend = async () => {
    setFeedback(null)
    const url = backendUrl.trim()
    const modelName = backendModel.trim()
    if (!url || !modelName) {
      setFeedback({ text: 'Enter both the server URL and the model name.', error: true })
      return
    }
    setBusy(true)
    try {
      await updateSettings({ backendUrl: url, backendModel: modelName })
      const token = backendToken.trim()
      if (token) {
        await setBackendToken(token)
        setSavedToken(token)
        setBackendTokenDraft('')
      }
      setFeedback({ text: 'Backend saved.' })
    } catch {
      setFeedback({ text: 'Unable to save the backend settings. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const removeBackendToken = async () => {
    setFeedback(null)
    const confirmed = await confirmAction({ title: 'Remove the bearer token?', message: 'The backend will be called without a token.', confirmLabel: 'Remove', destructive: true })
    if (!confirmed) return
    setBusy(true)
    try {
      await deleteBackendToken()
      setSavedToken('')
    } catch {
      setFeedback({ text: 'Unable to remove the token. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const testBackendConnection = async () => {
    setFeedback(null)
    if (!settings.backendUrl || !settings.backendModel) {
      setFeedback({ text: 'Save the backend settings first.', error: true })
      return
    }
    setBusy(true)
    try {
      await testBackend(settings.backendUrl, settings.backendModel, await getBackendToken().catch(() => null))
      setFeedback({ text: `Connected — ${settings.backendModel} answered.` })
    } catch (error) {
      setFeedback({ text: error instanceof BackendError ? error.message : 'Unable to reach the backend. Please try again.', error: true })
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
        <SelectField
          centered
          label="AI mode"
          value={selectedMode.label}
          placeholder="Choose AI mode"
          options={AI_MODES.map((option) => option.label)}
          onChange={(label) => {
            const option = AI_MODES.find((item) => item.label === label)
            if (!option || option.value === settings.aiMode) return
            void updateSettings({ aiMode: option.value })
          }}
        />
        <AppText variant="small" tone="soft" style={styles.footnote}>{selectedMode.detail}</AppText>
      </View>

      {settings.aiMode === 'local' && (
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
          <View style={styles.deviceCard}>
            <GroupedCard>
              <ListRow title={specs.device ?? 'This device'} subtitle={`${specs.os}${specs.cpu ? ` · ${specs.cpu}` : ''}`} leading="system" />
              <ListRow
                title="Memory"
                subtitle={specs.memoryGb !== null ? `${specs.memoryGb} GB RAM · ${OFFLINE_AI_RECOMMENDED_RAM_GB} GB+ recommended` : 'Unavailable'}
                leading="shield"
              />
              <ListRow
                title="Storage"
                subtitle={specs.freeGb !== null ? `${specs.freeGb} GB free · ${OFFLINE_AI_MIN_FREE_GB} GB needed` : 'Unavailable'}
                leading="download"
              />
              <ListRow
                title={capability.title}
                subtitle={capability.message}
                leading={capability.level === 'ready' ? 'check' : 'shield'}
                destructive={capability.level === 'insufficient'}
              />
            </GroupedCard>
          </View>
          <View style={[styles.card, styles.replyLength, { backgroundColor: colors.surface }]}>
            <AppText align="center">Reply length</AppText>
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
      )}

      {settings.aiMode === 'cloud' && (
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
          <View style={styles.fieldWrap}>
            <Touchable
              onPress={() => setModelPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Gemini model"
              style={[styles.field, { borderColor: colors.line, backgroundColor: colors.background }]}
            >
              <AppText style={styles.fieldValue}>{selectedModelLabel}</AppText>
              <Icon name="chevronDown" size={18} color={colors.inkSoft} />
            </Touchable>
          </View>

          <Modal visible={modelPickerOpen} transparent animationType="fade" onRequestClose={() => setModelPickerOpen(false)}>
            <View style={styles.modalCenter}>
              <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={() => setModelPickerOpen(false)} />
              <View style={[styles.popup, { backgroundColor: colors.surface }]} accessibilityRole="radiogroup" accessibilityLabel="Gemini model" accessibilityViewIsModal>
                <AppText variant="sheetTitle" accessibilityRole="header" style={styles.popupTitle}>Gemini model</AppText>
              <Touchable
                onPress={() => { void updateSettings({ geminiModel: 'auto' }); setModelPickerOpen(false) }}
                accessibilityRole="radio"
                accessibilityState={{ selected: settings.geminiModel === 'auto' }}
                style={styles.modelRow}
              >
                <View style={styles.checkSlot} />
                <View style={styles.modelBody}>
                  <AppText weight="500" align="center">Automatic</AppText>
                  <AppText variant="small" tone="soft" align="center">
                    {available && available.length > 0
                      ? `Using ${modelLabel(available[0])}`
                      : 'Picks the best model your key allows'}
                  </AppText>
                </View>
                <View style={styles.checkSlot}>{settings.geminiModel === 'auto' && <Icon name="check" size={18} color={colors.teal} />}</View>
              </Touchable>
              <ScrollView style={[styles.modelList, { maxHeight: windowHeight * 0.5 }]} keyboardShouldPersistTaps="handled">
              {pickerModels.map((option) => {
                const selected = settings.geminiModel === option.id
                return (
                  <Touchable
                    key={option.id}
                    onPress={() => { void updateSettings({ geminiModel: option.id }); setModelPickerOpen(false) }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: option.unavailable }}
                    disabled={option.unavailable}
                    style={[styles.modelRow, option.unavailable && styles.modelUnavailable]}
                  >
                    <View style={styles.checkSlot} />
                    <View style={styles.modelBody}>
                      <AppText weight="500" align="center" tone={option.unavailable ? 'soft' : 'default'}>{option.label}</AppText>
                      <AppText variant="small" tone="soft" align="center">{option.detail}</AppText>
                    </View>
                    <View style={styles.checkSlot}>{selected && <Icon name="check" size={18} color={colors.teal} />}</View>
                  </Touchable>
                )
              })}
              </ScrollView>
              <View style={styles.popupClose}>
                <Button label="Close" variant="secondary" onPress={() => setModelPickerOpen(false)} />
              </View>
              </View>
            </View>
          </Modal>
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
      )}

      {settings.aiMode === 'custom' && (
        <View style={styles.section}>
          <SettingsLabel>Custom backend · OpenAI-compatible</SettingsLabel>
          {savedToken ? (
            <GroupedCard>
              <ListRow title="Bearer token saved" subtitle={`•••• ${savedToken.slice(-4)}`} leading="check" />
              <ListRow title="Remove bearer token" subtitle="Delete the saved token" leading="trash" destructive onPress={removeBackendToken} />
            </GroupedCard>
          ) : null}
          <View style={[styles.card, styles.backendCard, { backgroundColor: colors.surface }]}>
            <TextInput
              value={backendUrl}
              onChangeText={setBackendUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="Server URL, e.g. http://192.168.1.5:11434"
              placeholderTextColor={colors.inkSoft}
              accessibilityLabel="Backend server URL"
              style={[styles.input, { color: colors.ink, borderColor: colors.line, fontSize: typeRamp.body.fontSize * scale }]}
            />
            <TextInput
              value={backendModel}
              onChangeText={setBackendModel}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Model name, e.g. gemma3:4b"
              placeholderTextColor={colors.inkSoft}
              accessibilityLabel="Backend model name"
              style={[styles.input, { color: colors.ink, borderColor: colors.line, fontSize: typeRamp.body.fontSize * scale }]}
            />
            <TextInput
              value={backendToken}
              onChangeText={setBackendTokenDraft}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={savedToken ? 'New bearer token (blank keeps saved one)' : 'Bearer token (optional)'}
              placeholderTextColor={colors.inkSoft}
              accessibilityLabel="Backend bearer token"
              style={[styles.input, { color: colors.ink, borderColor: colors.line, fontSize: typeRamp.body.fontSize * scale }]}
            />
            <View style={styles.actions}>
              <Button label="Save" loading={busy} onPress={saveBackend} />
            </View>
          </View>
          <View style={styles.actions}>
            <Button label="Test connection" variant="secondary" disabled={!settings.backendUrl || !settings.backendModel} loading={busy} onPress={testBackendConnection} />
          </View>
          <AppText variant="small" tone="soft" style={styles.footnote}>Works with OpenAI-compatible servers — Ollama, LM Studio, llama.cpp, vLLM. GabAI posts to /v1/chat/completions on your URL; enter the base address or a path ending in /v1. Photos are sent only when the backend supports vision. If it is unreachable, GabAI answers offline.</AppText>
        </View>
      )}

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
  progressTrack: { height: 6, borderRadius: 3, marginTop: space[3], marginHorizontal: space[1], overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row', marginTop: space[3] },
  deviceCard: { marginTop: space[3] },
  replyLength: { marginTop: space[3], gap: space[3] },
  segmented: { flexDirection: 'row', gap: space[1], padding: space[1], borderRadius: radius.md },
  segment: { flex: 1, minHeight: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[3] },
  backendCard: { marginTop: space[3], gap: space[3] },
  fieldWrap: { marginTop: space[3] },
  field: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], minHeight: touchTarget },
  fieldValue: { flex: 1, minWidth: 0 },
  modalCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[5] },
  popup: { width: '100%', maxWidth: 320, borderRadius: radius.lg, padding: space[5], gap: space[2] },
  popupTitle: { marginBottom: space[2] },
  popupClose: { flexDirection: 'row', marginTop: space[2] },
  modelList: { flexGrow: 0 },
  modelRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3] },
  modelBody: { flex: 1, minWidth: 0, alignItems: 'center' },
  modelUnavailable: { opacity: 0.45 },
  checkSlot: { width: 18, alignItems: 'center' },
  guideTitle: { marginBottom: space[2] },
  guideStep: { marginBottom: space[1] },
  footnote: { marginTop: space[2], marginHorizontal: space[4] },
})
