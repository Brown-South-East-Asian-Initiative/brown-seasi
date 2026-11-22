<script setup lang="ts">
// Full-width photo band. Two ways to use it:
// - content-driven (editable): <SectionImageBreaker file="content/home/image-breakers.json" field="items.0" />
// - plain props (not editable): <SectionImageBreaker src="/images/x.png" overlay-text="…" />
const props = defineProps<{
  file?: string
  /** Object path inside the file, e.g. "items.0". */
  field?: string
  src?: string
  alt?: string
  caption?: string
  height?: string
  /** Content mode: allow a quote over the image. */
  overlay?: boolean
  overlayText?: string
}>()

const { isEditing } = useEditor()
const store = useContentStore()

const editable = computed(() => !!props.file && !!props.field)
const at = (key: string) => `${props.field}.${key}`
const read = (key: string) => (editable.value ? store.get(props.file!, at(key)) as string | undefined : undefined)

const imageSrc = computed(() => (editable.value ? store.assetSrc(read('src')) : props.src))
const imageAlt = computed(() => (editable.value ? read('alt') : props.alt) ?? 'SEASI image')
const quote = computed(() => (editable.value ? read('quote') : props.overlayText))
const label = computed(() => (editable.value ? read('label') : 'SEASI'))
const captionText = computed(() => (editable.value ? read('caption') : props.caption))

// In edit mode, quote/caption slots show even when empty so they can be filled in.
const showQuote = computed(() => !!quote.value || (editable.value && isEditing.value && props.overlay))
const showCaption = computed(() => !!captionText.value || (editable.value && isEditing.value))

const withQuotes = (q: string) => `"${q}"`

const sectionRef = ref<HTMLElement | null>(null)
const imgRef = ref<HTMLElement | null>(null)

useImageParallax(sectionRef, imgRef, 16)
</script>

<template>
  <div
    ref="sectionRef"
    class="relative w-full overflow-hidden ring-1 ring-crimson/10"
    :class="height ?? 'h-[60vh] md:h-[75vh]'"
  >
    <div
      class="absolute top-0 left-0 right-0 z-[15] h-1.5 bg-crimson pointer-events-none"
      aria-hidden="true"
    />
    <div
      class="absolute bottom-0 left-0 right-0 z-[15] h-1 bg-crimson pointer-events-none"
      aria-hidden="true"
    />
    <img
      ref="imgRef"
      :src="imageSrc"
      :alt="imageAlt"
      class="absolute inset-0 h-full w-full object-cover object-center scale-[1.14] will-change-transform"
    >

    <!-- Mutes busy photography so quote text stays readable -->
    <div
      v-if="showQuote"
      class="absolute inset-0 z-[5] bg-white/50 pointer-events-none"
    />

    <div class="absolute inset-0 bg-gradient-to-t from-ink/15 via-transparent to-transparent z-[6] pointer-events-none" />

    <button
      v-if="editable && isEditing"
      type="button"
      class="absolute top-6 right-4 z-20 font-sans text-xs font-medium px-3 py-2 rounded-full bg-ink/80 text-ivory hover:bg-crimson"
      @click="replaceImageField(file!, at('src'), at('alt'))"
    >Change image</button>

    <div
      v-if="showQuote"
      class="absolute inset-0 flex items-end justify-start p-8 md:p-14 z-10"
    >
      <div class="max-w-2xl">
        <EditText
          v-if="editable"
          :file="file!"
          :field="at('label')"
          placeholder="Label"
          class="font-mono text-2xs uppercase tracking-widest text-crimson mb-3 block"
        />
        <span v-else class="font-mono text-2xs uppercase tracking-widest text-crimson mb-3 block">
          {{ label }}
        </span>
        <p class="relative font-cormorant italic font-semibold text-ink text-2xl md:text-4xl leading-snug border-l-4 border-crimson pl-6">
          <EditText
            v-if="editable"
            :file="file!"
            :field="at('quote')"
            multiline
            placeholder="Quote (optional)"
            :format="withQuotes"
          />
          <template v-else>"{{ quote }}"</template>
        </p>
      </div>
    </div>

    <div v-if="showCaption" class="absolute bottom-4 right-4 z-10">
      <span class="font-mono text-2xs uppercase tracking-widest text-ivory/50 bg-ink/40 backdrop-blur-sm px-2 py-1 rounded">
        <EditText v-if="editable" :file="file!" :field="at('caption')" placeholder="Caption (optional)" />
        <template v-else>{{ caption }}</template>
      </span>
    </div>
  </div>
</template>
