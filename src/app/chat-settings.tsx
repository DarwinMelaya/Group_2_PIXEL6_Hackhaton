import { useState } from 'react'
import { StyleSheet, Switch, View } from 'react-native'

import { CloudGeminiSection } from '@/components/chat-settings/CloudGeminiSection'
import { CustomBackendSection } from '@/components/chat-settings/CustomBackendSection'
import { LocalModelSection, type SettingsFeedback } from '@/components/chat-settings/LocalModelSection'
import { SelectField } from '@/components/SelectField'
import { AppText } from '@/components/ui/AppText'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { BackButton, Banner, PageHeader, SettingsLabel } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Screen } from '@/components/ui/Screen'
import type { AiMode, VoiceLanguage } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import { space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'

const AI_MODES: { value: AiMode; label: string; detail: string }[] = [
  { value: 'local', label: 'Local AI', detail: 'Gemma 4 E2B on your phone. Works offline.' },
  { value: 'cloud', label: 'Cloud AI', detail: 'Google Gemini. Needs internet.' },
  { value: 'custom', label: 'Custom backend', detail: 'Your own OpenAI-compatible server (Ollama, LM Studio, llama.cpp…).' },
]

const VOICE_LANGUAGES: { value: VoiceLanguage; label: string }[] = [
  { value: 'fil-PH', label: 'Filipino' },
  { value: 'en-US', label: 'English (US)' },
]

export default function ChatSettingsScreen() {
  const { settings, updateSettings } = useSettings()
  const { colors } = useTheme()
  const [feedback, setFeedback] = useState<SettingsFeedback>(null)

  const selectedMode = AI_MODES.find((option) => option.value === settings.aiMode) ?? AI_MODES[0]
  const selectedVoiceLanguage = VOICE_LANGUAGES.find((option) => option.value === settings.voiceLanguage) ?? VOICE_LANGUAGES[0]

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

      {settings.aiMode === 'local' && <LocalModelSection onFeedback={setFeedback} />}
      {settings.aiMode === 'cloud' && <CloudGeminiSection onFeedback={setFeedback} />}
      {settings.aiMode === 'custom' && <CustomBackendSection onFeedback={setFeedback} />}

      <View style={styles.section}>
        <SettingsLabel>Voice</SettingsLabel>
        <GroupedCard>
          <ListRow
            title="Read replies aloud"
            subtitle="Speaks each new GabAI reply"
            leading="speaker"
            trailing={<View pointerEvents="none"><Switch value={settings.voiceReplies} trackColor={{ true: colors.teal }} /></View>}
            onPress={() => void updateSettings({ voiceReplies: !settings.voiceReplies })}
          />
        </GroupedCard>
        <View style={styles.voiceField}>
          <SelectField
            centered
            label="Voice language"
            value={selectedVoiceLanguage.label}
            placeholder="Choose voice language"
            options={VOICE_LANGUAGES.map((option) => option.label)}
            onChange={(label) => {
              const option = VOICE_LANGUAGES.find((item) => item.label === label)
              if (option) void updateSettings({ voiceLanguage: option.value })
            }}
          />
        </View>
        <AppText variant="small" tone="soft" style={styles.footnote}>Voice typing uses your phone’s speech recognizer. In Local AI mode it stays on-device, so it works without internet on supported phones.</AppText>
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
  voiceField: { marginTop: space[3] },
  footnote: { marginTop: space[2], marginHorizontal: space[4] },
})
