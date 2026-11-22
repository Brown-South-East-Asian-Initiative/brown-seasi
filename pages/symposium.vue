<script setup lang="ts">
const D = SYMPOSIUM_DETAILS
const S = SYMPOSIUM_SCHEDULE
const { isEditing } = useEditor()
const store = useContentStore()

interface SymposiumDetails {
  seoTitle: string
  seoDescription: string
  buttons?: { label: string; href: string }[]
  photos?: { src: string; alt: string }[]
}
const details = useContentFile<SymposiumDetails>(D)
const scheduleFile = useContentFile<{ items: ScheduleItem[] }>(S)
const schedule = computed(() => scheduleFile.value?.items ?? [])

const title = computed(() => details.value?.seoTitle ?? 'Symposium — Brown SEASI')
const description = computed(() => details.value?.seoDescription ?? '')

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

const typeColors = scheduleTypeColors
const featuredOptions = [
  { label: '★ Highlighted', value: true },
  { label: '☆ Not highlighted', value: false },
]

// ── Editing actions ───────────────────────────────────────────
function addScheduleItem() {
  store.update(S, (d) => {
    d.items ??= []
    d.items.push({ time: '12:00 PM', title: 'New item', type: 'Presentations', description: '' })
  })
}

function removeScheduleItem(i: number) {
  if (window.confirm(`Remove "${schedule.value[i]?.title}" from the schedule?`)) store.update(S, d => d.items.splice(i, 1))
}

function moveScheduleItem(_list: string, from: number, to: number) {
  store.update(S, d => moveItem(d.items, from, to))
}

function addButton() {
  store.update(D, (d) => {
    d.buttons ??= []
    d.buttons.push({ label: 'New button', href: '/' })
  })
}

function removeButton(i: number) {
  store.update(D, d => d.buttons.splice(i, 1))
}

const inviteRef = ref<HTMLElement | null>(null)
const scheduleRef = ref<HTMLElement | null>(null)
const locationRef = ref<HTMLElement | null>(null)

useScrollReveal(inviteRef)
useScrollReveal(scheduleRef)
useScrollReveal(locationRef)
</script>

