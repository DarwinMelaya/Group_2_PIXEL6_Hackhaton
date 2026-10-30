import type { ChatMessage } from '@/db/chat'
import type { ReplyLength, Settings } from '@/db/settings'
import type { TokenUsage, UsageSource } from '@/db/tokenUsage'
import { barangayContacts, municipalContacts, nationalContacts, provincialContacts, searchContacts, type ContactSearchResult, type EmergencyContact } from '@/data/contacts'
import { guides, type Guide } from '@/data/guides'
import { MUNICIPALITIES, type Municipality } from '@/data/profile'
import { BackendError, generateBackend } from '@/services/customBackend'
import { generateGemini, GeminiError, type GeminiImage } from '@/services/gemini'
import { modelLabel, resolveModel } from '@/services/geminiModels'
import { generateLocal, getLocalModelStatus } from '@/services/localModel'
import { getBackendToken, getGeminiKey } from '@/storage/secrets'

/**
 * What the saved profile tells the assistant: where the user lives (grounds hotline
 * answers in the right municipality) and who their personal emergency contact is.
 */
export type AssistantContext = {
  municipality?: Municipality
  barangay?: string
  emergencyContact?: { name: string; phone: string; relationship?: string }
}

const KIT_TERMS = ['kit', 'go-bag', 'go bag', 'emergency bag', 'prepare', 'supplies']

/**
 * Terms that mean the user wants someone to call. `AGENCY_TERMS` alone is enough
 * ("ano ang MDRRMO"); `CONTACT_TERMS` are generic request words. Municipal names are
 * not here on purpose — "baha sa Gasan" wants the flood guide, not a phone list.
 */
const CONTACT_TERMS = ['hotline', 'contact', 'kontak', 'numero', 'number', 'tawag', 'call', 'phone', 'telepono', 'cellphone', 'rescue', 'saklolo', 'nearest', 'malapit', '911']
const AGENCY_TERMS = ['mdrrmo', 'pdrrmo', 'bdrrmc', 'bfp', 'pnp', 'coast guard', 'red cross', 'fire station', 'police', 'pulis', 'bumbero', 'ambulan', 'hospital', 'ospital', 'municipal hall', 'munisipyo', 'barangay hall']

/**
 * Looser trigger for injecting the directory into a model prompt: everything above plus
 * place names and emergency cries. Extra context never hurts a model, but a no-model
 * fallback must be sure the user wants numbers before answering with a phone list.
 */
const DIRECTORY_TERMS = [...CONTACT_TERMS, ...AGENCY_TERMS, 'emergency', 'tulong', 'barangay', 'brgy', ...MUNICIPALITIES.map((municipality) => municipality.toLowerCase())]

const wantsContacts = (text: string) => {
  const lower = text.toLowerCase()
  return [...CONTACT_TERMS, ...AGENCY_TERMS].some((term) => lower.includes(term))
}
const wantsDirectory = (text: string) => {
  const lower = text.toLowerCase()
  return DIRECTORY_TERMS.some((term) => lower.includes(term))
}

/** Asking after the user's own emergency contact person, saved in their profile. */
const PERSONAL_CONTACT_TERMS = /\b(my (emergency )?contact|emergency contact (ko|namin|nating)|aking (emergency )?contact|contact person|kontak (ko|namin)|next of kin|kamag-?anak)\b/i

const KIT_ANSWER =
  'A basic emergency kit: 3 days of drinking water and ready-to-eat food, a flashlight with spare batteries, ' +
  'a whistle, a first aid kit, maintenance medicines, a power bank, copies of IDs in a waterproof pouch, cash, ' +
  'and extra clothes. Keep it where everyone at home can grab it quickly.'

const FALLBACK =
  'I can help with typhoons, floods, landslides, earthquakes, fires, and first aid for bleeding, burns, choking, ' +
  'and fractures — or give you a Marinduque emergency hotline. Try asking about one of those. ' +
  'For a life-threatening emergency, call 911 now. You can ask in English, Tagalog, or Taglish.'

