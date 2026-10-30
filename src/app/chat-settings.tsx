import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { CloudGeminiSection } from '@/components/chat-settings/CloudGeminiSection'
import { CustomBackendSection } from '@/components/chat-settings/CustomBackendSection'
import { LocalModelSection, type SettingsFeedback } from '@/components/chat-settings/LocalModelSection'
import { SelectField } from '@/components/SelectField'
import { AppText } from '@/components/ui/AppText'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { BackButton, Banner, PageHeader, SettingsLabel } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Screen } from '@/components/ui/Screen'
import type { AiMode } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import { space } from '@/theme/tokens'

const AI_MODES: { value: AiMode; label: string; detail: string }[] = [
  { value: 'local', label: 'Local AI', detail: 'Gemma 4 E2B on your phone. Works offline.' },
  { value: 'cloud', label: 'Cloud AI', detail: 'Google Gemini. Needs internet.' },
  { value: 'custom', label: 'Custom backend', detail: 'Your own OpenAI-compatible server (Ollama, LM Studio, llama.cpp…).' },
]

export default function ChatSettingsScreen() {
  const { settings, updateSettings } = useSettings()
  const [feedback, setFeedback] = useState<SettingsFeedback>(null)

  const selectedMode = AI_MODES.find((option) => option.value === settings.aiMode) ?? AI_MODES[0]

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
  footnote: { marginTop: space[2], marginHorizontal: space[4] },
})
