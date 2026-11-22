<script setup lang="ts">
const props = defineProps<{ file: string; base: string; block: Record<string, any> }>()
const { isEditing } = useEditor()
const store = useContentStore()

const player = computed(() => (props.block.url ? embedUrl(props.block.url) : null))
const audio = computed(() => isAudioEmbed(props.block.url ?? ''))

function setUrl() {
  const next = window.prompt(
    'Paste the share link of the video or audio:\n\n• YouTube or Vimeo\n• Internet Archive (archive.org/details/…)\n• SoundCloud\n• Google Drive (file shared as "Anyone with the link")',
    props.block.url ?? '',
  )
  if (next === null) return
  const v = next.trim()
  if (v && !/^https:\/\//.test(v)) {
    window.alert('Please paste a full link starting with https://')
    return
  }
  store.set(props.file, `${props.base}.url`, v)
}
</script>

<template>
  <figure class="max-w-4xl mx-auto">
    <div
      v-if="player"
      class="relative overflow-hidden rounded-lg ring-1 ring-crimson/15 bg-ink"
      :class="audio ? 'h-40' : 'aspect-video'"
    >
      <iframe
        :src="player"
        class="absolute inset-0 w-full h-full"
        :class="isEditing ? 'pointer-events-none' : ''"
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerpolicy="strict-origin-when-cross-origin"
        :title="block.caption || 'Embedded media'"
      />
    </div>
    <a
      v-else-if="block.url && !isEditing"
      :href="block.url"
      target="_blank"
      rel="noopener"
      class="font-sans text-crimson underline"
    >{{ block.url }}</a>
    <p v-if="isEditing && block.url && !player" class="font-sans text-sm text-crimson-dark mb-2">
      This link can't be shown as a player, so visitors will see a plain link.
    </p>
    <button
      v-if="isEditing"
      type="button"
      class="seasi-edit-add w-full min-h-0 py-3 mt-3"
      @click="setUrl"
    >{{ block.url ? 'Change video/audio link' : '+ Add a video or audio link' }}</button>
    <figcaption v-if="block.caption || isEditing" class="mt-3">
      <EditText
        :file="file"
        :field="`${base}.caption`"
        placeholder="Caption (optional)"
        class="font-mono text-2xs uppercase tracking-widest text-muted"
      />
    </figcaption>
  </figure>
</template>
