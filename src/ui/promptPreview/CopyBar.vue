<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore, useUIStore } from '@/core/store';
import { ElButton, ElSwitch, ElTooltip } from 'element-plus';
import { ToggleGroupRoot, ToggleGroupItem } from 'radix-vue';
import { Copy } from 'lucide-vue-next';

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
    <!-- Mode toggle group -->
    <div class="mode-group">
      <span class="group-label">Mode</span>
      <ToggleGroupRoot
        class="mode-switch"
        type="single"
        :model-value="mode"
        @update:model-value="(val) => { if (val) mode = val as 'short' | 'long' | 'batch' }"
      >
        <ToggleGroupItem
          v-for="item in MODE_OPTIONS"
          :key="item.value"
          class="mode-btn"
          :value="item.value"
        >
          {{ item.label }}
        </ToggleGroupItem>
      </ToggleGroupRoot>
    </div>

    <!-- Geometry switch -->
    <ElTooltip content="是否包含几何布局信息" placement="top" :show-after="400">
      <div class="geometry-wrap">
        <ElSwitch
          v-model="includeGeometry"
          size="small"
          class="geometry-switch"
        />
        <span class="toggle-label">Geometry</span>
      </div>
    </ElTooltip>

    <!-- Copy button -->
    <ElButton
      class="copy-btn"
      type="primary"
      size="small"
      :disabled="!props.text.trim()"
      @click="copyPrompt"
    >
      <Copy :size="13" />
      复制 Prompt
    </ElButton>
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
  cursor: pointer;
  transition: all var(--transition-normal);
  outline: none;
}

.mode-btn:last-child {
  border-right: 0;
}

.mode-btn[data-state='on'] {
  background: rgba(var(--accent-primary-rgb), 0.14);
  color: var(--accent-primary);
}

.mode-btn:hover:not([data-state='on']) {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.geometry-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-base);
  cursor: pointer;
}

.toggle-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ElSwitch size adjustments */
:deep(.geometry-switch.el-switch) {
  --el-switch-on-color: var(--accent-primary);
  height: 18px;
}

/* ElButton copy button styling */
:deep(.copy-btn.el-button) {
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  --el-button-bg-color: rgba(var(--accent-primary-rgb), 0.12);
  --el-button-border-color: rgba(var(--accent-primary-rgb), 0.3);
  --el-button-text-color: var(--accent-primary);
  --el-button-hover-bg-color: rgba(var(--accent-primary-rgb), 0.2);
  --el-button-hover-border-color: rgba(var(--accent-primary-rgb), 0.48);
  --el-button-hover-text-color: var(--accent-primary);
  --el-button-active-bg-color: rgba(var(--accent-primary-rgb), 0.25);
}

@media (max-width: 860px) {
  .geometry-wrap {
    margin-left: 0;
  }
}
</style>
