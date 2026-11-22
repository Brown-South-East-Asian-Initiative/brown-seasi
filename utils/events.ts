// Events live in content/events/*.json. Read them with useCollection(EVENTS_FOLDER).

export interface SiteEvent {
  slug: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  time?: string
  title: string
  description?: string
  location?: string
  tag: string
  /** Internal path (/symposium) or full URL. */
  link?: string
  featured?: boolean
}

export const EVENTS_FOLDER = 'content/events'
export const EVENTS_SECTION = 'content/home/events-section.json'

/** Choices editors get for an event's type. Colors for each live in tagColors below. */
export const EVENT_TAGS = ['Lecture', 'Symposium', 'Workshop', 'Film', 'Social', 'Other']

/** Styling stays in code: the CMS only picks a tag name. */
const tagColors: Record<string, string> = {
  Symposium: 'bg-crimson/12 text-crimson ring-1 ring-crimson/30',
  Lecture: 'bg-sepia/10 text-sepia ring-1 ring-sepia/20',
}
const defaultTagColor = 'bg-ink/5 text-ink-light ring-1 ring-ink/10'

export function eventTagColor(tag: string) {
  return tagColors[tag] ?? defaultTagColor
}
