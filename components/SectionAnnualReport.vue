<script setup lang="ts">
const REPORT = 'content/home/annual-report.json'
const report = useContentFile<{ pdf: string; viewLabel: string; coverImage: string; coverHighlights: string[]; hoverKicker: string; hoverText: string; hoverButton: string }>(REPORT)
const reportUrl = computed(() => encodeURI(report.value?.pdf ?? ''))

const { isEditing } = useEditor()
const store = useContentStore()

function addHighlight() {
  store.update(REPORT, (d) => {
    d.coverHighlights ??= []
    d.coverHighlights.push('New highlight')
  })
}
function removeHighlight(i: number) {
  store.update(REPORT, d => d.coverHighlights.splice(i, 1))
}
function moveHighlight(_list: string, from: number, to: number) {
  store.update(REPORT, d => moveItem(d.coverHighlights, from, to))
}

const root = ref<HTMLElement | null>(null)
useScrollReveal(root)
</script>

<template>
  <section id="annual-report" ref="root" class="relative bg-ivory-dark py-24 md:py-36 overflow-hidden">
    <!-- Background wash -->
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(196,30,58,0.14),transparent_55%)]" />
    <div class="pointer-events-none absolute inset-0 bg-grain opacity-[0.35]" />

    <div class="max-w-8xl mx-auto px-6 md:px-10 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center">
        <!-- Copy -->
        <div class="lg:col-span-5 space-y-8">
          <div data-reveal>
            <EditText :file="REPORT" field="label" class="font-mono text-2xs uppercase tracking-widest text-crimson" />
          </div>

          <div data-reveal>
            <h2 class="font-cormorant font-semibold leading-[0.95] text-ink">
              <EditText :file="REPORT" field="title" required class="block text-[clamp(2.5rem,5.5vw,4.5rem)] tracking-tight" />
              <EditText :file="REPORT" field="year" placeholder="Year" class="block text-[clamp(2.5rem,5.5vw,4.5rem)] tracking-tight text-crimson mt-1" />
            </h2>
            <div class="mt-6 h-1 w-24 bg-gradient-to-r from-crimson to-crimson-vivid rounded-full" />
          </div>

          <EditText
            :file="REPORT"
            field="description"
            tag="p"
            multiline
            data-reveal
            class="block font-sans text-base md:text-lg text-ink/65 leading-relaxed max-w-lg"
          />

          <div data-reveal class="flex flex-wrap gap-4">
            <!-- View: PDF opens in a new tab. Edit: change the label and the PDF address. -->
            <a
              v-if="!isEditing"
              :href="reportUrl"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 font-sans text-sm font-medium px-6 py-3 bg-crimson hover:bg-crimson-vivid text-ivory rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-crimson/35 hover:-translate-y-0.5 ring-1 ring-crimson-vivid/25"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {{ report?.viewLabel }}
            </a>
            <EditLink
              v-else
              :file="REPORT"
              label-field="viewLabel"
              href-field="pdf"
              class="inline-flex items-center gap-2 font-sans text-sm font-medium px-6 py-3 bg-crimson text-ivory rounded-full ring-1 ring-crimson-vivid/25"
            />
            <EditLink
              :file="REPORT"
              label-field="contactLabel"
              href-field="contactHref"
              class="inline-flex items-center gap-2 font-sans text-sm font-medium px-6 py-3 border border-ink/15 text-ink hover:border-crimson hover:text-crimson rounded-full transition-all duration-300 bg-white/40 backdrop-blur-sm"
            >
              <template #before>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m2 7 10 7 10-7"/>
                </svg>
              </template>
            </EditLink>
          </div>
        </div>

        <!-- Preview stack -->
        <div class="lg:col-span-7 flex justify-center lg:justify-end">
          <div class="relative w-full max-w-lg">
            <!-- Back sheets -->
            <div
              class="absolute -bottom-5 -right-5 left-5 top-5 rounded-md bg-gradient-to-br from-crimson/25 to-crimson-deep/20 ring-1 ring-crimson/20 -z-20 shadow-xl"
              aria-hidden="true"
            />
            <div
              class="absolute -bottom-2 -right-2 left-2 top-2 rounded-md bg-ivory-darker/90 ring-1 ring-border -z-10 shadow-lg"
              aria-hidden="true"
            />

            <component
              :is="isEditing ? 'div' : 'a'"
              :href="isEditing ? undefined : reportUrl"
              :target="isEditing ? undefined : '_blank'"
              :rel="isEditing ? undefined : 'noopener'"
              class="group relative block overflow-hidden rounded-md bg-ink shadow-2xl ring-1 ring-crimson/30 outline-none transition-transform duration-300 ease-out will-change-transform hover:scale-[1.03] focus-visible:scale-[1.02] focus-visible:ring-2 focus-visible:ring-crimson-vivid focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-dark origin-center"
            >
              <div class="relative isolate aspect-[3/4] sm:aspect-[4/5] overflow-hidden">
                <div class="absolute inset-0 z-0">
                  <img
                    :src="store.assetSrc(report?.coverImage)"
                    alt=""
                    class="h-full w-full object-cover opacity-45 saturate-[0.85]"
                    aria-hidden="true"
                  >
                  <div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-crimson-deep/50" />
                  <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.28),transparent_55%)]" />
                </div>

                <!-- Spine accent -->
                <div class="absolute left-0 top-0 bottom-0 z-[2] w-2 bg-gradient-to-b from-crimson via-crimson-vivid to-crimson-deep shadow-[4px_0_24px_rgba(196,30,58,0.38)]" />

                <!-- Cover typography -->
                <div class="absolute inset-0 z-10 flex flex-col justify-between p-8 sm:p-10 text-ivory">
                  <div>
                    <img
                      src="/images/logo.png"
                      alt=""
                      class="h-9 w-auto object-contain brightness-0 invert opacity-90 mb-8"
                    >
                    <EditText :file="REPORT" field="coverKicker" tag="p" class="block font-mono text-2xs uppercase tracking-[0.25em] text-crimson-vivid/90 mb-3" />
                    <EditText :file="REPORT" field="coverTitle" tag="h3" multiline class="block font-cormorant font-bold text-4xl sm:text-5xl leading-[0.95] tracking-tight whitespace-pre-line" />
                    <EditText :file="REPORT" field="year" tag="p" class="block mt-4 font-cormorant italic text-2xl text-crimson-vivid" />
                  </div>

                  <EditSortable tag="ul" class="space-y-2.5 border-t border-ivory/10 pt-6" @move="moveHighlight">
                    <li
                      v-for="(item, i) in report?.coverHighlights ?? []"
                      :key="i"
                      data-sort="highlight"
                      :data-index="i"
                      class="flex items-center gap-3 font-sans text-xs text-ivory/55"
                    >
                      <span class="h-1 w-1 rounded-full bg-crimson-vivid shadow-[0_0_8px_rgba(239,68,68,0.45)]" />
                      <EditText :file="REPORT" :field="`coverHighlights.${i}`" required />
                      <button v-if="isEditing" type="button" class="seasi-edit-chip" style="position: static; width: 1.25rem; height: 1.25rem" title="Remove" @click="removeHighlight(i)">✕</button>
                    </li>
                    <li v-if="isEditing">
                      <button type="button" class="font-sans text-xs text-crimson-vivid hover:underline" @click="addHighlight">+ Highlight</button>
                    </li>
                  </EditSortable>
                </div>

                <!-- Hover: solid panel + PDF copy (CSS only) -->
                <div
                  v-if="!isEditing"
                  class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink/90 px-8 text-center opacity-0 backdrop-blur-[1px] transition-opacity duration-300 ease-out group-hover:opacity-100"
                >
                  <span class="font-mono text-2xs uppercase tracking-[0.35em] text-crimson-vivid">{{ report?.hoverKicker }}</span>
                  <p class="font-cormorant text-2xl sm:text-3xl text-ivory leading-snug max-w-sm">
                    {{ report?.hoverText }}
                  </p>
                  <span class="inline-flex items-center gap-2 rounded-full bg-crimson px-5 py-2 font-sans text-sm font-medium text-ivory ring-1 ring-crimson-vivid/40 shadow-lg shadow-crimson/30">
                    {{ report?.hoverButton }}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                      <path d="M7 17L17 7M17 7H7M17 7v10"/>
                    </svg>
                  </span>
                </div>
              </div>

              <!-- Bottom strip -->
              <div class="flex items-center justify-between gap-3 border-t border-ivory/10 bg-ink/95 px-5 py-3 backdrop-blur-sm">
                <EditText :file="REPORT" field="stripLabel" class="font-mono text-2xs uppercase tracking-widest text-ivory/40" />
                <span class="font-mono text-2xs text-crimson-vivid">↗</span>
              </div>
            </component>

            <EditText :file="REPORT" field="hint" tag="p" class="block mt-4 text-center font-mono text-2xs uppercase tracking-widest text-muted lg:text-right" />

            <!-- Edit mode: the hover panel is hidden, so its text and the cover photo are edited here. -->
            <div v-if="isEditing" class="mt-6 rounded-lg bg-ink text-ivory p-4 space-y-3 font-sans text-sm">
              <button type="button" class="px-3 py-1.5 rounded-full bg-ivory/10 hover:bg-crimson text-xs" @click="replaceImageField(REPORT, 'coverImage')">Change cover photo</button>
              <p class="text-xs text-ivory/50">Shown when visitors hover the cover:</p>
              <EditText :file="REPORT" field="hoverKicker" tag="p" class="block font-mono text-2xs uppercase tracking-[0.35em] text-crimson-vivid" />
              <EditText :file="REPORT" field="hoverText" tag="p" class="block font-cormorant text-2xl" />
              <EditText :file="REPORT" field="hoverButton" tag="p" class="block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
