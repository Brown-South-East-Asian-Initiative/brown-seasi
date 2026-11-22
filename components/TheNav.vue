<script setup lang="ts">
const menuOpen = ref(false)

const { y } = useWindowScroll()
const scrolled = computed(() => y.value > 60)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

const N = SITE_NAV
const { isEditing } = useEditor()
const store = useContentStore()
const nav = useContentFile<{ links: SiteLink[]; contact: SiteLink }>(N)
const links = computed(() => nav.value?.links ?? [])

function addLink() {
  store.update(N, (d) => {
    d.links ??= []
    d.links.push({ label: 'New link', href: '/' })
  })
}

function removeLink(i: number) {
  if (window.confirm(`Remove "${links.value[i]?.label}" from the menu?`)) store.update(N, d => d.links.splice(i, 1))
}

function moveLink(_list: string, from: number, to: number) {
  store.update(N, d => moveItem(d.links, from, to))
}

/** In edit mode links are editable, so editors use this to move between pages (edits are kept). */
function goTo(href: string) {
  closeMenu()
  if (/^(https?:|mailto:|tel:)/i.test(href)) window.open(href, '_blank', 'noopener')
  else navigateTo(href)
}
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
    :class="scrolled
      ? 'bg-ivory/95 backdrop-blur-md border-b border-crimson/10 shadow-[0_8px_30px_-12px_rgba(196,30,58,0.12)]'
      : 'bg-transparent'"
  >
    <nav class="max-w-8xl mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-20">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 group shrink-0"
        @click="closeMenu"
      >
        <img
          src="/images/logo.png"
          alt="Brown SEASI"
          class="h-9 md:h-11 w-auto object-contain"
        >
      </NuxtLink>

      <EditSortable tag="ul" class="hidden md:flex items-center gap-8" @move="moveLink">
        <li
          v-for="(link, i) in links"
          :key="i"
          :data-sort="isEditing ? 'nav' : undefined"
          :data-index="i"
          class="relative"
          :class="isEditing ? 'cursor-grab' : ''"
        >
          <EditLink
            :file="N"
            :label-field="`links.${i}.label`"
            :href-field="`links.${i}.href`"
            class="font-sans text-sm font-medium tracking-wide transition-colors duration-200 relative group"
            :class="[scrolled
              ? 'text-stone-700 hover:text-crimson-vivid'
              : 'text-ivory hover:text-crimson-vivid', isEditing ? 'pr-4' : '']"
          >
            <span
              class="absolute -bottom-0.5 left-0 w-0 h-px bg-crimson-vivid group-hover:w-full transition-all duration-300"
            />
          </EditLink>
          <span v-if="isEditing" class="absolute -bottom-5 left-0 flex gap-1">
            <button type="button" class="w-4 h-4 rounded-full bg-ink/80 text-ivory text-[0.55rem] leading-4 text-center hover:bg-crimson" :title="`Go to ${link.label}`" @click="goTo(link.href)">→</button>
            <button type="button" class="w-4 h-4 rounded-full bg-ink/80 text-ivory text-[0.55rem] leading-4 text-center hover:bg-crimson" title="Remove link" @click="removeLink(i)">✕</button>
          </span>
        </li>
        <li v-if="isEditing">
          <button
            type="button"
            class="font-sans text-xs px-2 py-1 rounded-full border border-dashed transition-colors"
            :class="scrolled ? 'border-crimson/50 text-crimson' : 'border-ivory/60 text-ivory'"
            @click="addLink"
          >+ Link</button>
        </li>
        <li>
          <EditLink
            :file="N"
            label-field="contact.label"
            href-field="contact.href"
            class="font-sans text-sm font-medium px-4 py-2 rounded-full border transition-all duration-300"
            :class="scrolled
              ? 'border-crimson-vivid text-crimson-vivid hover:bg-crimson-vivid hover:text-ivory'
              : 'border-crimson-vivid/55 text-ivory hover:bg-crimson-vivid/25'"
          />
        </li>
      </EditSortable>

      <button
        class="md:hidden flex flex-col gap-1 p-1 transition-all duration-300"
        :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
        @click="toggleMenu"
      >
        <span
          class="block w-6 h-0.5 transition-all duration-300 origin-center"
          :class="[
            scrolled ? 'bg-stone-900' : 'bg-ivory',
            menuOpen ? 'rotate-45 translate-y-[0.38rem]' : '',
          ]"
        />
        <span
          class="block w-6 h-0.5 transition-all duration-300"
          :class="[
            scrolled ? 'bg-stone-900' : 'bg-ivory',
            menuOpen ? 'opacity-0' : 'opacity-100',
          ]"
        />
        <span
          class="block w-6 h-0.5 transition-all duration-300 origin-center"
          :class="[
            scrolled ? 'bg-stone-900' : 'bg-ivory',
            menuOpen ? '-rotate-45 -translate-y-[0.38rem]' : '',
          ]"
        />
      </button>
    </nav>

    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="menuOpen"
        class="md:hidden relative border-t border-crimson/10 bg-ivory/[0.98] backdrop-blur-md"
      >
        <EditSortable tag="ul" class="px-6 py-4 flex flex-col gap-1" @move="moveLink">
          <li
            v-for="(link, i) in links"
            :key="i"
            :data-sort="isEditing ? 'nav' : undefined"
            :data-index="i"
            :class="isEditing ? 'flex items-center gap-2 border-b border-border' : ''"
          >
            <EditLink
              :file="N"
              :label-field="`links.${i}.label`"
              :href-field="`links.${i}.href`"
              class="block font-sans text-base font-medium text-stone-700 py-3 border-b border-border last:border-0 transition-colors hover:text-crimson-vivid"
              :class="isEditing ? 'flex-1 !border-0' : ''"
              @click="!isEditing && closeMenu()"
            />
            <template v-if="isEditing">
              <button type="button" class="w-6 h-6 rounded-full bg-ink/80 text-ivory text-xs" :title="`Go to ${link.label}`" @click="goTo(link.href)">→</button>
              <button type="button" class="w-6 h-6 rounded-full bg-ink/80 text-ivory text-xs" title="Remove link" @click="removeLink(i)">✕</button>
            </template>
          </li>
          <li v-if="isEditing" class="pt-2">
            <button type="button" class="seasi-edit-add w-full min-h-0 py-2" @click="addLink">+ Add link</button>
          </li>
          <li class="pt-2">
            <EditLink
              :file="N"
              label-field="contact.label"
              href-field="contact.href"
              class="inline-block font-sans text-sm font-medium px-4 py-2 rounded-full border border-crimson-vivid/50 text-crimson-vivid hover:bg-crimson-vivid hover:text-ivory transition-all duration-300"
            />
          </li>
        </EditSortable>
      </div>
    </Transition>
  </header>
</template>
