<script setup lang="ts">
import { isContainer, isSlotHost } from '@/core/model/guards';
import { useSpecStore } from '@/core/store';
import { computed, watch } from 'vue';
import GridCanvas from './GridCanvas.vue';
import NodeRenderer from './NodeRenderer.vue';

const specStore = useSpecStore();

const rootId = computed(() => specStore.currentSpec?.rootId || null);

const rootGridId = computed(() => {
  if (!rootId.value || !specStore.currentSpec) return null;
  const root = specStore.currentSpec.nodes[rootId.value];
  if (!root || !isContainer(root) || !isSlotHost(root)) return null;
  return root.slot?.kind === 'grid' ? root.slot.gridId : null;
});

watch(
  rootId,
  nextRootId => {
    if (!nextRootId || !specStore.currentSpec) return;
    const root = specStore.currentSpec.nodes[nextRootId];
    if (!root || !isContainer(root) || !isSlotHost(root)) return;
    if (root.slot?.kind === 'empty') {
      specStore.ensureContainerGrid(nextRootId);
    }
  },
  { immediate: true },
);
</script>

<template>
  <section class="canvas-root">
    <div v-if="!rootId" class="canvas-empty">暂无规格，先在左侧创建或从欢迎页开始。</div>
    <GridCanvas v-else-if="rootGridId" :key="rootGridId" class="canvas-grid" :grid-id="rootGridId" />
    <NodeRenderer v-else :node-id="rootId" />
  </section>
</template>

<style scoped>
.canvas-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: auto;
}

.canvas-grid {
  flex: 1;
  min-height: 0;
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
