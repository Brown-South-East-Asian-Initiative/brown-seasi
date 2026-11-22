<script setup lang="ts">
const props = defineProps<{ file: string; base: string; block: Record<string, any> }>()
const { isEditing } = useEditor()
</script>

<template>
  <blockquote class="max-w-3xl mx-auto border-l-2 border-crimson pl-6 md:pl-8">
    <EditText
      :file="file"
      :field="`${base}.text`"
      tag="p"
      multiline
      required
      :format="t => `“${t.replace(/^[“\x22]|[”\x22]$/g, '')}”`"
      class="block font-cormorant italic text-3xl md:text-4xl text-ink leading-snug"
    />
    <footer v-if="block.attribution || isEditing" class="mt-4">
      <EditText
        :file="file"
        :field="`${base}.attribution`"
        placeholder="Who said it (optional)"
        :format="a => `— ${a}`"
        class="font-mono text-2xs uppercase tracking-widest text-muted"
      />
    </footer>
  </blockquote>
</template>
