export const GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', detail: 'Best quality' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', detail: 'Balanced' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', detail: 'Fastest, lowest quota use' },
] as const

export type GeminiModel = (typeof GEMINI_MODELS)[number]['id']

/**
 * Lowest thinking level each model accepts. Thought tokens are generated before any
 * visible text, so this is the main lever on how long a reply takes to appear.
 * `gemini-3.8-flash` has no `minimal` level; sending one is an API error.
 */
export const THINKING_LEVELS: Record<GeminiModel, 'minimal' | 'low'> = {
  'gemini-3.8-flash': 'low',
  'gemini-3.6-flash': 'minimal',
  'gemini-3.5-flash-lite': 'minimal',
}

/** App-defined token budgets shown in the usage dialog. When a model reaches its budget, the user can reset it. */
export const TOKEN_LIMITS = { local: 100_000, gemini: 250_000 } as const

export const isGeminiModel = (value: unknown): value is GeminiModel => GEMINI_MODELS.some((model) => model.id === value)
