import type { TokenUsage } from '@/db/tokenUsage'
import type { GeminiImage } from '@/services/gemini'

const TIMEOUT_MS = 60_000

export class BackendError extends Error {
  constructor(message: string, readonly kind: 'auth' | 'network' | 'timeout' | 'other') {
    super(message)
  }
}

/** One conversation turn as GabAI passes it around: text plus an optional inline image. */
export type BackendTurn = { role: 'user' | 'assistant'; text: string; image?: GeminiImage }

/**
 * Normalizes what the user typed into a chat/completions endpoint:
 *   `192.168.1.5:11434`              → `http://192.168.1.5:11434/v1/chat/completions`
 *   `http://localhost:1234/v1`       → `http://localhost:1234/v1/chat/completions`
 *   `http://x/v1/chat/completions`   → used as-is
 */
export function endpointFor(url: string): string {
  let base = url.trim().replace(/\/+$/, '')
  if (!base) return ''
  if (!/^https?:\/\//i.test(base)) base = `http://${base}`
  if (/\/chat\/completions$/i.test(base)) return base
  if (/\/v1$/i.test(base)) return `${base}/chat/completions`
  return `${base}/v1/chat/completions`
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

type OpenAiMessage = { role: 'system' | 'user' | 'assistant'; content: string | ContentPart[] }

/** Vision servers (LM Studio, llama.cpp, vLLM) take the OpenAI `image_url` data-URI shape. */
function toMessage(turn: BackendTurn): OpenAiMessage {
  if (!turn.image) return { role: turn.role, content: turn.text }
  return {
    role: turn.role,
    content: [
      { type: 'image_url', image_url: { url: `data:${turn.image.mimeType};base64,${turn.image.data}` } },
      { type: 'text', text: turn.text || 'What can you tell me about this photo?' },
    ],
  }
}

type CompletionBody = {
  choices?: { message?: { content?: string | { type?: string; text?: string }[] } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  error?: { message?: string } | string
}

function errorMessage(status: number, body: CompletionBody): BackendError {
  const apiMessage = typeof body.error === 'string' ? body.error : body.error?.message
  if (status === 401 || status === 403) {
    return new BackendError('The backend rejected the token. Check it and try again.', 'auth')
  }
  if (status === 404) {
    // On OpenAI-compatible servers a 404 is usually an unknown model name, not a missing route.
    if (apiMessage && /model|not found/i.test(apiMessage)) {
      return new BackendError('The backend does not recognize that model name. Check it in Chat settings.', 'other')
    }
    return new BackendError('Endpoint not found — check the URL and that the server exposes /v1/chat/completions.', 'other')
  }
  return new BackendError(apiMessage ? apiMessage.replace(/\s+/g, ' ').slice(0, 160).trim() : `Backend request failed (HTTP ${status}).`, 'other')
}

/**
 * Talks to any OpenAI-compatible chat server (Ollama, LM Studio, llama.cpp,
 * vLLM, or a remote endpoint). `model` is whatever name that server loaded.
 */
export async function generateBackend({ url, model, token, system, history }: {
  url: string
  model: string
  token?: string | null
  system: string
  history: BackendTurn[]
}): Promise<{ text: string; usage: TokenUsage }> {
  const endpoint = endpointFor(url)
  if (!endpoint) throw new BackendError('Enter the backend URL in Chat settings first.', 'other')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, ...history.map(toMessage)],
        temperature: 0.4,
        max_tokens: 2048,
        stream: false,
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (timedOut) throw new BackendError(`The backend took longer than ${TIMEOUT_MS / 1000}s to answer.`, 'timeout')
    const detail = error instanceof Error && error.message ? ` (${error.message})` : ''
    throw new BackendError(`Cannot reach the backend. Check the URL and that the server is running.${detail}`, 'network')
  } finally {
    clearTimeout(timeout)
  }

  const body = await response.json().catch(() => ({})) as CompletionBody
  if (!response.ok) throw errorMessage(response.status, body)

  const content = body.choices?.[0]?.message?.content
  const text = (typeof content === 'string'
    ? content
    : (content ?? []).filter((part) => part.type === 'text').map((part) => part.text ?? '').join('')).trim()
  if (!text) throw new BackendError('The backend returned an empty reply.', 'other')

  return {
    text,
    usage: {
      promptTokens: body.usage?.prompt_tokens ?? 0,
      completionTokens: body.usage?.completion_tokens ?? 0,
    },
  }
}

export async function testBackend(url: string, model: string, token?: string | null): Promise<void> {
  await generateBackend({ url, model, token, system: 'You are a connectivity test.', history: [{ role: 'user', text: 'Reply with OK.' }] })
}
