import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition'
import * as Speech from 'expo-speech'
import { Platform } from 'react-native'

import type { VoiceLanguage } from '@/db/settings'

/** Whether any speech recognizer exists on this device/browser. Checked once at screen mount. */
export function voiceInputAvailable(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable()
  } catch {
    return false
  }
}

/** Whether speech can be recognized fully on-device — the only mode that works offline. */
export function onDeviceVoiceAvailable(): boolean {
  try {
    return ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()
  } catch {
    return false
  }
}

export async function ensureVoicePermissions(): Promise<boolean> {
  try {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    return result.granted
  } catch {
    return false
  }
}

/**
 * Android needs a downloaded offline pack per locale for on-device recognition;
 * trigger the system download silently when the pack is missing.
 */
async function ensureOfflineVoicePack(lang: VoiceLanguage) {
  if (Platform.OS !== 'android') return
  try {
    const { installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({
      androidRecognitionServicePackage: 'com.google.android.as',
    })
    if (!installedLocales.some((locale) => locale.toLowerCase() === lang.toLowerCase())) {
      await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: lang }).catch(() => {})
    }
  } catch {}
}

/**
 * Starts dictation; transcripts arrive via `useSpeechRecognitionEvent` in the
 * chat screen. `onDevice` keeps audio on the phone (works offline) when the OS
 * supports it — otherwise it falls back to the regular network recognizer.
 */
export async function startVoiceInput({ lang, onDevice }: { lang: VoiceLanguage; onDevice: boolean }) {
  const deviceOnly = onDevice && onDeviceVoiceAvailable()
  if (deviceOnly) await ensureOfflineVoicePack(lang)
  ExpoSpeechRecognitionModule.start({
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
  ExpoSpeechRecognitionModule.stop()
}

/** Abandons the session — no transcript is delivered. */
export function cancelVoiceInput() {
  ExpoSpeechRecognitionModule.abort()
}

/** Speaks text with the OS voice engine; `onEnd` fires when it finishes or is cut short. */
export function speak(text: string, lang: VoiceLanguage, onEnd?: () => void) {
  void Speech.stop()
  Speech.speak(text, { language: lang, onDone: onEnd, onStopped: onEnd, onError: () => onEnd?.() })
}

export function stopSpeaking() {
  void Speech.stop()
}
