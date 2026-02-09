<script setup lang="ts">
import { isContainer } from '@/core/model/guards';
import { useSpecStore } from '@/core/store';
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { GridItem, GridLayout } from 'vue-grid-layout-v3';
import GridItemShell from './GridItemShell.vue';
import {
  useDragFromOutside,
  DROP_ITEM_ID,
  DEFAULT_DROP_W,
  DEFAULT_DROP_H,
} from './useDragFromOutside';

const MIN_W = 2;
const DEFAULT_ROWS = 12;
const DEFAULT_MARGIN: [number, number] = [8, 8];
const CANVAS_PADDING_Y = 16;
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const;
type Breakpoint = keyof typeof BREAKPOINTS;
interface LayoutEntry {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
}

const props = defineProps<{ gridId: string; compact?: boolean }>();

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

const colNum = computed(() => Number(gridNode.value?.props.colNum || 12));
const configuredRowHeight = computed(() => Number(gridNode.value?.props.rowHeight || 30));
const margin = computed<[number, number]>(() => {
  const raw = gridNode.value?.props.margin;
  if (!Array.isArray(raw) || raw.length !== 2) return DEFAULT_MARGIN;

  const marginX = Number(raw[0]);
  const marginY = Number(raw[1]);
  if (!Number.isFinite(marginX) || !Number.isFinite(marginY)) return DEFAULT_MARGIN;
  return [Math.max(0, marginX), Math.max(0, marginY)];
});
const cols = computed<Record<Breakpoint, number>>(() => {
  const lg = Math.max(1, colNum.value);
  return {
    lg,
    md: Math.max(1, Math.min(lg, 10)),
    sm: Math.max(1, Math.min(lg, 6)),
    xs: Math.max(1, Math.min(lg, 4)),
    xxs: Math.max(1, Math.min(lg, 2)),
  };
});

const draggable = ref(true);
const resizable = ref(true);
// Nested (compact) grids always use 'lg' columns – responsive breakpoints
// make no sense when width is determined by the parent item.
const responsive = ref(!props.compact);
const activeBreakpoint = ref<Breakpoint>('lg');
const layoutModel = ref<LayoutEntry[]>([]);
const responsiveLayouts = ref<Record<Breakpoint, LayoutEntry[]>>({
  lg: [],
  md: [],
  sm: [],
  xs: [],
  xxs: [],
});
const canvasEl = ref<HTMLElement | null>(null);
const canvasHeight = ref(0);
const gridLayoutRef = ref<any>(null);

// ── External drag-from-outside ──
const {
  mouseXY,
  isDragging,
  dropResult,
  registerGrid,
  unregisterGrid,
  confirmDrop,
  findDeepestGrid,
} = useDragFromOutside();

// Provide grid config so child GridItemShells can compute auto-height
provide('gridConfiguredRowHeight', configuredRowHeight);
provide('gridMargin', margin);

const occupiedRows = computed(() => {
  const maxRow = items.value.reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
  // Nested (compact) grids size by content; root grids keep a minimum row count
  if (props.compact) return Math.max(1, maxRow);
  return Math.max(DEFAULT_ROWS, maxRow);
});

const renderRowHeight = computed(() => {
  if (canvasHeight.value <= 0) return configuredRowHeight.value;

  const rows = occupiedRows.value;
  const usableHeight = canvasHeight.value - CANVAS_PADDING_Y - margin.value[1] * Math.max(0, rows - 1);
  if (usableHeight <= 0) return configuredRowHeight.value;

  return Math.max(12, Math.floor(usableHeight / rows));
});

let resizeObserver: ResizeObserver | null = null;

function updateCanvasHeight(): void {
  canvasHeight.value = canvasEl.value?.clientHeight || 0;
}

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateCanvasHeight());
    if (canvasEl.value) {
      resizeObserver.observe(canvasEl.value);
    }
  }
  nextTick(updateCanvasHeight);

  // Register this grid for external drag-from-outside
  if (canvasEl.value) {
    registerGrid(props.gridId, {
      el: canvasEl.value,
      getLayoutRef: () => gridLayoutRef.value,
    });
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  unregisterGrid(props.gridId);
});

watch(canvasEl, (next, prev) => {
  if (resizeObserver && prev) {
    resizeObserver.unobserve(prev);
  }
  if (resizeObserver && next) {
    resizeObserver.observe(next);
  }
  nextTick(updateCanvasHeight);

  // Re-register with drag composable when the canvas element changes
  if (prev) unregisterGrid(props.gridId);
  if (next) {
    registerGrid(props.gridId, {
      el: next,
      getLayoutRef: () => gridLayoutRef.value,
    });
  }
});

