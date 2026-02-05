<script setup lang="ts">
/**
 * GridContainer - 栅格容器组件
 * 用于在编辑器中可视化 Grid 布局结构
 * 统一处理 resize 逻辑，实现相邻 cell 联动调整
 */
import { useUIStore } from '@/app/store';
import {
    createBlockDragGroup,
    resolveDraggedType,
} from '@/composables/useDragDrop';
import type { GridCell, GridNode, LayoutNode } from '@/domain/schema';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';
import GridCellItem, { type ResizeEdge, type ResizeStartPayload } from './GridCellItem.vue';

const props = defineProps<{
  node: GridNode;
  depth: number;
}>();

const uiStore = useUIStore();

const isSelected = computed(() => uiStore.selectedNodeId === props.node.id);
const isHovered = computed(() => uiStore.hoveredNodeId === props.node.id);
const showActions = computed(() => isSelected.value || isHovered.value);

const GRID_COLUMNS = 24;
const GRID_ROW_UNIT = 8;
const MAX_ROW_SPAN = 60;

// 获取子节点列表（可以是 GridCell 或其他组件）
const cellList = computed<LayoutNode[]>(() => {
  if (!Array.isArray(props.node.children)) {
    (props.node as any).children = [];
  }
  return props.node.children as LayoutNode[];
});

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

function getNodeSpan(node: LayoutNode): number {
  if (node.type === 'GridCell') {
    return clamp((node as GridCell).colSpan ?? 1, 1, GRID_COLUMNS);
  }
  return GRID_COLUMNS;
}

