<script setup lang="ts">
const props = defineProps<{ file: string; base: string; block: Record<string, any> }>()
const { isEditing } = useEditor()
</script>

<template>
  <figure class="mx-auto" :class="block.size === 'wide' ? 'max-w-6xl' : 'max-w-3xl'">
    <EditImage
      :file="file"
      :field="`${base}.src`"
      :alt-field="`${base}.alt`"
      class="w-full h-auto rounded-lg ring-1 ring-crimson/15"
      loading="lazy"
    >
      <template #empty="{ pick, editing }">
        <button v-if="editing" type="button" class="seasi-edit-add w-full min-h-[14rem]" @click="pick">+ Choose image</button>
      </template>
    </EditImage>
    <figcaption v-if="block.caption || isEditing" class="mt-3">
      <EditText
        :file="file"
        :field="`${base}.caption`"
        placeholder="Caption (optional)"
        class="font-mono text-2xs uppercase tracking-widest text-muted"
      />
    </figcaption>
    <p v-if="isEditing" class="mt-2 font-sans text-xs text-muted">
      Size:
      <EditSelect
        :file="file"
        :field="`${base}.size`"
        label="Size"
        :options="[{ label: 'Normal width', value: 'normal' }, { label: 'Wide', value: 'wide' }]"
        class="text-ink"
      />
    </p>
  </figure>
</template>
