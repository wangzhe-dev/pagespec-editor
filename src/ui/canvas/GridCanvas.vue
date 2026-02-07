<script setup lang="ts">
import { computed, ref } from 'vue';
import { GridLayout, GridItem } from 'vue-grid-layout-v3';
import { useSpecStore } from '@/core/store';
import { isContainer } from '@/core/model/guards';
import NodeRenderer from './NodeRenderer.vue';

const props = defineProps<{ gridId: string }>();

const specStore = useSpecStore();

const gridNode = computed(() => {
  const node = specStore.currentSpec?.nodes[props.gridId];
  if (!node || !isContainer(node) || node.type !== 'grid') return null;
  return node;
});

const items = computed(() => {
  const source = gridNode.value?.items || [];
  return source.slice().sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.itemId.localeCompare(b.itemId);
  });
});

const layout = computed({
  get() {
    return items.value.map(item => ({
      i: item.itemId,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));
  },
  set(newLayout: Array<{ i: string; x: number; y: number; w: number; h: number }>) {
    for (const entry of newLayout) {
      specStore.updateGridItemGeometry(props.gridId, entry.i, {
        x: entry.x,
        y: entry.y,
        w: entry.w,
        h: entry.h,
      });
    }
  },
});

const colNum = computed(() => Number(gridNode.value?.props.colNum || 12));
const rowHeight = computed(() => Number(gridNode.value?.props.rowHeight || 30));

const draggable = ref(true);
const resizable = ref(true);
const responsive = ref(false);

function childIdForItem(itemId: string): string {
  const item = items.value.find(i => i.itemId === itemId);
  return item?.childId ?? '';
}

function removeItem(itemId: string) {
  specStore.removeGridItemById(props.gridId, itemId);
}

function onLayoutUpdated(newLayout: Array<{ i: string; x: number; y: number; w: number; h: number }>) {
  for (const entry of newLayout) {
    specStore.updateGridItemGeometry(props.gridId, entry.i, {
      x: entry.x,
      y: entry.y,
      w: entry.w,
      h: entry.h,
    });
  }
}
</script>

<template>
  <div v-if="!gridNode" class="grid-fallback">Grid 节点不存在</div>

  <div v-else class="grid-canvas">
    <div class="grid-controls">
      <label><input type="checkbox" v-model="draggable" /> 可拖拽</label>
      <label><input type="checkbox" v-model="resizable" /> 可缩放</label>
      <label><input type="checkbox" v-model="responsive" /> 响应式</label>
    </div>

    <div class="grid-info">
      <div class="columns">
        <div v-for="item in layout" :key="item.i">
          <b>{{ item.i }}</b>: [{{ item.x }}, {{ item.y }}, {{ item.w }}, {{ item.h }}]
        </div>
      </div>
    </div>

    <GridLayout
      v-model:layout="layout"
      :col-num="colNum"
      :row-height="rowHeight"
      :is-draggable="draggable"
      :is-resizable="resizable"
      :responsive="responsive"
      :vertical-compact="true"
      :use-css-transforms="true"
      @layout-updated="onLayoutUpdated"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
      >
        <div class="grid-item-content">
          <div class="grid-item-toolbar">
            <span class="grid-item-id">{{ item.i }}</span>
            <button class="remove-btn" @click.stop="removeItem(item.i)">×</button>
          </div>
          <div class="grid-item-child">
            <NodeRenderer :node-id="childIdForItem(item.i)" />
          </div>
        </div>
      </GridItem>
    </GridLayout>
  </div>
</template>

<style scoped>
.grid-canvas {
  border: 1px dashed var(--border-subtle);
  border-radius: 8px;
  padding: 8px;
  background: var(--bg-base);
}

.grid-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.grid-controls label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.grid-info {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.columns {
  columns: 160px;
}

:deep(.vue-grid-layout) {
  background: var(--bg-subtle);
  border-radius: 8px;
  min-height: 100px;
}

:deep(.vue-grid-item:not(.vue-grid-placeholder)) {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

:deep(.vue-grid-item.vue-grid-placeholder) {
  background: var(--accent-primary);
  opacity: 0.2;
  border-radius: 6px;
}

:deep(.vue-grid-item.resizing) {
  opacity: 0.9;
}

.grid-item-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-item-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  flex-shrink: 0;
}

.grid-item-id {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.remove-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  border-radius: 4px;
}

.remove-btn:hover {
  color: var(--danger);
  background: rgba(255, 0, 0, 0.08);
}

.grid-item-child {
  flex: 1;
  overflow: auto;
  padding: 4px;
}

.grid-fallback {
  border: 1px dashed var(--danger);
  border-radius: 8px;
  padding: 8px;
  color: var(--danger);
}
</style>