function splitRows(nodes: LayoutNode[]): LayoutNode[][] {
  const rows: LayoutNode[][] = [];
  let current: LayoutNode[] = [];
  let currentSpan = 0;

  nodes.forEach((node) => {
    const span = getNodeSpan(node);
    if (current.length > 0 && currentSpan + span > GRID_COLUMNS) {
      rows.push(current);
      current = [];
      currentSpan = 0;
    }
    current.push(node);
    currentSpan += span;
  });

  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

// 初始化 cell 的位置（colStart）和宽度（colSpan）
function initializeCellPositions(cells: GridCell[], reason: 'init' | 'add' | 'drag' | 'resize' | 'structure') {
  if (cells.length === 0) return;

  // resize 时不重新分配位置
  if (reason === 'resize') return;

  // 检查是否所有 cell 都已有有效的 colStart（非新添加的情况）
  const allHavePosition = cells.every(cell =>
    cell.colStart != null && cell.colStart >= 1 && cell.colSpanLocked
  );

  // 如果所有 cell 都已有位置且这不是结构变化，保持现有位置
  if (allHavePosition && reason !== 'add' && reason !== 'drag' && reason !== 'structure') {
    return;
  }

  // 为新 cell 或需要初始化的 cell 分配位置
  let nextStart = 1;
  cells.forEach((cell, index) => {
    // 如果是已锁定的 cell，使用其现有位置
    if (cell.colSpanLocked && cell.colStart != null && cell.colStart >= 1) {
      // 保持现有位置，但更新 nextStart
      nextStart = cell.colStart + (cell.colSpan ?? 1);
      return;
    }

    // 为未锁定的 cell 分配位置
    cell.colStart = nextStart;

    // 计算默认宽度：平均分配剩余空间
    const remainingCells = cells.length - index;
    const remainingSpace = GRID_COLUMNS - nextStart + 1;
    const defaultSpan = Math.max(1, Math.floor(remainingSpace / remainingCells));

    cell.colSpan = clamp(cell.colSpan ?? defaultSpan, 1, GRID_COLUMNS - nextStart + 1);
    cell.rowSpan = clamp(cell.rowSpan ?? 1, 1, MAX_ROW_SPAN);

    nextStart = cell.colStart + cell.colSpan;
  });
}

function normalizeRow(row: LayoutNode[], reason: 'init' | 'add' | 'drag' | 'resize' | 'structure') {
  if (row.length === 0) return;

  const gridCells = row.filter(node => node.type === 'GridCell') as GridCell[];
  if (gridCells.length !== row.length) {
    return;
  }

  // 只处理一个 cell 的特殊情况
  if (gridCells.length === 1) {
    const cell = gridCells[0];
    if (!cell.colSpanLocked || reason === 'add' || reason === 'drag' || reason === 'structure') {
      cell.colStart = 1;
      cell.colSpan = GRID_COLUMNS;
      cell.colSpanLocked = false;
    }
    return;
  }

  // 初始化 cell 位置
  initializeCellPositions(gridCells, reason);
}

let isNormalizing = false;
function normalizeGridLayout(reason: 'init' | 'add' | 'drag' | 'resize' | 'structure') {
  if (isNormalizing) return;
  isNormalizing = true;

  try {
    const nodes = cellList.value;
    const rows = splitRows(nodes);
    rows.forEach(row => normalizeRow(row, reason));
  } finally {
    isNormalizing = false;
  }
}

// ============= Resize 状态管理 =============

// 当前正在 resize 的 cell id 和边
const resizingCellId = ref<string | null>(null);
const resizingEdge = ref<ResizeEdge | null>(null);

// 获取某个 cell 当前激活的 resize 边（用于传递给 GridCellItem）
function getActiveResizeEdge(cellId: string): ResizeEdge | null {
  if (resizingCellId.value === cellId) {
    return resizingEdge.value;
  }
  return null;
}

// Resize 状态
interface ResizeState {
  edge: ResizeEdge;
  startX: number;
  startY: number;
  colWidth: number;
  cellId: string;
  startColStart: number;  // 初始 colStart
  startColSpan: number;   // 初始 colSpan
  startRowSpan: number;
}

let resizeState: ResizeState | null = null;

// 查找 cell 数据
function findCell(cellId: string): GridCell | null {
  const nodes = cellList.value;
  const cell = nodes.find(n => n.id === cellId);
  return cell?.type === 'GridCell' ? (cell as GridCell) : null;
}

function onCellResizeStart(payload: ResizeStartPayload) {
  const { cellId, edge, event, cellEl } = payload;
  const cell = findCell(cellId);
  if (!cell) return;

  // 从 cellEl 获取 grid canvas，计算列宽
  const gridEl = cellEl.closest('.grid-canvas') as HTMLElement | null;
  const gridRect = gridEl?.getBoundingClientRect();
  let colWidth = 40; // 默认值

  if (gridEl && gridRect) {
    const styles = window.getComputedStyle(gridEl);
    const gapValue = parseFloat(styles.columnGap || styles.gap || '0');
    const gap = Number.isFinite(gapValue) ? gapValue : 0;
    const totalGap = gap * (GRID_COLUMNS - 1);
    const usable = Math.max(gridRect.width - totalGap, gridRect.width / GRID_COLUMNS);
    colWidth = usable / GRID_COLUMNS;
  }

  const startColStart = clamp(cell.colStart ?? 1, 1, GRID_COLUMNS);
  const startColSpan = clamp(cell.colSpan ?? 1, 1, GRID_COLUMNS);
  const startRowSpan = clamp(cell.rowSpan ?? 1, 1, MAX_ROW_SPAN);

  resizeState = {
    edge,
    startX: event.clientX,
    startY: event.clientY,
    colWidth: Math.max(colWidth, 1),
    cellId,
    startColStart,
    startColSpan,
    startRowSpan,
  };

  resizingCellId.value = cellId;
  resizingEdge.value = edge;

  uiStore.selectNode(cellId);

  document.body.style.userSelect = 'none';
  document.body.style.cursor = edge === 'left' || edge === 'right' ? 'ew-resize' : 'ns-resize';

  window.addEventListener('pointermove', onResizeMove);
  window.addEventListener('pointerup', onResizeEnd);
}

function onResizeMove(event: PointerEvent) {
  if (!resizeState) return;

  const { edge, startX, startY, colWidth, cellId, startColStart, startColSpan, startRowSpan } = resizeState;
  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  const cell = findCell(cellId);
  if (!cell) return;

  if (edge === 'left' || edge === 'right') {
    const spanDelta = Math.round(deltaX / colWidth);

    if (edge === 'right') {
      // 拖动右边边框：colStart 不变，只改变 colSpan
      // 向右拖 → 变宽，向左拖 → 变窄
      const maxSpan = GRID_COLUMNS - startColStart + 1; // 最大不能超出右边界
      const newSpan = clamp(startColSpan + spanDelta, 1, maxSpan);

      if (newSpan !== cell.colSpan) {
        cell.colSpan = newSpan;
        cell.colSpanLocked = true;
      }
    } else {
      // 拖动左边边框：右边界不变，同时调整 colStart 和 colSpan
      // 向右拖 → 左边界右移，cell 变窄
      // 向左拖 → 左边界左移，cell 变宽
      const rightEdge = startColStart + startColSpan; // 右边界位置（不含）
      const newStart = clamp(startColStart + spanDelta, 1, rightEdge - 1);
      const newSpan = rightEdge - newStart;

      if (newStart !== cell.colStart || newSpan !== cell.colSpan) {
        cell.colStart = newStart;
        cell.colSpan = newSpan;
        cell.colSpanLocked = true;
      }
    }
  }

  if (edge === 'top' || edge === 'bottom') {
    // 垂直调整只影响当前 cell
    const unit = Math.max(GRID_ROW_UNIT, 1);
    // 拖动下边框：deltaY > 0 → 增高；拖动上边框：deltaY > 0 → 减高
    const rowDelta = Math.round((edge === 'bottom' ? deltaY : -deltaY) / unit);
    const newRowSpan = clamp(startRowSpan + rowDelta, 1, MAX_ROW_SPAN);
    if (newRowSpan !== cell.rowSpan) {
      cell.rowSpan = newRowSpan;
    }
  }
}

function onResizeEnd() {
  if (!resizeState) return;
  resizeState = null;
  resizingCellId.value = null;
  resizingEdge.value = null;

  document.body.style.userSelect = '';
  document.body.style.cursor = '';

  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', onResizeEnd);

  // 不调用 normalizeGridLayout，因为我们已经精确分配了 span
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', onResizeEnd);
});

