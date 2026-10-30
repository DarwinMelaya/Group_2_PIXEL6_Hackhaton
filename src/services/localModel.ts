import { Directory, File, Paths, type DownloadTask } from 'expo-file-system'
import type { LlamaContext } from 'llama.rn'
import { useSyncExternalStore } from 'react'

import type { TokenUsage } from '@/db/tokenUsage'

export class LocalModelUnavailableError extends Error {}

export const LOCAL_MODEL = {
  name: 'Gemma 4 E2B',
  fileName: 'gemma-4-E2B-it-Q4_0.gguf',
  url: 'https://huggingface.co/ggml-org/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_0.gguf',
  bytes: 2841481184,
}

const MIN_FREE_SPACE = LOCAL_MODEL.bytes + 700 * 1024 * 1024

const modelsDir = new Directory(Paths.document, 'models')
const modelFile = new File(modelsDir, LOCAL_MODEL.fileName)
const partFile = new File(modelsDir, `${LOCAL_MODEL.fileName}.part`)

export type LocalModelStatus = 'missing' | 'downloading' | 'ready' | 'unsupported'

type LocalModelState = { status: LocalModelStatus; progress: number; error?: string }

let task: DownloadTask | null = null
let cancelled = false
let state: LocalModelState = { status: modelFile.exists ? 'ready' : 'missing', progress: 0 }

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const setState = (patch: Partial<LocalModelState>) => {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

export function getLocalModelStatus(): LocalModelStatus {
  return state.status
}

async function download() {
  if (state.status === 'downloading') return
  try {
    if (Paths.availableDiskSpace < MIN_FREE_SPACE) {
      setState({ status: 'missing', progress: 0, error: 'Not enough free space. GabAI needs about 3.5 GB free.' })
      return
    }
    if (!modelsDir.exists) modelsDir.create()
    if (modelFile.exists) modelFile.delete()
    if (partFile.exists) partFile.delete()
    cancelled = false
    setState({ status: 'downloading', progress: 0, error: undefined })
    task = File.createDownloadTask(LOCAL_MODEL.url, partFile, {
      onProgress: ({ bytesWritten, totalBytes }) => {
        const total = totalBytes > 0 ? totalBytes : LOCAL_MODEL.bytes
        setState({ progress: Math.min(1, bytesWritten / total) })
      },
    })
    const file = await task.downloadAsync()
    task = null
    if (!file) {
      setState({ status: 'missing', progress: 0 })
      return
    }
    if (partFile.exists) await partFile.move(modelFile)
    if (!modelFile.exists || modelFile.size !== LOCAL_MODEL.bytes) {
      if (modelFile.exists) modelFile.delete()
      throw new Error('The downloaded model is incomplete. Please try again.')
    }
    setState({ status: 'ready', progress: 1 })
  } catch (error) {
    task = null
    try {
      if (partFile.exists) partFile.delete()
    } catch {}
    if (cancelled) setState({ status: 'missing', progress: 0 })
    else setState({ status: 'missing', progress: 0, error: error instanceof Error ? error.message : 'Download failed. Please try again.' })
  }
}

function cancel() {
  cancelled = true
  task?.cancel()
}

let context: LlamaContext | null = null

async function releaseContext() {
  if (!context) return
  const current = context
  context = null
  await current.release().catch(() => {})
}

async function remove() {
  if (task) cancel()
  await releaseContext()
  try {
    if (modelFile.exists) modelFile.delete()
    if (partFile.exists) partFile.delete()
  } catch {}
  setState({ status: 'missing', progress: 0, error: undefined })
}

export function useLocalModel() {
  const current = useSyncExternalStore(subscribe, () => state)
  return { ...current, download, cancel, remove }
}

type LocalMessage = { role: 'user' | 'assistant'; text: string }

export async function generateLocal({ system, history, nPredict }: { system: string; history: LocalMessage[]; nPredict: number }): Promise<{ text: string; usage: TokenUsage }> {
  if (!modelFile.exists) throw new LocalModelUnavailableError('The on-device model is not downloaded.')
  if (!context) {
    try {
      const { initLlama } = await import('llama.rn')
      context = await initLlama({ model: modelFile.uri, n_ctx: 4096, n_gpu_layers: 99, use_mlock: false })
    } catch (error) {
      throw new LocalModelUnavailableError(error instanceof Error ? error.message : 'The on-device model is unavailable.')
    }
  }
  const result = await context.completion({
    messages: [{ role: 'system', content: system }, ...history.map((message) => ({ role: message.role, content: message.text }))],
    n_predict: nPredict,
    temperature: 0.4,
  })
  const text = result.text.trim()
  if (!text) throw new LocalModelUnavailableError('The on-device model returned an empty reply.')
  return { text, usage: { promptTokens: result.timings.prompt_n, completionTokens: result.timings.predicted_n } }
}
