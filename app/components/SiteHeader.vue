<script setup lang="ts">
const menuOpen = ref(false)
const scrolled = ref(false)
const mobileHeader = ref<HTMLElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const route = useRoute()
const isCurrent = (to: string) => decodeURI(route.path).replace(/\/$/, '') === to.replace(/\/$/, '')
function closeMenu(restoreFocus = false) {
  menuOpen.value = false
  if (restoreFocus) menuButton.value?.focus()
}
function onScroll() { scrolled.value = window.scrollY > 16 }
function onOutside(event: Event) {
  if (menuOpen.value && event.target instanceof Node && !mobileHeader.value?.contains(event.target)) closeMenu()
}
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && menuOpen.value) closeMenu(true)
}
function onResize() { if (window.innerWidth > 921) closeMenu() }
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('focusin', onOutside)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('pointerdown', onOutside)
  document.removeEventListener('focusin', onOutside)
  document.removeEventListener('keydown', onKey)
})
const links = [
  { label: 'الرئيسية', to: '/' }, { label: 'تواصل معنا', to: '/connect/' },
  { label: 'من نحن', to: '/من-نحن/' }, { label: 'عروض خاصة', to: '/offers/' },
  { label: 'حساب تكلفة النقل', to: '/حساب-تكلفة-النقل/' },
]
</script>
<template>
  <a class="hp-skip" href="#main-content">تخطي إلى المحتوى</a>
  <header class="hp-desktop-header">
    <a href="/" aria-label="البيت المثالي، الرئيسية"><img src="/wp-content/uploads/2024/11/cropped-home808-74x50.webp" srcset="/wp-content/uploads/2024/11/cropped-home808-74x50.webp 74w, /wp-content/uploads/2024/11/cropped-home808-300x202.webp 300w" sizes="74px" width="74" height="50" alt="البيت المثالي"></a>
    <nav aria-label="القائمة الرئيسية" class="hp-desktop-links">
      <template v-for="(link, index) in links" :key="link.to">
        <details v-if="index === 3" class="hp-services"><summary>خدمتنا</summary><div><a href="/moving-furniture-riyadh/">نقل عفش بالرياض</a><a href="/دينا-نقل-عفش-بالرياض/">دينا نقل عفش بالرياض</a><a href="/نقل-عفش-بريدة/">نقل عفش ببريدة</a></div></details>
        <a :href="link.to" :aria-current="isCurrent(link.to) ? 'page' : undefined">{{ link.label }}</a>
      </template>
    </nav>
  </header>
  <header ref="mobileHeader" class="hp-mobile-navigation" :class="{ 'is-scrolled': scrolled, 'is-open': menuOpen }">
    <a href="/" class="hp-brand"><img src="/wp-content/uploads/2024/11/cropped-home808-74x50.webp" srcset="/wp-content/uploads/2024/11/cropped-home808-74x50.webp 74w, /wp-content/uploads/2024/11/cropped-home808-300x202.webp 300w" sizes="74px" width="74" height="50" alt="البيت المثالي"></a>
    <button ref="menuButton" type="button" :aria-expanded="menuOpen" aria-controls="mobile-menu" @click="menuOpen = !menuOpen">{{ menuOpen ? 'إغلاق القائمة ×' : 'القائمة ☰' }}</button>
    <nav v-if="menuOpen" id="mobile-menu" aria-label="القائمة الرئيسية">
      <a v-for="link in links" :key="link.to" :href="link.to" :aria-current="isCurrent(link.to) ? 'page' : undefined" @click="closeMenu()">{{ link.label }}</a>
      <a href="/moving-furniture-riyadh/" @click="closeMenu()">نقل عفش بالرياض</a>
      <a href="/دينا-نقل-عفش-بالرياض/" @click="closeMenu()">دينا نقل عفش بالرياض</a>
      <a href="/نقل-عفش-بريدة/" @click="closeMenu()">نقل عفش ببريدة</a>
    </nav>
  </header>
</template>
