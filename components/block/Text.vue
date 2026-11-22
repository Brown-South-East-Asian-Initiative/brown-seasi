<script setup lang="ts">
const props = defineProps<{ file: string; base: string; block: Record<string, any> }>()
const { isEditing } = useEditor()
</script>

<template>
  <section class="max-w-3xl mx-auto">
    <EditText
      v-if="block.heading || isEditing"
      :file="file"
      :field="`${base}.heading`"
      tag="h2"
      placeholder="Heading (optional)"
      class="block font-cormorant font-semibold text-4xl md:text-5xl tracking-tight text-ink leading-tight mb-5"
    />
    <EditText
      :file="file"
      :field="`${base}.body`"
      tag="div"
      multiline
      required
      placeholder="Write here. Ctrl/⌘ + Enter to finish."
      class="block font-sans text-base md:text-lg text-ink-light leading-relaxed whitespace-pre-line"
    />
  </section>
</template>
