const GEMINI_KEY = 'gemini_api_key'
const BACKEND_TOKEN = 'custom_backend_token'

export async function getGeminiKey(): Promise<string | null> {
  return window.localStorage.getItem(GEMINI_KEY)
}

export async function setGeminiKey(key: string): Promise<void> {
  window.localStorage.setItem(GEMINI_KEY, key)
}

export async function deleteGeminiKey(): Promise<void> {
  window.localStorage.removeItem(GEMINI_KEY)
}

export async function getBackendToken(): Promise<string | null> {
  return window.localStorage.getItem(BACKEND_TOKEN)
}

export async function setBackendToken(token: string): Promise<void> {
  window.localStorage.setItem(BACKEND_TOKEN, token)
}

export async function deleteBackendToken(): Promise<void> {
  window.localStorage.removeItem(BACKEND_TOKEN)
}
