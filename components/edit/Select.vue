<script setup lang="ts">
// A value picked from a fixed list (e.g. event type) or an on/off toggle.
// Visitors see the default slot. Editors click it to get a dropdown.
//   <EditSelect :file="path" field="tag" :options="['Lecture', 'Symposium']"><span>{{ event.tag }}</span></EditSelect>
//   <EditSelect :file="path" field="featured" :options="[{ label: 'Featured', value: true }, { label: 'Not featured', value: false }]" />
type Option = string | { label: string; value: string | number | boolean }

const props = withDefaults(defineProps<{
  file: string
  field: string
  options: Option[]
  tag?: string
  /** Shown to editors next to the dropdown, e.g. "Type". */
  label?: string
}>(), { tag: 'span' })

const { isEditing } = useEditor()
const store = useContentStore()
const value = computed(() => store.get(props.file, props.field))
const normalized = computed(() => props.options.map(o => (typeof o === 'string' ? { label: o, value: o } : o)))
const currentLabel = computed(() => normalized.value.find(o => o.value === value.value)?.label ?? String(value.value ?? ''))

const editing = ref(false)
const select = ref<HTMLSelectElement | null>(null)

async function begin() {
  editing.value = true
  await nextTick()
  select.value?.focus()
  try {
    select.value?.showPicker?.()
  } catch {}
}

function choose(e: Event) {
  const index = Number((e.target as HTMLSelectElement).value)
  const option = normalized.value[index]
  editing.value = false
  if (option) store.set(props.file, props.field, option.value)
}
</script>

<template>
  <component :is="tag" v-if="!isEditing"><slot :value="value" :label="currentLabel">{{ currentLabel }}</slot></component>
  <select
    v-else-if="editing"
    ref="select"
    class="seasi-edit seasi-edit--active font-sans text-sm text-ink bg-white rounded px-2 py-1"
    :aria-label="label ?? field"
    @click.stop
    @change="choose"
    @blur="editing = false"
    @keydown.esc="editing = false"
  >
    <option
      v-for="(o, i) in normalized"
      :key="String(o.value)"
      :value="i"
      :selected="o.value === value"
    >{{ o.label }}</option>
  </select>
  <component
    :is="tag"
    v-else
    class="seasi-edit seasi-edit--select"
    :title="`Click to change${label ? ` ${label.toLowerCase()}` : ''}`"
    @click.stop.prevent="begin"
  ><slot :value="value" :label="currentLabel">{{ currentLabel }}</slot></component>
</template>
