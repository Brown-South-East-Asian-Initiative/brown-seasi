# Plan: Visual editing for the SEASI site

## Goal

SEASI members edit the website **on the page itself**: double-click text to change it, click an image to replace it, drag cards to reorder, and "+" to add new ones. No forms and no code. Every save becomes a GitHub pull request with a live preview, and the site updates once it's merged.

This is **structured** editing, not freeform Figma: members change content and order, but layout, fonts, colors and animations stay locked in code. That keeps the design (and the mobile layout) from breaking.

Everything is self-hosted in this repo. Third parties: **GitHub** (stores content, login) and **Netlify** (hosting, which we already use). No CMS service, no database, no always-on server.

## What editors will see

1. Go to `https://<site>/edit` and click **Log in with GitHub**.
2. They land on the home page in **edit mode**: the normal site plus a slim toolbar at the bottom.
3. Hovering outlines anything editable:
   - **Text:** double-click to edit in place. Enter or click away to finish.
   - **Images:** click to upload a replacement. They're asked for alt text, and the image is resized automatically.
   - **Lists** (gallery images, schedule items, stats, student works, page blocks): drag handle to reorder, **+** to add, trash to delete.
   - **Dated items** (talks, events): **+ Add talk** creates a card with placeholder text. Order follows the date.
   - **Small choices** (event type, featured on/off): a dropdown pops up on click.
4. They navigate between pages normally while staying in edit mode.
5. The toolbar shows: number of unsaved changes, **Undo**, **Discard**, **Save**.
6. **Save** asks for a one-line description ("Add Nov 10 talk"), then opens a pull request. The toolbar shows "Draft saved · preview building…" and then a **preview link**.
7. An admin opens the PR, checks the preview, and merges. The site is live about 1–2 minutes later.

Undo after publishing = revert the PR on GitHub.

## How it works

```
Browser (edit mode)                         GitHub                      Netlify
───────────────────                         ──────                      ───────
/edit → "Log in" ──────────────────────────► OAuth ◄──── netlify/functions/auth + callback
          ◄──────────── token (sessionStorage)

load content/*.json from main ◄───────────── Contents API
edit in place (reactive store)
Save:
  create branch  edit/<user>-<date> ───────► Git Data API
  commit changed JSON + images ────────────►
  open PR ─────────────────────────────────► PR ──────────────────────► deploy preview
                                            admin merges ─────────────► production build
```

- **The public site is unchanged:** a static Nuxt build that reads `content/*.json` at build time. Edit mode is client-side only, so visitors never load the editor code. It's a lazy-loaded chunk.
- **In edit mode,** content is fetched **live from GitHub** (not the built copy), so editors always start from the latest `main`, or from their own open draft branch if they resume one.
- **Saving** happens in the browser, calling the GitHub API with the editor's own token. GitHub works out the diff. The only server code is the two small OAuth functions (the login token exchange needs a secret).
- **Permissions** come from GitHub: editors need write access to the repo. Branch protection can require an admin review before merging.

## Login (GitHub App)

Login uses a **GitHub App** ("SEASI Website Editor"), not an OAuth App. The editor's token only works on `brown-seasi`, only for file contents and PRs, and expires after 8 hours. An OAuth App token would have access to every repo the person can reach.

1. The editor clicks **Log in with GitHub** on `/edit`, which redirects to `github.com/login/oauth/authorize?client_id=…&state=…`.
2. They approve on GitHub (first time only), and GitHub redirects to `/.netlify/functions/callback?code=…&state=…`.
3. The function checks `state`, then exchanges `code` plus the client secret for a user access token.
4. The function returns the token to the page, which stores it in `sessionStorage`.
5. The page calls `GET /repos/{owner}/brown-seasi` and checks `permissions.push`. If it's true, edit mode turns on. If not, it shows "Ask a SEASI admin for edit access".
6. When the token expires, the toolbar asks the editor to log in again. Unsaved edits are kept in memory and saved after re-login.

