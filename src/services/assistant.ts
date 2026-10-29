import type { ChatMessage } from '@/db/chat'
import type { Settings } from '@/db/settings'
import { guides, type Guide } from '@/data/guides'
import { generateGemini, GeminiError } from '@/services/gemini'
import { generateLocal, getLocalModelStatus, LOCAL_MODEL } from '@/services/localModel'
import { getGeminiKey } from '@/storage/secrets'

const KIT_TERMS = ['kit', 'go-bag', 'go bag', 'emergency bag', 'prepare', 'supplies']

const KIT_ANSWER =
  'A basic emergency kit: 3 days of drinking water and ready-to-eat food, a flashlight with spare batteries, ' +
  'a whistle, a first aid kit, maintenance medicines, a power bank, copies of IDs in a waterproof pouch, cash, ' +
  'and extra clothes. Keep it where everyone at home can grab it quickly.'

const FALLBACK =
  'I can help with typhoons, floods, landslides, earthquakes, fires, and first aid for bleeding, burns, choking, ' +
  'and fractures. Try asking about one of those. For a life-threatening emergency, call 911 now. ' +
  'You can ask in English, Tagalog, or Taglish.'

const SYSTEM_PROMPT =
  'You are GabAI, an offline-first safety assistant for Marinduque, Philippines. ' +
  'Answer only about disaster preparedness and first aid. ' +
  'Reply in the same language the user used (English, Tagalog, or Taglish). ' +
  'Give short numbered steps. ' +
  'For life-threatening emergencies, tell them to call 911 first. ' +
  'Never invent hotline numbers. ' +
  'If you are unsure, say so and point the user to the Guides tab.'

const HISTORY_LIMIT = 10
const N_PREDICT = { short: 320, detailed: 900 } as const

function findGuide(question: string): Guide | undefined {
  const text = question.toLowerCase()
  let best: { guide: Guide; score: number } | undefined
  for (const guide of guides) {
    const score = guide.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? keyword.length : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { guide, score }
  }
  return best?.guide
}

const PHASE_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'After', pattern: /\b(after|pagkatapos|matapos|nakalipas|tapos na)\b/ },
  { label: 'During', pattern: /\b(during|habang|while|ngayon|right now|kapag may|kung may|pag may)\b/ },
]

function phaseLabel(text: string): string {
  return PHASE_PATTERNS.find(({ pattern }) => pattern.test(text))?.label ?? 'Before'
}

/**
 * Last-resort offline answer: retrieves the best-matching bundled guide by keyword.
 */
export function guideReply(question: string): string {
  const text = question.toLowerCase()
  if (KIT_TERMS.some((term) => text.includes(term))) return KIT_ANSWER
  const guide = findGuide(question)
  if (!guide) return FALLBACK
  const phase = guide.kind === 'disaster'
    ? guide.phases.find((item) => item.label === phaseLabel(text)) ?? guide.phases[0]
    : guide.phases[0]
  const steps = phase.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
  return `${guide.name} · ${phase.label}\n${steps}\n\nOpen the ${guide.name} guide in the Safety library for the full steps.`
}

function buildSystem(question: string): string {
  const guide = findGuide(question)
  if (!guide) return SYSTEM_PROMPT
  const reference = guide.phases.map((phase) => `${phase.label}: ${phase.steps.join(' ')}`).join('\n')
  return `${SYSTEM_PROMPT}\n\nReference guide: ${guide.name}\n${reference}`
}

async function localReply(system: string, history: { role: 'user' | 'assistant'; text: string }[], nPredict: number): Promise<string | null> {
  if (getLocalModelStatus() !== 'ready') return null
  try {
    return await generateLocal({ system, history, nPredict })
  } catch {
    return null
  }
}

/**
 * Dispatcher: cloud mode tries Gemini first, then falls back to the on-device
 * model, then to bundled-guide retrieval. Always resolves with an answer.
 */
export async function generateReply(question: string, history: ChatMessage[], settings: Settings): Promise<{ text: string; notice?: string }> {
  const system = buildSystem(question)
  const modelHistory = [...history.slice(-HISTORY_LIMIT), { role: 'user' as const, body: question }]
    .map((message) => ({ role: message.role, text: message.body }))
  const nPredict = N_PREDICT[settings.localReplyLength]

  let notice: string | undefined
  if (settings.aiMode === 'cloud') {
    const apiKey = await getGeminiKey().catch(() => null)
    if (!apiKey) {
      notice = 'Cloud AI is not set up. Answered offline.'
    } else {
      try {
        const text = await generateGemini({ apiKey, model: settings.geminiModel, system, history: modelHistory })
        if (text) return { text }
      } catch (error) {
        notice = `${error instanceof GeminiError ? error.message : 'Gemini is unavailable.'} Answered offline.`
      }
    }
  }

  const text = await localReply(system, modelHistory, nPredict)
  if (text) return notice ? { text, notice } : { text }
  if (!notice && settings.aiMode === 'local' && getLocalModelStatus() !== 'ready') {
    notice = `Download ${LOCAL_MODEL.name} in Chat settings for full AI answers. Showing guide steps.`
  }
  return { text: guideReply(question), notice }
}
