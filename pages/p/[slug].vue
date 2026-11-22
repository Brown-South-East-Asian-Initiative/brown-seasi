<script setup lang="ts">
// Pages members build from blocks. Content: content/custom-pages/<slug>.json
const route = useRoute()
const { isEditing } = useEditor()
const store = useContentStore()

const slug = computed(() => String(route.params.slug))
const path = computed(() => customPagePath(slug.value))
const page = computed(() => store.read(path.value) as CustomPage | undefined)

if (!page.value && !isEditing.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: () => (page.value ? `${page.value.title} — Brown SEASI` : 'Brown SEASI'),
  ogTitle: () => page.value?.title,
  description: () => page.value?.subtitle,
  ogDescription: () => page.value?.subtitle,
  ogImage: useSiteAssetUrl('/images/website-preview.png'),
})

const blockComponents: Record<string, ReturnType<typeof resolveComponent>> = {
  text: resolveComponent('BlockText'),
  image: resolveComponent('BlockImage'),
  gallery: resolveComponent('BlockGallery'),
  button: resolveComponent('BlockButton'),
  faq: resolveComponent('BlockFaq'),
  embed: resolveComponent('BlockEmbed'),
  quote: resolveComponent('BlockQuote'),
}

const adding = ref(false)

function addBlock(type: string) {
  const def = BLOCK_TYPES.find(b => b.type === type)
  if (!def) return
  adding.value = false
  store.update(path.value, (data) => {
    data.blocks ??= []
    data.blocks.push(def.create())
  })
}

function removeBlock(i: number) {
  if (window.confirm('Remove this block? (You can undo before saving.)')) {
    store.update(path.value, data => data.blocks.splice(i, 1))
  }
}

function moveBlock(from: number, to: number) {
  store.update(path.value, data => moveItem(data.blocks, from, to))
}

async function deletePage() {
  if (!page.value || !window.confirm(`Delete the page "${page.value.title}"? It's removed when you save. (You can undo before saving.)`)) return
  const href = `/p/${slug.value}`
  store.remove(path.value)
  // Also drop menu links to it.
  if (store.read(SITE_NAV)?.links?.some((l: { href: string }) => l.href === href)) {
    store.update(SITE_NAV, (data) => {
      data.links = data.links.filter((l: { href: string }) => l.href !== href)
    })
  }
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen bg-ivory">
    <TheNav />

    <template v-if="page">
      <section class="relative bg-crimson-deep overflow-hidden border-b border-crimson-vivid/20">
        <div
          class="absolute inset-0 opacity-[0.06] pointer-events-none"
          style="background-image: repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)"
        />
        <div class="relative z-10 max-w-8xl mx-auto px-6 md:px-10 pt-32 pb-16 md:pt-44 md:pb-24">
          <EditText
            :file="path"
            field="title"
            tag="h1"
            required
            class="block font-cormorant font-bold text-ivory text-[clamp(3rem,8vw,8rem)] tracking-tighter leading-[0.9]"
          />
          <EditText
            v-if="page.subtitle || isEditing"
            :file="path"
            field="subtitle"
            tag="p"
            placeholder="Subtitle (optional)"
            class="block font-cormorant text-[clamp(1.4rem,3vw,2.75rem)] tracking-tight text-ivory/70 font-light italic max-w-3xl mt-4"
          />
          <div v-if="isEditing" class="mt-8 flex flex-wrap items-center gap-4 font-sans text-xs text-ivory/60">
            <span>Page address: <span class="font-mono text-ivory/85">/p/{{ slug }}</span></span>
            <button type="button" class="text-ivory/70 hover:text-ivory underline" @click="deletePage">Delete this page</button>
          </div>
        </div>
      </section>

      <main class="bg-white py-16 md:py-24 px-6 md:px-10">
        <EditSortable class="flex flex-col gap-14 md:gap-20" @move="(_list, from, to) => moveBlock(from, to)">
          <div
            v-for="(block, i) in page.blocks ?? []"
            :key="`${i}-${block.type}`"
            data-sort="block"
            :data-index="i"
            :class="isEditing ? 'rounded-xl ring-1 ring-dashed ring-crimson/20 p-4 md:p-6 hover:ring-crimson/45 transition-shadow' : ''"
          >
            <div v-if="isEditing" class="flex items-center justify-between mb-3 font-mono text-2xs uppercase tracking-widest text-muted select-none">
              <span class="cursor-grab" title="Drag to move this block">⠿ {{ BLOCK_TYPES.find(b => b.type === block.type)?.label ?? block.type }}</span>
              <button type="button" class="hover:text-crimson" title="Remove block" @click="removeBlock(i)">✕ Remove</button>
            </div>
            <component :is="blockComponents[block.type]" :file="path" :base="`blocks.${i}`" :block="block" />
          </div>
        </EditSortable>

        <p v-if="!page.blocks?.length && !isEditing" class="text-center font-sans text-muted">This page is empty.</p>

        <div v-if="isEditing" class="max-w-3xl mx-auto mt-14">
          <button v-if="!adding" type="button" class="seasi-edit-add w-full min-h-0 py-4" @click="adding = true">+ Add block</button>
          <div v-else class="rounded-xl ring-1 ring-crimson/25 bg-ivory p-4">
            <p class="font-mono text-2xs uppercase tracking-widest text-crimson mb-3">Add a block</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="t in BLOCK_TYPES"
                :key="t.type"
                type="button"
                class="text-left rounded-lg bg-white ring-1 ring-border hover:ring-crimson px-4 py-3 transition"
                @click="addBlock(t.type)"
              >
                <span class="block font-sans text-sm font-medium text-ink">{{ t.label }}</span>
                <span class="block font-sans text-xs text-muted">{{ t.hint }}</span>
              </button>
            </div>
            <button type="button" class="mt-3 font-sans text-xs text-muted hover:text-ink" @click="adding = false">Cancel</button>
          </div>
        </div>
      </main>
    </template>

    <section v-else class="pt-40 pb-32 text-center px-6">
      <p class="font-cormorant text-4xl text-ink mb-4">This page doesn't exist (yet).</p>
      <p class="font-sans text-sm text-muted">It may have been deleted, or it's in a draft that hasn't been published.</p>
    </section>

    <TheFooter />
  </div>
</template>