const SYSTEM_PROMPT =
  'You are GabAI, an offline-first safety assistant for Marinduque, Philippines. ' +
  'Answer only about disaster preparedness, first aid, and Marinduque emergency contacts. ' +
  'Reply in the same language the user used (English, Tagalog, or Taglish). ' +
  'Give short numbered steps. ' +
  'For life-threatening emergencies, tell them to call 911 first. ' +
  'Give hotline numbers only from the verified directory in this prompt — never invent or recall a number. ' +
  'If you are unsure, say so and point the user to the Guides tab or the Emergency contacts screen.'

const HISTORY_LIMIT = 10
const N_PREDICT = { short: 320, detailed: 900 } as const

/** Sent instead of SYSTEM_PROMPT when a photo is attached. */
const VISION_PROMPT =
  'You are GabAI, an offline-first safety assistant for Marinduque, Philippines. ' +
  'The user attached a photo. Describe what is visible and give first-aid or preparedness steps for what you see. ' +
  'Never diagnose. If the photo suggests an injury or a medical condition, say so and advise seeing a health professional. ' +
  'Reply in the same language the user used (English, Tagalog, or Taglish). ' +
  'For life-threatening emergencies, tell them to call 911 first. ' +
  'If the photo is unrelated to safety, say so and point the user to the Guides tab.'

/**
 * Cloud length control has to go through the prompt: Gemini counts thought tokens
 * against maxOutputTokens, so capping that truncates the answer instead of shortening it.
 */
const LENGTH_PROMPT = {
  short: 'Keep the whole answer under 120 words.',
  detailed: 'Use at most 10 steps.',
} as const

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

const contactLine = (contacts: EmergencyContact[]) => contacts.map((contact) => `${contact.label} — ${contact.number}`).join('; ')

/**
 * Compact rendering of the verified hotline dataset (`data/contacts.ts`), so every
 * backend — Gemini, a custom server, or the on-device model — quotes the same numbers.
 */
function directoryBlock(context?: AssistantContext): string {
  const municipal = MUNICIPALITIES.map((municipality) => {
    // Verified barangay rows, should any ever be confirmed, ride along with the municipal list.
    const barangay = Object.values(barangayContacts[municipality] ?? {}).flat()
    return `${municipality}: ${contactLine([...barangay, ...municipalContacts[municipality]])}`
  })
  const lines = [
    'Verified emergency hotline directory for Marinduque:',
    `National: ${contactLine(nationalContacts)}`,
    `Provincial: ${contactLine(provincialContacts)}`,
    ...municipal,
    'Barangay BDRRMC numbers are still pending MDRRMO verification — if asked for one, say it is not confirmed yet and give the municipal hotlines instead.',
  ]
  lines.push(...contextLines(context))
  lines.push('Answer contact questions only from this directory.')
  return lines.join('\n')
}

/** Profile facts a model may quote — the saved address and the user's own emergency contact. */
function contextLines(context?: AssistantContext): string[] {
  const lines: string[] = []
  if (context?.municipality) {
    lines.push(`User's saved address: ${context.barangay ? `Brgy. ${context.barangay}, ` : ''}${context.municipality}. Their municipal hotlines apply unless they ask about another place.`)
  }
  const contact = context?.emergencyContact
  if (contact) {
    lines.push(`User's personal emergency contact: ${contact.name}${contact.relationship ? ` (${contact.relationship})` : ''} — ${contact.phone}. Share it only when they ask about their own contact.`)
  }
  return lines
}

/**
 * The `searchContacts` matches rendered for a model prompt: only the hotlines that fit
 * the question, so even a small on-device model picks the right row instead of
 * hallucinating one from a long list.
 */
