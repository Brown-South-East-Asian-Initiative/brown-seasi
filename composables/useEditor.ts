import type { StagedAsset, WorkingFile } from './useContent'

// Edit-mode session: the editor's GitHub login, entering edit mode, and saving.
// The token lives in sessionStorage, so it is cleared when the tab closes.

const SESSION_KEY = 'seasi-editor-token'
const DRAFT_KEY = 'seasi-editor-draft'
const UNSAVED_KEY = 'seasi-editor-unsaved'

export interface EditorSession {
  token: string
  expiresAt: number
  login: string
  name: string | null
  avatarUrl: string
}

export interface Draft {
  branch: string
  number: number
  url: string
  commitSha: string
}

type SaveStatus =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; preview: 'waiting' | 'building' | 'ready' | 'failed'; previewUrl?: string }
  | { state: 'error'; message: string }

export function useEditor() {
  const session = useState<EditorSession | null>('editor-session', () => null)
  const draft = useState<Draft | null>('editor-draft', () => null)
  const saveStatus = useState<SaveStatus>('editor-save-status', () => ({ state: 'idle' }))
  const loadNote = useState<string>('editor-load-note', () => '')
  const config = useRuntimeConfig()
  const repo = config.public.githubRepo as string
  const baseBranch = config.public.githubBranch as string
  const store = useContentStore()

  const isEditing = computed(() => !!session.value && store.state.value.active)

  function api() {
    if (!session.value) throw new Error('Not logged in')
    return github(session.value.token, repo)
  }

  /** Restore a login saved earlier in this tab and turn edit mode on. Runs after hydration. */
  function restore() {
    if (import.meta.server) return
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as EditorSession
        if (saved.expiresAt > Date.now()) session.value = saved
        else sessionStorage.removeItem(SESSION_KEY)
      }
      const savedDraft = sessionStorage.getItem(DRAFT_KEY)
      if (savedDraft) draft.value = JSON.parse(savedDraft)
    } catch {
      // Storage blocked or corrupt: stay logged out.
    }
    if (session.value) startEditing()
  }

  /** Check the token with GitHub and confirm the user can push to the repo. */
  async function signIn(token: string, expiresInSeconds: number) {
    const gh = github(token, repo)
    const user = await gh.call('/user').catch(() => {
      throw new Error('GitHub did not accept this login. Please try again.')
    })
    const repoData = await gh.call(`/repos/${repo}`).catch(() => null)
    if (!repoData?.permissions?.push) {
      throw new Error(`Signed in as @${user.login}, but this account can't edit the website yet. Ask a SEASI admin to add you to the ${repo} repository.`)
    }

    session.value = {
      token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
    }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session.value))
    } catch {}
    startEditing()
  }

  /** Make a working copy and pull in the latest content from GitHub. */
  async function startEditing() {
    store.activate()
    loadNote.value = ''
    try {
      const gh = api()
      const { files: baseFiles } = await gh.contentTree(baseBranch)

      // With an open draft, show the draft's version so new saves build on it
      // (conflict checks still compare against the base branch).
      let files = baseFiles
      if (draft.value) {
        const open = await gh.pullRequestIsOpen(draft.value.number).catch(() => false)
        if (open) files = (await gh.contentTree(draft.value.branch)).files
        else clearDraft()
      }

      if (!Object.keys(files).length) {
        loadNote.value = `No content found on the "${baseBranch}" branch yet. Showing this build's content.`
        restoreUnsaved()
        return
      }
      await Promise.all(Object.entries(files).map(async ([path, sha]) => {
        store.loadRemote(path, await gh.readBlobJson(sha), baseFiles[path] ?? '')
      }))
      // Files the draft deleted shouldn't reappear from the bundled copy.
      if (files !== baseFiles) {
        for (const path of Object.keys(store.state.value.files)) {
          if (!(path in files)) delete store.state.value.files[path]
        }
      }
      restoreUnsaved()
    } catch (e) {
      restoreUnsaved()
      loadNote.value = `Couldn't load the latest content from GitHub (${e instanceof Error ? e.message : 'unknown error'}). Showing this build's content.`
    }
  }

  /** Keep unsaved edits in this tab while the editor logs in again. */
  function stashUnsaved() {
    try {
      const s = store.state.value
      sessionStorage.setItem(UNSAVED_KEY, JSON.stringify({ files: s.files, assets: s.assets }))
    } catch {
      // Too big for sessionStorage (large images): edits will be lost on re-login.
    }
  }

  function restoreUnsaved() {
    try {
      const raw = sessionStorage.getItem(UNSAVED_KEY)
      if (!raw) return
      sessionStorage.removeItem(UNSAVED_KEY)
      const saved = JSON.parse(raw) as { files: Record<string, WorkingFile>; assets: Record<string, StagedAsset> }
      for (const asset of Object.values(saved.assets)) {
        const bytes = Uint8Array.from(atob(asset.base64), c => c.charCodeAt(0))
        asset.objectUrl = URL.createObjectURL(new Blob([bytes]))
      }
      store.state.value.files = saved.files
      store.state.value.assets = saved.assets
    } catch {}
  }

  function clearDraft() {
    draft.value = null
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {}
  }

  function signOut() {
    session.value = null
    draft.value = null
    store.deactivate()
    saveStatus.value = { state: 'idle' }
    try {
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {}
  }

  function loginUrl(returnTo = '/') {
    return `/.netlify/functions/auth?return=${encodeURIComponent(returnTo)}`
  }

  /**
   * Save all changes as a pull request. The first save opens a draft PR;
   * later saves in the same session add commits to it.
   */
  async function save(message: string) {
    const s = session.value
    if (!s) return
    if (s.expiresAt < Date.now()) {
      saveStatus.value = { state: 'error', message: 'Your login expired. Log in again to save (your edits stay on this page).' }
      return
    }
    const changes = store.changes.value
    if (!changes.length) return

    saveStatus.value = { state: 'saving' }
    try {
      const gh = api()

      // Someone else changed the same file on GitHub since we loaded it?
      const { files: remote } = await gh.contentTree(baseBranch)
      const conflicts = changes.filter(c =>
        (c.file.remoteSha && remote[c.path] && remote[c.path] !== c.file.remoteSha)
        || (c.kind === 'created' && remote[c.path] && !draft.value),
      )
      if (conflicts.length) {
        throw new Error(`Someone else changed ${conflicts.map(c => c.path.split('/').pop()).join(', ')} since you started. Copy your edits, reload the page, and try again.`)
      }

      const files = changes.map(c => ({ path: c.path, content: c.kind === 'deleted' ? null : stableJson(c.file.data) }))
      const binaries = store.usedAssets.value.map(a => ({ path: a.repoPath, base64: a.base64 }))
      const commitMessage = `${message}\n\nEdited by @${s.login} with the SEASI website editor.`

      // Keep adding to the open draft; start a new one if it was merged or closed.
      let current = draft.value
      if (current && !(await gh.pullRequestIsOpen(current.number).catch(() => false))) current = null

      if (current) {
        const commitSha = await gh.commitFiles({ fromBranch: current.branch, toBranch: current.branch, createBranch: false, message: commitMessage, files, binaries })
        current = { ...current, commitSha }
      } else {
        const branch = `site-edits/${s.login.toLowerCase()}-${timestamp()}`
        const commitSha = await gh.commitFiles({ fromBranch: baseBranch, toBranch: branch, createBranch: true, message: commitMessage, files, binaries })
        const pr = await gh.openPullRequest({
          base: baseBranch,
          head: branch,
          title: message,
          body: [
            `Website edits by @${s.login}, made with the SEASI website editor.`,
            '',
            'Check the Netlify deploy preview below, then merge to publish.',
            '',
            ...changes.map(c => `- ${c.kind}: \`${c.path}\``),
            ...binaries.map(b => `- image: \`${b.path}\``),
          ].join('\n'),
        })
        current = { branch, number: pr.number, url: pr.url, commitSha }
      }

      draft.value = current
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(current))
      } catch {}
      store.markSaved()
      saveStatus.value = { state: 'saved', preview: 'waiting' }
      pollPreview(current.commitSha)
    } catch (e) {
      saveStatus.value = { state: 'error', message: e instanceof Error ? e.message : 'Save failed.' }
    }
  }

  /** Watch for Netlify's deploy preview link (up to ~6 minutes). */
  async function pollPreview(commitSha: string) {
    const gh = api()
    for (let i = 0; i < 36; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 5000 : 10000))
      if (draft.value?.commitSha !== commitSha || saveStatus.value.state !== 'saved') return
      const result = await gh.previewUrl(commitSha).catch(() => null)
      if (!result) continue
      saveStatus.value = { state: 'saved', preview: result.state, previewUrl: 'url' in result ? result.url : undefined }
      if (result.state === 'ready' || result.state === 'failed') return
    }
  }

  return { session, draft, saveStatus, loadNote, isEditing, repo, baseBranch, restore, signIn, signOut, loginUrl, stashUnsaved, save }
}

function timestamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}
