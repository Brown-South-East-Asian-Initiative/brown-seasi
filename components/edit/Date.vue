<script setup lang="ts">
// A date (YYYY-MM-DD) shown with custom formatting. Editors double-click to pick a new date.
const props = withDefaults(defineProps<{
  file: string
  field: string
  tag?: string
  format?: (iso: string) => string
}>(), { tag: 'span' })

const { isEditing } = useEditor()
const store = useContentStore()
const value = computed(() => String(store.get(props.file, props.field) ?? ''))
const shown = computed(() => (value.value && props.format ? props.format(value.value) : value.value))

const editing = ref(false)
const input = ref<HTMLInputElement | null>(null)

async function begin() {
  editing.value = true
  await nextTick()
  input.value?.focus()
  input.value?.showPicker?.()
}

function finish() {
  const v = input.value?.value
  editing.value = false
  if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) store.set(props.file, props.field, v)
}
</script>

<template>
  <component :is="tag" v-if="!isEditing"><slot :value="value">{{ shown }}</slot></component>
  <input
    v-else-if="editing"
    ref="input"
    type="date"
    :value="value"
    class="seasi-edit seasi-edit--active font-sans text-base text-ink bg-white rounded px-2 py-1"
    @click.stop
    @change="finish"
    @blur="finish"
    @keydown.enter.prevent="finish"
    @keydown.esc="editing = false"
  >
  <component
    :is="tag"
    v-else
    class="seasi-edit"
    title="Double-click to change the date"
    @click.stop.prevent
    @dblclick.stop.prevent="begin"
  ><slot :value="value">{{ shown }}</slot></component>
</template>
