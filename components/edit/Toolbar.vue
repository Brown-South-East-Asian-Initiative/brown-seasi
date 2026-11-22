<script setup lang="ts">
// Floating bar shown in edit mode: unsaved changes, undo, discard, save (opens a PR), preview link.
const { session, draft, saveStatus, loadNote, save, signOut, loginUrl, stashUnsaved } = useEditor()
const store = useContentStore()
const route = useRoute()

const count = computed(() => store.changes.value.length)
const asking = ref(false)
const message = ref('')
const messageInput = ref<HTMLInputElement | null>(null)
const showNote = ref(true)

const expired = computed(() => !!session.value && session.value.expiresAt < Date.now())

async function startSave() {
  asking.value = true
  message.value = ''
  await nextTick()
  messageInput.value?.focus()
}

async function confirmSave() {
  const text = message.value.trim() || defaultMessage()
  asking.value = false
  await save(text)
}

function defaultMessage() {
  const names = store.changes.value.map(c => c.path.split('/').pop()!.replace(/\.json$/, ''))
  return `Update ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` and ${names.length - 3} more` : ''}`
}

function discardAll() {
  if (window.confirm(`Throw away ${count.value} unsaved change${count.value === 1 ? '' : 's'}?`)) store.discard()
}

function exit() {
  if (count.value && !window.confirm('You have unsaved changes. Log out anyway?')) return
  signOut()
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (target?.isContentEditable || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none font-sans">
    <p
      v-if="loadNote && showNote"
      class="pointer-events-auto max-w-xl text-xs text-ink bg-ivory ring-1 ring-sepia/40 rounded-lg px-3 py-2 shadow-lg flex gap-3 items-start"
    >
      <span>{{ loadNote }}</span>
      <button class="text-muted hover:text-ink" aria-label="Dismiss" @click="showNote = false">✕</button>
    </p>

    <p
      v-if="saveStatus.state === 'error'"
      class="pointer-events-auto max-w-xl text-sm text-ivory bg-crimson-dark rounded-lg px-4 py-2 shadow-lg"
      role="alert"
    >
      {{ saveStatus.message }}
    </p>

    <form
      v-if="asking"
      class="pointer-events-auto w-full max-w-xl bg-ink text-ivory rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row gap-3"
      @submit.prevent="confirmSave"
    >
      <label class="sr-only" for="seasi-save-message">What did you change?</label>
      <input
        id="seasi-save-message"
        ref="messageInput"
        v-model="message"
        :placeholder="defaultMessage()"
        maxlength="120"
        class="flex-1 min-w-0 bg-ivory/10 rounded-lg px-3 py-2 text-sm placeholder:text-ivory/40 focus:outline-none focus:ring-2 focus:ring-crimson-vivid"
        @keydown.esc="asking = false"
      >
      <div class="flex gap-2">
        <button type="button" class="px-3 py-2 text-sm text-ivory/70 hover:text-ivory" @click="asking = false">Cancel</button>
        <button type="submit" class="px-4 py-2 text-sm font-medium bg-crimson hover:bg-crimson-vivid rounded-full">
          {{ draft ? 'Add to draft' : 'Save draft' }}
        </button>
      </div>
    </form>

    <div class="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-ink text-ivory rounded-full shadow-2xl pl-2 pr-3 py-2 text-sm max-w-full">
      <img v-if="session" :src="session.avatarUrl" :alt="`@${session.login}`" class="w-7 h-7 rounded-full">
      <span class="font-mono text-2xs uppercase tracking-widest text-ivory/60 hidden sm:inline">Editing</span>

      <span class="text-ivory/85 whitespace-nowrap">
        <template v-if="saveStatus.state === 'saving'">Saving…</template>
        <template v-else-if="count">{{ count }} unsaved change{{ count === 1 ? '' : 's' }}</template>
        <template v-else-if="saveStatus.state === 'saved'">Saved to draft</template>
        <template v-else>Double-click text to edit</template>
      </span>

      <template v-if="saveStatus.state === 'saved' && !count">
        <a
          v-if="saveStatus.preview === 'ready' && saveStatus.previewUrl"
          :href="saveStatus.previewUrl"
          target="_blank"
          rel="noopener"
          class="text-crimson-vivid hover:underline whitespace-nowrap"
        >Open preview ↗</a>
        <span v-else-if="saveStatus.preview === 'failed'" class="text-crimson-vivid whitespace-nowrap">Preview build failed</span>
        <span v-else class="text-ivory/50 whitespace-nowrap">Preview building…</span>
      </template>

      <a
        v-if="draft"
        :href="draft.url"
        target="_blank"
        rel="noopener"
        class="text-ivory/70 hover:text-ivory underline-offset-2 hover:underline whitespace-nowrap"
        title="Your draft on GitHub. An admin merges it to publish."
      >Draft #{{ draft.number }} ↗</a>

      <span class="w-px h-5 bg-ivory/15" />

      <button
        class="px-2 py-1 rounded hover:bg-ivory/10 disabled:opacity-30"
        :disabled="!store.canUndo.value"
        title="Undo (Ctrl/⌘ Z)"
        @click="store.undo()"
      >Undo</button>
      <button
        class="px-2 py-1 rounded hover:bg-ivory/10 disabled:opacity-30"
        :disabled="!count"
        @click="discardAll"
      >Discard</button>

      <a
        v-if="expired"
        :href="loginUrl(route.fullPath)"
        class="px-4 py-1.5 font-medium bg-sepia text-ink rounded-full"
        @click="stashUnsaved"
      >Log in again</a>
      <button
        v-else
        class="px-4 py-1.5 font-medium bg-crimson hover:bg-crimson-vivid rounded-full disabled:opacity-40 disabled:hover:bg-crimson"
        :disabled="!count || saveStatus.state === 'saving'"
        @click="startSave"
      >Save</button>

      <button class="px-2 py-1 text-ivory/60 hover:text-ivory" title="Log out of edit mode" @click="exit">Exit</button>
    </div>
  </div>
</template>
