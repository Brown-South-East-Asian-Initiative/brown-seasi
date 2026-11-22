<script setup lang="ts">
// An image editors can click to replace. Pass normal <img> attributes (class, alt, loading…).
// Use the #empty slot for what to show when there's no image; it receives `pick` for editors.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  file: string
  field: string
  /** Field to store alt text in (asked for after upload). */
  altField?: string
}>()

const { isEditing } = useEditor()
const store = useContentStore()
const src = computed(() => store.assetSrc(store.get(props.file, props.field) as string | undefined))
const altText = computed(() => (props.altField ? String(store.get(props.file, props.altField) ?? '') : undefined))
const busy = ref(false)

async function pick() {
  if (busy.value || justDragged()) return
  busy.value = true
  try {
    const url = await pickAndStageImage()
    if (!url) return
    const alt = props.altField
      ? window.prompt('Describe this image for people using screen readers (alt text):', altText.value ?? '')
      : null
    store.update(props.file, (data) => {
      setByPath(data, props.field, url)
      if (props.altField && alt !== null) setByPath(data, props.altField, alt.trim())
    })
  } catch (e) {
    window.alert(e instanceof Error ? e.message : 'Could not use that image.')
  } finally {
    busy.value = false
  }
}

function setByPath(obj: any, path: string, value: unknown) {
  const keys = path.split('.')
  const last = keys.pop()!
  const target = keys.reduce((o, k) => o[k], obj)
  target[last] = value
}

defineExpose({ pick })
</script>

<template>
  <img
    v-if="src"
    v-bind="$attrs"
    :src="src"
    :alt="altText ?? ($attrs.alt as string | undefined)"
    :class="isEditing ? 'seasi-edit seasi-edit--image' : ''"
    :title="isEditing ? 'Click to replace image' : undefined"
    @click="isEditing && ($event.preventDefault(), $event.stopPropagation(), pick())"
  >
  <slot v-else name="empty" :pick="pick" :editing="isEditing" />
</template>
