<script setup lang="ts">
import AppHeader from './AppHeader.vue';
import DesignerPage from '@/ui/pages/DesignerPage.vue';
// import LibraryPage from '@/ui/pages/LibraryPage.vue';
</script>

<template>
  <section class="app-shell">
    <AppHeader />
    <DesignerPage />
  </section>
</template>

<style scoped>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
