// Turns edit mode back on after a reload (if the editor is logged in this tab),
// and warns before leaving the page with unsaved edits.
export default defineNuxtPlugin((nuxtApp) => {
  // Wait for hydration so the server-rendered page and the first client render match.
  nuxtApp.hook('app:mounted', () => {
    useEditor().restore()
  })

  window.addEventListener('beforeunload', (event) => {
    if (useContentStore().changes.value.length) {
      event.preventDefault()
    }
  })
})
