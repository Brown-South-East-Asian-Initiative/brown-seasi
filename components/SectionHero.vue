<script setup lang="ts">
import { gsap } from 'gsap'

const HERO = 'content/home/hero.json'
const hero = useContentFile<{ background: string; buttons: { label: string; href: string; style: string }[] }>(HERO)
const { isEditing } = useEditor()
const store = useContentStore()

// Button looks are fixed in code; editors pick one per button.
const buttonStyles: Record<string, string> = {
  primary: 'bg-crimson text-white hover:bg-crimson-dark',
  light: 'bg-white text-[#1C1917] border border-stone-400/90 shadow-md hover:bg-stone-100',
  outline: 'border border-ivory/40 text-ivory hover:bg-ivory/10',
}
const styleOptions = [
  { label: 'Red', value: 'primary' },
  { label: 'White', value: 'light' },
  { label: 'Outline', value: 'outline' },
]

function addButton() {
  store.update(HERO, (d) => {
    d.buttons ??= []
    d.buttons.push({ label: 'New button', href: '/', style: 'outline' })
  })
}

function removeButton(i: number) {
  store.update(HERO, d => d.buttons.splice(i, 1))
}

function moveButton(_list: string, from: number, to: number) {
  store.update(HERO, d => moveItem(d.buttons, from, to))
}

const root = ref<HTMLElement | null>(null)
const bgLayer = ref<HTMLElement | null>(null)

function scrollToContent() {
  const el = document.getElementById('about')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  const section = root.value
  if (!section) return

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.hero-badge', { opacity: 0, y: 28, duration: 0.75 }, 0.1)
      .from('.hero-line-a', { opacity: 0, y: 36, duration: 0.8 }, 0.22)
      .from('.hero-line-b', { opacity: 0, y: 44, duration: 0.85 }, 0.32)
      .from('.hero-copy', { opacity: 0, y: 32, duration: 0.75 }, 0.48)
      .from('.hero-cta', { opacity: 0, y: 24, duration: 0.7 }, 0.56)
      .from('.hero-scroll', { opacity: 0, y: 16, duration: 0.6 }, 0.68)

    if (bgLayer.value) {
      gsap.fromTo(
        bgLayer.value,
        { scale: 1.08 },
        {
          scale: 1,
          duration: 1.6,
          ease: 'power2.out',
        }
      )
    }

    gsap.to('.hero-scroll-line', {
      opacity: 0.35,
      repeat: -1,
      yoyo: true,
      duration: 1.35,
      ease: 'sine.inOut',
    })
  }, section)

  onUnmounted(() => ctx.revert())
})
</script>

