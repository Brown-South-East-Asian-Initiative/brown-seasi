<script setup lang="ts">
const F = SITE_FOOTER
const { isEditing } = useEditor()
const store = useContentStore()
const footer = useContentFile<{ links: SiteLink[]; socials: (SiteLink & { icon: string })[] }>(F)
const navLinks = computed(() => footer.value?.links ?? [])
const socials = computed(() => footer.value?.socials ?? [])

function addItem(list: 'links' | 'socials') {
  store.update(F, (d) => {
    d[list] ??= []
    d[list].push(list === 'links' ? { label: 'New link', href: '/' } : { label: 'New profile', href: 'https://', icon: 'link' })
  })
}

function removeItem(list: 'links' | 'socials', i: number) {
  if (window.confirm('Remove this link?')) store.update(F, d => d[list].splice(i, 1))
}

function moveItemIn(list: string, from: number, to: number) {
  store.update(F, d => moveItem(d[list], from, to))
}
</script>

<template>
  <footer class="bg-ink text-ivory/70">
    <!-- Top bar -->
    <div class="border-b border-ivory/10">
      <div class="max-w-8xl mx-auto px-6 md:px-10 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">

        <!-- Brand column -->
        <div class="md:col-span-1">
          <NuxtLink to="/" class="inline-block mb-5">
            <img
              src="/images/logo.png"
              alt="Brown SEASI"
              class="h-12 w-auto object-contain brightness-0 invert"
            >
          </NuxtLink>
          <EditText
            :file="F"
            field="blurb"
            tag="p"
            multiline
            placeholder="About SEASI"
            class="block font-sans text-sm leading-relaxed text-ivory/50 max-w-xs"
          />
          <EditLink
            :file="F"
            label-field="email.label"
            href-field="email.href"
            class="inline-flex items-center gap-2 mt-5 font-mono text-xs text-crimson-vivid hover:text-crimson transition-colors"
            :class="isEditing ? 'pr-4' : ''"
          >
            <template #before>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-3.5 h-3.5">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m2 7 10 7 10-7"/>
              </svg>
            </template>
          </EditLink>
        </div>

        <!-- Navigation column -->
        <div>
          <EditText :file="F" field="linksHeading" tag="h3" required class="block font-mono text-2xs uppercase tracking-widest text-ivory/30 mb-5" />
          <EditSortable tag="ul" class="flex flex-col gap-3" @move="moveItemIn">
            <li
              v-for="(link, i) in navLinks"
              :key="i"
              :data-sort="isEditing ? 'links' : undefined"
              :data-index="i"
              :class="isEditing ? 'flex items-center gap-2 cursor-grab' : ''"
            >
              <EditLink
                :file="F"
                :label-field="`links.${i}.label`"
                :href-field="`links.${i}.href`"
                class="font-sans text-sm text-ivory/60 hover:text-ivory transition-colors flex items-center gap-1.5 group"
                :class="isEditing ? 'pr-4' : ''"
              >
                <template #before>
                  <span class="w-0 group-hover:w-3 h-px bg-crimson-vivid transition-all duration-300 inline-block" />
                </template>
              </EditLink>
              <button
                v-if="isEditing"
                type="button"
                class="w-5 h-5 rounded-full bg-ivory/15 text-ivory text-[0.6rem] leading-5 text-center hover:bg-crimson"
                title="Remove link"
                @click="removeItem('links', i)"
              >✕</button>
            </li>
            <li v-if="isEditing">
              <button type="button" class="font-sans text-xs text-ivory/70 border border-dashed border-ivory/30 rounded-full px-3 py-1 hover:bg-ivory/10" @click="addItem('links')">+ Link</button>
            </li>
          </EditSortable>
        </div>

        <!-- Socials column -->
        <div>
          <EditText :file="F" field="socialsHeading" tag="h3" required class="block font-mono text-2xs uppercase tracking-widest text-ivory/30 mb-5" />
          <EditSortable tag="ul" class="flex flex-col gap-4" @move="moveItemIn">
            <li
              v-for="(social, i) in socials"
              :key="i"
              :data-sort="isEditing ? 'socials' : undefined"
              :data-index="i"
              :class="isEditing ? 'flex items-center gap-2 cursor-grab' : ''"
            >
              <EditLink
                :file="F"
                :label-field="`socials.${i}.label`"
                :href-field="`socials.${i}.href`"
                class="flex items-center gap-3 font-sans text-sm text-ivory/60 hover:text-ivory group transition-colors"
                :class="isEditing ? 'pr-4' : ''"
              >
                <template #before>
                  <EditSelect :file="F" :field="`socials.${i}.icon`" :options="socialIconOptions" label="Icon" class="flex">
                    <span
                      class="flex items-center justify-center w-8 h-8 rounded-full border border-ivory/10 group-hover:border-crimson-vivid group-hover:text-crimson-vivid transition-all duration-300"
                      v-html="socialIcons[social.icon]?.svg ?? socialIcons.link!.svg"
                    />
                  </EditSelect>
                </template>
              </EditLink>
              <button
                v-if="isEditing"
                type="button"
                class="w-5 h-5 rounded-full bg-ivory/15 text-ivory text-[0.6rem] leading-5 text-center hover:bg-crimson"
                title="Remove"
                @click="removeItem('socials', i)"
              >✕</button>
            </li>
            <li v-if="isEditing">
              <button type="button" class="font-sans text-xs text-ivory/70 border border-dashed border-ivory/30 rounded-full px-3 py-1 hover:bg-ivory/10" @click="addItem('socials')">+ Social link</button>
            </li>
          </EditSortable>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="max-w-8xl mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p class="font-mono text-2xs text-ivory/25 uppercase tracking-widest">
        © {{ new Date().getFullYear() }} <EditText :file="F" field="copyright" placeholder="Name · City" />
      </p>
      <EditText :file="F" field="bottomRight" tag="p" placeholder="Text (optional)" class="block font-mono text-2xs text-ivory/25 uppercase tracking-widest" />
    </div>
  </footer>
</template>
