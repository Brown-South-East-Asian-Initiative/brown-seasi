<script setup lang="ts">
import { gsap } from 'gsap'

defineProps<{
  dark?: boolean
}>()

// Items live in content/site/ticker.json (shared by every ticker on the site).
const TICKER = 'content/site/ticker.json'
const ticker = useContentFile<{ items: string[] }>(TICKER)
const items = computed(() => ticker.value?.items ?? [])

const { isEditing } = useEditor()
const store = useContentStore()

const trackRef = ref<HTMLElement | null>(null)
let tween: gsap.core.Tween | null = null

function startScroll() {
  tween?.kill()
  tween = null
  const track = trackRef.value
  if (!track) return
  const half = track.scrollWidth / 2
  if (!half) return
  tween = gsap.fromTo(track, { x: 0 }, { x: -half, duration: 45, ease: 'none', repeat: -1 })
}

onMounted(startScroll)
onUnmounted(() => tween?.kill())

// Moving text can't be edited: stop scrolling in edit mode, restart after.
watch(isEditing, async (editing) => {
  if (editing) {
    tween?.kill()
    tween = null
  } else {
    await nextTick()
    startScroll()
  }
})

function addItem() {
  store.update(TICKER, (d) => {
    d.items ??= []
    d.items.push('New item')
  })
}

function removeItem(i: number) {
  store.update(TICKER, d => d.items.splice(i, 1))
}

function moveTickerItem(_list: string, from: number, to: number) {
  store.update(TICKER, d => moveItem(d.items, from, to))
}
</script>

<template>
  <div
    class="overflow-hidden py-4 relative border-y"
    :class="dark ? 'bg-ink border-ivory/10' : 'bg-crimson border-crimson-dark/20'"
  >
    <template v-if="!isEditing">
      <div
        class="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        :class="dark
          ? 'bg-gradient-to-r from-ink to-transparent'
          : 'bg-gradient-to-r from-crimson to-transparent'"
      />
      <div
        class="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        :class="dark
          ? 'bg-gradient-to-l from-ink to-transparent'
          : 'bg-gradient-to-l from-crimson to-transparent'"
      />

      <div ref="trackRef" class="flex w-max items-center will-change-transform">
        <template v-for="pass in 2" :key="pass">
          <span
            v-for="(item, i) in items"
            :key="`${pass}-${i}`"
            class="flex items-center shrink-0"
          >
            <span
              class="font-cormorant italic text-xl md:text-2xl font-medium whitespace-nowrap px-6"
              :class="dark ? 'text-ivory/75' : 'text-ivory'"
            >
              {{ item }}
            </span>
            <span
              class="text-lg font-light"
              :class="dark ? 'text-crimson-vivid/70' : 'text-ivory/55'"
            >·</span>
          </span>
        </template>
      </div>
    </template>

    <!-- Edit mode: the ticker stands still so items can be edited, reordered, added and removed. -->
    <EditSortable v-else class="flex flex-wrap items-center gap-y-3 px-4" @move="moveTickerItem">
      <span
        v-for="(item, i) in items"
        :key="i"
        data-sort="item"
        :data-index="i"
        class="flex items-center shrink-0 cursor-grab"
      >
        <EditText
          :file="TICKER"
          :field="`items.${i}`"
          required
          class="font-cormorant italic text-xl md:text-2xl font-medium whitespace-nowrap px-6"
          :class="dark ? 'text-ivory/75' : 'text-ivory'"
        />
        <button
          type="button"
          class="seasi-edit-chip"
          style="position: static"
          title="Remove item"
          @click.stop="removeItem(i)"
        >✕</button>
      </span>
      <button
        type="button"
        class="seasi-edit-add px-4 py-1.5 ml-4"
        style="min-height: 0; color: #F9F6F0; border-color: rgb(249 246 240 / 0.5)"
        @click="addItem"
      >+ Item</button>
    </EditSortable>
  </div>
</template>
