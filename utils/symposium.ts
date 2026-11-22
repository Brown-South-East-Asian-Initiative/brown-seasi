// Symposium content lives in content/symposium/*.json and is edited in place (edit mode).

export const SYMPOSIUM_DETAILS = 'content/symposium/details.json'
export const SYMPOSIUM_SCHEDULE = 'content/symposium/schedule.json'

export interface ScheduleItem {
  time: string
  title: string
  type: string
  description?: string
  featured?: boolean
}

/** Styling stays in code: editors only pick the type name. */
export const scheduleTypeColors: Record<string, string> = {
  Opening: 'bg-sepia/10 text-sepia ring-1 ring-sepia/20',
  Presentations: 'bg-ink/5 text-ink/60 ring-1 ring-border',
  Break: 'bg-ivory-dark text-muted ring-1 ring-border',
  Keynote: 'bg-crimson/12 text-crimson font-semibold ring-1 ring-crimson/30',
  Culture: 'bg-sepia/10 text-sepia ring-1 ring-sepia/20',
  Reception: 'bg-ink/5 text-ink/60 ring-1 ring-border',
}

export const scheduleTypes = Object.keys(scheduleTypeColors)

/** Icons editors can pick for the hero feature cards. */
export const featureIcons: Record<string, { label: string; svg: string }> = {
  people: { label: 'People', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  book: { label: 'Book', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>` },
  music: { label: 'Music', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>` },
  send: { label: 'Arrow', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>` },
  star: { label: 'Star', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>` },
  mic: { label: 'Microphone', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-6 h-6"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>` },
}

export const featureIconOptions = Object.entries(featureIcons).map(([value, i]) => ({ label: i.label, value }))
