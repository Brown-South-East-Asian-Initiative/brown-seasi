<script setup lang="ts">
import { gsap } from 'gsap'

const ABOUT = 'content/home/about.json'
const REPORT = 'content/home/annual-report.json'

interface Stat { value: string; suffix?: string; label: string }
const about = useContentFile<{ image: string; paragraphs: string[]; stats: Stat[] }>(ABOUT)
const report = useContentFile<{ pdf: string; aboutLinkLabel: string }>(REPORT)
const stats = computed(() => about.value?.stats ?? [])

const { isEditing } = useEditor()
const store = useContentStore()

const root = ref<HTMLElement | null>(null)
const statsRef = ref<{ $el: HTMLElement } | null>(null)
const popRefs: HTMLElement[] = []

useScrollReveal(root)

// Numbers count up when scrolled into view: small numbers from 0, years from 12 years earlier.
// Non-numbers (like ∞) pop in instead.
function numeric(stat: Stat) {
  return /^\d+$/.test(stat.value) ? Number(stat.value) : null
}
function countStart(n: number) {
  return n >= 1000 ? n - 12 : 0
}
const counts = ref<number[]>(stats.value.map(s => countStart(numeric(s) ?? 0)))
const done = ref(false)

function shown(stat: Stat, i: number) {
  const n = numeric(stat)
  if (n === null || done.value) return stat.value
  return String(counts.value[i] ?? countStart(n))
}

let ctx: gsap.Context | null = null

onMounted(() => {
  const block = statsRef.value?.$el
  if (!block) return

  ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: block, start: 'top 82%', once: true },
      onComplete: () => { done.value = true },
    })

    stats.value.forEach((stat, i) => {
      const n = numeric(stat)
      const at = i === 0 ? 0 : i === 1 ? 0.12 : 0.12 + i * 0.08
      if (n !== null) {
        const counter = { v: countStart(n) }
        const big = n >= 1000
        tl.to(counter, {
          v: n,
          duration: big ? 1.35 : 1.15,
          ease: big ? 'power1.inOut' : 'power2.out',
          onUpdate: () => { counts.value[i] = Math.round(counter.v) },
        }, at)
      } else if (popRefs[i]) {
        gsap.set(popRefs[i], { opacity: 0, scale: 0.35, rotate: -12 })
        tl.to(popRefs[i], { opacity: 1, scale: 1, rotate: 0, duration: 0.85, ease: 'back.out(1.6)' }, i === 2 ? 0.28 : at)
      }
    })
  }, block)
})

onUnmounted(() => ctx?.revert())

// Editors see the real values, not a half-finished animation.
watch(isEditing, (editing) => {
  if (!editing) return
  done.value = true
  ctx?.revert()
  ctx = null
})

function addParagraph() {
  store.update(ABOUT, d => d.paragraphs.push('New paragraph.'))
}
function removeParagraph(i: number) {
  store.update(ABOUT, d => d.paragraphs.splice(i, 1))
}
function moveParagraph(_list: string, from: number, to: number) {
  store.update(ABOUT, d => moveItem(d.paragraphs, from, to))
}
function addStat() {
  store.update(ABOUT, d => d.stats.push({ value: '1', label: 'New\nstat' }))
}
function removeStat(i: number) {
  store.update(ABOUT, d => d.stats.splice(i, 1))
}
function moveStat(_list: string, from: number, to: number) {
  store.update(ABOUT, d => moveItem(d.stats, from, to))
}
</script>

