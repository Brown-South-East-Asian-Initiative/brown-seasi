<script setup lang="ts">
const config = useRuntimeConfig()
const { isEditing } = useEditor()
const route = useRoute()

const siteUrl = computed(() => (config.public.siteUrl as string | undefined)?.replace(/\/$/, '') ?? '')
const canonicalUrl = computed(() => (siteUrl.value ? `${siteUrl.value}${route.path}` : ''))

useSeoMeta({
  ogSiteName: 'SEASI',
  ogType: 'website',
  ogLocale: 'en_US',
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
})

useHead({
  link: computed(() =>
    canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [],
  ),
})
</script>

<template>
  <NuxtPage />
  <ClientOnly>
    <LazyEditToolbar v-if="isEditing" />
  </ClientOnly>
</template>
