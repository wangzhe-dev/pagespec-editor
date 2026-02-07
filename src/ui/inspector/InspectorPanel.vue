<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore } from '@/core/store';
import { isContainer, isLeaf } from '@/core/model/guards';
import ContainerInspector from './ContainerInspector.vue';
import LeafInspector from './LeafInspector.vue';

const specStore = useSpecStore();

const selected = computed(() => specStore.selectedNode);
const breadcrumb = computed(() => specStore.selectedPath.join(' / '));
</script>

<template>
  <section class="inspector-panel">
    <header>
      <h3>Inspector</h3>
      <p v-if="breadcrumb" class="path">{{ breadcrumb }}</p>
    </header>

    <p v-if="!selected" class="empty">请选择一个节点</p>
    <LeafInspector v-else-if="isLeaf(selected)" :node-id="selected.id" />
    <ContainerInspector v-else-if="isContainer(selected)" :node-id="selected.id" />
  </section>
</template>

<style scoped>
.inspector-panel {
  padding: 12px;
}

.path {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.empty {
  margin-top: 8px;
  color: var(--text-muted);
}
</style>
