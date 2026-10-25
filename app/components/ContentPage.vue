<script setup lang="ts">
import styles from '../../content/styles-manifest.json'
import company from '../../content/company.json'
import { companySchema } from '../utils/company-schema.mjs'
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
  link: [{ rel: 'canonical', href: page.canonical }, { rel: 'stylesheet', href: styles[page.id as keyof typeof styles] }, { rel: 'alternate', type: 'application/ld+json', href: '/company.json', title: company.name }],
  style: page.styles.map((textContent: string) => ({ textContent })),
  script: companySchema(page.schema, company).map((schema: any) => ({ type: 'application/ld+json', textContent: JSON.stringify(schema).replace(/</g, '\\u003c') })),
})
</script>
<template>
  <div id="page" class="hfeed site">
    <SiteHeader />
    <div id="main-content" tabindex="-1" :role="hasMainLandmark ? undefined : 'main'">
      <slot name="before-content" />
      <CompanyFacts v-if="page.path === '/من-نحن/'" />
      <div class="hp-page-content" v-html="page.html" />
      <QuoteForm v-if="page.isQuote" />
    </div>
    <SiteFooter />
  </div>
</template>
