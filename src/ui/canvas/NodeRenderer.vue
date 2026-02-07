<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore } from '@/core/store';
import { isContainer, isLeaf, isSlotHost } from '@/core/model/guards';
import SlotRenderer from './SlotRenderer.vue';
import GridCanvas from './GridCanvas.vue';

const props = defineProps<{ nodeId: string }>();

const specStore = useSpecStore();

const node = computed(() => specStore.currentSpec?.nodes[props.nodeId] || null);
const isSelected = computed(() => specStore.selectedId === props.nodeId);
const isRoot = computed(() => specStore.currentSpec?.rootId === props.nodeId);

const leafFieldSummary = computed(() => {
  const current = node.value;
  if (!current || !isLeaf(current)) return '';

  const fields = (current.leafMeta.fields || {}) as Record<string, string[] | undefined>;
  const parts = Object.entries(fields)
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([key, value]) => `${key}:${(value || []).length}`);

  return parts.join(' | ');
});

function selectNode(): void {
  specStore.select(props.nodeId);
}

function removeNode(): void {
  selectNode();
  specStore.removeSelected();
}
</script>

<template>
  <div v-if="!node" class="node-missing">节点不存在：{{ nodeId }}</div>

  <article v-else-if="isLeaf(node)" class="leaf-shell" :class="{ selected: isSelected }" @click.stop="selectNode">
    <header class="leaf-header">
      <span class="leaf-type">{{ node.type }}</span>
      <code>{{ node.leafMeta.componentRef }}</code>
      <button class="danger" @click.stop="removeNode">删除</button>
    </header>
    <p v-if="node.leafMeta.description" class="leaf-desc">{{ node.leafMeta.description }}</p>
    <p v-if="leafFieldSummary" class="leaf-fields">{{ leafFieldSummary }}</p>
  </article>

  <section
    v-else-if="isContainer(node)"
    class="container-shell"
    :class="{ selected: isSelected }"
    @click.stop="selectNode"
  >
    <header class="container-header">
      <div>
        <strong>{{ node.type }}</strong>
        <span class="container-id">{{ node.id }}</span>
      </div>
      <button v-if="!isRoot" class="danger" @click.stop="removeNode">删除</button>
    </header>

    <GridCanvas v-if="node.type === 'grid'" :grid-id="node.id" />
    <SlotRenderer v-else-if="isSlotHost(node)" :host-id="node.id" />
  </section>
</template>

<style scoped>
.node-missing {
  border: 1px dashed var(--danger);
  color: var(--danger);
  border-radius: 8px;
  padding: 8px;
}

.container-shell,
.leaf-shell {
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  margin-bottom: 10px;
  background: var(--bg-subtle);
}

.container-shell.selected,
.leaf-shell.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
}

.container-header,
.leaf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.leaf-header {
  border-bottom: 0;
}

.leaf-type {
  text-transform: uppercase;
  font-size: 12px;
  opacity: 0.8;
}

.container-id {
  margin-left: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

.leaf-desc,
.leaf-fields {
  padding: 0 10px 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

button.danger {
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  padding: 2px 8px;
}

button.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}
</style>
