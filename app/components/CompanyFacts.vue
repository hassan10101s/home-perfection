<script setup lang="ts">
import company from '../../content/company.json'
</script>
<template>
  <section class="hp-company-facts" aria-label="بيانات الشركة والتواصل">
    <dl><div><dt>الشركة</dt><dd>{{ company.name }}</dd></div><div><dt>مناطق الخدمة الرئيسية</dt><dd>{{ company.serviceAreas.join('، ') }}</dd></div><div><dt>تواصل معنا</dt><dd><a :href="`tel:${company.telephone}`"><bdi>{{ company.telephone }}</bdi></a><br><a :href="`mailto:${company.email}`">{{ company.email }}</a></dd></div></dl>
  </section>
</template>