<template>
  <section
    ref="root"
    class="hero-section relative w-full h-screen min-h-[600px] flex items-center md:items-end overflow-hidden grain-overlay"
  >
    <!-- Background image -->
    <div ref="bgLayer" class="absolute inset-0 z-0 will-change-transform">
      <img
        :src="store.assetSrc(hero?.background)"
        :alt="String(store.get(HERO, 'backgroundAlt') ?? '')"
        class="img-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-br from-white/45 via-white/25 to-crimson-deep/20" />
      <div class="absolute inset-0 bg-gradient-to-t from-crimson-deep/35 via-transparent to-ink/10" />
      <div class="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-crimson-deep/40 to-transparent" />
      <!-- Red editorial accent -->
      <div class="absolute top-0 right-0 w-[min(45%,420px)] h-full bg-gradient-to-l from-crimson/15 to-transparent pointer-events-none" />
    </div>

    <button
      v-if="isEditing"
      type="button"
      class="absolute top-24 right-6 md:right-10 z-20 font-sans text-xs font-medium px-3 py-2 rounded-full bg-ink/80 text-ivory hover:bg-crimson"
      @click="replaceImageField(HERO, 'background', 'backgroundAlt')"
    >Change background image</button>

    <div class="relative z-10 w-full max-w-8xl mx-auto px-6 md:px-10 pt-24 pb-12 md:pt-0 md:pb-28">
      <div class="hero-badge mb-6">
        <span class="inline-flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-ivory/85 border border-crimson-vivid/35 bg-ink/20 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-[0_0_0_1px_rgba(196,30,58,0.22)]">
          <span class="w-1.5 h-1.5 rounded-full bg-crimson-vivid inline-block shadow-[0_0_12px_rgba(196,30,58,0.5)]" />
          <EditText :file="HERO" field="badge" placeholder="Badge text" />
        </span>
      </div>

      <h1 class="font-cormorant font-light text-ivory leading-none mb-2 hero-line-a">
        <EditText :file="HERO" field="eyebrow" class="block text-[clamp(2.5rem,6vw,5.5rem)] tracking-tight text-ivory/75 italic" />
      </h1>
      <h2 class="font-cormorant font-semibold text-ivory leading-none mb-8 hero-line-b">
        <span class="block text-[clamp(3rem,7.5vw,8rem)] tracking-tighter leading-[0.9] drop-shadow-[0_4px_32px_rgba(0,0,0,0.35)]">
          <EditText :file="HERO" field="titleLine1" required /><br>
          <EditText :file="HERO" field="titleHighlight" tag="em" placeholder="Highlighted words" class="text-crimson-vivid not-italic [text-shadow:0_0_40px_rgba(196,30,58,0.4)]" /><br>
          <EditText :file="HERO" field="titleLine3" />
        </span>
      </h2>

      <div class="flex flex-col gap-6">
        <EditText
          :file="HERO"
          field="intro"
          tag="p"
          multiline
          class="hero-copy font-sans text-base md:text-lg text-ivory/75 max-w-md leading-relaxed border-l-2 border-crimson-vivid/60 pl-5"
        />
        <EditSortable class="hero-cta flex flex-wrap items-center justify-center gap-4 w-full" @move="moveButton">
          <EditLink
            v-for="(button, i) in hero?.buttons ?? []"
            :key="i"
            :file="HERO"
            :label-field="`buttons.${i}.label`"
            :href-field="`buttons.${i}.href`"
            data-sort="button"
            :data-index="i"
            class="font-sans text-sm font-medium px-6 py-3 rounded-full transition-colors duration-200"
            :class="buttonStyles[button.style] ?? buttonStyles.outline"
          >
            <template v-if="isEditing">
              <button type="button" class="seasi-edit-chip" style="top: -0.6rem; left: -0.6rem" title="Remove button" @click.stop.prevent="removeButton(i)">✕</button>
              <span class="seasi-link-chip" style="top: auto; bottom: -0.6rem" title="Button style">
                <EditSelect :file="HERO" :field="`buttons.${i}.style`" :options="styleOptions" label="Button style">◐</EditSelect>
              </span>
            </template>
          </EditLink>
          <button v-if="isEditing" type="button" class="seasi-edit-add px-5 py-3" style="min-height: 0; border-radius: 9999px; color: #F9F6F0; border-color: rgb(249 246 240 / 0.6)" @click="addButton">+ Button</button>
        </EditSortable>
      </div>
    </div>

    <button
      type="button"
      class="hero-scroll absolute bottom-8 right-10 z-10 flex flex-col items-center gap-2 group cursor-pointer"
      aria-label="Scroll down"
      @click="scrollToContent"
    >
      <span class="font-mono text-2xs uppercase tracking-widest text-ivory/50 group-hover:text-crimson-vivid transition-colors">
        Scroll
      </span>
      <span class="relative w-px h-10 bg-gradient-to-b from-ivory/35 to-transparent block overflow-hidden rounded-full">
        <span class="hero-scroll-line absolute inset-0 bg-gradient-to-b from-crimson-vivid via-crimson-vivid/50 to-transparent opacity-90" />
      </span>
    </button>
  </section>
</template>
