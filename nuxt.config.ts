import manifest from './content/manifest.json'
import { finalizeStaticSite } from './scripts/finalize.mjs'

const productionSite = process.env.SITE_ENV !== 'preview' && process.env.NODE_ENV !== 'development'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  css: ['~/assets/site.css','~/assets/polish.css','~/assets/home.css'],
  app: { head: { htmlAttrs: { lang: 'ar', dir: 'rtl' }, meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }], link: [{rel:'icon',type:'image/webp',sizes:'32x32',href:'/wp-content/uploads/2024/11/cropped-HOME-01-32x32.webp'},{rel:'apple-touch-icon',href:'/wp-content/uploads/2024/11/cropped-HOME-01-180x180.webp'}] } },
  runtimeConfig: { public: { productionSite } },
  hooks: {
    'nitro:init'(nitro) {
      if (!nitro.options.static) return
      nitro.hooks.hook('prerender:done', async ({ failedRoutes }) => {
        if (!failedRoutes.length) await finalizeStaticSite(nitro.options.output.publicDir, productionSite)
      })
    },
  },
  nitro: { preset: 'static', prerender: { routes: manifest.map(p => p.path), crawlLinks: false, failOnError: true } },
  experimental: { payloadExtraction: true },
})