Access is managed in GitHub: add someone as a repo collaborator (or to a `website-editors` team in the SEASI org) to give access; remove them to revoke it.

GitHub App settings:

| Setting | Value |
|---|---|
| Callback URLs | `https://<site>/.netlify/functions/callback` and `http://localhost:8888/.netlify/functions/callback` (local, via `netlify dev`) |
| Expire user authorization tokens | On |
| Webhook | Off |
| Repository permissions | Contents: **Read & write** · Pull requests: **Read & write** · Commit statuses: **Read** (to find the Netlify preview link) · Metadata: Read (automatic) |
| Install on | Only `brown-seasi` |
| Secrets | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` in Netlify env vars and a local `.env` (never committed). No private key needed. |

## Building blocks (code)

| Piece | What it does |
|---|---|
| `content/**/*.json` | All editable content, one file per talk, event or work, plus page files for single pages |
| `composables/useContent.ts` | One reactive store for content. Normal mode uses the bundled JSON; edit mode uses the GitHub copy and tracks changes and undo |
| `composables/useEditor.ts` | Edit-mode state: logged-in user, token, dirty files, save, open drafts |
| `components/edit/Text.vue` (`<EditText>`) | Renders text normally. In edit mode it's `contenteditable` (plain text, or bold/italic/link for long text), with max lengths |
| `components/edit/Image.vue` (`<EditImage>`) | Click → file picker → resize/compress in the browser → asks for alt text → staged for commit under `public/uploads/` |
| `components/edit/Sortable.vue` (`<EditSortable>`) | Drag-to-reorder container (`sortablejs`); add/delete buttons live in each page |
| `components/edit/Date.vue` (`<EditDate>`) | Double-click a date to pick a new one. (A dropdown/toggle editor is still to do.) |
| `components/edit/Toolbar.vue` (`<EditToolbar>`) | Unsaved count, undo, discard, save, preview link, "your open drafts" |
| `utils/github.ts` | Thin wrapper over the GitHub REST API: read files, create branch, commit, open PR |
| `pages/edit.vue` | Login page. Turns on edit mode, then sends the editor to the site |
| `netlify/functions/auth.ts`, `callback.ts` | GitHub OAuth login (token exchange). Secrets live in Netlify env vars |

Every existing section component swaps its hardcoded text for `<EditableText>`, `<EditableImage>`, etc. Outside edit mode those render exactly like plain text and `<img>`.

---

## Phases

### Phase 0: Prep and ownership (½ day)
- [ ] Move the GitHub repo and the Netlify site under SEASI-owned accounts.
- [ ] Netlify: Git-linked, auto-publish on `main`, deploy previews for PRs. Add a `netlify.toml`.
- [ ] Fix the broken `./symposium-invite` link in `pages/symposium.vue` (it currently makes `nuxt generate` fail).
- [ ] Decide who the editors and admins are.

### Phase 1: Content out of code (1–2 days)
Mostly done already in the stash `decap-cms attempt` (`git stash list`). Restore the content files, loaders, Student Works page and dev-restart hook. Drop `public/admin/` and `decap-server`.

| Content | Currently in | Moves to |
|---|---|---|
| Speaker talks and term | `utils/speakerSeries.ts` | `content/talks/*.json`, `content/settings/speaker-series.json` ✅ in stash |
| Other events | `components/SectionEvents.vue` | `content/events/*.json` ✅ in stash |
| Student works (new page) | — | `content/student-works/*.json` ✅ in stash |
| Hero, About text and stats, ticker | `SectionHero.vue`, `SectionAbout.vue`, `TickerBar.vue` | `content/pages/home.json` |
| Annual report | `SectionAnnualReport.vue` | `content/pages/home.json` |
| Symposium details and schedule | `pages/symposium.vue` | `content/pages/symposium.json` |
| Speaker series page text | `pages/speaker-series/index.vue` | `content/pages/speaker-series.json` |
| Footer and nav | `TheFooter.vue`, `TheNav.vue` | `content/site.json` |

**Done when:** the site looks identical and every visible piece of text and image comes from `content/`.

### Phase 2: Login and GitHub plumbing (1–2 days)
- [x] Create the GitHub App (settings above) and install it on `brown-seasi` only.
- [x] `auth` / `callback` Netlify Functions (with a `state` check to block forged logins).
- [x] `/edit` login page, with the token kept in `sessionStorage` (cleared when the tab closes). Ask the editor to log in again when the 8-hour token expires.
- [x] Local dev through `netlify dev` (port 8888) so the functions run locally: `bun run dev:edit`.
- [x] `utils/github.ts`: read a file or folder from a branch; create a branch, a commit with many files and a PR; list the user's open `edit/*` PRs.
- [x] Check write access after login and show a friendly message if the user doesn't have it.

### Phase 3: Edit mode core (3–5 days)
- [x] `useContent` store: bundled vs live GitHub source, change tracking per file, undo stack.
- [x] `EditText`, `EditImage`, `EditDate`, `EditSortable`. `EditLink`, `EditSelect` (dropdowns/toggles).
- [x] `EditToolbar` with save → PR → preview link (poll the PR's Netlify status for the URL).
- [x] Warn before leaving the page with unsaved changes.
- [x] Wire up the **Speaker Series** page end to end first, as the pilot.

### Phase 4: Make every page editable (2–3 days)
- [x] Home (hero, about, stats, annual report, events), Symposium, Student Works, footer and nav.
- [x] "+ Add" templates for talks, events, student works, schedule items, stats and gallery images.
- [ ] Required-field checks before save (e.g. a talk needs a speaker and a date).

Known gaps after Phase 4:
- No PDF upload yet (editors can change a PDF's address, not upload one). Add an `EditFile` editor.
- The `./symposium-invite` link on the symposium page is broken (now editable); it also makes `nuxt generate` fail.
- Section numbers like "01 / About SEASI" are plain text; sections can't be reordered.
- Local dev: after adding content files by hand (e.g. `git pull`), restart `bun run dev:edit`.

### Phase 5: New pages from blocks (optional, 2–3 days)
- [ ] "+ New page": a title and slug, then stack blocks: text, image, gallery, button, collapsible (FAQ), embed (YouTube / Internet Archive), quote.
- [ ] One template `pages/p/[slug].vue`. Block components live in `components/blocks/`, each wrapped in the editable pieces.
- [ ] Prerender page routes from `content/pages/custom/*.json`.

### Phase 6: Guardrails, docs, handoff (1–2 days)
- [ ] Branch protection on `main` (require a PR and 1 approval from an admin).
- [x] Image limits: resize to max 2000px and compress in the browser; no audio or video uploads (link out instead).
- [ ] **Conflicts:** content is one file per item, so two drafts rarely touch the same file. If they do, the toolbar warns ("Another draft also edits this talk") and GitHub shows the conflict on the PR.
- [ ] `EDITING.md` with screenshots for members; developer notes in the README (how to make a new component editable).
- [ ] Hand off accounts and run a walkthrough with Audrey and the board.

**Rough total:** about 2–3 weeks of part-time work for Phases 0–4 (the core). Phase 5 is optional.

## Not doing (on purpose)

- Freeform positioning, resizing, or changing fonts and colors. That's a code change, which keeps the design consistent.
- Hosting audio, video or archives in the repo. Those go to the Brown Digital Repository, the Internet Archive or YouTube, with a link or embed on the site.
- Editing on phones. Edit mode targets desktop browsers.

## Open questions

- Create the GitHub App under the SEASI org now, or under a personal account and transfer it later (GitHub Apps can be transferred)?
- Who can merge (admins)? Should admins get a **Publish** button in the toolbar, or merge on GitHub?
- Custom domain? It's needed for the OAuth callback URL.
- Are editors OK making free GitHub accounts?
- Student Works: where will the oral history project be hosted?