const layoutBlueprint = computed<LayoutEntry[]>(() => {
  // Geometry-only snapshot:
  // changing child type/childId should not rebuild responsive layouts.
  return items.value.map(item => ({
    i: item.itemId,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: item.minW ?? MIN_W,
  }));
});

function cloneLayout(layout: LayoutEntry[]): LayoutEntry[] {
  return layout.map(item => ({ ...item }));
}

function collides(a: Pick<LayoutEntry, 'x' | 'y' | 'w' | 'h'>, b: Pick<LayoutEntry, 'x' | 'y' | 'w' | 'h'>): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

function isBreakpoint(value: string): value is Breakpoint {
  return Object.prototype.hasOwnProperty.call(BREAKPOINTS, value);
}

function scaleLayout(
  source: LayoutEntry[],
  fromCols: number,
  toCols: number,
): LayoutEntry[] {
  if (fromCols === toCols) return cloneLayout(source);

  const sorted = cloneLayout(source).sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.i.localeCompare(b.i);
  });

  const placed: LayoutEntry[] = [];

  for (const item of sorted) {
    const scaledMinW = item.minW
      ? Math.max(1, Math.min(toCols, Math.round((item.minW / fromCols) * toCols)))
      : undefined;
    const w = Math.max(
      scaledMinW ?? 1,
      Math.min(
        toCols,
        Math.round((item.w / fromCols) * toCols),
      ),
    );
    const h = Math.max(1, item.h);

    let x = Math.round((item.x / fromCols) * toCols);
    x = Math.max(0, Math.min(toCols - w, x));
    let y = Math.max(0, item.y);

    const candidate: LayoutEntry = {
      ...item,
      x,
      y,
      w,
      h,
      minW: scaledMinW,
    };

    while (placed.some(entry => collides(candidate, entry))) {
      x += 1;
      if (x + w > toCols) {
        x = 0;
        y += 1;
      }
      candidate.x = x;
      candidate.y = y;
    }

    placed.push(candidate);
  }

  return placed;
}

function rebuildResponsiveLayouts(): void {
  const lgLayout = layoutBlueprint.value;

  const nextLayouts: Record<Breakpoint, LayoutEntry[]> = {
    lg: cloneLayout(lgLayout),
    md: scaleLayout(lgLayout, cols.value.lg, cols.value.md),
    sm: scaleLayout(lgLayout, cols.value.lg, cols.value.sm),
    xs: scaleLayout(lgLayout, cols.value.lg, cols.value.xs),
    xxs: scaleLayout(lgLayout, cols.value.lg, cols.value.xxs),
  };

  responsiveLayouts.value = nextLayouts;
  layoutModel.value = cloneLayout(nextLayouts[activeBreakpoint.value] || nextLayouts.lg);
}

// Use a stable key so that non-geometry spec changes (e.g. childId swap)
// do NOT trigger a rebuild that would wipe un-persisted layout adjustments.
const layoutStableKey = computed(() =>
  JSON.stringify(layoutBlueprint.value) + '|' + JSON.stringify(cols.value),
);

watch(layoutStableKey, () => {
  rebuildResponsiveLayouts();
}, { immediate: true });

function childIdForItem(itemId: string): string {
  if (itemId === DROP_ITEM_ID) return '';
  const item = items.value.find(i => i.itemId === itemId);
  return item?.childId ?? '';
}

function onLayoutUpdated(newLayout: Array<{ i: string; x: number; y: number; w: number; h: number; minW?: number }>) {
  layoutModel.value = cloneLayout(newLayout);
  responsiveLayouts.value = {
    ...responsiveLayouts.value,
    [activeBreakpoint.value]: cloneLayout(newLayout),
  };

  // During external drag the __drop__ placeholder pushes other items around.
  // Do NOT persist these temporary positions – it would mutate the store,
  // trigger layoutBlueprint / rebuildResponsiveLayouts, and wipe the placeholder.
  if (newLayout.some(entry => entry.i === DROP_ITEM_ID)) return;

  // Always persist – if at a non-'lg' breakpoint, scale positions/widths
  // back to 'lg' columns so the store stays the single source of truth.
  const bp = activeBreakpoint.value;
  const bpCols = cols.value[bp];
  const lgCols = cols.value.lg;

  for (const entry of newLayout) {
    if (bp === 'lg') {
      specStore.updateGridItemGeometry(props.gridId, entry.i, {
        x: entry.x,
        y: entry.y,
        w: entry.w,
        h: entry.h,
      });
    } else {
      // Proportionally scale back to 'lg' column grid
      const w = Math.max(1, Math.min(lgCols, Math.round((entry.w / bpCols) * lgCols)));
      const x = Math.max(0, Math.min(lgCols - w, Math.round((entry.x / bpCols) * lgCols)));
      specStore.updateGridItemGeometry(props.gridId, entry.i, {
        x,
        y: entry.y,
        w,
        h: entry.h,
      });
    }
  }
}

