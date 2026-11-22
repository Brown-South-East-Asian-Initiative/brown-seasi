// One store for all site content (content/**/*.json).
//
// - Normal visitors: reads the JSON bundled into the build. Nothing else happens.
// - Edit mode: a working copy is made, edits go into it, and we track what changed
//   so Save can commit only those files (see utils/github.ts).

type Json = Record<string, any>

const bundledModules = import.meta.glob<Json>('../content/**/*.json', { eager: true, import: 'default' })

/** Bundled content keyed by repo path, e.g. "content/talks/juno-parrenas.json". */
const bundled: Record<string, Json> = Object.fromEntries(
  Object.entries(bundledModules).map(([key, data]) => [key.replace(/^\.\.\//, ''), data]),
)

export interface WorkingFile {
  data: Json
  /** JSON as last loaded or saved; used to detect changes. */
  original: string | null
  /** Git blob sha on the base branch, when loaded from GitHub (for conflict checks). */
  remoteSha?: string
  deleted?: boolean
}

export interface StagedAsset {
  /** Repo path, e.g. "public/uploads/talk-portrait-123.jpg". */
  repoPath: string
  base64: string
  objectUrl: string
}

interface ContentState {
  active: boolean
  files: Record<string, WorkingFile>
  /** Uploaded images not yet committed, keyed by public URL ("/uploads/…"). */
  assets: Record<string, StagedAsset>
  undo: string[]
}

const UNDO_LIMIT = 100

export function useContentStore() {
  const state = useState<ContentState>('content-store', () => ({ active: false, files: {}, assets: {}, undo: [] }))

  /** Start editing: copy bundled content into a working set. Client only. */
  function activate() {
    if (state.value.active) return
    const files: Record<string, WorkingFile> = {}
    for (const [path, data] of Object.entries(bundled)) {
      files[path] = { data: structuredClone(data), original: stableJson(data) }
    }
    state.value = { active: true, files, assets: {}, undo: [] }
  }

  function deactivate() {
    for (const a of Object.values(state.value.assets)) URL.revokeObjectURL(a.objectUrl)
    state.value = { active: false, files: {}, assets: {}, undo: [] }
  }

  /** Read one file (working copy in edit mode, bundled otherwise). */
  function read(path: string): Json | undefined {
    if (state.value.active) {
      const f = state.value.files[path]
      return f && !f.deleted ? f.data : undefined
    }
    return bundled[path]
  }

  /** Read one field by dot path, e.g. get(path, "gallery.0.caption"). */
  function get(path: string, field: string) {
    return getPath(read(path), field)
  }

  /** All files in a folder, e.g. "content/talks". */
  function list(folder: string): { path: string; data: Json }[] {
    const prefix = `${folder.replace(/\/$/, '')}/`
    const source = state.value.active
      ? Object.entries(state.value.files).filter(([, f]) => !f.deleted).map(([p, f]) => [p, f.data] as const)
      : Object.entries(bundled)
    return source
      .filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
      .map(([path, data]) => ({ path, data }))
  }

  function snapshot() {
    const s = state.value
    s.undo.push(JSON.stringify(s.files))
    if (s.undo.length > UNDO_LIMIT) s.undo.shift()
  }

  /** Change one field. `field` is a dot path like "gallery.2.caption". */
  function set(path: string, field: string, value: unknown) {
    const file = state.value.files[path]
    if (!file) return
    if (getPath(file.data, field) === value) return
    snapshot()
    setPath(file.data, field, value)
  }

  /** Apply any change to a file's data in one undo step. */
  function update(path: string, fn: (data: Json) => void) {
    const file = state.value.files[path]
    if (!file) return
    snapshot()
    fn(file.data)
  }

  function create(path: string, data: Json) {
    snapshot()
    state.value.files[path] = { data, original: null }
  }

  function remove(path: string) {
    const file = state.value.files[path]
    if (!file) return
    snapshot()
    if (file.original === null && !file.remoteSha) delete state.value.files[path]
    else file.deleted = true
  }

  function undo() {
    const prev = state.value.undo.pop()
    if (prev) state.value.files = JSON.parse(prev)
  }

  /** Throw away all unsaved edits. */
  function discard() {
    const s = state.value
    for (const [path, f] of Object.entries(s.files)) {
      if (f.original === null) delete s.files[path]
      else {
        f.data = JSON.parse(f.original)
        f.deleted = false
      }
    }
    for (const a of Object.values(s.assets)) URL.revokeObjectURL(a.objectUrl)
    s.assets = {}
    s.undo = []
  }

  /** Files that differ from what was loaded. */
  const changes = computed(() => {
    const out: { path: string; kind: 'created' | 'updated' | 'deleted'; file: WorkingFile }[] = []
    for (const [path, f] of Object.entries(state.value.files)) {
      if (f.deleted) {
        if (f.original !== null || f.remoteSha) out.push({ path, kind: 'deleted', file: f })
      } else if (f.original === null) out.push({ path, kind: 'created', file: f })
      else if (stableJson(f.data) !== f.original) out.push({ path, kind: 'updated', file: f })
    }
    return out
  })

  /** Staged images still referenced by changed content (removed ones are skipped). */
  const usedAssets = computed(() => {
    const text = changes.value.filter(c => c.kind !== 'deleted').map(c => JSON.stringify(c.file.data)).join('\n')
    return Object.entries(state.value.assets).filter(([url]) => text.includes(JSON.stringify(url))).map(([, a]) => a)
  })

  function stageAsset(publicUrl: string, asset: StagedAsset) {
    state.value.assets[publicUrl] = asset
  }

  /** Show staged (not yet committed) images from memory. */
  function assetSrc(src: string | undefined) {
    if (!src) return src
    return state.value.assets[src]?.objectUrl ?? src
  }

  /** After a successful save: what's in the working copy is the new baseline. */
  // remoteSha is kept as the base-branch version, so later conflict checks still compare against main.
  function markSaved() {
    const s = state.value
    for (const [path, f] of Object.entries(s.files)) {
      if (f.deleted) {
        delete s.files[path]
        continue
      }
      f.original = stableJson(f.data)
    }
    s.assets = {}
    s.undo = []
  }

  /** Replace a file with the version on GitHub (only if the editor hasn't touched it). */
  function loadRemote(path: string, data: Json, sha: string) {
    const existing = state.value.files[path]
    const untouched = !existing || (existing.original !== null && stableJson(existing.data) === existing.original && !existing.deleted)
    if (existing && !untouched) {
      existing.remoteSha = existing.remoteSha ?? sha
      return
    }
    state.value.files[path] = { data, original: stableJson(data), remoteSha: sha }
  }

  return {
    state, activate, deactivate, read, get, list, set, update, create, remove, undo, discard,
    changes, usedAssets, stageAsset, assetSrc, markSaved, loadRemote,
    canUndo: computed(() => state.value.undo.length > 0),
  }
}

/** Reactive single file, e.g. useContentFile<{ term: string }>('content/settings/speaker-series.json'). */
export function useContentFile<T = Json>(path: string) {
  const store = useContentStore()
  return computed(() => store.read(path) as T | undefined)
}

/** Reactive folder of entries, each with its file path (needed for editing). */
export function useCollection<T = Json>(folder: string) {
  const store = useContentStore()
  return computed(() => store.list(folder) as { path: string; data: T }[])
}

export function stableJson(data: unknown) {
  return `${JSON.stringify(data, null, 2)}\n`
}

function getPath(obj: any, field: string) {
  return field.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
}

function setPath(obj: any, field: string, value: unknown) {
  const keys = field.split('.')
  const last = keys.pop()!
  let target = obj
  for (const [i, k] of keys.entries()) {
    if (target[k] == null) target[k] = /^\d+$/.test(keys[i + 1] ?? last) ? [] : {}
    target = target[k]
  }
  if (value === '' || value === undefined) {
    if (Array.isArray(target)) target[Number(last)] = value ?? ''
    else delete target[last]
  } else {
    target[last] = value
  }
}

export function slugify(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled'
}

/** Speaker series talks, sorted by date. Each item has `path` (its file) for editing. */
export function useTalks() {
  const talks = useCollection<SpeakerTalk>(TALKS_FOLDER)
  return computed(() => [...talks.value].sort((a, b) => a.data.date.localeCompare(b.data.date)))
}
