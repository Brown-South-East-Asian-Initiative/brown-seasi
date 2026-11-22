# Brown SEASI — Website

Marketing and information site for the **Southeast Asian Studies Initiative (SEASI)** at [Brown University](https://www.brown.edu/) — a student- and community-led effort to grow Southeast Asian studies through advocacy, programming, faculty support, and academic proposals.

## What’s on the site

- **Home** — Hero, about SEASI, publications (annual report), events, image breakers, and marquees.
- **Symposium** (`/symposium`) — 6th Annual Symposium (2026): schedule, venue, and RSVP/contact links.

Design direction: editorial typography (Cormorant Garamond + DM Sans), crimson accents aligned with Brown, and motion used for hero load, scroll reveals, parallax on large images, and animated stats on the about section.

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | [Nuxt 4](https://nuxt.com/) (Vue 3) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) (`tailwind.config.ts` for theme tokens) |
| Animation | [GSAP](https://gsap.com/) + ScrollTrigger (`plugins/gsap.client.ts`) |
| Utilities | [VueUse](https://vueuse.org/) (`@vueuse/nuxt`) |

## Project layout

```
brown-seasi/
├── assets/css/main.css       # Global base styles
├── components/               # Page sections and UI
│   ├── SectionHero.vue
│   ├── SectionAbout.vue
│   ├── SectionAnnualReport.vue
│   ├── SectionEvents.vue
│   ├── SectionImageBreaker.vue
│   ├── TheNav.vue
│   ├── TheFooter.vue
│   ├── TickerBar.vue
│   └── SymposiumHero.vue
├── composables/              # useScrollReveal, useImageParallax
├── pages/
│   ├── index.vue             # Home
│   └── symposium.vue         # Symposium
├── plugins/gsap.client.ts    # Registers GSAP ScrollTrigger (client-only)
├── public/images/            # Static images (logo, photos, backgrounds)
├── nuxt.config.ts
└── tailwind.config.ts
```

## Setup

Install dependencies (this repo uses [Bun](https://bun.sh/); npm/pnpm/yarn work too):

```bash
bun install
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server (default: http://localhost:3000), view only |
| `bun run dev:edit` | Dev server with the editor login: http://localhost:8888 (runs `netlify dev`, loads `.env`) |
| `bun run build` | Production build |
| `bun run preview` | Preview production build locally |
| `bun run generate` | Static generation (`nuxt generate`) |

## Environment

Copy `.env.example` to `.env` and fill it in. Set the same variables in Netlify → Environment variables.

| Variable | Used for |
|---|---|
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub App "SEASI Website Editor" (editor login). Never commit the secret. |
| `NUXT_PUBLIC_SITE_URL` | Primary domain (`https://seasi.org`): share-preview URLs and the login redirect allowlist |
| `NUXT_PUBLIC_GITHUB_BRANCH` (optional) | Branch the editor reads from and opens PRs against. Default `main`. |
| `NUXT_PUBLIC_GITHUB_REPO` (optional) | `owner/name` of the repo. Default `Brown-South-East-Asian-Initiative/brown-seasi`. |

## Website editor

Members edit the site in place at `/edit` (guide: [EDITING.md](EDITING.md)). How it works:

- **Content lives in `content/**/*.json`**, never in components. Components read it with `useContentFile(path)`, `useCollection(folder)` or `useTalks()` (`composables/useContent.ts`).
- **Editable pieces** wrap content in `components/edit/`: `<EditText>`, `<EditImage>`, `<EditLink>` (with optional `upload="application/pdf"`), `<EditDate>`, `<EditSelect>`, `<EditSortable>`. Outside edit mode they render plain HTML, so visitors never see editor UI.
- **Login:** `netlify/functions/auth.mts` + `callback.mts` (GitHub App OAuth; helpers in `netlify/lib/oauth.mts`). The token stays in the editor's tab (`sessionStorage`).
- **Saving** (`composables/useEditor.ts`, `utils/github.ts`): the browser commits changed JSON files and uploads (`public/uploads/`) to a `site-edits/<user>-<time>` branch and opens a PR. Netlify builds a deploy preview; merging publishes.
- **Making a new section editable:** move its text into a JSON file under `content/`, read it with `useContentFile`, and swap hardcoded text/images/links for the `Edit*` components. See `pages/speaker-series/index.vue` for lists with add/remove/reorder.
- **Local dev:** after adding content files by hand (e.g. `git pull`), restart `bun run dev:edit`.

## License / content

Content reflects SEASI’s public messaging. Replace or extend copy and assets under `public/images/` as needed for your deployment.
