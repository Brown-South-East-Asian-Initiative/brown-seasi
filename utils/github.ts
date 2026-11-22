// Small GitHub REST client for the editor. Runs in the browser with the editor's own
// GitHub App token, so every commit and PR is made as that person.

const API = 'https://api.github.com'

export class GitHubError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export function github(token: string, repo: string) {
  async function call<T = any>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API}${path.replace('{repo}', `repos/${repo}`)}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message = res.status === 401
        ? 'Your login expired. Log in again to save.'
        : body.message ?? `GitHub request failed (${res.status})`
      throw new GitHubError(message, res.status)
    }
    return res.status === 204 ? (undefined as T) : res.json()
  }

  /** Latest commit sha of a branch. */
  async function branchHead(branch: string) {
    const ref = await call(`/{repo}/git/ref/heads/${encodeURIComponent(branch)}`)
    return ref.object.sha as string
  }

  /** All JSON files under content/ on a branch, with their blob shas. */
  async function contentTree(branch: string) {
    const head = await branchHead(branch)
    const tree = await call(`/{repo}/git/trees/${head}?recursive=1`)
    const files: Record<string, string> = {}
    for (const item of tree.tree as { path: string; type: string; sha: string }[]) {
      if (item.type === 'blob' && item.path.startsWith('content/') && item.path.endsWith('.json')) {
        files[item.path] = item.sha
      }
    }
    return { head, files }
  }

  async function readBlobJson(sha: string) {
    const blob = await call(`/{repo}/git/blobs/${sha}`)
    const text = new TextDecoder().decode(Uint8Array.from(atob(blob.content.replace(/\n/g, '')), c => c.charCodeAt(0)))
    return JSON.parse(text)
  }

  /**
   * Commit file changes on top of `fromBranch` and point `toBranch` at the new commit
   * (creating it if needed). GitHub works out the diff; we only send new contents.
   */
  async function commitFiles(opts: {
    fromBranch: string
    toBranch: string
    createBranch: boolean
    message: string
    files: { path: string; content: string | null }[]
    binaries: { path: string; base64: string }[]
  }) {
    const parentSha = await branchHead(opts.fromBranch)
    const parent = await call(`/{repo}/git/commits/${parentSha}`)

    const binaryEntries = await Promise.all(opts.binaries.map(async (b) => {
      const blob = await call(`/{repo}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: b.base64, encoding: 'base64' }) })
      return { path: b.path, mode: '100644', type: 'blob', sha: blob.sha as string }
    }))
    const textEntries = opts.files.map(f => f.content === null
      ? { path: f.path, mode: '100644', type: 'blob', sha: null }
      : { path: f.path, mode: '100644', type: 'blob', content: f.content })

    const tree = await call(`/{repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: parent.tree.sha, tree: [...textEntries, ...binaryEntries] }),
    })
    const commit = await call(`/{repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message: opts.message, tree: tree.sha, parents: [parentSha] }),
    })
    if (opts.createBranch) {
      await call(`/{repo}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${opts.toBranch}`, sha: commit.sha }) })
    } else {
      await call(`/{repo}/git/refs/heads/${encodeURIComponent(opts.toBranch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) })
    }
    return commit.sha as string
  }

  async function openPullRequest(opts: { base: string; head: string; title: string; body: string }) {
    const pr = await call(`/{repo}/pulls`, { method: 'POST', body: JSON.stringify(opts) })
    return { number: pr.number as number, url: pr.html_url as string }
  }

  async function pullRequestIsOpen(number: number) {
    const pr = await call(`/{repo}/pulls/${number}`)
    return pr.state === 'open'
  }

  /** Netlify posts the deploy preview link as a commit status. */
  async function previewUrl(commitSha: string) {
    const status = await call(`/{repo}/commits/${commitSha}/status`)
    const preview = (status.statuses as { context: string; state: string; target_url: string | null }[])
      .find(s => /netlify.*deploy-preview/i.test(s.context))
    if (!preview) return { state: 'waiting' as const }
    if (preview.state === 'success' && preview.target_url) return { state: 'ready' as const, url: preview.target_url }
    if (preview.state === 'failure' || preview.state === 'error') return { state: 'failed' as const, url: preview.target_url ?? undefined }
    return { state: 'building' as const }
  }

  return { call, branchHead, contentTree, readBlobJson, commitFiles, openPullRequest, pullRequestIsOpen, previewUrl }
}

/** Read a File as base64 (no data: prefix). */
export function fileToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
