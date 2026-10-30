import type { ExpoSpeechRecognitionNativeEventMap } from 'expo-speech-recognition'
import { useEffect, useEffectEvent } from 'react'
import { Platform } from 'react-native'

import type { VoiceLanguage } from '@/db/settings'
import { speech as Speech } from '@/services/speech'
import { speechRecognition } from '@/services/speechRecognition'

type SpeechRecognitionEvents = {
  [K in keyof ExpoSpeechRecognitionNativeEventMap]: (event: ExpoSpeechRecognitionNativeEventMap[K]) => void
}

/** Subscribe only when the installed app includes speech recognition. */
export function useSpeechRecognitionEvent<K extends keyof ExpoSpeechRecognitionNativeEventMap>(
  eventName: K,
  listener: SpeechRecognitionEvents[K],
) {
  const onEvent = useEffectEvent(listener)

  useEffect(() => {
    const subscription = speechRecognition?.addListener(eventName, ((event) => onEvent(event)) as SpeechRecognitionEvents[K])
    return () => subscription?.remove()
  }, [eventName])
}

/** Whether any speech recognizer exists on this device/browser. Checked once at screen mount. */
export function voiceInputAvailable(): boolean {
  try {
    return speechRecognition?.isRecognitionAvailable() ?? false
  } catch {
    return false
  }
}

/** Whether speech can be recognized fully on-device — the only mode that works offline. */
export function onDeviceVoiceAvailable(): boolean {
  try {
    return speechRecognition?.supportsOnDeviceRecognition() ?? false
  } catch {
    return false
  }
}

export async function ensureVoicePermissions(): Promise<boolean> {
  try {
    const result = await speechRecognition?.requestPermissionsAsync()
    return result?.granted ?? false
  } catch {
    return false
  }
}

/**
 * Android needs a downloaded offline pack per locale for on-device recognition;
 * trigger the system download silently when the pack is missing.
 */
async function ensureOfflineVoicePack(lang: VoiceLanguage) {
  if (Platform.OS !== 'android' || !speechRecognition) return
  try {
    const { installedLocales } = await speechRecognition.getSupportedLocales({
      androidRecognitionServicePackage: 'com.google.android.as',
    })
    if (!installedLocales.some((locale) => locale.toLowerCase() === lang.toLowerCase())) {
      await speechRecognition.androidTriggerOfflineModelDownload({ locale: lang }).catch(() => {})
    }
  } catch {}
}

/**
 * Starts dictation; transcripts arrive via `useSpeechRecognitionEvent` in the
 * chat screen. `onDevice` keeps audio on the phone (works offline) when the OS
 * supports it — otherwise it falls back to the regular network recognizer.
 */
export async function startVoiceInput({ lang, onDevice }: { lang: VoiceLanguage; onDevice: boolean }) {
  if (!speechRecognition) throw new Error('Voice input requires a development build with speech recognition enabled.')
  const deviceOnly = onDevice && onDeviceVoiceAvailable()
  if (deviceOnly) await ensureOfflineVoicePack(lang)
  speechRecognition.start({
    lang,
    interimResults: true,
    maxAlternatives: 1,
    continuous: false,
    requiresOnDeviceRecognition: deviceOnly,
    addsPunctuation: true,
    iosTaskHint: 'dictation',
    ...(deviceOnly ? { androidIntentOptions: { EXTRA_PREFER_OFFLINE: true } } : {}),
  })
}

/** Stops listening and delivers the final transcript. */
export function stopVoiceInput() {
  speechRecognition?.stop()
}

/** Abandons the session — no transcript is delivered. */
export function cancelVoiceInput() {
  speechRecognition?.abort()
}

/** Speaks text with the OS voice engine; `onEnd` fires when it finishes or is cut short. */
export function speak(text: string, lang: VoiceLanguage, onEnd?: () => void, onError?: () => void) {
  const fail = () => {
    onEnd?.()
    onError?.()
  }
  if (!Speech) {
    fail()
    return
  }
  void Speech.stop().catch(() => {})
  try {
    Speech.speak(text, { language: lang, onDone: onEnd, onStopped: onEnd, onError: fail })
  } catch {
    fail()
  }
}

export function voiceOutputAvailable(): boolean {
  return Speech !== null && (Platform.OS !== 'web' || (typeof window !== 'undefined' && 'speechSynthesis' in window))
}

export function stopSpeaking() {
  void Speech?.stop().catch(() => {})
}
