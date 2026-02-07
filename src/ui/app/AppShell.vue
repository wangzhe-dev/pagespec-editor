<script setup lang="ts">
import { ref } from 'vue';
import { useSpecStore } from '@/core/store';
import DesignerPage from '@/ui/pages/DesignerPage.vue';
import LibraryPage from '@/ui/pages/LibraryPage.vue';

const specStore = useSpecStore();
const tab = ref<'designer' | 'library'>('designer');
</script>

<template>
  <section class="app-shell">
    <header class="shell-header">
      <div class="tabs">
        <button :class="{ active: tab === 'designer' }" @click="tab = 'designer'">Designer</button>
        <button :class="{ active: tab === 'library' }" @click="tab = 'library'">Library</button>
      </div>
      <div class="meta" v-if="specStore.currentSpec">
        <strong>{{ specStore.currentSpec.meta.name }}</strong>
      </div>
    </header>

    <DesignerPage v-if="tab === 'designer'" />
    <LibraryPage v-else />
  </section>
</template>

<style scoped>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.shell-header {
  height: 48px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}

.tabs {
  display: flex;
  gap: 8px;
}

button {
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  padding: 4px 10px;
}

button.active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.meta {
  color: var(--text-secondary);
  font-size: 12px;
}
</style>