<template>
  <div class="min-h-screen bg-ivory">
    <TheNav />

    <SymposiumHero />

    <section ref="inviteRef" class="bg-white py-16 md:py-20 border-t border-crimson/10">
      <div class="max-w-8xl mx-auto px-6 md:px-10">
        <div class="max-w-3xl mx-auto text-center">
          <div data-reveal class="mb-6">
            <EditText :file="D" field="aboutLabel" tag="p" required class="font-mono text-2xs uppercase tracking-widest text-crimson" />
          </div>
          <div data-reveal>
            <EditText :file="D" field="aboutQuote" tag="p" multiline required class="font-cormorant italic text-2xl md:text-3xl text-ink leading-snug" />
          </div>
          <div data-reveal class="mt-8 flex justify-center gap-4 flex-wrap">
            <span v-for="(btn, i) in details?.buttons ?? []" :key="i" class="relative inline-flex">
              <EditLink
                :file="D"
                :label-field="`buttons.${i}.label`"
                :href-field="`buttons.${i}.href`"
                upload="application/pdf"
                class="inline-flex items-center gap-2 font-sans text-sm font-medium px-6 py-3 rounded-full transition-all duration-300"
                :class="i === 0
                  ? 'bg-crimson hover:bg-crimson-vivid text-ivory hover:-translate-y-0.5 hover:shadow-lg hover:shadow-crimson/25 ring-1 ring-crimson-vivid/20'
                  : 'border border-crimson/20 text-ink hover:border-crimson hover:text-crimson'"
              />
              <button
                v-if="isEditing"
                type="button"
                class="absolute -top-2.5 -left-2.5 z-10 w-5 h-5 rounded-full bg-ink text-ivory text-[0.65rem] leading-5 text-center hover:bg-crimson"
                title="Remove button"
                @click="removeButton(i)"
              >✕</button>
            </span>
            <button v-if="isEditing" type="button" class="seasi-edit-add min-h-0 px-5 py-3" @click="addButton">+ Button</button>
          </div>
        </div>

        <div class="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-5xl mx-auto">
          <div
            v-for="(photo, i) in details?.photos ?? []"
            :key="i"
            data-reveal
            class="group overflow-hidden rounded-lg ring-1 ring-crimson/15 shadow-lg shadow-crimson/5"
          >
            <EditImage
              :file="D"
              :field="`photos.${i}.src`"
              :alt-field="`photos.${i}.alt`"
              class="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] md:h-64"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>

    <section ref="scheduleRef" class="bg-ivory py-20 md:py-32 relative">
      <div class="max-w-8xl mx-auto px-6 md:px-10">
        <div class="mb-14">
          <div data-reveal class="mb-4">
            <EditText :file="D" field="scheduleLabel" tag="p" required class="font-mono text-2xs uppercase tracking-widest text-crimson" />
          </div>
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div data-reveal>
              <EditText :file="D" field="scheduleHeading" tag="h2" required class="font-cormorant font-semibold text-[clamp(2.5rem,6vw,5.5rem)] tracking-tighter leading-none text-ink" />
            </div>
            <div data-reveal>
              <EditText
                :file="D"
                field="scheduleVenue"
                tag="p"
                multiline
                placeholder="Venue and address"
                class="block font-sans text-sm text-muted max-w-xs leading-relaxed md:text-right border-l-2 md:border-l-0 md:border-r-2 border-crimson/20 pl-4 md:pl-0 md:pr-4 whitespace-pre-line"
              />
            </div>
          </div>
        </div>

        <div data-reveal class="mb-12 overflow-hidden rounded-lg ring-1 ring-crimson/15">
          <EditImage
            :file="D"
            field="scheduleImage.src"
            alt-field="scheduleImage.alt"
            class="h-48 w-full object-cover object-center md:h-56"
            loading="lazy"
            decoding="async"
          />
        </div>

        <EditSortable class="flex flex-col" @move="moveScheduleItem">
          <article
            v-for="(item, i) in schedule"
            :key="`${i}-${item.time}`"
            data-reveal
            :data-sort="isEditing ? 'schedule' : undefined"
            :data-index="i"
            class="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-x-8 gap-y-3 py-8 border-b border-border last:border-0"
            :class="isEditing ? 'cursor-grab' : ''"
          >
            <div class="font-mono text-sm text-muted sm:text-right sm:pt-1">
              <EditText :file="S" :field="`items.${i}.time`" tag="time" required />
            </div>

            <div class="relative sm:border-l sm:border-border sm:pl-8">
              <div
                class="pointer-events-none absolute top-2.5 -left-[7px] hidden h-3 w-3 rounded-full border-2 sm:block"
                :class="item.featured
                  ? 'border-crimson bg-crimson shadow-lg shadow-crimson/35'
                  : 'border-border bg-ivory ring-2 ring-ivory'"
              />

              <div class="flex items-center gap-3 mb-2">
                <EditSelect :file="S" :field="`items.${i}.type`" :options="scheduleTypes" label="Type" class="flex">
                  <span
                    class="font-mono text-2xs uppercase tracking-widest px-2.5 py-1 rounded-full"
                    :class="typeColors[item.type] ?? 'bg-ivory-dark text-muted'"
                  >
                    {{ item.type }}
                  </span>
                </EditSelect>
                <EditSelect
                  v-if="isEditing"
                  :file="S"
                  :field="`items.${i}.featured`"
                  :options="featuredOptions"
                  label="Highlight"
                >
                  <span class="font-mono text-2xs uppercase tracking-widest text-muted">
                    {{ item.featured ? '★ Highlighted' : '☆ Not highlighted' }}
                  </span>
                </EditSelect>
              </div>
              <EditText
                :file="S"
                :field="`items.${i}.title`"
                tag="h3"
                required
                class="block font-cormorant font-semibold text-xl md:text-2xl leading-tight mb-2"
                :class="item.featured ? 'text-crimson' : 'text-ink'"
              />
              <EditText
                :file="S"
                :field="`items.${i}.description`"
                tag="p"
                multiline
                placeholder="Description (optional)"
                class="block font-sans text-sm text-muted leading-relaxed max-w-xl whitespace-pre-line"
              />
            </div>
            <button
              v-if="isEditing"
              type="button"
              class="seasi-edit-chip right-0"
              title="Remove from schedule"
              @click.stop="removeScheduleItem(i)"
            >✕</button>
          </article>
        </EditSortable>
        <button v-if="isEditing" type="button" class="seasi-edit-add w-full min-h-0 py-4 mt-6" @click="addScheduleItem">+ Add schedule item</button>
      </div>
    </section>

    <SectionImageBreaker :file="D" field="breaker" height="h-[45vh] md:h-[55vh]" :overlay="true" />

    <section ref="locationRef" class="bg-white py-20 md:py-28 border-t border-crimson/10">
      <div class="max-w-8xl mx-auto px-6 md:px-10">
        <div data-reveal class="mb-12 overflow-hidden rounded-lg ring-1 ring-crimson/15 md:mb-16">
          <EditImage
            :file="D"
            field="locationImage.src"
            alt-field="locationImage.alt"
            class="aspect-[21/9] w-full object-cover object-center min-h-[10rem] md:min-h-[14rem]"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          <div data-reveal>
            <div class="w-10 h-10 rounded-full bg-crimson/12 flex items-center justify-center mb-4 ring-1 ring-crimson/25">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-crimson">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <EditText :file="D" field="venue.heading" tag="h3" required class="block font-cormorant font-semibold text-xl text-ink mb-2" />
            <EditText :file="D" field="venue.text" tag="p" multiline class="block font-sans text-sm text-muted leading-relaxed whitespace-pre-line" />
          </div>

          <div data-reveal>
            <div class="w-10 h-10 rounded-full bg-crimson/12 flex items-center justify-center mb-4 ring-1 ring-crimson/25">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-crimson">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <EditText :file="D" field="dateTime.heading" tag="h3" required class="block font-cormorant font-semibold text-xl text-ink mb-2" />
            <EditText :file="D" field="dateTime.text" tag="p" multiline class="block font-sans text-sm text-muted leading-relaxed whitespace-pre-line" />
          </div>

          <div data-reveal>
            <div class="w-10 h-10 rounded-full bg-crimson/12 flex items-center justify-center mb-4 ring-1 ring-crimson/25">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-5 h-5 text-crimson">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m2 7 10 7 10-7"/>
              </svg>
            </div>
            <EditText :file="D" field="contact.heading" tag="h3" required class="block font-cormorant font-semibold text-xl text-ink mb-2" />
            <p class="font-sans text-sm text-muted leading-relaxed">
              <EditText :file="D" field="contact.intro" placeholder="Intro line" /><br>
              <EditLink :file="D" label-field="contact.email.label" href-field="contact.email.href" class="text-crimson hover:underline" :class="isEditing ? 'pr-4' : ''" /><br>
              <EditText :file="D" field="contact.note" placeholder="Note (optional)" class="text-muted/60" />
            </p>
          </div>
        </div>
      </div>
    </section>

    <TickerBar :dark="true" />
    <TheFooter />
  </div>
</template>
