<script setup lang="ts">
import content from '../../content/pages/3.json'
import html from '../../content/pages/3.html?raw'
definePageMeta({ path: "/privacy-policy/" })
</script>
<template><ContentPage :page="{ ...content, html }" /></template>
