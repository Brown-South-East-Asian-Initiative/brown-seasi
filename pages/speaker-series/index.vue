<script setup lang="ts">
import { gsap } from 'gsap'

const title = 'Speaker Series — Brown SEASI'
const description =
  "SEASI's Lecture Series brings leading scholars and writers on Southeast Asia to Brown University, as part of the SEAS@Brown Program Series."

const ogImage = useSiteAssetUrl('/images/website-preview.png')

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage,
  ogImageAlt: 'Brown Southeast Asian Studies Initiative — Brown University',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: ogImage,
})

const { isEditing } = useEditor()
const store = useContentStore()
const talkEntries = useTalks()
/** Talk data plus `path`, the file it lives in (used by the editor). */
const talks = computed(() => talkEntries.value.map(({ path, data }) => ({ ...data, path })))
const nextTalk = computed(() => talks.value.find(t => !isTalkPast(t.date)) ?? talks.value[talks.value.length - 1])
const seriesTerm = useContentFile<{ term: string }>(SPEAKER_SERIES_SETTINGS)
/** Page text (headings, intro, about blurb) lives in content/pages/speaker-series.json. */
const PAGE = 'content/pages/speaker-series.json'

// All talks start expanded; each can be collapsed in place. In edit mode everything stays open.
const collapsed = ref(new Set<string>())
const isOpen = (slug: string) => isEditing.value || !collapsed.value.has(slug)

function toggleTalk(slug: string) {
  const next = new Set(collapsed.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  collapsed.value = next
}

// ── Editing actions ───────────────────────────────────────────
function addTalk() {
  const speaker = window.prompt('Speaker name for the new talk:')?.trim()
  if (!speaker) return
  let slug = slugify(speaker)
  while (store.read(`${TALKS_FOLDER}/${slug}.json`)) slug = `${slug}-2`
  const inTwoWeeks = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)
  store.create(`${TALKS_FOLDER}/${slug}.json`, { slug, date: inTwoWeeks, speaker, affiliation: 'Affiliation' })
  nextTick(() => document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

function deleteTalk(talk: { path: string; speaker: string }) {
  if (window.confirm(`Delete the talk by ${talk.speaker}? (You can undo before saving.)`)) store.remove(talk.path)
}

/** Flyers may be stored as a single string; editing always uses a list. */
function ensureFlyerArray(data: Record<string, any>) {
  if (!data.flyer) data.flyer = []
  else if (!Array.isArray(data.flyer)) data.flyer = [data.flyer]
  return data.flyer as string[]
}

async function addFlyer(path: string) {
  const url = await pickImage()
  if (url) store.update(path, data => ensureFlyerArray(data).push(url))
}

async function addPhoto(path: string) {
  const url = await pickImage()
  if (!url) return
  const alt = window.prompt('Describe this photo for people using screen readers (alt text):') ?? ''
  store.update(path, (data) => {
    data.gallery ??= []
    data.gallery.push({ src: url, alt: alt.trim() })
  })
}

function removeFlyer(path: string, index: number) {
  store.update(path, (data) => {
    const list = ensureFlyerArray(data)
    list.splice(index, 1)
    if (!list.length) delete data.flyer
  })
}

function removePhoto(path: string, index: number) {
  store.update(path, (data) => {
    data.gallery.splice(index, 1)
    if (!data.gallery.length) delete data.gallery
  })
}

async function pickImage() {
  try {
    return await pickAndStageImage()
  } catch (e) {
    window.alert(e instanceof Error ? e.message : 'Could not use that image.')
    return null
  }
}

/** Drag-to-reorder inside a talk's image grid (flyers and photos are separate lists). */
function reorderMedia(path: string, list: string, from: number, to: number) {
  store.update(path, (data) => {
    if (list === 'flyer') moveItem(ensureFlyerArray(data), from, to)
    else moveItem(data.gallery, from, to)
  })
}

const hero = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const aboutRef = ref<HTMLElement | null>(null)

useScrollReveal(listRef)
useScrollReveal(aboutRef)

onMounted(() => {
  const section = hero.value
  if (!section) return
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.ss-label', { opacity: 0, y: 24, duration: 0.7 }, 0.08)
      .from('.ss-title', { opacity: 0, y: 36, duration: 0.85 }, 0.18)
      .from('.ss-subtitle', { opacity: 0, y: 20, duration: 0.65 }, 0.32)
      .from('.ss-next', { opacity: 0, y: 32, duration: 0.75 }, 0.45)
  }, section)
  onUnmounted(() => ctx.revert())
})
</script>

