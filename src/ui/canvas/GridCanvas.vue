<script setup lang="ts">
import { isContainer } from '@/core/model/guards';
import { useSpecStore } from '@/core/store';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { GridItem, GridLayout } from 'vue-grid-layout-v3';
import GridItemShell from './GridItemShell.vue';

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
const responsive = ref(true);
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

const occupiedRows = computed(() => {
  const maxRow = items.value.reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
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
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(canvasEl, (next, prev) => {
  if (resizeObserver && prev) {
    resizeObserver.unobserve(prev);
  }
  if (resizeObserver && next) {
    resizeObserver.observe(next);
  }
  nextTick(updateCanvasHeight);
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

watch([layoutBlueprint, cols], () => {
  rebuildResponsiveLayouts();
}, { immediate: true });

function childIdForItem(itemId: string): string {
  const item = items.value.find(i => i.itemId === itemId);
  return item?.childId ?? '';
}

function onLayoutUpdated(newLayout: Array<{ i: string; x: number; y: number; w: number; h: number; minW?: number }>) {
  layoutModel.value = cloneLayout(newLayout);
  responsiveLayouts.value = {
    ...responsiveLayouts.value,
    [activeBreakpoint.value]: cloneLayout(newLayout),
  };

  // Persist schema geometry with lg as source of truth.
  if (activeBreakpoint.value !== 'lg') return;

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
  if (activeBreakpoint.value !== 'lg') return;

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

function onBreakpointChanged(newBreakpoint: string, newLayout: LayoutEntry[]) {
  if (!isBreakpoint(newBreakpoint)) return;
  activeBreakpoint.value = newBreakpoint;
  layoutModel.value = cloneLayout(newLayout);
}
</script>

<template>
  <div v-if="!gridNode" class="grid-fallback">Grid 节点不存在</div>

  <div v-else ref="canvasEl" class="grid-canvas">
    <GridLayout
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
</style>
