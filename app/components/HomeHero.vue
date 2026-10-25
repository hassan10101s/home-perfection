<script setup lang="ts">
import hero from '../../content/home-hero.json'
</script>
<template>
  <section class="hp-home-hero" aria-labelledby="hp-home-title">
    <div class="hp-hero-inner">
      <div class="hp-hero-copy">
        <p class="hp-hero-eyebrow"><span aria-hidden="true" />البيت المثالي</p>
        <h1 id="hp-home-title">{{ hero.title }}</h1>
        <div class="hp-hero-actions">
          <a v-for="(action,index) in hero.actions" :key="action.href" :href="action.href" :class="['hp-hero-action',index===0?'hp-hero-primary':'hp-hero-secondary']">
            <svg v-if="index===0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a13 13 0 0 1-7-7l2-2-2-5Z" /></svg>
            <span>{{ action.text }}</span>
          </a>
        </div>
        <ul class="hp-hero-services" aria-label="خدماتنا">
          <li>الفك والتركيب</li><li>التغليف</li><li>النقل</li>
        </ul>
      </div>
      <div class="hp-hero-art"><img :src="hero.image.src" :srcset="hero.image.srcset" sizes="(max-width: 720px) calc(100vw - 70px), (max-width: 1200px) calc((100vw - 130px) / 2), 510px" :width="hero.image.width" :height="hero.image.height" :alt="hero.image.alt" fetchpriority="high" decoding="async"></div>
    </div>
  </section>
</template>
