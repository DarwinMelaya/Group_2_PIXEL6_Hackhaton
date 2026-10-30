import { useEffect, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import type { SettingsFeedback } from '@/components/chat-settings/LocalModelSection'
import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { SettingsLabel } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { useSettings } from '@/providers/SettingsProvider'
import { BackendError, testBackend } from '@/services/customBackend'
import { deleteBackendToken, getBackendToken, setBackendToken } from '@/storage/secrets'
import { radius, space, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { confirmAction } from '@/utils/dialogs'

export function CustomBackendSection({
  onFeedback,
}: {
  onFeedback: (feedback: SettingsFeedback) => void
}) {
  const { settings, updateSettings } = useSettings()
  const { colors, scale } = useTheme()
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl)
  const [backendModel, setBackendModel] = useState(settings.backendModel)
  const [backendToken, setBackendTokenDraft] = useState('')
  const [savedToken, setSavedToken] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getBackendToken().then((token) => setSavedToken(token ?? '')).catch(() => setSavedToken(''))
  }, [])

  const saveBackend = async () => {
    onFeedback(null)
    const url = backendUrl.trim()
    const modelName = backendModel.trim()
    if (!url || !modelName) {
      onFeedback({ text: 'Enter both the server URL and the model name.', error: true })
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
      onFeedback({ text: 'Backend saved.' })
    } catch {
      onFeedback({ text: 'Unable to save the backend settings. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const removeBackendToken = async () => {
    onFeedback(null)
    const confirmed = await confirmAction({ title: 'Remove the bearer token?', message: 'The backend will be called without a token.', confirmLabel: 'Remove', destructive: true })
    if (!confirmed) return
    setBusy(true)
    try {
      await deleteBackendToken()
      setSavedToken('')
    } catch {
      onFeedback({ text: 'Unable to remove the token. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const testBackendConnection = async () => {
    onFeedback(null)
    if (!settings.backendUrl || !settings.backendModel) {
      onFeedback({ text: 'Save the backend settings first.', error: true })
      return
    }
    setBusy(true)
    try {
      await testBackend(settings.backendUrl, settings.backendModel, await getBackendToken().catch(() => null))
      onFeedback({ text: `Connected — ${settings.backendModel} answered.` })
    } catch (error) {
      onFeedback({ text: error instanceof BackendError ? error.message : 'Unable to reach the backend. Please try again.', error: true })
    } finally {
      setBusy(false)
    }
  }

  return (
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
  )
}

const styles = StyleSheet.create({
  section: { marginTop: space[6] },
  card: { borderRadius: radius.group, padding: space[4] },
  backendCard: { marginTop: space[3], gap: space[3] },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[3] },
  actions: { flexDirection: 'row', marginTop: space[3] },
  footnote: { marginTop: space[2], marginHorizontal: space[4] },
})
