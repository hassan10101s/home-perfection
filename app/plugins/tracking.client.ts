import site from '../../content/site.json'

export default defineNuxtPlugin(() => {
  if (!useRuntimeConfig().public.productionSite || location.hostname !== 'homeperfectionnow.com') return
  const w = window as any
  w.sc_project = site.statcounter.project
  w.sc_security = site.statcounter.security
  w.sc_invisible = site.statcounter.invisible
  w.sc_https = 1
  const counter = document.createElement('script')
  counter.async = true
  counter.src = 'https://www.statcounter.com/counter/counter.js'
  document.head.appendChild(counter)
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
