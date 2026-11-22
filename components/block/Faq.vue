<script setup lang="ts">
const props = defineProps<{ file: string; base: string; block: Record<string, any> }>()
const { isEditing } = useEditor()
const store = useContentStore()

function items(data: Record<string, any>) {
  return props.base.split('.').reduce((o, k) => o[k], data).items as { question: string; answer: string }[]
}
</script>

<template>
  <section class="max-w-3xl mx-auto">
    <EditText
      v-if="block.heading || isEditing"
      :file="file"
      :field="`${base}.heading`"
      tag="h2"
      placeholder="Heading (optional)"
      class="block font-cormorant font-semibold text-4xl md:text-5xl tracking-tight text-ink leading-tight mb-6"
    />
    <EditSortable
      class="divide-y divide-border border-y border-border"
      @move="(_list, from, to) => store.update(file, data => moveItem(items(data), from, to))"
    >
      <details
        v-for="(item, i) in block.items"
        :key="i"
        data-sort="faq"
        :data-index="i"
        class="group py-5"
        :open="isEditing || undefined"
      >
        <summary class="flex items-start justify-between gap-6 cursor-pointer list-none">
          <EditText
            :file="file"
            :field="`${base}.items.${i}.question`"
            required
            class="font-cormorant font-semibold text-2xl text-ink leading-snug"
          />
          <span class="font-sans text-crimson text-xl leading-none mt-1 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <EditText
          :file="file"
          :field="`${base}.items.${i}.answer`"
          tag="p"
          multiline
          placeholder="Answer"
          class="block font-sans text-base text-ink-light leading-relaxed mt-3 whitespace-pre-line"
        />
        <button
          v-if="isEditing"
          type="button"
          class="seasi-edit-chip right-0"
          title="Remove question"
          @click.prevent.stop="store.update(file, data => items(data).splice(i, 1))"
        >✕</button>
      </details>
    </EditSortable>
    <button
      v-if="isEditing"
      type="button"
      class="seasi-edit-add w-full min-h-0 py-3 mt-4"
      @click="store.update(file, data => items(data).push({ question: 'New question?', answer: 'Answer.' }))"
    >+ Question</button>
  </section>
</template>
