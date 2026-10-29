import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store'

const GEMINI_KEY = 'gemini_api_key'

export function getGeminiKey(): Promise<string | null> {
  return getItemAsync(GEMINI_KEY)
}

export function setGeminiKey(key: string): Promise<void> {
  return setItemAsync(GEMINI_KEY, key)
}

export function deleteGeminiKey(): Promise<void> {
  return deleteItemAsync(GEMINI_KEY)
}
