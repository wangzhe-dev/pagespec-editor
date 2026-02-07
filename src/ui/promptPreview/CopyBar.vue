<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore, useUIStore } from '@/core/store';

const props = defineProps<{ text: string }>();

const specStore = useSpecStore();
const uiStore = useUIStore();

const mode = computed({
  get: () => specStore.settings.promptMode,
  set: (value: 'short' | 'long' | 'batch') => specStore.setPromptMode(value),
});

const includeGeometry = computed({
  get: () => specStore.settings.includeGeometry,
  set: (value: boolean) => specStore.setIncludeGeometry(value),
});

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(props.text);
    uiStore.showToast('success', 'Prompt 已复制');
  } catch {
    uiStore.showToast('error', '复制失败');
  }
}
</script>

<template>
  <div class="copy-bar">
    <label>
      Mode
      <select v-model="mode">
        <option value="short">Short</option>
        <option value="long">Long</option>
        <option value="batch">Batch</option>
      </select>
    </label>

    <label class="checkbox">
      <input v-model="includeGeometry" type="checkbox" />
      includeGeometry
    </label>

    <button @click="copyPrompt">复制</button>
  </div>
</template>

<style scoped>
.copy-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

select,
button {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 4px 8px;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
