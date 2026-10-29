export const GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', detail: 'Best quality' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', detail: 'Balanced' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', detail: 'Fastest, lowest quota use' },
] as const

export type GeminiModel = (typeof GEMINI_MODELS)[number]['id']

export const isGeminiModel = (value: unknown): value is GeminiModel => GEMINI_MODELS.some((model) => model.id === value)
