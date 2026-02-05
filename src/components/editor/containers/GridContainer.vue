<script setup lang="ts">
/**
 * GridContainer - 栅格容器组件
 * 用于在编辑器中可视化 Grid 布局结构
 * 统一处理 resize 逻辑，实现相邻 cell 联动调整
 * 支持边框感知拖拽定位
 */
import { useUIStore } from '@/app/store';
import {
    createBlockDragGroup,
    resolveDraggedType,
} from '@/composables/useDragDrop';
import {
    computeIndicatorPosition,
    useEdgeDrag,
    type DropPosition,
    type EdgeDirection
} from '@/composables/useEdgeDrag';
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
const MIN_COL_SPAN = 3;

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

function getClientPoint(evt: any): { x: number; y: number } | null {
  const e = evt?.originalEvent ?? evt;
  if (e?.touches?.length) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if (e?.changedTouches?.length) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  if (typeof e?.clientX === 'number' && typeof e?.clientY === 'number') {
    return { x: e.clientX, y: e.clientY };
  }
  return null;
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

function getGridItemStyle(node: LayoutNode) {
  if (node.type === 'GridCell') {
    const cell = node as GridCell;
    const start = clamp(cell.colStart ?? 1, 1, GRID_COLUMNS);
    const span = clamp(cell.colSpan ?? 1, 1, GRID_COLUMNS);
    const rStart = clamp(cell.rowStart ?? 1, 1, MAX_ROW_SPAN);
    const rSpan = clamp(cell.rowSpan ?? 1, 1, MAX_ROW_SPAN);

    return {
      gridColumn: `${start} / span ${span}`,
      gridRow: rSpan > 1 ? `${rStart} / span ${rSpan}` : undefined,
      justifySelf: cell.justifySelf || undefined,
      alignSelf: cell.alignSelf || undefined,
    };
  }

  return {
    gridColumn: `1 / span ${GRID_COLUMNS}`,
  };
}

function getRowCellsById(cellId: string): GridCell[] {
  const rows = splitRows(cellList.value);
  for (const row of rows) {
    const gridCells = row.filter((node): node is GridCell => node.type === 'GridCell');
    if (gridCells.some(cell => cell.id === cellId)) {
      return gridCells;
    }
  }
  return [];
}

function getRowIndexById(cellId: string): number {
  const rows = splitRows(cellList.value);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(node => node.id === cellId)) {
      return i;
    }
  }
  return -1;
}