<template>
  <section id="about" ref="root" class="relative bg-ivory py-24 md:py-36 overflow-hidden">
    <div class="max-w-8xl mx-auto px-6 md:px-10">
      <div data-reveal class="mb-10">
        <EditText :file="ABOUT" field="label" class="font-mono text-2xs uppercase tracking-widest text-crimson" />
      </div>

      <div data-reveal class="mb-16 md:mb-20">
        <h2 class="font-cormorant font-semibold leading-none">
          <EditText :file="ABOUT" field="headingSmall" class="block text-[clamp(3.5rem,9vw,9rem)] tracking-tighter text-crimson/25 italic" />
          <EditText :file="ABOUT" field="headingLarge" required class="block text-[clamp(3.5rem,9vw,9rem)] tracking-tighter text-ink -mt-4 md:-mt-6" />
        </h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        <div data-reveal class="relative group">
          <div class="aspect-[4/3] overflow-hidden rounded-sm ring-1 ring-crimson/10 shadow-[0_24px_80px_-24px_rgba(196,30,58,0.22)]">
            <EditImage
              :file="ABOUT"
              field="image"
              alt-field="imageAlt"
              class="img-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </div>
          <div class="absolute -bottom-4 -left-4 w-32 h-1 bg-gradient-to-r from-crimson to-crimson-vivid" />
          <div class="absolute -top-3 -right-3 w-16 h-16 border-t-2 border-r-2 border-crimson/40 pointer-events-none" />
        </div>

        <div class="flex flex-col gap-8">
          <div data-reveal class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-crimson/15 flex items-center justify-center shrink-0 ring-1 ring-crimson/25">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="w-5 h-5 text-crimson fill-current">
                <path d="M216,70.39v112c-72,59.69-104-56.47-176,3.22v-112C112,13.92,144,130.08,216,70.39Z" opacity="0.2"/>
                <path d="M222.16,177.25a8,8,0,0,1-1,11.25c-17.36,14.39-32.86,19.5-47,19.5-18.58,0-34.82-8.82-49.93-17-25.35-13.76-47.24-25.64-79.07.74a8,8,0,1,1-10.22-12.31c40.17-33.28,70.32-16.92,96.93-2.48,25.35,13.75,47.24,25.63,79.07-.74A8,8,0,0,1,222.16,177.25Zm-11.27-57c-31.83,26.38-53.72,14.5-79.07.74-26.61-14.43-56.76-30.79-96.93,2.49a8,8,0,0,0,10.22,12.31c31.83-26.38,53.72-14.5,79.07-.74,15.11,8.19,31.35,17,49.93,17,14.14,0,29.64-5.11,47-19.5a8,8,0,1,0-10.22-12.31ZM45.11,79.8c31.83-26.37,53.72-14.49,79.07-.74,15.11,8.2,31.35,17,49.93,17,14.14,0,29.64-5.12,47-19.5a8,8,0,1,0-10.22-12.31c-31.83,26.38-53.72,14.5-79.07.74C105.21,50.58,75.06,34.22,34.89,67.5A8,8,0,1,0,45.11,79.8Z"/>
              </svg>
            </div>
            <EditText :file="ABOUT" field="subheading" tag="h3" class="font-cormorant font-semibold text-2xl text-ink" />
          </div>

          <div v-if="!isEditing" data-reveal class="space-y-5">
            <!-- *words* in a paragraph are shown in italics -->
            <p
              v-for="(paragraph, i) in about?.paragraphs ?? []"
              :key="i"
              class="font-sans text-base md:text-lg text-ink/70 leading-relaxed"
              v-html="emphasize(paragraph, 'text-ink font-medium')"
            />
          </div>
          <EditSortable v-else class="space-y-5" @move="moveParagraph">
            <div v-for="(paragraph, i) in about?.paragraphs ?? []" :key="i" data-sort="paragraph" :data-index="i" class="pr-8">
              <EditText
                :file="ABOUT"
                :field="`paragraphs.${i}`"
                tag="p"
                multiline
                required
                class="block font-sans text-base md:text-lg text-ink/70 leading-relaxed"
              />
              <button type="button" class="seasi-edit-chip right-0" style="right: 0" title="Remove paragraph" @click="removeParagraph(i)">✕</button>
            </div>
            <p class="font-sans text-xs text-muted">Tip: put *stars* around words to show them in italics.</p>
            <button type="button" class="seasi-edit-add w-full py-3" style="min-height: 0" @click="addParagraph">+ Paragraph</button>
          </EditSortable>

          <EditSortable
            ref="statsRef"
            data-reveal
            class="grid gap-4 pt-4 border-t border-crimson/15"
            :style="{ gridTemplateColumns: `repeat(${Math.max(stats.length, 1)}, minmax(0, 1fr))` }"
            aria-live="polite"
            @move="moveStat"
          >
            <div v-for="(stat, i) in stats" :key="i" :data-sort="isEditing ? 'stat' : undefined" :data-index="i">
              <p
                v-if="!isEditing"
                :ref="el => { if (el) popRefs[i] = el as HTMLElement }"
                class="font-cormorant font-bold text-4xl text-crimson leading-none tabular-nums min-h-[2.5rem]"
                :class="numeric(stat) === null && !done ? 'opacity-0' : ''"
              >
                <span>{{ shown(stat, i) }}</span><span
                  v-if="stat.suffix"
                  v-show="shown(stat, i) === stat.value"
                  class="text-[0.55em] font-semibold align-top"
                >{{ stat.suffix }}</span>
              </p>
              <p v-else class="font-cormorant font-bold text-4xl text-crimson leading-none tabular-nums min-h-[2.5rem]">
                <EditText :file="ABOUT" :field="`stats.${i}.value`" required /><EditText
                  :file="ABOUT"
                  :field="`stats.${i}.suffix`"
                  placeholder="+ suffix"
                  class="text-[0.55em] font-semibold align-top"
                />
              </p>
              <EditText
                :file="ABOUT"
                :field="`stats.${i}.label`"
                tag="p"
                multiline
                class="block font-sans text-xs text-muted mt-1 uppercase tracking-wide whitespace-pre-line"
              />
              <button v-if="isEditing && stats.length > 1" type="button" class="seasi-edit-chip" style="right: 0; top: -0.75rem" title="Remove stat" @click="removeStat(i)">✕</button>
            </div>
            <button v-if="isEditing && stats.length < 4" type="button" class="seasi-edit-add" style="min-height: 3rem" @click="addStat">+ Stat</button>
          </EditSortable>

          <div data-reveal>
            <a
              v-if="!isEditing"
              :href="encodeURI(report?.pdf ?? '')"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 font-sans text-sm font-medium text-crimson hover:text-crimson-dark border-b-2 border-crimson/30 hover:border-crimson pb-0.5 transition-colors duration-200"
            >
              {{ report?.aboutLinkLabel }}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </a>
            <EditLink
              v-else
              :file="REPORT"
              label-field="aboutLinkLabel"
              href-field="pdf"
              class="inline-flex items-center gap-2 font-sans text-sm font-medium text-crimson border-b-2 border-crimson/30 pb-0.5"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
