<script setup lang="ts">
// Editor login page. GitHub login lands here (token in the URL fragment),
// we verify edit access, then send the editor back to the site in edit mode.
useHead({ title: 'Edit the site — Brown SEASI', meta: [{ name: 'robots', content: 'noindex' }] })

const { session, isEditing, repo, restore, signIn, signOut, loginUrl } = useEditor()

const status = ref<'idle' | 'checking' | 'error'>('idle')
const error = ref('')
const returnTo = ref('/')
/** Plain `nuxt dev` (port 3000) doesn't run the login functions; `bun run dev:edit` (8888) does. */
const wrongDevPort = ref(false)

onMounted(async () => {
  wrongDevPort.value = location.hostname === 'localhost' && location.port === '3000'
  const hash = new URLSearchParams(window.location.hash.slice(1))
  // Remove the token from the address bar and history right away.
  if (window.location.hash) history.replaceState(null, '', window.location.pathname)

  if (hash.get('error')) {
    status.value = 'error'
    error.value = hash.get('error')!
    return
  }

  const token = hash.get('access_token')
  if (token) {
    status.value = 'checking'
    returnTo.value = hash.get('return') || '/'
    try {
      await signIn(token, Number(hash.get('expires_in')) || 28800)
      await navigateTo(returnTo.value)
    } catch (e) {
      status.value = 'error'
      error.value = e instanceof Error ? e.message : 'Login failed.'
    }
    return
  }

  restore()
})
</script>

<template>
  <div class="min-h-screen bg-crimson-deep flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-md bg-ivory rounded-2xl shadow-2xl p-8 md:p-10">
      <img src="/images/logo.png" alt="Brown SEASI" class="h-10 w-auto mb-8">

      <h1 class="font-cormorant font-semibold text-4xl text-ink leading-tight mb-2">
        Edit the website
      </h1>

      <template v-if="status === 'checking'">
        <p class="font-sans text-sm text-muted">Checking your access…</p>
      </template>

      <template v-else-if="isEditing && session">
        <div class="flex items-center gap-3 my-6">
          <img :src="session.avatarUrl" alt="" class="w-10 h-10 rounded-full">
          <div class="font-sans text-sm">
            <p class="text-ink font-medium">{{ session.name || session.login }}</p>
            <p class="text-muted">@{{ session.login }}</p>
          </div>
        </div>
        <NuxtLink
          to="/"
          class="block text-center font-sans text-sm font-medium px-6 py-3 bg-crimson hover:bg-crimson-vivid text-ivory rounded-full transition-colors"
        >
          Start editing
        </NuxtLink>
        <button class="block w-full mt-3 font-sans text-sm text-muted hover:text-ink" @click="signOut">
          Log out
        </button>
      </template>

      <template v-else>
        <p class="font-sans text-sm text-muted leading-relaxed mb-6">
          Log in with your GitHub account to change text and images on the SEASI site.
          Your changes are saved as a draft for an admin to review before they go live.
        </p>

        <p
          v-if="wrongDevPort"
          class="font-sans text-sm text-ink bg-sepia/15 ring-1 ring-sepia/40 rounded-lg px-4 py-3 mb-6"
        >
          Login doesn't work on port 3000. Run <code class="font-mono">bun run dev:edit</code> and open
          <a class="underline" href="http://localhost:8888/edit">localhost:8888/edit</a>.
        </p>

        <p
          v-if="status === 'error'"
          class="font-sans text-sm text-crimson-dark bg-crimson/10 ring-1 ring-crimson/20 rounded-lg px-4 py-3 mb-6"
          role="alert"
        >
          {{ error }}
        </p>

        <a
          :href="loginUrl(returnTo)"
          class="flex items-center justify-center gap-2 font-sans text-sm font-medium px-6 py-3 bg-ink hover:bg-ink-light text-ivory rounded-full transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          Log in with GitHub
        </a>
        <p class="font-sans text-xs text-muted/80 mt-4 text-center">
          Need access? Ask a SEASI admin to add your GitHub account to <span class="font-mono">{{ repo }}</span>.
        </p>
      </template>
    </div>
  </div>
</template>