function findAdjacentCell(cell: GridCell, edge: 'left' | 'right'): GridCell | null {
  const rowCells = getRowCellsById(cell.id);
  if (rowCells.length === 0) return null;

  const start = clamp(cell.colStart ?? 1, 1, GRID_COLUMNS);
  const span = clamp(cell.colSpan ?? 1, 1, GRID_COLUMNS);

  if (edge === 'right') {
    const boundary = start + span;
    return rowCells.find(other =>
      other.id !== cell.id && clamp(other.colStart ?? 1, 1, GRID_COLUMNS) === boundary
    ) ?? null;
  }

  const boundary = start;
  return rowCells.find(other => {
    if (other.id === cell.id) return false;
    const otherStart = clamp(other.colStart ?? 1, 1, GRID_COLUMNS);
    const otherSpan = clamp(other.colSpan ?? 1, 1, GRID_COLUMNS);
    return otherStart + otherSpan === boundary;
  }) ?? null;
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
    if (reason !== 'drag' && cell.colSpanLocked && cell.colStart != null && cell.colStart >= 1) {
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
const draggingCellId = ref<string | null>(null);
const dragStartRowIndex = ref<number | null>(null);

// Grid 容器 DOM 引用
const gridCanvasRef = ref<HTMLElement | null>(null);

// Cell 元素引用 Map（用于边框感知拖拽）
const cellElementsMap = ref<Map<string, HTMLElement>>(new Map());

// 注册/注销 Cell 元素引用
function registerCellElement(cellId: string, el: HTMLElement | null) {
  if (el) {
    cellElementsMap.value.set(cellId, el);
  } else {
    cellElementsMap.value.delete(cellId);
  }
}

// ============= 边框感知拖拽 =============

const edgeDrag = useEdgeDrag({
  getCellElements: () => cellElementsMap.value,
  getCellRowIndex: (cellId: string) => getRowIndexById(cellId),
  threshold: 15,
});

// 计算插入指示器位置
const indicatorPosition = computed(() => {
  if (!edgeDrag.isDragging.value || !edgeDrag.dropPosition.value) return null;
  if (!gridCanvasRef.value) return null;

  const containerRect = gridCanvasRef.value.getBoundingClientRect();
  const cells = edgeDrag.collectCellRects();

  return computeIndicatorPosition(edgeDrag.dropPosition.value, cells, containerRect);
});

// 获取某个 Cell 的拖拽边框（区别于 resize 边框）
function getCellDragEdge(cellId: string): EdgeDirection {
  return edgeDrag.getCellDragEdge(cellId);
}

// 判断某个 Cell 是否为拖拽目标（高亮目标 cell）
function isCellDropTarget(cellId: string): boolean {
  const drop = edgeDrag.dropPosition.value;
  if (!drop) return false;
  // before/after 类型时高亮目标 cell
  if ((drop.type === 'before' || drop.type === 'after') && drop.targetId === cellId) {
    return true;
  }
  return false;
}

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
  neighborId?: string | null;
  neighborStartColStart?: number;
  neighborStartColSpan?: number;
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

  let neighbor: GridCell | null = null;
  if (edge === 'left' || edge === 'right') {
    neighbor = findAdjacentCell(cell, edge);
  }

  resizeState = {
    edge,
    startX: event.clientX,
    startY: event.clientY,
    colWidth: Math.max(colWidth, 1),
    cellId,
    startColStart,
    startColSpan,
    startRowSpan,
    neighborId: neighbor?.id ?? null,
    neighborStartColStart: neighbor ? clamp(neighbor.colStart ?? 1, 1, GRID_COLUMNS) : undefined,
    neighborStartColSpan: neighbor ? clamp(neighbor.colSpan ?? 1, 1, GRID_COLUMNS) : undefined,
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

  const {
    edge,
    startX,
    startY,
    colWidth,
    cellId,
    startColStart,
    startColSpan,
    startRowSpan,
    neighborId,
    neighborStartColStart,
    neighborStartColSpan,
  } = resizeState;
  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  const cell = findCell(cellId);
  if (!cell) return;

  if (edge === 'left' || edge === 'right') {
    const spanDelta = Math.round(deltaX / colWidth);

    if (neighborId && neighborStartColStart != null && neighborStartColSpan != null) {
      const neighbor = findCell(neighborId);
      if (neighbor) {
        const total = startColSpan + neighborStartColSpan;

        if (edge === 'right') {
          const newLeftSpan = clamp(startColSpan + spanDelta, MIN_COL_SPAN, total - MIN_COL_SPAN);
          const newRightSpan = total - newLeftSpan;
          const newRightStart = startColStart + newLeftSpan;

          if (
            newLeftSpan !== cell.colSpan ||
            newRightSpan !== neighbor.colSpan ||
            newRightStart !== neighbor.colStart
          ) {
            cell.colSpan = newLeftSpan;
            cell.colSpanLocked = true;
            neighbor.colStart = newRightStart;
            neighbor.colSpan = newRightSpan;
            neighbor.colSpanLocked = true;
          }
          return;
        }

        const newCurrentSpan = clamp(startColSpan - spanDelta, MIN_COL_SPAN, total - MIN_COL_SPAN);
        const newNeighborSpan = total - newCurrentSpan;
        const newCurrentStart = neighborStartColStart + newNeighborSpan;

        if (
          newCurrentSpan !== cell.colSpan ||
          newNeighborSpan !== neighbor.colSpan ||
          newCurrentStart !== cell.colStart
        ) {
          neighbor.colSpan = newNeighborSpan;
          neighbor.colSpanLocked = true;
          cell.colStart = newCurrentStart;
          cell.colSpan = newCurrentSpan;
          cell.colSpanLocked = true;
        }
        return;
      }
    }

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

function onGridMove(evt: any): boolean {
  if (!moveValidator(evt)) return false;

  const dragged = evt.draggedContext?.element as LayoutNode | undefined;
  const related = evt.relatedContext?.element as LayoutNode | undefined;
  if (!dragged || !related) return true;

  const draggedRect = evt.draggedRect as DOMRect | undefined;

  // 更新边框感知拖拽状态（传递拖拽元素的实际 rect）
  if (edgeDrag.isDragging.value) {
    const point = getClientPoint(evt);
    const fallbackX = draggedRect ? draggedRect.left + draggedRect.width / 2 : 0;
    const fallbackY = draggedRect ? draggedRect.top + draggedRect.height / 2 : 0;
    const clientX = point?.x ?? fallbackX;
    const clientY = point?.y ?? fallbackY;
    edgeDrag.onDragMove({
      clientX,
      clientY,
      draggedRect, // 传递完整的 rect
    } as any);
  }

  if (dragged.type !== 'GridCell' || related.type !== 'GridCell') {
    return true;
  }

  const relatedRect = evt.relatedRect as DOMRect | undefined;
  if (!draggedRect || !relatedRect) return true;

  const activeEdge = edgeDrag.activeEdge.value;
  if (activeEdge === 'left') {
    evt.willInsertAfter = draggedRect.left >= relatedRect.left;
    return true;
  }
  if (activeEdge === 'right') {
    evt.willInsertAfter = draggedRect.right > relatedRect.right;
    return true;
  }

  const crossedTop = draggedRect.top < relatedRect.top;
  const crossedBottom = draggedRect.bottom > relatedRect.bottom;
  const crossedLeft = draggedRect.left < relatedRect.left;
  const crossedRight = draggedRect.right > relatedRect.right;

  if (crossedTop) {
    evt.willInsertAfter = false;
    return true;
  }

  if (crossedBottom) {
    evt.willInsertAfter = true;
    return true;
  }

  if (crossedLeft) {
    evt.willInsertAfter = false;
    return true;
  }

  if (crossedRight) {
    evt.willInsertAfter = true;
    return true;
  }

  return false;
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

function onDragStart(evt: any) {
  const index = evt?.oldIndex;
  if (typeof index !== 'number') {
    draggingCellId.value = null;
    dragStartRowIndex.value = null;
    return;
  }

  const dragged = cellList.value[index];
  if (!dragged || dragged.type !== 'GridCell') {
    draggingCellId.value = null;
    dragStartRowIndex.value = null;
    return;
  }

  draggingCellId.value = dragged.id;
  dragStartRowIndex.value = getRowIndexById(dragged.id);

  // 启动边框感知拖拽（使用鼠标/触摸位置）
  const point = getClientPoint(evt);
  const cellEl = cellElementsMap.value.get(dragged.id);
  const draggedRect = cellEl?.getBoundingClientRect();
  const fallbackX = draggedRect ? draggedRect.left + draggedRect.width / 2 : 0;
  const fallbackY = draggedRect ? draggedRect.top + draggedRect.height / 2 : 0;
  const clientX = point?.x ?? fallbackX;
  const clientY = point?.y ?? fallbackY;

  edgeDrag.onDragStart(dragged.id, {
    clientX,
    clientY,
    draggedRect,
  } as any);
}

function onDragEnd(evt: any) {
  // 获取边框感知拖拽结果
  const edgeDragResult = edgeDrag.onDragEnd();

  const cellId = draggingCellId.value;
  const startRow = dragStartRowIndex.value;

  // 如果有边框感知的放置位置，使用它来调整
  if (edgeDragResult.dropPosition && edgeDragResult.draggedId) {
    applyDropPosition(edgeDragResult.draggedId, edgeDragResult.dropPosition, evt);
  } else if (cellId && startRow != null) {
    // 回退到原有逻辑
    const endRow = getRowIndexById(cellId);
    if (endRow !== -1 && endRow !== startRow) {
      const cell = findCell(cellId);
      if (cell) {
        cell.colStart = 1;
        cell.colSpan = GRID_COLUMNS;
        cell.colSpanLocked = true;
      }
    }
  }

  draggingCellId.value = null;
  dragStartRowIndex.value = null;

  normalizeGridLayout('drag');
}

/**
 * 根据边框感知的放置位置调整 Cell
 */
function applyDropPosition(draggedId: string, dropPos: DropPosition, evt: any) {
  if (!dropPos) return;

  const list = cellList.value;
  const draggedIndex = list.findIndex(n => n.id === draggedId);
  if (draggedIndex === -1) return;

  const dragged = list[draggedIndex] as GridCell;

  switch (dropPos.type) {
    case 'before':
    case 'after': {
      const targetIndex = list.findIndex(n => n.id === dropPos.targetId);
      if (targetIndex === -1) return;

      const target = list[targetIndex] as GridCell;

      // 从原位置移除
      list.splice(draggedIndex, 1);

      // 计算新的插入位置（考虑删除后的索引变化）
      let insertIndex = targetIndex;
      if (draggedIndex < targetIndex) {
        insertIndex--;
      }
      if (dropPos.type === 'after') {
        insertIndex++;
      }

      // 插入到新位置
      list.splice(insertIndex, 0, dragged);

      // 调整 colStart 使其紧邻目标
      if (dropPos.type === 'before') {
        // 放在目标左边
        const targetStart = target.colStart ?? 1;
        const targetSpan = target.colSpan ?? 1;
        const draggedSpan = dragged.colSpan ?? 1;

        // 重新分配空间：dragged + target 平分原有空间
        const totalSpan = targetSpan;
        const newDraggedSpan = Math.max(MIN_COL_SPAN, Math.floor(totalSpan / 2));
        const newTargetSpan = Math.max(MIN_COL_SPAN, totalSpan - newDraggedSpan);

        dragged.colStart = targetStart;
        dragged.colSpan = newDraggedSpan;
        dragged.colSpanLocked = true;

        target.colStart = targetStart + newDraggedSpan;
        target.colSpan = newTargetSpan;
        target.colSpanLocked = true;
      } else {
        // 放在目标右边
        const targetStart = target.colStart ?? 1;
        const targetSpan = target.colSpan ?? 1;

        // 重新分配空间
        const totalSpan = targetSpan;
        const newTargetSpan = Math.max(MIN_COL_SPAN, Math.floor(totalSpan / 2));
        const newDraggedSpan = Math.max(MIN_COL_SPAN, totalSpan - newTargetSpan);

        target.colSpan = newTargetSpan;
        target.colSpanLocked = true;

        dragged.colStart = targetStart + newTargetSpan;
        dragged.colSpan = newDraggedSpan;
        dragged.colSpanLocked = true;
      }
      break;
    }

    case 'row-start':
    case 'row-end': {
      // 移动到新行
      dragged.colStart = 1;
      dragged.colSpan = GRID_COLUMNS;
      dragged.colSpanLocked = true;

      // 重新排列到对应行
      // 这里暂时让 vuedraggable 处理实际的数组移动
      break;
    }
  }
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
      ref="gridCanvasRef"
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
      :move="onGridMove"
      @add="onAddCell"
      @start="onDragStart"
      @end="onDragEnd"
      class="grid-canvas"
      :style="gridStyle"
    >
      <template #item="{ element }">
        <div class="grid-item-wrapper" :style="getGridItemStyle(element)">
          <!-- GridCell 使用专门的组件渲染 -->
          <GridCellItem
            v-if="element.type === 'GridCell'"
            :ref="(el: any) => registerCellElement(element.id, el?.$el)"
            :cell="element"
            :depth="depth + 1"
            :total-columns="GRID_COLUMNS"
            :row-unit="GRID_ROW_UNIT"
            :max-row-span="MAX_ROW_SPAN"
            :active-resize-edge="getActiveResizeEdge(element.id)"
            :drag-edge="getCellDragEdge(element.id)"
            :is-drop-target="isCellDropTarget(element.id)"
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

    <!-- 插入位置指示器 -->
    <div
      v-if="indicatorPosition"
      class="drop-indicator"
      :class="indicatorPosition.type"
      :style="{
        left: `${indicatorPosition.x}px`,
        top: `${indicatorPosition.y}px`,
        width: `${indicatorPosition.width}px`,
        height: `${indicatorPosition.height}px`,
      }"
    />
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
  display: block;
  min-width: 0;
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

/* 插入位置指示器 */
.drop-indicator {
  position: absolute;
  background: var(--accent-primary);
  border-radius: 2px;
  pointer-events: none;
  z-index: 100;
  animation: indicator-pulse 1s ease-in-out infinite;
}

.drop-indicator.vertical {
  width: 4px;
}

.drop-indicator.horizontal {
  height: 4px;
}

@keyframes indicator-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
</style>
