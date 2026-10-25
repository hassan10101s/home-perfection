<script setup lang="ts">
const props = defineProps<{ page: any }>()
const production = useRuntimeConfig().public.productionSite
const page = props.page
const hasMainLandmark = /<main(?:\s|>)/i.test(page.html)
useHead({
  title: page.title,
  bodyAttrs: { class: page.bodyClass.replace(/\b(ast-header-break-point|elementor-invisible)\b/g, '') + ' hp-migrated' },
  meta: [
    ...page.meta.filter((m: any) => m.name !== 'robots'),
    { name: 'robots', content: production ? (page.meta.find((m: any) => m.name === 'robots')?.content || 'index, follow') : 'noindex, nofollow' },
  ],
  link: [{ rel: 'canonical', href: page.canonical }, ...page.css.map((href: string) => ({ rel: 'stylesheet', href }))],
  style: page.styles.map((textContent: string) => ({ textContent })),
  script: page.schema.map((schema: any) => ({ type: 'application/ld+json', textContent: JSON.stringify(schema).replace(/</g, '\\u003c') })),
})
</script>
<template>
  <div id="page" class="hfeed site">
    <SiteHeader />
    <div id="main-content" tabindex="-1" :role="hasMainLandmark ? undefined : 'main'">
      <slot name="before-content" />
      <div class="hp-page-content" v-html="page.html" />
      <QuoteForm v-if="page.isQuote" />
    </div>
    <SiteFooter />
  </div>
</template>
