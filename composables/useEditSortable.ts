import Sortable from 'sortablejs'
import type { Ref } from 'vue'

/**
 * Drag-to-reorder for items inside a container, active only in edit mode.
 * Mark items with data-sort="<list name>" and data-index="<index in that list>".
 * Several lists can share one container (e.g. flyers and photos in one grid);
 * items only reorder within their own list.
 */
export function useEditSortable(
  container: Ref<HTMLElement | null | undefined>,
  onMove: (list: string, from: number, to: number) => void,
) {
  const { isEditing } = useEditor()
  let sortable: Sortable | null = null

  function setup() {
    sortable?.destroy()
    sortable = null
    const el = container.value
    if (!el || !isEditing.value) return
    sortable = Sortable.create(el, {
      draggable: '[data-sort]',
      filter: '.seasi-edit-chip',
      preventOnFilter: false,
      // Mouse-based dragging: avoids the browser dragging the <img> itself.
      forceFallback: true,
      fallbackTolerance: 5,
      animation: 180,
      ghostClass: 'seasi-sort-ghost',
      onStart() {
        lastDragAt.value = Date.now()
      },
      onEnd(evt) {
        lastDragAt.value = Date.now()
        const item = evt.item as HTMLElement
        const list = item.dataset.sort!
        const from = Number(item.dataset.index)
        const to = Array.from(el.querySelectorAll<HTMLElement>(':scope > [data-sort]'))
          .filter(n => n.dataset.sort === list)
          .indexOf(item)
        // Put the DOM back where Vue expects it; Vue re-renders from the data change.
        item.remove()
        el.insertBefore(item, el.children[evt.oldIndex!] ?? null)
        if (to !== -1 && to !== from) onMove(list, from, to)
      },
    })
  }

  watch([container, isEditing], setup, { flush: 'post' })
  onMounted(setup)
  onBeforeUnmount(() => sortable?.destroy())
}

/** When the last drag happened, so a drop isn't treated as a click (e.g. "replace image"). */
const lastDragAt = ref(0)
export function justDragged() {
  return Date.now() - lastDragAt.value < 300
}

/** Move an item within an array in place. */
export function moveItem<T>(arr: T[], from: number, to: number) {
  const [item] = arr.splice(from, 1)
  arr.splice(to, 0, item!)
}