function focusedDirectoryBlock(search: ContactSearchResult, context?: AssistantContext): string {
  const lines = ['Verified emergency hotlines matching the question:']
  for (const section of search.sections) {
    lines.push(`${section.title}${section.fallback ? ' (no dedicated hotline listed — closest responders)' : ''}: ${contactLine(section.contacts)}`)
  }
  lines.push(...contextLines(context))
  lines.push('Answer contact questions only from this directory. If the hotline the user needs is not listed, name the office to ask for (MDRRMO, BFP, PNP) — never invent a number.')
  return lines.join('\n')
}

/** The user's own emergency contact person, answered straight from their profile. */
function personalContactReply(question: string, context?: AssistantContext): string | null {
  if (!PERSONAL_CONTACT_TERMS.test(question)) return null
  const contact = context?.emergencyContact
  if (!contact) {
    return 'You have not saved a personal emergency contact yet — add one in Profile → Emergency contact. For official hotlines, tell me your municipality or agency.'
  }
  return `Your emergency contact: ${contact.name}${contact.relationship ? ` (${contact.relationship})` : ''} — ${contact.phone}\n\nFor official hotlines, ask me or open the Emergency contacts screen (red phone button).`
}

/**
 * No-model answer for "who do I call": deterministic text straight from the contacts
 * dataset, so a wrong number can never be generated. `searchContacts` narrows the
 * answer to the agency and place the question names. Returns null for other questions.
 */
export function contactReply(question: string, context?: AssistantContext): string | null {
  const text = question.toLowerCase()
  // Asking about the saved contact person counts as contact intent on its own.
  if (!wantsContacts(text) && !PERSONAL_CONTACT_TERMS.test(question)) return null
  const personal = personalContactReply(question, context)
  if (personal) return personal

  const search = searchContacts(question, context)
  const list = search.sections
    .map((section) => {
      const rows = section.contacts.map((contact) => `- ${contact.label}: ${contact.number}`).join('\n')
      return section.fallback ? `${section.title} (no dedicated hotline — closest responders)\n${rows}` : `${section.title}\n${rows}`
    })
    .join('\n\n')
  const barangayNote = /barangay|brgy|bdrrmc/.test(text)
    ? '\n\nBarangay BDRRMC numbers are still being verified — use the municipal hotlines meanwhile.'
    : ''
  const pointer = search.municipalities.length
    ? 'Open the Emergency contacts screen (red phone button) to call directly.'
    : `Tell me your municipality — ${MUNICIPALITIES.join(', ')} — for its local hotlines, or open the Emergency contacts screen to call directly.`
  return `${list}${barangayNote}\n\n${pointer}`
}

/**
 * Last-resort offline answer: contacts come straight from the dataset, otherwise
 * retrieves the best-matching bundled guide by keyword.
 */
export function guideReply(question: string, context?: AssistantContext): string {
  const text = question.toLowerCase()
  if (KIT_TERMS.some((term) => text.includes(term))) return KIT_ANSWER
  const contacts = contactReply(question, context)
  if (contacts) return contacts
  const guide = findGuide(question)
  if (!guide) return FALLBACK
  const phase = guide.kind === 'disaster'
    ? guide.phases.find((item) => item.label === phaseLabel(text)) ?? guide.phases[0]
    : guide.phases[0]
  const steps = phase.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
  return `${guide.name} · ${phase.label}\n${steps}\n\nOpen the ${guide.name} guide in the Safety library for the full steps.`
}

function buildSystem(question: string, length: ReplyLength, hasImage: boolean, context?: AssistantContext): string {
  // Guide retrieval is keyword-based; it cannot ground an answer about pixels.
  if (hasImage) return `${VISION_PROMPT} ${LENGTH_PROMPT[length]}`
  const parts = [`${SYSTEM_PROMPT} ${LENGTH_PROMPT[length]}`]
  if (wantsDirectory(question)) {
    const search = searchContacts(question, context)
    parts.push(search.narrowed ? focusedDirectoryBlock(search, context) : directoryBlock(context))
  }
  const guide = findGuide(question)
  if (guide) {
    const reference = guide.phases.map((phase) => `${phase.label}: ${phase.steps.join(' ')}`).join('\n')
    parts.push(`Reference guide: ${guide.name}\n${reference}`)
  }
  return parts.join('\n\n')
}

