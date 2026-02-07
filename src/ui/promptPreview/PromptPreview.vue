<script setup lang="ts">
import { computed } from 'vue';
import { buildPrompt } from '@/core/prompt';
import { useSpecStore } from '@/core/store';
import CopyBar from './CopyBar.vue';

const specStore = useSpecStore();

const promptResult = computed(() => {
  if (!specStore.currentSpec) {
    return null;
  }

  return buildPrompt(specStore.currentSpec, {
    mode: specStore.settings.promptMode,
    includeGeometry: specStore.settings.includeGeometry,
  });
});

const rawText = computed(() => promptResult.value?.rawText || '暂无可预览 Prompt');
</script>

<template>
  <section class="prompt-preview">
    <header>
      <h3>Prompt Preview</h3>
    </header>

    <CopyBar :text="rawText" />

    <pre class="preview-text">{{ rawText }}</pre>
  </section>
</template>

<style scoped>
.prompt-preview {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-text {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
