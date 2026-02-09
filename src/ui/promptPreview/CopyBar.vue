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

const MODE_OPTIONS: Array<{ label: string; value: 'short' | 'long' | 'batch' }> = [
  { label: 'Short', value: 'short' },
  { label: 'Long', value: 'long' },
  { label: 'Batch', value: 'batch' },
];

async function copyPrompt() {
  if (!props.text.trim()) {
    uiStore.showToast('warning', '当前没有可复制的 Prompt');
    return;
  }

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
    <div class="mode-group">
      <span class="group-label">Mode</span>
      <div class="mode-switch" role="group" aria-label="Prompt mode">
        <button
          v-for="item in MODE_OPTIONS"
          :key="item.value"
          class="mode-btn"
          type="button"
          :class="{ active: mode === item.value }"
          @click="mode = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <label class="geometry-toggle">
      <input v-model="includeGeometry" type="checkbox" />
      <span class="switch-track">
        <span class="switch-dot" />
      </span>
      <span class="toggle-label">Geometry</span>
    </label>

    <button class="copy-btn" type="button" :disabled="!props.text.trim()" @click="copyPrompt">
      复制 Prompt
    </button>
  </div>
</template>

<style scoped>
.copy-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.mode-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.group-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
}

.mode-switch {
  display: inline-flex;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-base);
}

.mode-btn {
  border: 0;
  border-right: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-secondary);
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 600;
  transition: all var(--transition-normal);
}

.mode-btn:last-child {
  border-right: 0;
}

.mode-btn.active {
  background: rgba(var(--accent-primary-rgb), 0.14);
  color: var(--accent-primary);
}

.geometry-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-base);
}

.geometry-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-track {
  position: relative;
  width: 30px;
  height: 18px;
  border-radius: 999px;
  background: var(--bg-hover);
  border: 1px solid var(--border-subtle);
  transition: all var(--transition-normal);
}

.switch-dot {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform var(--transition-normal);
}

.geometry-toggle input:checked + .switch-track {
  background: rgba(var(--accent-primary-rgb), 0.35);
  border-color: rgba(var(--accent-primary-rgb), 0.45);
}

.geometry-toggle input:checked + .switch-track .switch-dot {
  transform: translateX(12px);
}

.toggle-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.copy-btn {
  border: 1px solid rgba(var(--accent-primary-rgb), 0.3);
  border-radius: 8px;
  background: rgba(var(--accent-primary-rgb), 0.12);
  color: var(--accent-primary);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  transition: all var(--transition-normal);
}

.copy-btn:hover:not(:disabled) {
  border-color: rgba(var(--accent-primary-rgb), 0.48);
  background: rgba(var(--accent-primary-rgb), 0.2);
}

.copy-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 860px) {
  .geometry-toggle {
    margin-left: 0;
  }
}
</style>