<template>
  <div class="min-h-screen bg-ivory">
    <TheNav />

    <section ref="hero" class="relative bg-crimson-deep overflow-hidden border-b border-crimson-vivid/20">
      <div
        class="absolute inset-0 opacity-[0.06] pointer-events-none"
        style="background-image: repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)"
      />
      <div class="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-crimson/25 to-transparent pointer-events-none" />

      <div class="relative z-10 max-w-8xl mx-auto px-6 md:px-10 pt-32 pb-20 md:pt-44 md:pb-28">
        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-12 lg:gap-16 items-end">
          <div>
            <div class="ss-label mb-6">
              <span class="font-mono text-2xs uppercase tracking-widest text-ivory/70 border border-crimson-vivid/40 bg-ink/15 rounded-full px-3 py-1 inline-block ring-1 ring-crimson-vivid/20">
                <EditText :file="SPEAKER_SERIES_SETTINGS" field="term" required placeholder="Term" /> · <EditText :file="PAGE" field="programLabel" required />
              </span>
            </div>
            <h1 class="ss-title font-cormorant font-bold text-ivory leading-none mb-2">
              <span class="block text-[clamp(3.5rem,10vw,10rem)] tracking-tighter leading-[0.88] drop-shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
                <EditText :file="PAGE" field="title" required />
              </span>
            </h1>
            <p class="ss-subtitle font-cormorant text-[clamp(1.6rem,3.8vw,3.75rem)] tracking-tight text-ivory/70 font-light italic max-w-3xl">
              <EditText :file="PAGE" field="subtitle" />
            </p>
          </div>

          <NuxtLink
            v-if="nextTalk"
            :to="`#${nextTalk.slug}`"
            class="ss-next group block bg-white/5 border border-crimson-vivid/25 rounded-lg p-5 hover:bg-white/10 hover:border-crimson-vivid/50 transition-all duration-300"
          >
            <p class="font-mono text-2xs uppercase tracking-widest text-crimson-vivid mb-4">
              {{ isTalkPast(nextTalk.date) ? 'Latest talk' : 'Next talk' }}
            </p>
            <div class="flex items-center gap-4">
              <img
                v-if="nextTalk.portrait"
                :src="store.assetSrc(nextTalk.portrait)"
                :alt="`Portrait of ${nextTalk.speaker}`"
                class="w-20 h-20 rounded-full object-cover object-[center_20%] ring-2 ring-crimson-vivid/40 shrink-0"
              >
              <div class="min-w-0">
                <h2 class="font-cormorant font-semibold text-2xl text-ivory leading-tight">{{ nextTalk.speaker }}</h2>
                <p class="font-sans text-xs text-ivory/55 mt-1">{{ nextTalk.affiliation }}</p>
              </div>
            </div>
            <p v-if="nextTalk.title" class="font-cormorant italic text-xl text-ivory/85 mt-4">
              {{ formatTalkTitle(nextTalk.title) }}
            </p>
            <p class="font-mono text-2xs uppercase tracking-widest text-ivory/60 mt-4 flex items-center justify-between gap-4">
              <span>{{ formatTalkDate(nextTalk.date, 'short') }}</span>
              <span class="text-ivory/80 group-hover:translate-x-1 transition-transform">Details →</span>
            </p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section ref="listRef" class="bg-white py-20 md:py-32">
      <div class="max-w-8xl mx-auto px-6 md:px-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p data-reveal class="font-mono text-2xs uppercase tracking-widest text-crimson mb-4">
              {{ seriesTerm?.term }} <EditText :file="PAGE" field="lineupLabel" required />
            </p>
            <h2 data-reveal class="font-cormorant font-semibold text-[clamp(2.5rem,6vw,5.5rem)] tracking-tighter leading-none text-ink">
              <EditText :file="PAGE" field="listHeading" required />
            </h2>
          </div>
          <p data-reveal class="font-sans text-sm text-muted max-w-xs leading-relaxed md:text-right border-l-2 md:border-l-0 md:border-r-2 border-crimson/25 pl-4 md:pl-0 md:pr-4">
            <EditText :file="PAGE" field="listIntro" multiline />
          </p>
        </div>

        <div v-if="isEditing" class="mb-6">
          <button type="button" class="seasi-edit-add w-full min-h-0 py-4" @click="addTalk">+ Add talk</button>
        </div>

        <div class="flex flex-col divide-y divide-border border-y border-border">
          <article
            v-for="talk in talks"
            :id="talk.slug"
            :key="talk.path"
            data-reveal
            class="scroll-mt-24"
          >
            <component
              :is="isEditing ? 'div' : 'button'"
              :type="isEditing ? undefined : 'button'"
              class="group w-full text-left grid grid-cols-[4.5rem_minmax(0,1fr)_auto] md:grid-cols-[7rem_5.5rem_minmax(0,1fr)_auto] items-center gap-x-6 md:gap-x-8 gap-y-3 py-8 md:py-10"
              :aria-expanded="isEditing ? undefined : isOpen(talk.slug)"
              :aria-controls="isEditing ? undefined : `${talk.slug}-details`"
              @click="!isEditing && toggleTalk(talk.slug)"
            >
              <EditDate :file="talk.path" field="date" tag="div" class="text-center md:text-left">
                <span class="block font-cormorant font-semibold text-5xl md:text-6xl leading-none text-ink group-hover:text-crimson transition-colors">
                  {{ talkDateParts(talk.date).day }}
                </span>
                <span class="block font-mono text-2xs uppercase tracking-widest text-muted mt-1">
                  {{ talkDateParts(talk.date).month }} · {{ talkDateParts(talk.date).weekday }}
                </span>
              </EditDate>

              <div class="hidden md:block">
                <EditImage
                  :file="talk.path"
                  field="portrait"
                  :alt="`Portrait of ${talk.speaker}`"
                  class="w-20 h-20 rounded-full object-cover object-[center_20%] ring-1 ring-crimson/20 group-hover:ring-crimson/60 transition"
                  loading="lazy"
                >
                  <template #empty="{ pick, editing }">
                    <component
                      :is="editing ? 'button' : 'div'"
                      :type="editing ? 'button' : undefined"
                      class="w-20 h-20 rounded-full bg-ivory-dark ring-1 ring-border flex items-center justify-center font-cormorant text-2xl text-muted"
                      :class="editing ? 'seasi-edit seasi-edit--image' : ''"
                      :title="editing ? 'Add a portrait' : undefined"
                      @click="editing && pick()"
                    >
                      {{ editing ? '+' : talk.speaker.split(' ').map(w => w[0]).slice(0, 2).join('') }}
                    </component>
                  </template>
                </EditImage>
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-3 mb-2">
                  <span
                    v-if="isTalkPast(talk.date)"
                    class="font-mono text-2xs uppercase tracking-widest text-muted/50"
                  >Past</span>
                  <span
                    v-else-if="talk.slug === nextTalk?.slug"
                    class="font-mono text-2xs uppercase tracking-widest px-2.5 py-1 rounded-full bg-crimson/12 text-crimson ring-1 ring-crimson/30"
                  >Up next</span>
                  <EditText :file="talk.path" field="affiliation" required placeholder="Affiliation" class="font-mono text-2xs uppercase tracking-widest text-muted" />
                </div>
                <EditText
                  :file="talk.path"
                  field="speaker"
                  tag="h3"
                  required
                  class="font-cormorant font-semibold text-3xl md:text-4xl text-ink leading-tight group-hover:text-crimson transition-colors"
                />
                <EditText
                  :file="talk.path"
                  field="title"
                  tag="p"
                  :format="formatTalkTitle"
                  empty="Talk title to be announced"
                  placeholder="Talk title (leave empty while TBA)"
                  class="font-cormorant italic text-lg md:text-xl mt-1"
                  :class="talk.title ? 'text-ink-light' : 'text-muted/60'"
                />
              </div>

              <div class="flex items-center">
                <button
                  v-if="isEditing"
                  type="button"
                  class="w-10 h-10 rounded-full border border-border hover:border-crimson hover:bg-crimson hover:text-ivory text-muted flex items-center justify-center transition-all duration-300"
                  title="Delete this talk"
                  @click="deleteTalk(talk)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                </button>
                <div v-else class="w-10 h-10 rounded-full border border-border group-hover:border-crimson group-hover:bg-crimson flex items-center justify-center transition-all duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="w-4 h-4 text-muted group-hover:text-ivory transition-all duration-300"
                    :class="isOpen(talk.slug) ? 'rotate-180' : ''"
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </component>

            <div
              :id="`${talk.slug}-details`"
              class="grid transition-[grid-template-rows] duration-500 ease-editorial"
              :class="isOpen(talk.slug) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="overflow-hidden">
                <div class="pb-10 md:pb-14 md:pl-[13.5rem] md:pr-18">
                  <EditText
                    v-if="talk.role || isEditing"
                    :file="talk.path"
                    field="role"
                    tag="p"
                    placeholder="Speaker's role or position (optional)"
                    class="block font-sans text-sm text-muted leading-relaxed max-w-2xl mb-6"
                  />

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden ring-1 ring-border">
                    <div class="bg-ivory/60 p-5">
                      <p class="font-mono text-2xs uppercase tracking-widest text-crimson mb-2">Date</p>
                      <EditDate
                        :file="talk.path"
                        field="date"
                        tag="p"
                        :format="iso => formatTalkDate(iso)"
                        class="font-cormorant text-xl leading-snug text-ink font-semibold"
                      />
                    </div>
                    <div
                      v-for="d in [
                        { label: 'Time', field: 'time', value: talk.time, hint: 'e.g. 5:30 – 7:00 PM' },
                        { label: 'Location', field: 'location', value: talk.location, hint: 'Building and room' },
                      ]"
                      :key="d.label"
                      class="bg-ivory/60 p-5"
                    >
                      <p class="font-mono text-2xs uppercase tracking-widest text-crimson mb-2">{{ d.label }}</p>
                      <EditText
                        :file="talk.path"
                        :field="d.field"
                        tag="p"
                        empty="To be announced"
                        :placeholder="d.hint"
                        class="font-cormorant text-xl leading-snug"
                        :class="d.value ? 'text-ink font-semibold' : 'text-muted/60 italic'"
                      />
                    </div>
                  </div>

                  <EditText
                    v-if="talk.abstract || isEditing"
                    :file="talk.path"
                    field="abstract"
                    tag="p"
                    multiline
                    placeholder="Abstract (optional). Ctrl/⌘ + Enter to finish."
                    class="block font-sans text-base text-ink-light leading-relaxed max-w-2xl mt-6 whitespace-pre-line"
                  />

                  <EditSortable
                    v-if="flyerImages(talk).length || talk.gallery?.length || isEditing"
                    class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
                    @move="(list, from, to) => reorderMedia(talk.path, list, from, to)"
                  >
                    <a
                      v-for="(src, i) in flyerImages(talk)"
                      :key="`flyer-${i}-${src}`"
                      data-sort="flyer"
                      :data-index="i"
                      :href="talk.flyerDownload ? encodeURI(talk.flyerDownload) : src"
                      target="_blank"
                      rel="noopener"
                      class="group/img row-span-2 lg:row-span-1 overflow-hidden rounded-lg ring-1 ring-crimson/15 bg-white"
                      :class="isEditing ? 'cursor-grab' : ''"
                    >
                      <EditImage
                        :file="talk.path"
                        :field="Array.isArray(talk.flyer) ? `flyer.${i}` : 'flyer'"
                        :alt="`Lecture Series flyer${flyerImages(talk).length > 1 ? ` ${i + 1}` : ''} for ${talk.speaker}`"
                        class="w-full h-full object-cover object-top transition-transform duration-500 group-hover/img:scale-[1.03] lg:aspect-[3/4]"
                        loading="lazy"
                      />
                      <button
                        v-if="isEditing"
                        type="button"
                        class="seasi-edit-chip right-1.5"
                        title="Remove flyer"
                        @click.prevent.stop="removeFlyer(talk.path, i)"
                      >✕</button>
                    </a>
                    <figure
                      v-for="(img, i) in talk.gallery"
                      :key="`photo-${i}-${img.src}`"
                      data-sort="photo"
                      :data-index="i"
                      class="group/img overflow-hidden rounded-lg ring-1 ring-crimson/15 bg-white"
                      :class="isEditing ? 'cursor-grab' : ''"
                    >
                      <div class="overflow-hidden">
                        <EditImage
                          :file="talk.path"
                          :field="`gallery.${i}.src`"
                          :alt-field="`gallery.${i}.alt`"
                          class="aspect-[4/3] lg:aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover/img:scale-[1.03]"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <figcaption v-if="img.caption || isEditing" class="px-3 py-2">
                        <EditText
                          :file="talk.path"
                          :field="`gallery.${i}.caption`"
                          placeholder="Caption"
                          class="font-mono text-2xs uppercase tracking-widest text-muted"
                        />
                      </figcaption>
                      <button
                        v-if="isEditing"
                        type="button"
                        class="seasi-edit-chip right-1.5"
                        title="Remove photo"
                        @click.prevent.stop="removePhoto(talk.path, i)"
                      >✕</button>
                    </figure>
                    <template v-if="isEditing">
                      <button type="button" class="seasi-edit-add" @click="addFlyer(talk.path)">+ Flyer</button>
                      <button type="button" class="seasi-edit-add" @click="addPhoto(talk.path)">+ Photo</button>
                    </template>
                  </EditSortable>

                  <div class="mt-6 flex flex-wrap gap-3">
                    <a
                      :href="`mailto:seasi@brown.edu?subject=${encodeURIComponent(`Lecture Series: ${talk.speaker}`)}`"
                      class="inline-flex items-center gap-2 font-sans text-sm font-medium px-5 py-2.5 bg-crimson hover:bg-crimson-vivid text-ivory rounded-full transition-all duration-300 hover:-translate-y-0.5"
                    >
                      Questions / RSVP
                    </a>
                    <a
                      v-if="talk.flyerDownload || flyerImages(talk).length"
                      :href="talk.flyerDownload ? encodeURI(talk.flyerDownload) : flyerImages(talk)[0]"
                      target="_blank"
                      rel="noopener"
                      class="inline-flex items-center gap-2 font-sans text-sm font-medium px-5 py-2.5 border border-crimson/20 text-ink hover:border-crimson hover:text-crimson rounded-full transition-all duration-300"
                    >
                      Download flyer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section ref="aboutRef" class="bg-ivory py-16 md:py-24 border-t border-crimson/10">
      <div class="max-w-3xl mx-auto px-6 md:px-10 text-center">
        <p data-reveal class="font-mono text-2xs uppercase tracking-widest text-crimson mb-6"><EditText :file="PAGE" field="aboutLabel" required /></p>
        <p data-reveal class="font-cormorant italic text-2xl md:text-3xl text-ink leading-snug">
          <EditText :file="PAGE" field="aboutText" multiline required />
        </p>
        <div data-reveal class="mt-8">
          <EditLink
            :file="PAGE"
            label-field="ctaLabel"
            href-field="ctaHref"
            class="inline-flex items-center gap-2 font-sans text-sm font-medium px-6 py-3 bg-crimson hover:bg-crimson-vivid text-ivory rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-crimson/25"
          />
        </div>
      </div>
    </section>

    <TickerBar :dark="true" />
    <TheFooter />
  </div>
</template>
