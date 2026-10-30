import * as Linking from 'expo-linking'
import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'

import type { SettingsFeedback } from '@/components/chat-settings/LocalModelSection'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { Icon } from '@/components/ui/Icon'
import { SettingsLabel } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Touchable } from '@/components/ui/Touchable'
import { GEMINI_MODELS, getModelInfo } from '@/data/ai'
import { useSettings } from '@/providers/SettingsProvider'
import { GeminiError, testGeminiKey } from '@/services/gemini'
import { clearModelCache, fetchAvailableModels, modelLabel, resolveModel } from '@/services/geminiModels'
import { deleteGeminiKey, getGeminiKey, setGeminiKey } from '@/storage/secrets'
import { radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { confirmAction } from '@/utils/dialogs'

const SETUP_STEPS = [
  '1. Tap "Get free API key" below to open Google AI Studio.',
  '2. Sign in with your Google account.',
  '3. Tap "Create API key" and copy it.',
  '4. Come back to GabAI and paste it above, then tap Save.',
]

export function CloudGeminiSection({
  onFeedback,
}: {
  onFeedback: (feedback: SettingsFeedback) => void
}) {
  const { settings, updateSettings } = useSettings()
  const { colors, scale } = useTheme()
  const [apiKey, setApiKey] = useState('')
  const [savedKey, setSavedKey] = useState('')
  const [modelPickerOpen, setModelPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  /** Model ids this API key can reach; null while unknown (never fetched). */
  const [available, setAvailable] = useState<string[] | null>(null)
  const { height: windowHeight } = useWindowDimensions()

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

  useEffect(() => {
    getGeminiKey().then((key) => setSavedKey(key ?? '')).catch(() => setSavedKey(''))
  }, [])

  // Discover which catalog models the saved key can actually call.
  useEffect(() => {
    if (!savedKey) return
    let cancelled = false
    fetchAvailableModels(savedKey).then((models) => {
      if (!cancelled) setAvailable(models)
    })
    return () => { cancelled = true }
  }, [savedKey])

  const saveKey = async () => {
    onFeedback(null)
    const trimmed = apiKey.trim()
    if (!trimmed) {
      onFeedback({ text: 'Paste your API key first.', error: true })
      return
    }
    setBusy(true)
    try {
      await setGeminiKey(trimmed)
      clearModelCache()
      setSavedKey(trimmed)
      setAvailable(null)
      setApiKey('')
      onFeedback({ text: 'API key saved.' })
    } catch {
      onFeedback({ text: 'Unable to save the API key. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const removeKey = async () => {
    onFeedback(null)
    const confirmed = await confirmAction({ title: 'Remove the API key?', message: 'Cloud AI will be unavailable until you add a new key.', confirmLabel: 'Remove', destructive: true })
    if (!confirmed) return
    setBusy(true)
    try {
      await deleteGeminiKey()
      setSavedKey('')
      setAvailable(null)
    } catch {
      onFeedback({ text: 'Unable to remove the API key. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const testConnection = async () => {
    onFeedback(null)
    if (!savedKey) return
    setBusy(true)
    try {
      const resolved = await resolveModel(savedKey, settings.geminiModel)
      await testGeminiKey(savedKey, resolved.model)
      onFeedback({ text: `Connected to Gemini (${resolved.model}).` })
    } catch (error) {
      onFeedback({ text: error instanceof GeminiError ? error.message : 'Unable to reach Gemini. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  return (
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
  )
}

const styles = StyleSheet.create({
  section: { marginTop: space[6] },
  card: { borderRadius: radius.group, padding: space[4] },
  actions: { flexDirection: 'row', marginTop: space[3] },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[3] },
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
