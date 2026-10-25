import site from '../../content/site.json'

export default defineNuxtPlugin(() => {
  if (!useRuntimeConfig().public.productionSite || location.hostname !== 'homeperfectionnow.com') return
  const w = window as any
  w.dataLayer = w.dataLayer || []
  w.gtag = function () { w.dataLayer.push(arguments) }
  w.gtag('js', new Date())
  w.gtag('set', 'linker', { domains: ['homeperfectionnow.com'] })
  w.gtag('config', site.googleTag)
  w.gtag('config', site.googleAds)
  const tag = document.createElement('script')
  tag.async = true
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${site.googleTag}`
  document.head.appendChild(tag)
  w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
  const manager = document.createElement('script')
  manager.async = true
  manager.src = `https://www.googletagmanager.com/gtm.js?id=${site.googleTagManager}`
  document.head.appendChild(manager)
})
