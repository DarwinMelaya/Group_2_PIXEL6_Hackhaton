const GEMINI_KEY = 'gemini_api_key'

export async function getGeminiKey(): Promise<string | null> {
  return window.localStorage.getItem(GEMINI_KEY)
}

export async function setGeminiKey(key: string): Promise<void> {
  window.localStorage.setItem(GEMINI_KEY, key)
}

export async function deleteGeminiKey(): Promise<void> {
  window.localStorage.removeItem(GEMINI_KEY)
}
