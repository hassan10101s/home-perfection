<script setup lang="ts">
defineProps<{ error: { statusCode: number } }>()
useHead({ title: 'الصفحة غير موجودة | البيت المثالي', meta: [{ name: 'robots', content: 'noindex, follow' }] })
</script>
<template><main dir="rtl" style="font-family:Arial;text-align:center;padding:100px 24px"><h1>{{ error.statusCode === 404 ? 'الصفحة غير موجودة' : 'تعذر عرض الصفحة' }}</h1><p>يمكنك العودة للرئيسية أو التواصل معنا لمساعدتك.</p><a href="/">العودة للرئيسية</a> · <a href="tel:0565964755">اتصل بنا</a></main></template>
