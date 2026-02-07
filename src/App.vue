<script setup lang="ts">
import { useSpecStore, useUIStore } from '@/core/store';
import ToastContainer from '@/ui/app/ToastContainer.vue';
import AppShell from '@/ui/app/AppShell.vue';
import WelcomeScreen from '@/ui/pages/WelcomeScreen.vue';
import { onMounted, watch } from 'vue';

const specStore = useSpecStore();
const uiStore = useUIStore();

onMounted(() => {
  specStore.initialize();
  uiStore.loadFromStorage();
});

watch(
  () => uiStore.theme,
  () => uiStore.saveToStorage(),
);
</script>

<template>
  <div class="app-root">
    <WelcomeScreen v-if="uiStore.showWelcome && !specStore.hasSpecs" />
    <AppShell v-else />
    <ToastContainer />
  </div>
</template>

<style>
.app-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
