<script setup lang="ts">
// A link or button whose label and address editors can change.
// Visitors get a normal NuxtLink (internal pages) or <a> (external links, files, mailto).
// Editors double-click the label to edit it, and use the small link chip to change the address.
//   <EditLink :file="path" label-field="cta.label" href-field="cta.href" class="…" />
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  file: string
  labelField: string
  hrefField: string
}>()

const { isEditing } = useEditor()
const store = useContentStore()

const label = computed(() => String(store.get(props.file, props.labelField) ?? ''))
const href = computed(() => String(store.get(props.file, props.hrefField) ?? ''))

/** External sites, email/phone links and files (PDFs etc.) skip the router. */
const isPlain = computed(() => /^(https?:|mailto:|tel:)/i.test(href.value) || /\.[a-z0-9]{2,5}($|[?#])/i.test(href.value.split('/').pop() ?? ''))
const isExternal = computed(() => /^https?:/i.test(href.value))
/** External sites and files (PDFs) open in a new tab. */
const opensNewTab = computed(() => isExternal.value || (isPlain.value && !/^(mailto:|tel:)/i.test(href.value)))
const safeHref = computed(() => (/^(https?:|mailto:|tel:)/i.test(href.value) ? href.value : encodeURI(decodeURI(href.value))))

function editHref() {
  const next = window.prompt('Where should this link go?\n\n• A page on this site: /symposium\n• A section: /#events\n• Another website: https://…\n• Email: mailto:seasi@brown.edu', href.value)
  if (next === null) return
  const v = next.trim()
  if (v && !/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(v)) {
    window.alert('Links must start with /, #, https://, mailto: or tel:')
    return
  }
  store.set(props.file, props.hrefField, v)
}
</script>

<template>
  <span v-if="isEditing" v-bind="$attrs" class="relative group/elink">
    <slot name="before" />
    <EditText :file="file" :field="labelField" required placeholder="Button text" />
    <slot />
    <button
      type="button"
      class="seasi-link-chip opacity-0 group-hover/elink:opacity-100 focus:opacity-100 transition-opacity"
      :title="`Change link (now: ${href || 'none'})`"
      @click.stop.prevent="editHref"
    >🔗</button>
  </span>
  <a
    v-else-if="isPlain"
    :href="safeHref"
    :target="opensNewTab ? '_blank' : undefined"
    :rel="opensNewTab ? 'noopener' : undefined"
    v-bind="$attrs"
  ><slot name="before" />{{ label }}<slot /></a>
  <NuxtLink v-else v-bind="$attrs" :to="href || '/'"><slot name="before" />{{ label }}<slot /></NuxtLink>
</template>
