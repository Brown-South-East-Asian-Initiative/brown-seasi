<script setup lang="ts">
const root = ref<HTMLElement | null>(null)
useScrollReveal(root)

const { isEditing } = useEditor()
const store = useContentStore()
const siteEvents = useCollection<SiteEvent>(EVENTS_FOLDER)
const talks = useTalks()
const S = EVENTS_SECTION

const FEATURED_OPTIONS = [
  { label: 'Featured', value: true },
  { label: 'Not featured', value: false },
]

const events = computed(() => [
  ...siteEvents.value.map(({ path, data: event }) => ({
    id: `event-${event.slug}`,
    /** File to edit; talks don't have one here (they're edited on /speaker-series). */
    path: path as string | null,
    sortDate: event.date,
    date: formatTalkDate(event.date, 'short'),
    time: event.time || 'Time TBA',
    title: event.title,
    description: event.description,
    location: event.location || 'Brown University, Providence RI',
    tag: event.tag,
    tagColor: eventTagColor(event.tag),
    href: event.link || undefined,
    featured: !!event.featured,
    past: isTalkPast(event.date),
  })),
  ...talks.value.map(({ data: talk }) => ({
    id: `talk-${talk.slug}`,
    path: null as string | null,
    sortDate: talk.date,
    date: formatTalkDate(talk.date, 'short'),
    time: talk.time ?? 'Time TBA',
    title: talk.title ? `${talk.speaker}: ${talk.title}` : talk.speaker,
    description: `Lecture Series · ${talk.affiliation}`,
    location: talk.location ?? 'Brown University, Providence RI',
    tag: 'Lecture',
    tagColor: eventTagColor('Lecture'),
    href: `/speaker-series#${talk.slug}`,
    featured: false,
    past: isTalkPast(talk.date),
  })),
].sort((a, b) => a.sortDate.localeCompare(b.sortDate)))

// ── Editing actions ───────────────────────────────────────────
function addEvent() {
  const title = window.prompt('Title of the new event:')?.trim()
  if (!title) return
  let slug = slugify(title)
  while (store.read(`${EVENTS_FOLDER}/${slug}.json`)) slug = `${slug}-2`
  const inTwoWeeks = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)
  store.create(`${EVENTS_FOLDER}/${slug}.json`, { slug, date: inTwoWeeks, title, tag: 'Lecture' })
}

function deleteEvent(event: { path: string | null; title: string }) {
  if (event.path && window.confirm(`Delete "${event.title}"? (You can undo before saving.)`)) store.remove(event.path)
}

