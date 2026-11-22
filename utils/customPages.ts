// Pages members build themselves from blocks. Each page is content/custom-pages/<slug>.json
// and appears at /p/<slug>.

export const CUSTOM_PAGES_FOLDER = 'content/custom-pages'

export function customPagePath(slug: string) {
  return `${CUSTOM_PAGES_FOLDER}/${slug}.json`
}

export interface CustomPage {
  slug: string
  title: string
  subtitle?: string
  blocks: Block[]
}

export type Block =
  | { type: 'text'; heading?: string; body: string }
  | { type: 'image'; src: string; alt?: string; caption?: string; size?: 'normal' | 'wide' }
  | { type: 'gallery'; images: { src: string; alt?: string; caption?: string }[] }
  | { type: 'button'; label: string; href: string; style?: 'primary' | 'secondary' }
  | { type: 'faq'; heading?: string; items: { question: string; answer: string }[] }
  | { type: 'embed'; url: string; caption?: string }
  | { type: 'quote'; text: string; attribution?: string }

/** Block types shown in the "+ Add block" menu, with what a new one starts with. */
export const BLOCK_TYPES: { type: Block['type']; label: string; hint: string; create: () => Block }[] = [
  { type: 'text', label: 'Text', hint: 'Heading and paragraphs', create: () => ({ type: 'text', heading: 'New section', body: 'Double-click to write here.' }) },
  { type: 'image', label: 'Image', hint: 'One picture with a caption', create: () => ({ type: 'image', src: '', alt: '', caption: '', size: 'normal' }) },
  { type: 'gallery', label: 'Gallery', hint: 'A grid of photos', create: () => ({ type: 'gallery', images: [] }) },
  { type: 'button', label: 'Button', hint: 'A link to a page, site or file', create: () => ({ type: 'button', label: 'Learn more', href: '/', style: 'primary' }) },
  { type: 'faq', label: 'FAQ', hint: 'Questions that open on click', create: () => ({ type: 'faq', heading: 'Questions', items: [{ question: 'A question?', answer: 'The answer.' }] }) },
  { type: 'embed', label: 'Video / audio', hint: 'YouTube, Vimeo, Internet Archive, SoundCloud, Google Drive', create: () => ({ type: 'embed', url: '', caption: '' }) },
  { type: 'quote', label: 'Quote', hint: 'A highlighted quote', create: () => ({ type: 'quote', text: 'A memorable quote.', attribution: '' }) },
]

/**
 * Turn a normal share link into an embeddable player URL.
 * Returns null for links we don't know how to embed (we show a plain link instead).
 */
export function embedUrl(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'vimeo.com') {
    const id = url.pathname.match(/^\/(\d+)/)?.[1]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  if (host === 'archive.org') {
    const id = url.pathname.match(/^\/(?:details|embed)\/([^/?#]+)/)?.[1]
    return id ? `https://archive.org/embed/${id}` : null
  }
  if (host === 'soundcloud.com') {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}&visual=false`
  }
  if (host === 'drive.google.com') {
    const id = url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1]
    return id ? `https://drive.google.com/file/d/${id}/preview` : null
  }
  return null
}

/** Audio players are short; video players are 16:9. */
export function isAudioEmbed(raw: string) {
  return /soundcloud\.com/.test(raw)
}
