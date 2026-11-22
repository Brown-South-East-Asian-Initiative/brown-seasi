// Pick a new image and write it to a content field (plus alt text if wanted).
// For images that sit under other layers and can't be clicked directly.
export async function replaceImageField(file: string, field: string, altField?: string) {
  try {
    const url = await pickAndStageImage()
    if (!url) return
    const store = useContentStore()
    const alt = altField
      ? window.prompt('Describe this image for people using screen readers (alt text):', String(store.get(file, altField) ?? ''))
      : null
    store.update(file, (data) => {
      setField(data, field, url)
      if (altField && alt !== null) setField(data, altField, alt.trim())
    })
  } catch (e) {
    window.alert(e instanceof Error ? e.message : 'Could not use that image.')
  }
}

function setField(obj: any, path: string, value: unknown) {
  const keys = path.split('.')
  const last = keys.pop()!
  const target = keys.reduce((o, k) => o[k], obj)
  target[last] = value
}

/** Escape text, then turn *phrase* into an emphasized span. Used for paragraphs with an italic phrase. */
export function emphasize(text: string, emClass = '') {
  const escaped = text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
  return escaped.replace(/\*([^*\n]+)\*/g, `<em class="${emClass}">$1</em>`)
}
