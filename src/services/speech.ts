import { requireOptionalNativeModule } from 'expo'

type SpeechModule = typeof import('expo-speech')

// Older development builds may not contain ExpoSpeech. Check before loading
// expo-speech, whose native entry point throws when the module is absent.
export const speech: SpeechModule | null = requireOptionalNativeModule('ExpoSpeech')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require('expo-speech')
  : null
