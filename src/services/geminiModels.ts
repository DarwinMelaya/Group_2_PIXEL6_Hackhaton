import { AUTO_MODEL, GEMINI_MODELS, MODEL_PREFERENCE, supportsVision, type GeminiModel, type GeminiModelChoice } from '@/data/ai'

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000'
const TIMEOUT_MS = 15_000
/** Keys rarely gain or lose models mid-session, so one lookup per hour is plenty. */
const CACHE_TTL_MS = 60 * 60 * 1000

type ListedModel = { name?: string; supportedGenerationMethods?: string[] }

let cache: { key: string; at: number; models: string[] } | null = null

/**
 * Every model this key can call through generateContent — the full free-tier
 * list, not just GabAI's curated catalog. Ordered by GabAI preference first so
 * `auto` still picks cheap models; unknown ids follow alphabetically.
 * Returns `null` when the list could not be fetched — offline, blocked, or a bad key —
 * so callers can fall back to the configured model instead of refusing to answer.
 */
export async function fetchAvailableModels(apiKey: string): Promise<string[] | null> {
  if (cache && cache.key === apiKey && Date.now() - cache.at < CACHE_TTL_MS) return cache.models
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(ENDPOINT, { headers: { 'x-goog-api-key': apiKey }, signal: controller.signal })
    if (!response.ok) return null
    const body = await response.json() as { models?: ListedModel[] }
    const callable = (body.models ?? [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => model.name?.replace(/^models\//, ''))
      .filter((name): name is string => Boolean(name))
    // Catalog ids first in preference order, then every other id the key exposes.
    const rest = callable.filter((id) => !MODEL_PREFERENCE.includes(id as GeminiModel)).sort()
    const models = [...MODEL_PREFERENCE.filter((id) => callable.includes(id)), ...rest]
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
): Promise<{ model: string; substituted: boolean; reason?: string }> {
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

/** 'gemini-2.0-flash-lite' → 'Gemini 2.0 Flash Lite' when the id is not in the catalog. */
export const modelLabel = (id: string) =>
  GEMINI_MODELS.find((model) => model.id === id)?.label
  ?? id.replace(/^models\//, '').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
