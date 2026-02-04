<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { usePagesStore, useProfilesStore, useUIStore } from '@/app/store';
import EditorLayout from '@/components/editor/EditorLayout.vue';
import WelcomeScreen from '@/components/editor/WelcomeScreen.vue';
import ToastContainer from '@/components/common/ToastContainer.vue';

const pagesStore = usePagesStore();
const profilesStore = useProfilesStore();
const uiStore = useUIStore();

onMounted(() => {
  // 加载存储的数据
  pagesStore.loadFromStorage();
  profilesStore.loadFromStorage();
  uiStore.loadFromStorage();
});

// 自动保存
watch(
  () => [pagesStore.pages, pagesStore.activePageId],
  () => pagesStore.saveToStorage(),
  { deep: true },
);

watch(
  () => [profilesStore.profiles, profilesStore.activeProfileId],
  () => profilesStore.saveToStorage(),
  { deep: true },
);

watch(
  () => [uiStore.panelSizes, uiStore.panelVisibility, uiStore.promptStyle, uiStore.theme],
  () => uiStore.saveToStorage(),
  { deep: true },
);
</script>

<template>
  <div class="app-root">
    <WelcomeScreen v-if="uiStore.showWelcome && pagesStore.pages.length === 0" />
    <EditorLayout v-else />
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
