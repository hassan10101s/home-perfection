<script setup lang="ts">
import content from '../../content/pages/12.json'
import html from '../../content/pages/12.html?raw'
definePageMeta({ path: "/" })
</script>
<template><ContentPage :page="{ ...content, html }"><template #before-content><HomeHero /></template></ContentPage></template>
