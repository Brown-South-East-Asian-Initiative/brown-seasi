<script setup lang="ts">
// Text that editors can double-click to change. Outside edit mode it renders like plain text.
// <EditText :file="path" field="speaker" tag="h3" class="…" />
const props = withDefaults(defineProps<{
  file: string
  field: string
  tag?: string
  multiline?: boolean
  /** Shown to visitors when empty (e.g. "To be announced"). Omit to render nothing. */
  empty?: string
  /** Hint shown to editors when empty. */
  placeholder?: string
  required?: boolean
  maxlength?: number
  /** Display formatting for visitors, e.g. adding quotes. Editors always edit the raw text. */
  format?: (value: string) => string
}>(), { tag: 'span', placeholder: 'Double-click to add text', maxlength: 2000 })

const { isEditing } = useEditor()
const store = useContentStore()

const value = computed(() => String(store.get(props.file, props.field) ?? ''))
const shown = computed(() => (value.value ? (props.format ? props.format(value.value) : value.value) : ''))

const editing = ref(false)
const el = ref<HTMLElement | null>(null)
let cancelled = false

async function begin() {
  editing.value = true
  cancelled = false
  await nextTick()
  const node = el.value
  if (!node) return
  node.innerText = value.value
  node.focus()
  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function finish() {
  if (!editing.value) return
  const node = el.value
  editing.value = false
  if (cancelled || !node) return
  let text = node.innerText.replace(/ /g, ' ')
  text = props.multiline ? text.replace(/\n{3,}/g, '\n\n').trim() : text.replace(/\s+/g, ' ').trim()
  text = text.slice(0, props.maxlength)
  if (props.required && !text) return
  store.set(props.file, props.field, text)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    cancelled = true
    el.value?.blur()
  } else if (e.key === 'Enter' && (!props.multiline || e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    el.value?.blur()
  }
}
</script>

<template>
  <component :is="tag" v-if="!isEditing">{{ shown || empty }}</component>
  <component
    :is="tag"
    v-else-if="editing"
    key="editing"
    ref="el"
    contenteditable="plaintext-only"
    class="seasi-edit seasi-edit--active"
    :class="{ 'whitespace-pre-line': multiline }"
    spellcheck="true"
    @click.stop.prevent
    @blur="finish"
    @keydown="onKeydown"
  />
  <component
    :is="tag"
    v-else
    key="view"
    class="seasi-edit"
    :class="{ 'seasi-edit--empty': !value }"
    :data-placeholder="placeholder"
    :title="'Double-click to edit'"
    @click.stop.prevent
    @dblclick.stop.prevent="begin"
  >{{ shown }}</component>
</template>
