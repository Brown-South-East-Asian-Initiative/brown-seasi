<script setup lang="ts">
const props = defineProps<{ file: string; base: string; block: Record<string, any> }>()
const { isEditing } = useEditor()
</script>

<template>
  <div class="max-w-3xl mx-auto flex flex-wrap items-center gap-4">
    <EditLink
      :file="file"
      :label-field="`${base}.label`"
      :href-field="`${base}.href`"
      upload="application/pdf"
      class="inline-flex items-center gap-2 font-sans text-sm font-medium px-6 py-3 rounded-full transition-all duration-300"
      :class="block.style === 'secondary'
        ? 'border border-crimson/25 text-ink hover:border-crimson hover:text-crimson'
        : 'bg-crimson hover:bg-crimson-vivid text-ivory hover:-translate-y-0.5 hover:shadow-lg hover:shadow-crimson/25'"
    />
    <span v-if="isEditing" class="font-sans text-xs text-muted">
      Style:
      <EditSelect
        :file="file"
        :field="`${base}.style`"
        label="Style"
        :options="[{ label: 'Red', value: 'primary' }, { label: 'Outline', value: 'secondary' }]"
        class="text-ink"
      />
    </span>
  </div>
</template>
