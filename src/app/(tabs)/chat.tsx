import * as Haptics from 'expo-haptics'
import { router, useFocusEffect } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TokenUsageModal } from '@/components/TokenUsageModal'
import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { MUNICIPALITIES, type ProfileInfo } from '@/data/profile'
import { addMessage, clearMessages, listMessages, type ChatMessage } from '@/db/chat'
import { getProfile } from '@/db/profile'
import { recordTokenUsage } from '@/db/tokenUsage'
import { useSettings } from '@/providers/SettingsProvider'
import { generateReply, type AssistantContext } from '@/services/assistant'
import { captureAttachment, takeStagedAttachment, AttachmentError, type Attachment, type AttachmentSource } from '@/services/attachment'
import { cancelVoiceInput, ensureVoicePermissions, onDeviceVoiceAvailable, speak, startVoiceInput, stopSpeaking, stopVoiceInput, useSpeechRecognitionEvent, voiceInputAvailable, voiceOutputAvailable } from '@/services/voice'
import { deletePhotoFile } from '@/storage/photos'
import { brand, radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { confirmAction } from '@/utils/dialogs'

const GREETING: ChatMessage = { id: 0, role: 'assistant', body: 'Kumusta! I’m GabAI. Ask me about first aid, disaster preparedness, or Marinduque emergency hotlines in English, Tagalog, or Taglish.', createdAt: 0 }
const SUGGESTIONS = ['Ano ang gagawin kapag may lindol?', 'How do I treat a minor burn?', 'What belongs in an emergency kit?', 'Sino ang tatawagan ko sa emergency?']

export default function ChatScreen() {
  const db = useSQLiteContext()
  const { settings, updateSettings } = useSettings()
  const { colors, scale } = useTheme()
  const insets = useSafeAreaInsets()
  const list = useRef<FlatList<ChatMessage>>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [thinking, setThinking] = useState(false)
  const [notice, setNotice] = useState('')
  const [usageOpen, setUsageOpen] = useState(false)
  // 'starting' covers the gap between tapping the mic and the recognizer's
  // 'start' event (permission prompt, Android offline-pack download) so the
  // user gets immediate feedback that capture is being set up.
  const [voiceState, setVoiceState] = useState<'idle' | 'starting' | 'listening'>('idle')
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [speakerAvailable] = useState(() => voiceOutputAvailable())
  // Text already in the composer when dictation started — transcripts append to it.
  const voiceBase = useRef('')
  // Which recognizer the current session is using; a failed 'net' session retries on-device.
  const voiceEngine = useRef<'net' | 'device' | null>(null)

  useEffect(() => {
    listMessages(db).then(setMessages).catch(() => setMessages([]))
  }, [db])

  // Picks up a photo handed over by the Capture tab ("Analyze with GabAI").
  useFocusEffect(useCallback(() => {
    const staged = takeStagedAttachment()
    if (staged) setAttachment(staged)
  }, []))

  // Drop dictation and any spoken reply when the user leaves the tab.
  useFocusEffect(useCallback(() => () => {
    cancelVoiceInput()
    stopSpeaking()
    setSpeakingId(null)
    setVoiceState('idle')
  }, []))

  useSpeechRecognitionEvent('start', () => {
    setVoiceState('listening')
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    AccessibilityInfo.announceForAccessibility('Microphone on — listening')
  })
  useSpeechRecognitionEvent('end', () => {
    // Errors null the engine first, so this only acknowledges a clean stop.
    if (voiceEngine.current) {
      void Haptics.selectionAsync().catch(() => {})
      AccessibilityInfo.announceForAccessibility('Voice input stopped')
    }
    voiceEngine.current = null
    setVoiceState('idle')
  })
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? ''
    const base = voiceBase.current
    setDraft(base ? `${base} ${transcript}` : transcript)
  })
  useSpeechRecognitionEvent('error', (event) => {
    // A network recognizer that can't reach its service retries on-device so
    // voice input still works without internet.
    const retryable = event.error === 'network' || event.error === 'service-not-allowed'
    if (retryable && voiceEngine.current === 'net' && onDeviceVoiceAvailable()) {
      voiceEngine.current = 'device'
      setNotice('No internet — using on-device voice typing.')
      void startVoiceInput({ lang: settings.voiceLanguage, onDevice: true })
      return
    }
    voiceEngine.current = null
    setVoiceState('idle')
    if (event.error === 'aborted' || event.error === 'no-speech' || event.error === 'speech-timeout') return
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
    setNotice(event.error === 'service-not-allowed'
      ? 'Speech recognition is unavailable. Enable a speech recognition service in your phone settings, then try again.'
      : 'Voice input failed. Check the microphone and try again.')
  })

  // Stopping an in-flight ('starting') session cancels it outright; stopping a
  // live one ends it gracefully so the final transcript lands in the draft.
  const stopVoice = () => {
    if (voiceState === 'starting') {
      cancelVoiceInput()
      setVoiceState('idle')
    } else {
      stopVoiceInput()
    }
  }

  const toggleMic = async () => {
    if (voiceState !== 'idle') {
      stopVoice()
      return
    }
    setNotice('')
    if (!voiceInputAvailable()) {
      setNotice('Voice input is unavailable. Update GabAI and check that speech recognition is enabled on your phone, then try again.')
      return
    }
    if (!(await ensureVoicePermissions())) {
      setNotice('Voice input needs microphone and speech permission. Allow them in system settings, then try again.')
      return
    }
    voiceBase.current = draft.trim()
    voiceEngine.current = settings.aiMode === 'local' ? 'device' : 'net'
    setVoiceState('starting')
    try {
      await startVoiceInput({ lang: settings.voiceLanguage, onDevice: voiceEngine.current === 'device' })
    } catch {
      voiceEngine.current = null
      setVoiceState('idle')
      setNotice('Voice input failed to start. Try again.')
    }
  }

  const speechFailed = () => setNotice('Voice playback is unavailable. Install or enable a text-to-speech engine in your phone settings, then try again.')

  const toggleSpeak = (item: ChatMessage) => {
    if (speakingId === item.id) {
      setSpeakingId(null)
      stopSpeaking()
      return
    }
    setSpeakingId(item.id)
    speak(item.body, settings.voiceLanguage, () => setSpeakingId((current) => (current === item.id ? null : current)), speechFailed)
  }

  const attach = async (source: AttachmentSource) => {
    setNotice('')
    try {
      const picked = await captureAttachment(source)
      if (picked) setAttachment(picked)
    } catch (error) {
      setNotice(error instanceof AttachmentError ? error.message : 'Unable to use that photo.')
    }
  }

  const pickAttachment = () => {
    if (Platform.OS === 'web') {
      // No camera picker on web — the file chooser is the only meaningful source.
      void attach('library')
      return
    }
    Alert.alert('Attach a photo', undefined, [
      { text: 'Take a photo', onPress: () => void attach('camera') },
      { text: 'Choose from library', onPress: () => void attach('library') },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const send = async () => {
    const text = draft.trim()
    const photo = attachment ?? undefined
    if ((!text && !photo) || thinking) return
    if (voiceState !== 'idle') cancelVoiceInput()
    setDraft('')
    setAttachment(null)
    setNotice('')
    setThinking(true)
    try {
      // Keep a readable bubble when a photo is sent without a caption.
      const body = text || 'Shared a photo for analysis.'
      const question = await addMessage(db, 'user', body, photo && { fileName: photo.fileName, mimeType: photo.mimeType })
      setMessages((current) => [...current, question])
      // Saved profile grounds hotline answers: the address picks the municipality,
      // the emergency contact answers "who is my emergency contact". Profile reads
      // are cheap, so fetch per send to pick up edits made mid-chat.
      const profile = await getProfile(db).catch((): ProfileInfo => ({}))
      const municipality = MUNICIPALITIES.find((m) => m === profile.municipality)
      const context: AssistantContext | undefined = municipality || profile.contactPhone
        ? {
            municipality,
            barangay: municipality ? profile.barangay || undefined : undefined,
            emergencyContact: profile.contactPhone
              ? { name: profile.contactName || 'Emergency contact', phone: profile.contactPhone, relationship: profile.relationship || undefined }
              : undefined,
          }
        : undefined
      const reply = await generateReply(
        text,
        messages,
        settings,
        photo && { mimeType: photo.mimeType, data: photo.base64 },
        context,
      )
      setNotice(reply.notice ?? '')
      // A resolved substitute is a better choice than a broken manual one; keep it.
      // Skipped for 'auto' — it should keep re-resolving on every message.
      if (reply.model && settings.geminiModel !== 'auto' && reply.model !== settings.geminiModel) {
        void updateSettings({ geminiModel: reply.model })
      }
      if (reply.usage) await recordTokenUsage(db, reply.usage.source, reply.usage).catch(() => {})
      const answer = await addMessage(db, 'assistant', reply.text)
      setMessages((current) => [...current, answer])
      if (settings.voiceReplies && speakerAvailable) {
        setSpeakingId(answer.id)
        speak(reply.text, settings.voiceLanguage, () => setSpeakingId((current) => (current === answer.id ? null : current)), speechFailed)
      }
    } catch {
      // Keep the typed text so a failed send does not eat the user's message.
      setDraft(text)
      setNotice('Something went wrong sending that. Please try again.')
    } finally {
      setThinking(false)
    }
  }

  const deleteChat = async () => {
    if (thinking) return
    const confirmed = await confirmAction({
      title: 'Delete this chat?',
      message: 'All messages in this conversation will be removed. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!confirmed) return
    for (const message of messages) {
      if (message.photo) deletePhotoFile(message.photo.fileName)
    }
    await clearMessages(db)
    setMessages([])
    setNotice('')
  }

  const data = [GREETING, ...messages]
  const canSend = Boolean(draft.trim() || attachment) && !thinking

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Touchable onPress={() => setUsageOpen(true)} accessibilityLabel="Token usage" style={styles.topAction}>
          <Icon name="chart" size={20} color={colors.ink} />
        </Touchable>
        <Touchable onPress={deleteChat} accessibilityLabel="Delete chat" style={styles.topAction}>
          <Icon name="trash" size={20} color={colors.danger} />
        </Touchable>
        <Touchable onPress={() => router.push('/chat-settings')} accessibilityLabel="Chat settings" style={styles.topAction}>
          <Icon name="settings" size={20} color={colors.ink} />
        </Touchable>
      </View>
      <FlatList
        ref={list}
        style={styles.fill}
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        onLayout={() => list.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <View style={styles.intro}>
            <View style={[styles.orb, { backgroundColor: colors.tealSoft }]}><Icon name="shield" size={27} color={colors.teal} /></View>
            <AppText variant="pageTitle" align="center" style={styles.introTitle}>GabAI Assistant</AppText>
            <AppText variant="caption" tone="soft" align="center">Answers grounded in verified safety guides</AppText>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.role === 'user'
          return (
            <View style={[styles.bubble, mine ? [styles.mine, { backgroundColor: brand.primary }] : [styles.theirs, { backgroundColor: colors.surface }]]}>
              {item.photo ? (
                <Image
                  source={{ uri: item.photo.uri }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                  accessibilityLabel="Photo you attached"
                />
              ) : null}
              <AppText style={mine ? { color: brand.onPrimary } : undefined}>{item.body}</AppText>
              {!mine && speakerAvailable ? (
                <Touchable
                  onPress={() => toggleSpeak(item)}
                  accessibilityLabel={speakingId === item.id ? 'Stop reading reply' : 'Read reply aloud'}
                  hitSlop={8}
                  style={styles.speakButton}
                >
                  <Icon name="speaker" size={15} color={speakingId === item.id ? colors.teal : colors.inkSoft} />
                </Touchable>
              ) : null}
            </View>
          )
        }}
        ListFooterComponent={
          thinking ? (
            <View style={[styles.bubble, styles.theirs, { backgroundColor: colors.surface }]}><AppText tone="soft">GabAI is thinking…</AppText></View>
          ) : messages.length === 0 ? (
            <View style={styles.suggestions}>
              <AppText variant="eyebrow" tone="soft" style={styles.suggestionsLabel}>Try asking</AppText>
              {SUGGESTIONS.map((prompt) => (
                <Touchable key={prompt} onPress={() => setDraft(prompt)} style={[styles.prompt, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                  <AppText variant="caption" style={styles.fill}>{prompt}</AppText>
                  <Icon name="chevron" size={16} color={colors.inkSoft} />
                </Touchable>
              ))}
            </View>
          ) : undefined
        }
      />
      {notice ? <AppText variant="small" tone="soft" align="center" style={styles.notice}>{notice}</AppText> : null}
      {attachment && (
        <View style={[styles.pendingRow, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Image source={{ uri: attachment.uri }} style={styles.pendingThumb} />
          <AppText variant="caption" tone="soft" style={styles.fill}>Photo attached — add a note or just send it</AppText>
          <Touchable onPress={() => { deletePhotoFile(attachment.fileName); setAttachment(null) }} accessibilityLabel="Remove attached photo" style={styles.topAction}>
            <Icon name="close" size={18} color={colors.inkSoft} />
          </Touchable>
        </View>
      )}
      <View style={[styles.composer, { backgroundColor: voiceState !== 'idle' ? colors.dangerSoft : colors.surface, borderColor: voiceState !== 'idle' ? colors.danger : colors.line }]}>
        <Touchable onPress={pickAttachment} disabled={thinking} accessibilityLabel="Attach a photo" style={styles.attachAction}>
          <Icon name="paperclip" size={20} color={thinking ? colors.inkSoft : colors.ink} />
        </Touchable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={voiceState === 'listening' ? 'Listening — speak now…' : attachment ? 'Add context for the photo…' : 'Ask GabAI…'}
          placeholderTextColor={voiceState === 'listening' ? colors.danger : colors.inkSoft}
          accessibilityLabel="Message GabAI"
          returnKeyType="send"
          onSubmitEditing={send}
          submitBehavior="submit"
          maxLength={500}
          style={[styles.input, { color: colors.ink, fontSize: typeRamp.body.fontSize * scale }]}
        />
        <Touchable
          onPress={toggleMic}
          disabled={thinking}
          accessibilityLabel={voiceState === 'listening' ? 'Stop voice input' : voiceState === 'starting' ? 'Starting microphone' : 'Voice input'}
          accessibilityState={{ selected: voiceState !== 'idle', busy: voiceState === 'starting' }}
          style={[styles.mic, voiceState === 'listening' && { backgroundColor: brand.emergency }, voiceState === 'starting' && { backgroundColor: colors.dangerSoft }]}
        >
          {voiceState === 'starting' ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Icon name={voiceState === 'listening' ? 'stop' : 'mic'} size={19} color={voiceState === 'listening' ? brand.onPrimary : thinking ? colors.inkSoft : colors.ink} />
          )}
        </Touchable>
        <Touchable onPress={send} disabled={!canSend} accessibilityLabel="Send message" style={[styles.send, { opacity: canSend ? 1 : 0.5 }]}>
          <Icon name="send" size={19} color={brand.onPrimary} />
        </Touchable>
      </View>
      <TokenUsageModal visible={usageOpen} onClose={() => setUsageOpen(false)} />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space[4] },
  topAction: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  attachAction: { width: 40, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: space[5], paddingTop: space[2], paddingBottom: space[4], gap: space[3] },
  intro: { alignItems: 'center', marginBottom: space[4] },
  orb: { width: 56, height: 56, borderRadius: radius.group, alignItems: 'center', justifyContent: 'center', marginBottom: space[4] },
  introTitle: { marginBottom: space[1] },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: space[3], borderRadius: radius.group },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 5 },
  attachmentImage: { width: 220, height: 160, borderRadius: radius.md, marginBottom: space[2] },
  pendingRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: space[4], marginBottom: space[2], borderWidth: 1, borderRadius: radius.md, padding: space[2], gap: space[3] },
  pendingThumb: { width: 44, height: 44, borderRadius: radius.sm },
  suggestions: { marginTop: space[2] },
  suggestionsLabel: { marginBottom: space[2] },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderRadius: radius.md, paddingHorizontal: space[4], paddingVertical: space[3], minHeight: touchTarget, marginBottom: space[2] },
  notice: { marginHorizontal: space[5], marginBottom: space[2] },
  composer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: space[4], marginBottom: space[3], paddingLeft: space[1], paddingRight: 6, minHeight: 56, borderWidth: 1, borderRadius: 15 },
  input: { flex: 1, minWidth: 0, paddingVertical: space[2] },
  mic: { width: touchTarget, height: touchTarget, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  speakButton: { alignSelf: 'flex-end', marginTop: space[1], padding: 2 },
  send: { width: touchTarget, height: touchTarget, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.primary },
})
