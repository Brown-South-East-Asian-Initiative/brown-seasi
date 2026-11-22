<script setup lang="ts">
const title = 'Student Works — Brown SEASI'
const description =
  'Research, oral histories, and creative projects on Southeast Asia by Brown students.'

const ogImage = useSiteAssetUrl('/images/website-preview.png')

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage,
  ogImageAlt: 'Brown Southeast Asian Studies Initiative — Brown University',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: ogImage,
})

const { isEditing } = useEditor()
const store = useContentStore()
const P = STUDENT_WORKS_PAGE

const collection = useCollection<StudentWork>(STUDENT_WORKS_FOLDER)
const works = computed(() => sortStudentWorks(collection.value))

const thisYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: thisYear + 2 - 2000 }, (_, i) => thisYear + 1 - i)

const listRef = ref<HTMLElement | null>(null)
useScrollReveal(listRef)

// ── Editing actions ───────────────────────────────────────────
function addWork() {
  const workTitle = window.prompt('Title of the new student work:')?.trim()
  if (!workTitle) return
  let slug = slugify(workTitle)
  while (store.read(`${STUDENT_WORKS_FOLDER}/${slug}.json`)) slug = `${slug}-2`
  store.create(`${STUDENT_WORKS_FOLDER}/${slug}.json`, {
    slug,
    title: workTitle,
    students: 'Student name',
    year: thisYear,
    type: 'Research',
  })
}

function deleteWork(path: string, workTitle: string) {
  if (window.confirm(`Delete "${workTitle}"? (You can undo before saving.)`)) store.remove(path)
}

function editWorkLink(path: string, current?: string) {
  const next = window.prompt('Link to the project (a full https:// address). Leave empty for no link.', current ?? '')
  if (next === null) return
  const v = next.trim()
  if (v && !/^(https?:\/\/|\/)/i.test(v)) {
    window.alert('Links must start with https:// (or / for a page on this site).')
    return
  }
  store.set(path, 'link', v)
}
</script>

<template>
  <div class="min-h-screen bg-ivory">
    <TheNav />

    <section class="relative bg-crimson-deep overflow-hidden border-b border-crimson-vivid/20">
      <div
        class="absolute inset-0 opacity-[0.06] pointer-events-none"
        style="background-image: repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)"
      />
      <div class="relative z-10 max-w-8xl mx-auto px-6 md:px-10 pt-32 pb-20 md:pt-44 md:pb-28">
        <EditText
          :file="P"
          field="badge"
          required
          class="font-mono text-2xs uppercase tracking-widest text-ivory/70 border border-crimson-vivid/40 bg-ink/15 rounded-full px-3 py-1 inline-block mb-6"
        />
        <EditText
          :file="P"
          field="title"
          tag="h1"
          required
          class="font-cormorant font-bold text-ivory text-[clamp(3.5rem,10vw,10rem)] tracking-tighter leading-[0.88]"
        />
        <EditText
          :file="P"
          field="subtitle"
          tag="p"
          class="block font-cormorant text-[clamp(1.6rem,3.8vw,3.75rem)] tracking-tight text-ivory/70 font-light italic max-w-3xl mt-2"
        />
      </div>
    </section>

    <section ref="listRef" class="bg-white py-20 md:py-32">
      <div class="max-w-8xl mx-auto px-6 md:px-10">
        <div v-if="isEditing" class="mb-8">
          <button type="button" class="seasi-edit-add w-full min-h-0 py-4" @click="addWork">+ Add student work</button>
        </div>

        <EditText
          v-if="!works.length"
          :file="P"
          field="emptyText"
          tag="p"
          class="block font-sans text-muted text-center py-16"
        />

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          <article
            v-for="{ path, data: work } in works"
            :key="path"
            data-reveal
            class="relative"
          >
            <component
              :is="work.link && !isEditing ? 'a' : 'div'"
              :href="isEditing ? undefined : work.link || undefined"
              :target="work.link && !isEditing ? '_blank' : undefined"
              :rel="work.link && !isEditing ? 'noopener' : undefined"
              class="group block h-full"
            >
              <div class="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-crimson/15 bg-ivory-dark mb-5">
                <EditImage
                  :file="path"
                  field="image"
                  alt-field="imageAlt"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                >
                  <template #empty="{ pick, editing }">
                    <component
                      :is="editing ? 'button' : 'div'"
                      :type="editing ? 'button' : undefined"
                      class="w-full h-full flex items-center justify-center font-cormorant italic text-3xl text-crimson/30"
                      :class="editing ? 'seasi-edit seasi-edit--image' : ''"
                      :title="editing ? 'Add a cover image' : undefined"
                      @click="editing && pick()"
                    >
                      {{ editing ? '+ Cover image' : 'SEASI' }}
                    </component>
                  </template>
                </EditImage>
              </div>
              <div class="flex items-center gap-3 mb-3">
                <EditSelect :file="path" field="type" :options="STUDENT_WORK_TYPES" label="Type">
                  <span class="font-mono text-2xs uppercase tracking-widest px-2.5 py-1 rounded-full bg-sepia/10 text-sepia ring-1 ring-sepia/20">
                    {{ work.type }}
                  </span>
                </EditSelect>
                <EditSelect :file="path" field="year" :options="YEAR_OPTIONS.map(y => ({ label: String(y), value: y }))" label="Year">
                  <span class="font-mono text-2xs uppercase tracking-widest text-muted">{{ work.year }}</span>
                </EditSelect>
              </div>
              <EditText
                :file="path"
                field="title"
                tag="h2"
                required
                class="font-cormorant font-semibold text-2xl md:text-3xl text-ink leading-tight transition-colors duration-200"
                :class="work.link && !isEditing ? 'group-hover:text-crimson' : ''"
              />
              <EditText
                :file="path"
                field="students"
                tag="p"
                required
                placeholder="Student name(s)"
                class="block font-sans text-sm text-ink-light mt-2"
              />
              <EditText
                v-if="work.blurb || isEditing"
                :file="path"
                field="blurb"
                tag="p"
                multiline
                placeholder="Short description (optional)"
                class="block font-sans text-sm text-muted mt-3 leading-relaxed"
              />
              <span
                v-if="work.link && !isEditing"
                class="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-crimson mt-4 border-b-2 border-crimson/25 group-hover:border-crimson pb-0.5 transition-colors"
              >
                View project ↗
              </span>
              <div v-if="isEditing" class="flex flex-wrap items-center gap-3 mt-4">
                <button
                  type="button"
                  class="font-sans text-sm text-crimson border-b-2 border-crimson/25 hover:border-crimson pb-0.5"
                  :title="work.link || 'No link yet'"
                  @click="editWorkLink(path, work.link)"
                >🔗 {{ work.link ? 'Change project link' : 'Add project link' }}</button>
                <button
                  type="button"
                  class="font-sans text-sm text-muted hover:text-crimson"
                  @click="deleteWork(path, work.title)"
                >Delete</button>
              </div>
            </component>
          </article>
        </div>
      </div>
    </section>

    <TheFooter />
  </div>
</template>
