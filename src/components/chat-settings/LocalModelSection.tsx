import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui/AppText'
import { Button } from '@/components/ui/Button'
import { GroupedCard } from '@/components/ui/GroupedCard'
import { SettingsLabel } from '@/components/ui/Layout'
import { ListRow } from '@/components/ui/ListRow'
import { Touchable } from '@/components/ui/Touchable'
import type { ReplyLength } from '@/db/settings'
import { useSettings } from '@/providers/SettingsProvider'
import {
  getDeviceSpecs,
  localAiCapability,
  OFFLINE_AI_MIN_FREE_GB,
  OFFLINE_AI_RECOMMENDED_RAM_GB,
} from '@/services/deviceSpecs'
import { LOCAL_MODEL, useLocalModel } from '@/services/localModel'
import { radius, space } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { confirmAction } from '@/utils/dialogs'

export type SettingsFeedback = { text: string; error?: boolean } | null

const REPLY_LENGTHS: { value: ReplyLength; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'detailed', label: 'Detailed' },
]

const MODEL_SIZE_GB = '2.8 GB'

export function LocalModelSection({
  onFeedback,
}: {
  onFeedback: (feedback: SettingsFeedback) => void
}) {
  const { settings, updateSettings } = useSettings()
  const { colors } = useTheme()
  const model = useLocalModel()
  const [busy, setBusy] = useState(false)
  const [specs] = useState(getDeviceSpecs)

  const capability = localAiCapability(specs)

  const modelStatusLabel = () => {
    switch (model.status) {
      case 'downloading': return `Downloading ${Math.round(model.progress * 100)}%`
      case 'ready': return 'Ready'
      case 'unsupported': return 'Not available on web'
      default: return `Not downloaded (${MODEL_SIZE_GB})`
    }
  }

  const downloadModel = async () => {
    onFeedback(null)
    const confirmed = await confirmAction({
      title: 'Download Gemma 4 E2B?',
      message: 'This is a 2.8 GB download. Use Wi-Fi and keep GabAI open until it finishes. About 3.5 GB of free space is needed.',
      confirmLabel: 'Download',
    })
    if (!confirmed) return
    await model.download()
  }

  const deleteModel = async () => {
    onFeedback(null)
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

  return (
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
  footnote: { marginTop: space[2], marginHorizontal: space[4] },
})
