<script setup lang="ts">
import { isContainer } from '@/core/model/guards';
import { useSpecStore } from '@/core/store';
import { computed, ref } from 'vue';
import { GridItem, GridLayout } from 'vue-grid-layout-v3';
import GridItemShell from './GridItemShell.vue';

const MIN_W = 2;

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
      minW: item.minW ?? MIN_W,
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
const responsive = ref(true);

function childIdForItem(itemId: string): string {
  const item = items.value.find(i => i.itemId === itemId);
  return item?.childId ?? '';
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

/**
 * When a GridItem is resized, recalculate the w of other items
 * in the same row (overlapping Y range) to fill the remaining columns.
 */
function onItemResized(i: string, newH: number, newW: number) {
  const allItems = items.value;
  const resized = allItems.find(item => item.itemId === i);
  if (!resized) return;

  const cols = colNum.value;

  // Find items that overlap vertically with the resized item
  const rowSiblings = allItems.filter(other => {
    if (other.itemId === i) return false;
    return other.y < resized.y + newH && other.y + other.h > resized.y;
  });

  if (rowSiblings.length === 0) return;

  // Items to the right of the resized item, sorted by x
  const rightItems = rowSiblings
    .filter(item => item.x >= resized.x + resized.w)
    .sort((a, b) => a.x - b.x);

  if (rightItems.length === 0) return;

  // Redistribute width for items to the right
  const rightStartX = resized.x + newW;
  const availableWidth = cols - rightStartX;

  if (availableWidth < rightItems.length * MIN_W) return;

  const totalOrigW = rightItems.reduce((sum, item) => sum + item.w, 0);
  let curX = rightStartX;

  for (let j = 0; j < rightItems.length; j++) {
    const item = rightItems[j];
    const isLast = j === rightItems.length - 1;

    let w: number;
    if (isLast) {
      w = cols - curX;
    } else {
      w = Math.round(availableWidth * (item.w / totalOrigW));
    }
    w = Math.max(MIN_W, w);

    specStore.updateGridItemGeometry(props.gridId, item.itemId, { x: curX, w });
    curX += w;
  }
}
</script>

<template>
  <div v-if="!gridNode" class="grid-fallback">Grid 节点不存在</div>

  <div v-else class="grid-canvas">
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
        :min-w="item.minW"
        @resized="onItemResized"
      >
        <GridItemShell
          :grid-id="props.gridId"
          :item-id="item.i"
          :child-id="childIdForItem(item.i)"
        />
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

.grid-fallback {
  border: 1px dashed var(--danger);
  border-radius: 8px;
  padding: 8px;
  color: var(--danger);
}
</style>
