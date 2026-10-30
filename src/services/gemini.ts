import { isGeminiModel, thinkingLevelFor } from '@/data/ai'
import type { TokenUsage } from '@/db/tokenUsage'

/** Thinking models are slow on a non-streaming call; 20s was tripping on normal replies. */
const TIMEOUT_MS = 60_000

export class GeminiError extends Error {
  constructor(message: string, readonly kind: 'auth' | 'quota' | 'network' | 'timeout' | 'other') {
    super(message)
  }
}

/** Base64 image bytes sent inline. Keep well under the 20MB total request cap. */
export type GeminiImage = { mimeType: string; data: string }

type GeminiHistoryMessage = { role: 'user' | 'assistant'; text: string; image?: GeminiImage }

type GeminiPart = { text: string } | { inlineData: GeminiImage }

/** Image first, then the question: Gemini follows instructions about an image better in that order. */
function toParts(message: GeminiHistoryMessage): GeminiPart[] {
  const parts: GeminiPart[] = []
  if (message.image) parts.push({ inlineData: message.image })
  if (message.text) parts.push({ text: message.text })
  return parts.length ? parts : [{ text: '' }]
}

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

type GeminiUsageBody = { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number } }

/**
 * Thought tokens count against maxOutputTokens, so a tight cap makes the model spend
 * the whole budget reasoning and return no text at all. Keep this generous and control
 * answer length through the system prompt instead.
 */
const MAX_OUTPUT_TOKENS = 2048

export async function generateGemini({ apiKey, model, system, history }: { apiKey: string; model: string; system: string; history: GeminiHistoryMessage[] }): Promise<{ text: string; usage: TokenUsage }> {
  const controller = new AbortController()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: history.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: toParts(message) })),
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: 0.4,
          // thinkingConfig is only valid on the catalog's thinking models; older or
          // non-catalog ids from models.list would reject the whole request over it.
          ...(isGeminiModel(model) ? { thinkingConfig: { thinkingLevel: thinkingLevelFor(model) } } : {}),
        },
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (timedOut) throw new GeminiError(`Gemini took longer than ${TIMEOUT_MS / 1000}s to answer.`, 'timeout')
    const detail = error instanceof Error && error.message ? ` (${error.message})` : ''
    throw new GeminiError(`Cannot reach Gemini. Check your internet connection.${detail}`, 'network')
  } finally {
    clearTimeout(timeout)
  }
  const body = await response.json().catch(() => ({})) as GeminiErrorBody & GeminiUsageBody & {
    promptFeedback?: { blockReason?: string }
    candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[]
  }
  if (!response.ok) throw mapError(response.status, body)
  const candidate = body.candidates?.[0]
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? '')
    .join('')
    .trim()
  if (!text) {
    const reason = body.promptFeedback?.blockReason ?? candidate?.finishReason
    throw new GeminiError(reason ? `Gemini returned no answer (${reason}).` : 'Gemini returned an empty reply.', 'other')
  }
  const usage: TokenUsage = {
    promptTokens: body.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: (body.usageMetadata?.candidatesTokenCount ?? 0) + (body.usageMetadata?.thoughtsTokenCount ?? 0),
  }
  return { text, usage }
}

export async function testGeminiKey(apiKey: string, model: string): Promise<void> {
  await generateGemini({ apiKey, model, system: 'You are a connectivity test.', history: [{ role: 'user', text: 'Reply with OK.' }] })
}
