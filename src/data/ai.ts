/**
 * Curated catalog of the Gemini models GabAI will use.
 *
 * models.list tells us which models an API key can reach, but it does not expose
 * cost, latency, input modalities, or which thinking levels a model accepts — so
 * that knowledge lives here and is intersected with the live list at runtime.
 */
export const GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', detail: 'Best quality', thinking: 'low', vision: true },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', detail: 'Balanced', thinking: 'minimal', vision: true },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', detail: 'Fastest, lowest quota use', thinking: 'minimal', vision: true },
] as const

export type GeminiModel = (typeof GEMINI_MODELS)[number]['id']

export type GeminiModelInfo = (typeof GEMINI_MODELS)[number]

/**
 * Order GabAI picks from when it has to choose a model itself: cheapest and fastest
 * first, so the free tier lasts as long as possible.
 */
export const MODEL_PREFERENCE: GeminiModel[] = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash']

export const getModelInfo = (id: string): GeminiModelInfo | undefined => GEMINI_MODELS.find((model) => model.id === id)

/**
 * Lowest thinking level each model accepts. Thought tokens are generated before any
 * visible text, so this is the main lever on how long a reply takes to appear.
 * `gemini-3.8-flash` has no `minimal` level; sending one is an API error.
 */
export const thinkingLevelFor = (id: string): 'minimal' | 'low' => getModelInfo(id)?.thinking ?? 'low'

export const supportsVision = (id: string): boolean => getModelInfo(id)?.vision ?? false

/** App-defined token budgets shown in the usage dialog. When a model reaches its budget, the user can reset it. */
export const TOKEN_LIMITS = { local: 100_000, gemini: 250_000, custom: 250_000 } as const

export const isGeminiModel = (value: unknown): value is GeminiModel => GEMINI_MODELS.some((model) => model.id === value)

/** `'auto'` picks the best model the API key can reach; anything else is a manual choice. */
export type GeminiModelChoice = GeminiModel | 'auto'

export const AUTO_MODEL = 'auto' as const

export const isGeminiModelChoice = (value: unknown): value is GeminiModelChoice => value === AUTO_MODEL || isGeminiModel(value)
