export interface SpeakerTalk {
  slug: string
  /** ISO date (YYYY-MM-DD), used for sorting and past/upcoming status. */
  date: string
  speaker: string
  affiliation: string
  role?: string
  /** Talk title — omit while TBA. */
  title?: string
  abstract?: string
  location?: string
  time?: string
  portrait?: string
  /** Flyer image(s) shown on the talk card. */
  flyer?: string | string[]
  /** File to open from “Download flyer” (defaults to the first flyer image). */
  flyerDownload?: string
  gallery?: { src: string; alt: string; caption?: string }[]
}

// Talks live in content/talks/*.json. Read them with useTalks() (composables/useContent.ts)
// so edit mode can change them live.

export const TALKS_FOLDER = 'content/talks'
export const SPEAKER_SERIES_SETTINGS = 'content/settings/speaker-series.json'

/** "2026-09-30" → Date at local noon (avoids timezone day-shift). */
function toDate(iso: string) {
  return new Date(`${iso}T12:00:00`)
}

export function flyerImages(talk: SpeakerTalk) {
  if (!talk.flyer) return []
  return Array.isArray(talk.flyer) ? talk.flyer : [talk.flyer]
}

export function formatTalkTitle(title: string) {
  const trimmed = title.trim()
  if (/^["“']/.test(trimmed)) return trimmed
  return `“${trimmed}”`
}

export function formatTalkDate(iso: string, style: 'long' | 'short' = 'long') {
  return toDate(iso).toLocaleDateString('en-US', style === 'long'
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: '2-digit', year: 'numeric' })
}

export function talkDateParts(iso: string) {
  const d = toDate(iso)
  return {
    day: d.toLocaleDateString('en-US', { day: '2-digit' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
  }
}

export function isTalkPast(iso: string) {
  const end = toDate(iso)
  end.setHours(23, 59, 59)
  return end.getTime() < Date.now()
}
