<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useSpecStore } from '@/core/store';
import { isContainer, isSlotHost } from '@/core/model/guards';
import GridCanvas from './GridCanvas.vue';

const NodeRenderer = defineAsyncComponent(() => import('./NodeRenderer.vue'));

const props = defineProps<{ hostId: string }>();

const specStore = useSpecStore();

const host = computed(() => {
  const node = specStore.currentSpec?.nodes[props.hostId];
  if (!node || !isContainer(node) || !isSlotHost(node)) return null;
  return node;
});

function quickAddGridItem(mode: 'append' | 'replace'): void {
  specStore.addToSlot(props.hostId, { kind: 'container', type: 'gridItem' }, mode);
}

function quickAddContainer(mode: 'append' | 'replace'): void {
  specStore.addToSlot(props.hostId, { kind: 'container', type: 'card' }, mode);
}

function clearCurrentSlot(): void {
  specStore.clearHostSlot(props.hostId);
}
</script>

<template>
  <div v-if="!host" class="slot-empty">无可用 slot host</div>

  <div v-else class="slot-renderer">
    <div v-if="host.slot?.kind === 'empty'" class="slot-empty">
      <p>Empty Slot</p>
      <div class="slot-actions">
        <button @click.stop="quickAddGridItem('append')">+ GridItem</button>
        <button @click.stop="quickAddContainer('append')">+ Card</button>
      </div>
    </div>

    <div v-else-if="host.slot?.kind === 'single'" class="slot-single">
      <div class="slot-toolbar">
        <button @click.stop="quickAddGridItem('append')">追加 -> 升级Grid</button>
        <button @click.stop="quickAddGridItem('replace')">替换为GridItem</button>
        <button @click.stop="clearCurrentSlot">清空</button>
      </div>
      <NodeRenderer :node-id="host.slot.childId" />
    </div>

    <div v-else-if="host.slot?.kind === 'grid'" class="slot-grid">
      <div class="slot-toolbar">
        <button @click.stop="quickAddGridItem('append')">+ GridItem</button>
        <button @click.stop="clearCurrentSlot">清空</button>
      </div>
      <GridCanvas :grid-id="host.slot.gridId" />
    </div>
  </div>
</template>

<style scoped>
.slot-renderer {
  padding: 10px;
}

.slot-empty {
  border: 1px dashed var(--border-strong);
  border-radius: 8px;
  padding: 10px;
  color: var(--text-muted);
}

.slot-actions,
.slot-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

button {
  border: 1px solid var(--border-strong);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-radius: 6px;
  padding: 4px 8px;
}

button:hover {
  border-color: var(--accent-primary);
}
</style>
