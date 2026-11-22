// Upload a non-image file (e.g. a PDF) from the editor. It's held in memory and
// committed with the next Save, under public/uploads/.

const MAX_FILE_MB = 20

/** Open the file picker and stage the chosen file. Returns its public URL, or null if cancelled. */
export function pickAndStageFile(accept = 'application/pdf'): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        return reject(new Error(`That file is over ${MAX_FILE_MB} MB. Please compress it or host it elsewhere (e.g. Google Drive) and link to it.`))
      }
      try {
        const ext = (file.name.split('.').pop() || 'pdf').toLowerCase()
        const name = slugify(file.name.replace(/\.[^.]+$/, '')) || 'file'
        const publicUrl = `/uploads/${name}-${Date.now().toString(36)}.${ext}`
        useContentStore().stageAsset(publicUrl, {
          repoPath: `public${publicUrl}`,
          base64: await fileToBase64(file),
          objectUrl: URL.createObjectURL(file),
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