async function localReply(system: string, history: { role: 'user' | 'assistant'; text: string }[], nPredict: number): Promise<{ text: string; usage: TokenUsage } | null> {
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
 * `usage` is set when a real model generated the reply (guide retrieval has no tokens).
 *
 * `image` is only analyzed by cloud models — the bundled Gemma build and the guide
 * library are text-only, so attaching a photo needs a working Gemini key or the
 * reply degrades to a text-only answer with a notice.
 */
export async function generateReply(
  question: string,
  history: ChatMessage[],
  settings: Settings,
  image?: GeminiImage,
  context?: AssistantContext,
): Promise<{ text: string; notice?: string; model?: string; usage?: TokenUsage & { source: UsageSource } }> {
  const system = buildSystem(question, settings.localReplyLength, Boolean(image), context)
  // Earlier photo messages keep their file in the bubble but are not re-sent each turn;
  // re-uploading every image per request would burn quota and latency.
  const modelHistory = history.slice(-HISTORY_LIMIT)
    .map((message) => ({ role: message.role, text: message.body }))
  const questionText = question || (image ? 'What can you tell me about this photo? Please keep me safe.' : '')
  const current: { role: 'user' | 'assistant'; text: string; image?: GeminiImage } = { role: 'user', text: questionText, image }
  const nPredict = N_PREDICT[settings.localReplyLength]

  let notice: string | undefined
  if (settings.aiMode === 'cloud') {
    const apiKey = await getGeminiKey().catch(() => null)
    if (!apiKey) {
      notice = 'Cloud AI is not set up. Answered offline.'
    } else {
      try {
        const resolved = await resolveModel(apiKey, settings.geminiModel, { needsVision: Boolean(image) })
        if (resolved.substituted) notice = `Switched to ${modelLabel(resolved.model)} (${resolved.reason}).`
        const result = await generateGemini({ apiKey, model: resolved.model, system, history: [...modelHistory, current] })
        return { text: result.text, model: resolved.model, notice, usage: { source: 'gemini', ...result.usage } }
      } catch (error) {
        notice = `${notice ? `${notice} ` : ''}${error instanceof GeminiError ? error.message : 'Gemini is unavailable.'} Answered offline.`
      }
    }
  } else if (settings.aiMode === 'custom') {
    if (!settings.backendUrl || !settings.backendModel) {
      notice = 'Custom backend is not set up. Answered offline.'
    } else {
      try {
        const result = await generateBackend({
          url: settings.backendUrl,
          model: settings.backendModel,
          token: await getBackendToken().catch(() => null),
          system,
          history: [...modelHistory, current],
        })
        return { text: result.text, model: settings.backendModel, notice, usage: { source: 'custom', ...result.usage } }
      } catch (error) {
        notice = `${error instanceof BackendError ? error.message : 'The backend is unavailable.'} Answered offline.`
      }
    }
  } else if (image) {
    notice = 'Photo analysis needs Cloud AI, which is off. Answered from your text only.'
  }

  if (image && !notice) notice = 'Photo analysis needs Cloud AI. Answered from your text only.'
  const local = await localReply(system, [...modelHistory, { role: 'user' as const, text: questionText }], nPredict)
  if (local) return notice ? { text: local.text, usage: { source: 'local', ...local.usage }, notice } : { text: local.text, usage: { source: 'local', ...local.usage } }
  // Without the on-device model, guide retrieval is the normal local answer — no nagging.
  return { text: guideReply(questionText || 'photo', context), notice }
}
