import { router } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TokenUsageModal } from '@/components/TokenUsageModal'
import { AppText } from '@/components/ui/AppText'
import { Icon } from '@/components/ui/Icon'
import { Touchable } from '@/components/ui/Touchable'
import { addMessage, clearMessages, listMessages, type ChatMessage } from '@/db/chat'
import { recordTokenUsage } from '@/db/tokenUsage'
import { useSettings } from '@/providers/SettingsProvider'
import { generateReply } from '@/services/assistant'
import { brand, radius, space, touchTarget, typeRamp } from '@/theme/tokens'
import { useTheme } from '@/theme/useTheme'
import { confirmAction } from '@/utils/dialogs'

const GREETING: ChatMessage = { id: 0, role: 'assistant', body: 'Kumusta! I’m GabAI. Ask me about first aid or disaster preparedness in English, Tagalog, or Taglish.', createdAt: 0 }
const SUGGESTIONS = ['Ano ang gagawin kapag may lindol?', 'How do I treat a minor burn?', 'What belongs in an emergency kit?']

export default function ChatScreen() {
  const db = useSQLiteContext()
  const { settings } = useSettings()
  const { colors, scale } = useTheme()
  const insets = useSafeAreaInsets()
  const list = useRef<FlatList<ChatMessage>>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [notice, setNotice] = useState('')
  const [usageOpen, setUsageOpen] = useState(false)

  useEffect(() => {
    listMessages(db).then(setMessages).catch(() => setMessages([]))
  }, [db])

  const send = async () => {
    const text = draft.trim()
    if (!text || thinking) return
    setDraft('')
    setNotice('')
    setThinking(true)
    try {
      const question = await addMessage(db, 'user', text)
      setMessages((current) => [...current, question])
      const reply = await generateReply(text, messages, settings)
      setNotice(reply.notice ?? '')
      if (reply.usage) await recordTokenUsage(db, reply.usage.source, reply.usage).catch(() => {})
      const answer = await addMessage(db, 'assistant', reply.text)
      setMessages((current) => [...current, answer])
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
    await clearMessages(db)
    setMessages([])
    setNotice('')
  }

  const data = [GREETING, ...messages]

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + touchTarget}>
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
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.intro}>
            <View style={styles.orb}><Icon name="shield" size={31} color={brand.onPrimary} /></View>
            <AppText variant="pageTitle" align="center" style={styles.introTitle}>GabAI Assistant</AppText>
            <AppText variant="caption" tone="soft" align="center">Answers grounded in verified safety guides</AppText>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.role === 'user'
          return (
            <View style={[styles.bubble, mine ? [styles.mine, { backgroundColor: brand.primary }] : [styles.theirs, { backgroundColor: colors.surface }]]}>
              <AppText style={mine ? { color: brand.onPrimary } : undefined}>{item.body}</AppText>
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
      <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask GabAI…"
          placeholderTextColor={colors.inkSoft}
          accessibilityLabel="Message GabAI"
          returnKeyType="send"
          onSubmitEditing={send}
          submitBehavior="submit"
          maxLength={500}
          style={[styles.input, { color: colors.ink, fontSize: typeRamp.body.fontSize * scale }]}
        />
        <Touchable onPress={send} disabled={!draft.trim() || thinking} accessibilityLabel="Send message" style={[styles.send, { opacity: draft.trim() && !thinking ? 1 : 0.5 }]}>
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
  list: { paddingHorizontal: space[5], paddingTop: space[2], paddingBottom: space[4], gap: space[3] },
  intro: { alignItems: 'center', marginBottom: space[4] },
  orb: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.primary, marginBottom: space[3] },
  introTitle: { marginBottom: space[1] },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: space[3], borderRadius: radius.group },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 5 },
  suggestions: { marginTop: space[2] },
  suggestionsLabel: { marginBottom: space[2] },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: space[2], borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space[3], minHeight: touchTarget, marginBottom: space[2] },
  notice: { marginHorizontal: space[5], marginBottom: space[2] },
  composer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: space[4], marginBottom: space[3], paddingLeft: space[3], paddingRight: 6, minHeight: 56, borderWidth: 1, borderRadius: 15 },
  input: { flex: 1, minWidth: 0, paddingVertical: space[2] },
  send: { width: touchTarget, height: touchTarget, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.primary },
})
