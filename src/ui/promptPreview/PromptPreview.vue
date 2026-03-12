<script setup lang="ts">
import { buildPrompt } from '@/core/prompt';
import { useSpecStore, useUIStore } from '@/core/store';
import { computed } from 'vue';

const specStore = useSpecStore();
const uiStore = useUIStore();

async function copyPrompt() {
  if (!copyText.value.trim()) {
    uiStore.showToast('warning', '当前没有可复制的 Prompt');
    return;
  }
  try {
    await navigator.clipboard.writeText(copyText.value);
    uiStore.showToast('success', 'Prompt 已复制');
  } catch {
    uiStore.showToast('error', '复制失败');
  }
}

const promptResult = computed(() => {
  if (!specStore.currentSpec) return null;
  return buildPrompt(specStore.currentSpec, {
    mode: specStore.settings.promptMode,
    includeGeometry: specStore.settings.includeGeometry,
  });
});

const copyText = computed(() => promptResult.value?.rawText || '');
const displayText = computed(() => copyText.value || '暂无可预览 Prompt');
const hasPrompt = computed(() => copyText.value.length > 0);

</script>

<template>
  <section class="prompt-preview">
    <header class="preview-header">
      <p class="eyebrow">Skill 提示语</p>
      <button class="copy-btn" type="button" :disabled="!hasPrompt" @click="copyPrompt">
        复制 Prompt
      </button>
    </header>

    <pre class="preview-text">{{ displayText }}</pre>
  </section>
</template>

<style scoped>
.prompt-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 12px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 100% 0%, rgba(var(--accent-primary-rgb), 0.08), transparent 34%),
    linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.04), transparent 34%);
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.copy-btn {
  flex-shrink: 0;
  border: 1px solid rgba(var(--accent-primary-rgb), 0.32);
  border-radius: 9px;
  background: rgba(var(--accent-primary-rgb), 0.12);
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 10px;
  transition: all var(--transition-normal);
}

.copy-btn:hover:not(:disabled) {
  border-color: rgba(var(--accent-primary-rgb), 0.48);
  background: rgba(var(--accent-primary-rgb), 0.2);
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.title-wrap h3 {
  margin: 1px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}


.preview-text {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: color-mix(in srgb, var(--bg-base) 96%, white 4%);
  color: var(--text-primary);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 0 0 1px rgba(var(--accent-primary-rgb), 0.05);
  padding: 12px;
  font-size: 12px;
  line-height: 1.62;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 860px) {
  .prompt-preview {
    padding: 10px;
    gap: 8px;
  }
}
</style>
