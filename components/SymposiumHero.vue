<script setup lang="ts">
import { gsap } from 'gsap'

const props = withDefaults(
  defineProps<{
    /** Skip entrance animation (e.g. Open Graph screenshot page). */
    staticLayout?: boolean
  }>(),
  { staticLayout: false },
)

const root = ref<HTMLElement | null>(null)

const F = SYMPOSIUM_DETAILS
const { isEditing } = useEditor()
const store = useContentStore()
const details = useContentFile<{ features?: { icon: string; label: string; desc: string }[] }>(F)
const features = computed(() => details.value?.features ?? [])

function addFeature() {
  store.update(F, (d) => {
    d.features ??= []
    d.features.push({ icon: 'star', label: 'New highlight', desc: 'Short description' })
  })
}

function removeFeature(i: number) {
  if (window.confirm('Remove this card?')) store.update(F, d => d.features.splice(i, 1))
}

function moveFeature(_list: string, from: number, to: number) {
  store.update(F, d => moveItem(d.features, from, to))
}

onMounted(() => {
  const section = root.value
  if (!section || props.staticLayout) return

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.sym-label', { opacity: 0, y: 24, duration: 0.7 }, 0.08)
      .from('.sym-title', { opacity: 0, y: 36, duration: 0.85 }, 0.18)
      .from('.sym-subtitle', { opacity: 0, y: 20, duration: 0.65 }, 0.32)
      .from('.sym-meta', { opacity: 0, y: 28, duration: 0.75 }, 0.38)
      .from('.sym-card', { opacity: 0, y: 32, duration: 0.65, stagger: 0.08 }, 0.5)
  }, section)

  onUnmounted(() => ctx.revert())
})
</script>

<template>
  <section ref="root" class="symposium-hero-section relative bg-crimson-deep overflow-hidden border-b border-crimson-vivid/20">
    <div
      class="absolute inset-0 opacity-[0.06] pointer-events-none"
      style="background-image: repeating-linear-gradient(
        -45deg,
        #fff,
        #fff 1px,
        transparent 1px,
        transparent 18px
      )"
    />

    <div class="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
      style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E&quot;)"
    />

    <div class="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-crimson/25 to-transparent pointer-events-none" />

    <div class="relative z-10 max-w-8xl mx-auto px-6 md:px-10 pt-32 pb-20 md:pt-44 md:pb-28">
      <div class="sym-label mb-6">
        <EditText
          :file="F"
          field="badge"
          required
          class="font-mono text-2xs uppercase tracking-widest text-ivory/70 border border-crimson-vivid/40 bg-ink/15 rounded-full px-3 py-1 inline-block ring-1 ring-crimson-vivid/20"
        />
      </div>

      <h1 class="sym-title font-cormorant font-bold text-ivory leading-none mb-2">
        <EditText
          :file="F"
          field="title"
          required
          class="block text-[clamp(4rem,11vw,11rem)] tracking-tighter leading-[0.88] drop-shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
        />
      </h1>
      <EditText
        :file="F"
        field="subtitle"
        tag="p"
        placeholder="Subtitle"
        class="sym-subtitle block font-cormorant text-[clamp(1.8rem,4.5vw,4.5rem)] tracking-tight text-ivory/70 font-light italic mb-8 max-w-3xl"
      />

      <div class="sym-meta flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-16">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-crimson-vivid">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <EditText :file="F" field="dateLine" required class="font-mono text-sm text-ivory/80 uppercase tracking-wide" />
        </div>
        <span class="hidden sm:block text-crimson-vivid/50">|</span>
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-crimson-vivid">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <EditText :file="F" field="venueLine" required class="font-mono text-sm text-ivory/80 uppercase tracking-wide" />
        </div>
      </div>

      <EditSortable class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" @move="moveFeature">
        <div
          v-for="(feat, i) in features"
          :key="i"
          :data-sort="isEditing ? 'feature' : undefined"
          :data-index="i"
          class="sym-card bg-white/5 border border-crimson-vivid/20 rounded-sm p-6 hover:bg-white/10 hover:border-crimson-vivid/40 transition-all duration-300 group"
          :class="isEditing ? 'cursor-grab' : ''"
        >
          <EditSelect :file="F" :field="`features.${i}.icon`" :options="featureIconOptions" label="Icon" tag="div" class="mb-4">
            <div class="text-ivory/60 group-hover:text-ivory/90 transition-colors" v-html="featureIcons[feat.icon]?.svg ?? featureIcons.star!.svg" />
          </EditSelect>
          <EditText :file="F" :field="`features.${i}.label`" tag="h3" required class="block font-cormorant font-semibold text-lg text-ivory mb-1" />
          <EditText :file="F" :field="`features.${i}.desc`" tag="p" placeholder="Short description" class="block font-sans text-xs text-ivory/45 leading-relaxed" />
          <button
            v-if="isEditing"
            type="button"
            class="seasi-edit-chip right-1.5"
            title="Remove card"
            @click.stop="removeFeature(i)"
          >✕</button>
        </div>
        <button v-if="isEditing" type="button" class="seasi-edit-add !text-ivory/80 !border-ivory/30 hover:!bg-white/5" @click="addFeature">+ Add card</button>
      </EditSortable>
    </div>
  </section>
</template>
