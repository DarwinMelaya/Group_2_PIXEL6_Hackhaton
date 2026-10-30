import { useSyncExternalStore } from 'react'

import type { TokenUsage } from '@/db/tokenUsage'

export class LocalModelUnavailableError extends Error {}

export const LOCAL_MODEL = {
  name: 'Gemma 4 E2B',
  fileName: 'gemma-4-E2B-it-Q4_0.gguf',
  url: 'https://huggingface.co/ggml-org/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_0.gguf',
  bytes: 2841481184,
}

export type LocalModelStatus = 'missing' | 'downloading' | 'ready' | 'unsupported'

type LocalModelState = { status: LocalModelStatus; progress: number; error?: string }

const state: LocalModelState = { status: 'unsupported', progress: 0 }
const subscribe = () => () => {}

export function getLocalModelStatus(): LocalModelStatus {
  return state.status
}

const noop = async () => {}

export function useLocalModel() {
  const current = useSyncExternalStore(subscribe, () => state)
  return { ...current, download: noop, cancel: () => {}, remove: noop }
}

export async function generateLocal(): Promise<{ text: string; usage: TokenUsage }> {
  throw new LocalModelUnavailableError('The on-device model is not available on web.')
}
