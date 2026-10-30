import { requireOptionalNativeModule } from 'expo'

type SpeechRecognitionModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule

// Expo Go and development builds made before voice input was added don't have
// this module. A runtime import of the package would throw before chat mounts.
export const speechRecognition = requireOptionalNativeModule<SpeechRecognitionModule>('ExpoSpeechRecognition')
