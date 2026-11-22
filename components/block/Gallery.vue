<script setup lang="ts">
const props = defineProps<{ file: string; base: string; block: Record<string, any> }>()
const { isEditing } = useEditor()
const store = useContentStore()

function images(data: Record<string, any>) {
  return getBlock(data).images as { src: string; alt?: string; caption?: string }[]
}
function getBlock(data: Record<string, any>) {
  return props.base.split('.').reduce((o, k) => o[k], data)
}

async function addPhoto() {
  try {
    const url = await pickAndStageImage()
    if (!url) return
    const alt = window.prompt('Describe this photo for people using screen readers (alt text):') ?? ''
    store.update(props.file, data => images(data).push({ src: url, alt: alt.trim() }))
  } catch (e) {
    window.alert(e instanceof Error ? e.message : 'Could not use that image.')
  }
}
</script>

<template>
  <section class="max-w-6xl mx-auto">
    <EditSortable
      class="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
      @move="(_list, from, to) => store.update(file, data => moveItem(images(data), from, to))"
    >
      <figure
        v-for="(img, i) in block.images"
        :key="`${i}-${img.src}`"
        data-sort="photo"
        :data-index="i"
        class="overflow-hidden rounded-lg ring-1 ring-crimson/15 bg-white"
        :class="isEditing ? 'cursor-grab' : ''"
      >
        <EditImage
          :file="file"
          :field="`${base}.images.${i}.src`"
          :alt-field="`${base}.images.${i}.alt`"
          class="aspect-[4/3] w-full object-cover"
          loading="lazy"
        />
        <figcaption v-if="img.caption || isEditing" class="px-3 py-2">
          <EditText
            :file="file"
            :field="`${base}.images.${i}.caption`"
            placeholder="Caption"
            class="font-mono text-2xs uppercase tracking-widest text-muted"
          />
        </figcaption>
        <button
          v-if="isEditing"
          type="button"
          class="seasi-edit-chip right-1.5"
          title="Remove photo"
          @click.prevent.stop="store.update(file, data => images(data).splice(i, 1))"
        >✕</button>
      </figure>
      <button v-if="isEditing" type="button" class="seasi-edit-add aspect-[4/3]" @click="addPhoto">+ Photo</button>
    </EditSortable>
  </section>
</template>