function editEventLink(event: { path: string | null; href?: string }) {
  if (!event.path) return
  const next = window.prompt('Where should this event link to? Leave empty for no link.\n\n• A page on this site: /symposium\n• Another website: https://…', event.href ?? '')
  if (next === null) return
  const v = next.trim()
  if (v && !/^(\/|#|https?:\/\/|mailto:)/i.test(v)) {
    window.alert('Links must start with /, #, https://, or mailto:')
    return
  }
  store.set(event.path, 'link', v)
}
</script>

<template>
  <section id="events" ref="root" class="relative bg-white py-24 md:py-36 overflow-hidden">
    <div class="max-w-8xl mx-auto px-6 md:px-10">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <div>
          <div data-reveal class="mb-4">
            <EditText :file="S" field="label" required class="font-mono text-2xs uppercase tracking-widest text-crimson" />
          </div>
          <EditText
            :file="S"
            field="heading"
            tag="h2"
            required
            data-reveal
            class="font-cormorant font-semibold text-[clamp(3rem,7vw,6rem)] tracking-tighter leading-none text-ink"
          />
        </div>
        <EditText
          :file="S"
          field="intro"
          tag="p"
          multiline
          data-reveal
          class="font-sans text-sm text-muted max-w-xs leading-relaxed md:text-right border-l-2 md:border-l-0 md:border-r-2 border-crimson/25 pl-4 md:pl-0 md:pr-4"
        />
      </div>

      <div v-if="isEditing" class="mb-6">
        <button type="button" class="seasi-edit-add w-full min-h-0 py-4" @click="addEvent">+ Add event</button>
      </div>

      <div class="flex flex-col divide-y divide-border">
        <article
          v-for="event in events"
          :key="event.id"
          data-reveal
        >
          <component
            :is="isEditing ? 'div' : event.href ? 'NuxtLink' : 'div'"
            :to="isEditing ? undefined : event.href"
            class="group flex flex-col md:flex-row md:items-start gap-6 py-8 md:py-10"
            :class="event.href && !isEditing ? 'cursor-pointer' : ''"
          >
            <!-- Editable event (from content/events) -->
            <template v-if="isEditing && event.path">
              <div class="md:w-48 shrink-0">
                <EditDate
                  :file="event.path"
                  field="date"
                  tag="time"
                  :format="iso => formatTalkDate(iso, 'short')"
                  class="font-mono text-2xs uppercase tracking-widest text-muted block"
                />
                <EditText
                  :file="event.path"
                  field="time"
                  placeholder="Time (e.g. 5:00 PM)"
                  class="font-mono text-2xs uppercase tracking-widest text-muted/60 block mt-0.5"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-3 mb-3">
                  <EditSelect :file="event.path" field="tag" :options="EVENT_TAGS" label="Type">
                    <span
                      class="font-mono text-2xs uppercase tracking-widest px-2.5 py-1 rounded-full"
                      :class="event.tagColor"
                    >{{ event.tag }}</span>
                  </EditSelect>
                  <span v-if="event.past" class="font-mono text-2xs uppercase tracking-widest text-muted/40">
                    Past
                  </span>
                  <EditSelect :file="event.path" field="featured" :options="FEATURED_OPTIONS" label="Featured">
                    <span class="font-mono text-2xs uppercase tracking-widest text-muted">
                      {{ event.featured ? '★ Featured' : '☆ Not featured' }}
                    </span>
                  </EditSelect>
                </div>

                <EditText
                  :file="event.path"
                  field="title"
                  tag="h3"
                  required
                  class="font-cormorant font-semibold text-2xl md:text-3xl text-ink leading-tight"
                />

                <EditText
                  :file="event.path"
                  field="description"
                  tag="p"
                  multiline
                  placeholder="Description (optional)"
                  class="block font-sans text-sm text-muted mt-3 leading-relaxed max-w-xl"
                />

                <div class="flex items-center gap-1.5 mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5 text-crimson/50 shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <EditText
                    :file="event.path"
                    field="location"
                    placeholder="Location (defaults to Brown University, Providence RI)"
                    class="font-sans text-xs text-muted"
                  />
                </div>
              </div>

              <div class="flex md:flex-col items-center gap-2 self-center">
                <button
                  type="button"
                  class="w-10 h-10 rounded-full border border-border hover:border-crimson hover:bg-crimson hover:text-ivory text-muted flex items-center justify-center transition-all duration-300 text-sm"
                  :title="`Change link (now: ${event.href || 'none'})`"
                  @click="editEventLink(event)"
                >🔗</button>
                <button
                  type="button"
                  class="w-10 h-10 rounded-full border border-border hover:border-crimson hover:bg-crimson hover:text-ivory text-muted flex items-center justify-center transition-all duration-300"
                  title="Delete this event"
                  @click="deleteEvent(event)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            </template>

            <!-- Visitor view, and talks (edited on the Speaker Series page) -->
            <template v-else>
              <div class="md:w-48 shrink-0">
                <time class="font-mono text-2xs uppercase tracking-widest text-muted block">
                  {{ event.date }}
                </time>
                <span class="font-mono text-2xs uppercase tracking-widest text-muted/60 block mt-0.5">
                  {{ event.time }}
                </span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-3">
                  <span
                    class="font-mono text-2xs uppercase tracking-widest px-2.5 py-1 rounded-full"
                    :class="event.tagColor"
                  >
                    {{ event.tag }}
                  </span>
                  <span v-if="event.past" class="font-mono text-2xs uppercase tracking-widest text-muted/40">
                    Past
                  </span>
                  <NuxtLink
                    v-if="isEditing"
                    to="/speaker-series"
                    class="font-sans text-xs text-crimson underline underline-offset-2"
                  >Edit on the Speaker Series page</NuxtLink>
                </div>

                <h3
                  class="font-cormorant font-semibold text-2xl md:text-3xl text-ink leading-tight transition-colors duration-200"
                  :class="event.href ? 'group-hover:text-crimson' : ''"
                >
                  {{ event.title }}
                </h3>

                <p v-if="event.description" class="font-sans text-sm text-muted mt-3 leading-relaxed max-w-xl">
                  {{ event.description }}
                </p>

                <div class="flex items-center gap-1.5 mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5 text-crimson/50 shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span class="font-sans text-xs text-muted">{{ event.location }}</span>
                </div>
              </div>

              <div v-if="event.href" class="hidden md:flex items-center self-center">
                <div class="w-10 h-10 rounded-full border border-border group-hover:border-crimson group-hover:bg-crimson flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-crimson/25">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-muted group-hover:text-ivory transition-colors duration-300">
                    <path d="M7 17L17 7M17 7H7M17 7v10"/>
                  </svg>
                </div>
              </div>
            </template>
          </component>
        </article>
      </div>

      <div data-reveal class="mt-14 pt-10 border-t border-crimson/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <EditText :file="S" field="mailingText" tag="p" class="font-sans text-sm text-muted" />
        <EditLink
          :file="S"
          label-field="mailingLabel"
          href-field="mailingHref"
          class="inline-flex items-center gap-2 font-sans text-sm font-medium text-crimson hover:text-crimson-dark border-b-2 border-crimson/25 hover:border-crimson pb-0.5 transition-colors duration-200 whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </EditLink>
      </div>
    </div>
  </section>
</template>