// ============= 计算 Grid 样式 =============

const gridStyle = computed(() => {
  const { gap, rows } = props.node;

  // 解析间距
  let gapValue = '12px';
  if (typeof gap === 'number') {
    gapValue = `${gap}px`;
  } else if (gap && typeof gap === 'object') {
    gapValue = `${gap.row}px ${gap.col}px`;
  }

  // 解析列模板
  const gridTemplateColumns = `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`;

  // 解析行模板
  let gridTemplateRows: string | undefined;
  if (rows) {
    if (typeof rows === 'string') {
      gridTemplateRows = rows;
    }
  }

  return {
    display: 'grid',
    gridTemplateColumns,
    gridTemplateRows,
    gridAutoRows: `minmax(${GRID_ROW_UNIT}px, auto)`,
    gap: gapValue,
    alignItems: 'stretch',
    '--grid-row-unit': `${GRID_ROW_UNIT}px`,
  };
});

// 拖拽组配置 - 使用通用 blocks group，接收任何组件
const blockDragGroup = computed(() => createBlockDragGroup());

// 拖拽验证 - 允许任何容器组件直接放入 Grid
function moveValidator(evt: any): boolean {
  const dragged = evt.draggedContext?.element;
  const childType = resolveDraggedType(dragged);

  if (!childType) return false;

  // 允许的类型：GridCell 和其他容器/数据组件
  const allowedTypes = ['GridCell', 'Card', 'Tabs', 'Grid', 'Table', 'Tree', 'Form', 'Chart'];
  return allowedTypes.includes(childType);
}

// 添加时选中新节点（不再自动包装）
function onAddCell(evt: any) {
  const list = cellList.value;
  const added = list[evt.newIndex];

  if (!added) return;

  normalizeGridLayout('add');
  requestAnimationFrame(() => {
    uiStore.selectNode(added.id);
  });
}

function onDragEnd() {
  normalizeGridLayout('drag');
}

watch(
  () => cellList.value.length,
  () => normalizeGridLayout('structure'),
  { immediate: true }
);
</script>

<template>
  <div
    class="grid-container drag-handle"
    :class="{ selected: isSelected, hovered: isHovered }"
    @click.stop="uiStore.selectNode(node.id)"
    @mouseenter.stop="uiStore.hoverNode(node.id)"
    @mouseleave.stop="uiStore.hoverNode(null)"
  >
    <div v-if="showActions" class="type-badge">
      <span>Grid</span>
      <NodeActions :node="node" :show="showActions" />
    </div>

    <Draggable
      :list="cellList"
      item-key="id"
      :group="blockDragGroup"
      :animation="200"
      :fallback-on-body="true"
      :swap-threshold="0.65"
      :filter="'.resize-handle'"
      :prevent-on-filter="true"
      ghost-class="drag-ghost"
      chosen-class="drag-chosen"
      drag-class="drag-dragging"
      :move="moveValidator"
      @add="onAddCell"
      @end="onDragEnd"
      class="grid-canvas"
      :style="gridStyle"
    >
      <template #item="{ element }">
        <div class="grid-item-wrapper">
          <!-- GridCell 使用专门的组件渲染 -->
          <GridCellItem
            v-if="element.type === 'GridCell'"
            :cell="element"
            :depth="depth + 1"
            :total-columns="GRID_COLUMNS"
            :row-unit="GRID_ROW_UNIT"
            :max-row-span="MAX_ROW_SPAN"
            :active-resize-edge="getActiveResizeEdge(element.id)"
            @resize-start="onCellResizeStart"
          >
            <template #child="{ child, depth: childDepth }">
              <slot name="child" :child="child" :depth="childDepth" />
            </template>
          </GridCellItem>
          <!-- 其他组件直接通过 slot 渲染 -->
          <slot v-else name="child" :child="element" :depth="depth + 1" />
        </div>
      </template>
    </Draggable>
  </div>
</template>

<style scoped>
.grid-container {
  position: relative;
  border: 2px solid var(--border-default, #d0d0d0);
  background: var(--bg-elevated);
  border-radius: 8px;
  padding: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.grid-container.hovered {
  border-color: var(--border-strong, #999);
}

.grid-container.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.2);
}

.type-badge {
  position: absolute;
  bottom: -10px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--bg-elevated);
  border: 2px solid var(--accent-primary);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-primary);
  z-index: 1;
}

.grid-container {
  cursor: grab;
}

.grid-container:active {
  cursor: grabbing;
}

.add-cell-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.add-cell-btn:hover {
  background: var(--accent-primary);
  color: white;
}

.grid-canvas {
  min-height: 60px;
}

.grid-item-wrapper {
  display: contents;
}

.drop-slot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.drop-slot:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.drag-ghost {
  opacity: 0.6;
}
</style>
