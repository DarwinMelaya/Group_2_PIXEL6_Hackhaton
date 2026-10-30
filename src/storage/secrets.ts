import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store'

const GEMINI_KEY = 'gemini_api_key'
const BACKEND_TOKEN = 'custom_backend_token'

export function getGeminiKey(): Promise<string | null> {
  return getItemAsync(GEMINI_KEY)
}

export function setGeminiKey(key: string): Promise<void> {
  return setItemAsync(GEMINI_KEY, key)
}

export function deleteGeminiKey(): Promise<void> {
  return deleteItemAsync(GEMINI_KEY)
}

export function getBackendToken(): Promise<string | null> {
  return getItemAsync(BACKEND_TOKEN)
}

export function setBackendToken(token: string): Promise<void> {
  return setItemAsync(BACKEND_TOKEN, token)
}

export function deleteBackendToken(): Promise<void> {
  return deleteItemAsync(BACKEND_TOKEN)
}
