<script setup lang="ts">
// A container whose children can be dragged to reorder in edit mode.
// Children need data-sort="<list>" and data-index="<i>". Emits move(list, from, to).
withDefaults(defineProps<{ tag?: string }>(), { tag: 'div' })
const emit = defineEmits<{ move: [list: string, from: number, to: number] }>()
const root = ref<HTMLElement | null>(null)
useEditSortable(root, (list, from, to) => emit('move', list, from, to))
</script>

<template>
  <component :is="tag" ref="root"><slot /></component>
</template>
