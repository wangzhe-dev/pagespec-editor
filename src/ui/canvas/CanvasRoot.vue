<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore } from '@/core/store';
import NodeRenderer from './NodeRenderer.vue';

const specStore = useSpecStore();

const rootId = computed(() => specStore.currentSpec?.rootId || null);
</script>

<template>
  <section class="canvas-root">
    <header class="canvas-header">
      <h3>Canvas</h3>
      <p v-if="specStore.currentSpec">{{ specStore.currentSpec.meta.name }}</p>
    </header>

    <div v-if="!rootId" class="canvas-empty">暂无规格，先在左侧创建或从欢迎页开始。</div>
    <NodeRenderer v-else :node-id="rootId" />
  </section>
</template>

<style scoped>
.canvas-root {
  height: 100%;
  padding: 12px;
  overflow: auto;
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.canvas-empty {
  border: 1px dashed var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  color: var(--text-muted);
}
</style>
