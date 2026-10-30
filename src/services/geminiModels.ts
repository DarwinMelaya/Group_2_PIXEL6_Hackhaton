import { AUTO_MODEL, GEMINI_MODELS, MODEL_PREFERENCE, supportsVision, type GeminiModel, type GeminiModelChoice } from '@/data/ai'

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000'
const TIMEOUT_MS = 15_000
/** Keys rarely gain or lose models mid-session, so one lookup per hour is plenty. */
const CACHE_TTL_MS = 60 * 60 * 1000

type ListedModel = { name?: string; supportedGenerationMethods?: string[] }

let cache: { key: string; at: number; models: GeminiModel[] } | null = null

/**
 * Models this key can actually call, in GabAI's preference order (cheapest first).
 * Returns `null` when the list could not be fetched — offline, blocked, or a bad key —
 * so callers can fall back to the configured model instead of refusing to answer.
 */
export async function fetchAvailableModels(apiKey: string): Promise<GeminiModel[] | null> {
  if (cache && cache.key === apiKey && Date.now() - cache.at < CACHE_TTL_MS) return cache.models
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(ENDPOINT, { headers: { 'x-goog-api-key': apiKey }, signal: controller.signal })
    if (!response.ok) return null
    const body = await response.json() as { models?: ListedModel[] }
    const callable = new Set(
      (body.models ?? [])
        .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model) => model.name?.replace(/^models\//, ''))
        .filter((name): name is string => Boolean(name)),
    )
    // Intersect with the curated catalog: models.list also returns TTS, image and
    // robotics models that accept generateContent but would be useless here.
    const models = MODEL_PREFERENCE.filter((id) => callable.has(id))
    cache = { key: apiKey, at: Date.now(), models }
    return models
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export function clearModelCache() {
  cache = null
}

/**
 * Chooses the model to send a request to.
 *
 * Keeps the user's choice whenever it is usable, and only substitutes when that model
 * is missing from the key's list or cannot handle an attached image. Never blocks on
 * the network: if discovery fails, the configured model is attempted as-is.
 */
export async function resolveModel(
  apiKey: string,
  configured: GeminiModelChoice,
  options: { needsVision?: boolean } = {},
): Promise<{ model: GeminiModel; substituted: boolean; reason?: string }> {
  const needsVision = options.needsVision ?? false
  const available = await fetchAvailableModels(apiKey)

  // Auto: take the best model the key exposes (preference order), or the
  // cheapest catalog entry when the list is unreachable.
  if (configured === AUTO_MODEL) {
    const candidates = available ?? MODEL_PREFERENCE
    const pick = candidates.find((id) => !needsVision || supportsVision(id)) ?? candidates[0]
    return { model: pick, substituted: Boolean(available && !available.includes(pick)), reason: 'picked automatically' }
  }

  if (needsVision && !supportsVision(configured)) {
    const fallback = (available ?? MODEL_PREFERENCE).find(supportsVision)
    if (fallback) return { model: fallback, substituted: true, reason: `${configured} cannot read images` }
  }
  if (!available || available.includes(configured)) return { model: configured, substituted: false }

  const fallback = available.find((id) => !needsVision || supportsVision(id))
  if (!fallback) return { model: configured, substituted: false }
  return { model: fallback, substituted: true, reason: `${configured} is not available on this API key` }
}

export const modelLabel = (id: string) => GEMINI_MODELS.find((model) => model.id === id)?.label ?? id