/**
 * When a GridItem is resized, recalculate the w of other items
 * in the same row (overlapping Y range) to fill the remaining columns.
 * Works at any breakpoint – uses the active column count.
 */
function onItemResized(i: string, newH: number, newW: number) {
  if (i === DROP_ITEM_ID) return;
  const activeCols = cols.value[activeBreakpoint.value];

  const allItems = layoutModel.value;
  const resized = allItems.find(item => item.i === i);
  if (!resized) return;

  // Find items that overlap vertically with the resized item
  const rowSiblings = allItems.filter(other => {
    if (other.i === i) return false;
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
  const availableWidth = activeCols - rightStartX;

  if (availableWidth < rightItems.length * MIN_W) return;

  const totalOrigW = rightItems.reduce((sum, item) => sum + item.w, 0);
  let curX = rightStartX;

  const bp = activeBreakpoint.value;
  const bpCols = cols.value[bp];
  const lgCols = cols.value.lg;

  for (let j = 0; j < rightItems.length; j++) {
    const item = rightItems[j];
    const isLast = j === rightItems.length - 1;

    let w: number;
    if (isLast) {
      w = activeCols - curX;
    } else {
      w = Math.round(availableWidth * (item.w / totalOrigW));
    }
    w = Math.max(MIN_W, w);

    if (bp === 'lg') {
      specStore.updateGridItemGeometry(props.gridId, item.i, { x: curX, w });
    } else {
      const scaledW = Math.max(1, Math.min(lgCols, Math.round((w / bpCols) * lgCols)));
      const scaledX = Math.max(0, Math.min(lgCols - scaledW, Math.round((curX / bpCols) * lgCols)));
      specStore.updateGridItemGeometry(props.gridId, item.i, { x: scaledX, w: scaledW });
    }
    curX += w;
  }
}

function onBreakpointChanged(newBreakpoint: string, newLayout: LayoutEntry[]) {
  if (!isBreakpoint(newBreakpoint)) return;
  activeBreakpoint.value = newBreakpoint;
  layoutModel.value = cloneLayout(newLayout);
}

// ── External drag: drop target detection + placeholder ──

const dropTargetGridId = computed(() => {
  if (!isDragging.value) return null;
  return findDeepestGrid(mouseXY.x, mouseXY.y);
});

const isDropTarget = computed(() => dropTargetGridId.value === props.gridId);

let dragStarted = false;
const lastDropPos = ref<{ x: number; y: number } | null>(null);

// Add / remove the temporary '__drop__' placeholder item
watch(isDropTarget, (active) => {
  if (active) {
    const hasDropItem = layoutModel.value.some(item => item.i === DROP_ITEM_ID);
    if (!hasDropItem) {
      const activeCols = cols.value[activeBreakpoint.value];
      const dropW = Math.min(DEFAULT_DROP_W, activeCols);
      layoutModel.value = [
        ...layoutModel.value,
        { i: DROP_ITEM_ID, x: 0, y: 0, w: dropW, h: DEFAULT_DROP_H, minW: 1 },
      ];
    }
    dragStarted = false;
  } else {
    // Clean up placeholder (guard: might already be removed by dropResult handler)
    const hasDropItem = layoutModel.value.some(item => item.i === DROP_ITEM_ID);
    if (hasDropItem) {
      if (gridLayoutRef.value?.emitter && dragStarted) {
        const pos = lastDropPos.value || { x: 0, y: 0 };
        gridLayoutRef.value.emitter.emit('dragEvent', [
          'dragend', DROP_ITEM_ID, pos.x, pos.y, DEFAULT_DROP_H, DEFAULT_DROP_W,
        ]);
      }
      layoutModel.value = layoutModel.value.filter(item => item.i !== DROP_ITEM_ID);
    }
    dragStarted = false;
    lastDropPos.value = null;
  }
});

// Continuously move the placeholder to follow the mouse while this grid is the drop target.
// flush: 'post' ensures the GridLayout has processed the __drop__ item in its internal
// state.layout before we emit drag events on its emitter.
watch(
  () => isDropTarget.value ? `${mouseXY.x},${mouseXY.y}` : null,
  () => {
    if (!isDropTarget.value || !canvasEl.value) return;

    const layoutComp = gridLayoutRef.value;
    if (!layoutComp?.emitter || !layoutComp.el) return;

    const rect = (layoutComp.el as HTMLElement).getBoundingClientRect();
    const left = mouseXY.x - rect.left;
    const top = mouseXY.y - rect.top;

    // Manual calcXY (mirrors vue-grid-layout-v3's GridItem.calcXY)
    const activeCols = cols.value[activeBreakpoint.value];
    const containerWidth = rect.width;
    const colWidth = (containerWidth - margin.value[0] * (activeCols + 1)) / activeCols;
    const dropW = Math.min(DEFAULT_DROP_W, activeCols);

    let x = Math.round((left - margin.value[0]) / (colWidth + margin.value[0]));
    let y = Math.round((top - margin.value[1]) / (renderRowHeight.value + margin.value[1]));
    x = Math.max(0, Math.min(x, activeCols - dropW));
    y = Math.max(0, y);

    lastDropPos.value = { x, y };

    const eventType = dragStarted ? 'dragmove' : 'dragstart';
    layoutComp.emitter.emit('dragEvent', [
      eventType, DROP_ITEM_ID, x, y, DEFAULT_DROP_H, dropW,
    ]);
    dragStarted = true;
  },
  { flush: 'post' },
);

// Finalize drop: when dropResult is set for this grid, create the real node
watch(
  () => dropResult.value,
  (result) => {
    if (!result || result.gridId !== props.gridId) return;

    // Read the resolved position from layoutModel (placeholder is still present)
    const dropItem = layoutModel.value.find(item => item.i === DROP_ITEM_ID);
    const activeCols = cols.value[activeBreakpoint.value];
    const pos = dropItem
      ? { x: dropItem.x, y: dropItem.y, w: dropItem.w, h: dropItem.h }
      : {
          x: lastDropPos.value?.x ?? 0,
          y: lastDropPos.value?.y ?? 0,
          w: Math.min(DEFAULT_DROP_W, activeCols),
          h: DEFAULT_DROP_H,
        };

    // Emit dragend to clean up grid-layout internal drag state
    if (gridLayoutRef.value?.emitter) {
      gridLayoutRef.value.emitter.emit('dragEvent', [
        'dragend', DROP_ITEM_ID, pos.x, pos.y, pos.h, pos.w,
      ]);
    }

    // Remove placeholder from layout
    layoutModel.value = layoutModel.value.filter(item => item.i !== DROP_ITEM_ID);
    dragStarted = false;
    lastDropPos.value = null;

    // Scale back to 'lg' coordinates if at a non-'lg' breakpoint
    const bp = activeBreakpoint.value;
    if (bp !== 'lg') {
      const bpCols = cols.value[bp];
      const lgCols = cols.value.lg;
      pos.w = Math.max(1, Math.min(lgCols, Math.round((pos.w / bpCols) * lgCols)));
      pos.x = Math.max(0, Math.min(lgCols - pos.w, Math.round((pos.x / bpCols) * lgCols)));
    }

    // Create the real node via store
    specStore.dropIntoGrid(props.gridId, result.payload, pos);

    // Signal composable that drop is handled
    confirmDrop();
  },
);
</script>

<template>
  <div v-if="!gridNode" class="grid-fallback">Grid 节点不存在</div>

  <div v-else ref="canvasEl" class="grid-canvas">
    <GridLayout
      ref="gridLayoutRef"
      v-model:layout="layoutModel"
      :responsive-layouts="responsiveLayouts"
      :col-num="colNum"
      :breakpoints="BREAKPOINTS"
      :cols="cols"
      :margin="margin"
      :row-height="renderRowHeight"
      :is-draggable="draggable"
      :is-resizable="resizable"
      :responsive="responsive"
      :vertical-compact="true"
      :use-css-transforms="true"
      @layout-updated="onLayoutUpdated"
      @breakpoint-changed="onBreakpointChanged"
    >
      <GridItem
        v-for="item in layoutModel"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :min-w="item.minW"
        :drag-handle="'.drag-handle'"
        :class="{
          'drop-ghost': item.i === DROP_ITEM_ID,
          'item-selected': item.i !== DROP_ITEM_ID && childIdForItem(item.i) === specStore.selectedId,
        }"
        @resized="onItemResized"
      >
        <GridItemShell
          v-if="item.i !== DROP_ITEM_ID"
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
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: var(--bg-base);
}

:deep(.vue-grid-layout) {
  height: 100%;
  min-height: 100%;
  background: var(--bg-subtle);
  border-radius: 8px;
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

:deep(.vue-grid-item.item-selected) {
  border: 2px solid var(--accent-primary) !important;
}

:deep(.vue-grid-item.drop-ghost) {
  opacity: 0 !important;
}
</style>
