import { guides, type Guide } from '@/data/guides'

const KIT_TERMS = ['kit', 'go-bag', 'go bag', 'emergency bag', 'prepare', 'supplies']

const KIT_ANSWER =
  'A basic emergency kit: 3 days of drinking water and ready-to-eat food, a flashlight with spare batteries, ' +
  'a whistle, a first aid kit, maintenance medicines, a power bank, copies of IDs in a waterproof pouch, cash, ' +
  'and extra clothes. Keep it where everyone at home can grab it quickly.'

const FALLBACK =
  'I can help with typhoons, floods, landslides, earthquakes, fires, and first aid for bleeding, burns, choking, ' +
  'and fractures. Try asking about one of those. For a life-threatening emergency, call 911 now.'

function findGuide(question: string): Guide | undefined {
  const text = question.toLowerCase()
  let best: { guide: Guide; score: number } | undefined
  for (const guide of guides) {
    const score = guide.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? keyword.length : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { guide, score }
  }
  return best?.guide
}

/**
 * Offline assistant. Currently answers by retrieving the best-matching bundled guide.
 * Swap the body for an on-device model call while keeping this signature.
 */
export async function generateReply(question: string): Promise<string> {
  const text = question.toLowerCase()
  if (KIT_TERMS.some((term) => text.includes(term))) return KIT_ANSWER
  const guide = findGuide(question)
  if (!guide) return FALLBACK
  const phase = guide.kind === 'disaster'
    ? guide.phases.find((item) => /during|habang/.test(text) ? item.label === 'During' : /after|pagkatapos/.test(text) ? item.label === 'After' : item.label === 'Before') ?? guide.phases[0]
    : guide.phases[0]
  const steps = phase.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
  return `${guide.name} · ${phase.label}\n${steps}\n\nOpen the ${guide.name} guide in the Safety library for the full steps.`
}
