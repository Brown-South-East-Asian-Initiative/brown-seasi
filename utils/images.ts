// Prepare an uploaded image for the repo: shrink big photos so pages stay fast and the repo stays small.

const MAX_EDGE = 2000
const KEEP_ORIGINAL_UNDER = 1.5 * 1024 * 1024 // bytes
const MAX_UPLOAD = 25 * 1024 * 1024

export async function prepareImage(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > MAX_UPLOAD) throw new Error('That image is over 25 MB. Please choose a smaller one.')

  const name = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image'
  const id = Date.now().toString(36)

  // Vector and animated images, or already-small ones, are kept as they are.
  const bitmap = await createImageBitmap(file).catch(() => null)
  const fits = bitmap ? Math.max(bitmap.width, bitmap.height) <= MAX_EDGE : true
  if (!bitmap || file.type === 'image/svg+xml' || file.type === 'image/gif' || (fits && file.size <= KEEP_ORIGINAL_UNDER)) {
    bitmap?.close()
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    return { blob: file as Blob, filename: `${name}-${id}.${ext}` }
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff' // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/jpeg', 0.85))
  return { blob, filename: `${name}-${id}.jpg` }
}

/** Open the file picker, process the image and stage it. Returns its public URL, or null if cancelled. */
export function pickAndStageImage(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      try {
        const { blob, filename } = await prepareImage(file)
        const publicUrl = `/uploads/${filename}`
        useContentStore().stageAsset(publicUrl, {
          repoPath: `public${publicUrl}`,
          base64: await fileToBase64(blob),
          objectUrl: URL.createObjectURL(blob),
        })
        resolve(publicUrl)
      } catch (e) {
        reject(e)
      }
    })
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}
