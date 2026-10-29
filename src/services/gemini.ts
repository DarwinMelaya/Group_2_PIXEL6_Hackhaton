const TIMEOUT_MS = 20_000

export class GeminiError extends Error {
  constructor(message: string, readonly kind: 'auth' | 'quota' | 'network' | 'other') {
    super(message)
  }
}

type GeminiHistoryMessage = { role: 'user' | 'assistant'; text: string }

type GeminiErrorBody = { error?: { message?: string; status?: string; details?: { reason?: string }[] } }

function mapError(status: number, body: GeminiErrorBody): GeminiError {
  const apiMessage = body.error?.message
  const keyInvalid = apiMessage?.includes('API_KEY_INVALID') || body.error?.status === 'API_KEY_INVALID' ||
    body.error?.details?.some((detail) => detail.reason === 'API_KEY_INVALID')
  if (status === 400 && keyInvalid) {
    return new GeminiError('This API key was rejected. Check that you copied it correctly.', 'auth')
  }
  if (status === 401 || status === 403) {
    return new GeminiError('This API key was rejected. Check that you copied it correctly.', 'auth')
  }
  if (status === 429) return new GeminiError('Gemini free-tier limit reached. Try again later.', 'quota')
  return new GeminiError(apiMessage ?? `Gemini request failed (HTTP ${status}).`, 'other')
}

export async function generateGemini({ apiKey, model, system, history }: { apiKey: string; model: string; system: string; history: GeminiHistoryMessage[] }): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: history.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.text }] })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
      }),
      signal: controller.signal,
    })
  } catch {
    throw new GeminiError('Cannot reach Gemini. Check your internet connection.', 'network')
  } finally {
    clearTimeout(timeout)
  }
  const body = await response.json().catch(() => ({})) as GeminiErrorBody & { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  if (!response.ok) throw mapError(response.status, body)
  const text = (body.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('').trim()
  if (!text) throw new GeminiError('Gemini returned an empty reply.', 'other')
  return text
}

export async function testGeminiKey(apiKey: string, model: string): Promise<void> {
  await generateGemini({ apiKey, model, system: 'You are a connectivity test.', history: [{ role: 'user', text: 'Reply with OK.' }] })
}
