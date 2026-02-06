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
  createMoveValidator,
} from '@/composables/useDragDrop';
import {
  computeIndicatorPosition,
  useEdgeDrag,
  type EdgeDirection
} from '@/composables/useEdgeDrag';
import { createBlockNode } from '@/domain/registry';
import type { GridCell, GridNode, LayoutNode } from '@/domain/schema';
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';
import GridCellItem, { type ResizeEdge, type ResizeStartPayload } from './GridCellItem.vue';
import { IN_GRID_CELL_KEY } from './keys';

const props = defineProps<{
  node: GridNode;
  depth: number;
  /** 嵌套模式：在 GridCell 内部时为 true，不显示边框 */
  nested?: boolean;
}>();

// 定义 slot 类型
defineSlots<{
  child(props: { child: LayoutNode; depth: number; nested?: boolean }): any;
}>();

// 自动检测是否在 GridCell 内部（通过 provide/inject）
const inGridCell = inject(IN_GRID_CELL_KEY, false);
// 嵌套模式：由 inject 自动检测或 prop 显式指定
const isNested = computed(() => props.nested || inGridCell);

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
    const span = clamp(cell.colSpan ?? 1, 1, GRID_COLUMNS);
    const rSpan = clamp(cell.rowSpan ?? 1, 1, MAX_ROW_SPAN);

    return {
      '--grid-span': span,
      minHeight: rSpan > 1 ? `calc(${rSpan} * var(--grid-row-unit))` : undefined,
      alignSelf: cell.alignSelf || undefined,
    };
  }

  return {
    '--grid-span': GRID_COLUMNS,
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

  // 检查是否所有 cell 都已有有效的 colSpan（说明是已配置好的 Grid）
  const allHaveValidSpan = cells.every(cell =>
    cell.colSpan != null && cell.colSpan >= 1
  );

  // 如果所有 cell 都已有有效 colSpan，只需要重新计算 colStart 位置
  if (allHaveValidSpan && reason === 'structure') {
    let nextStart = 1;
    cells.forEach(cell => {
      cell.colStart = nextStart;
      nextStart += cell.colSpan ?? 1;
    });
    return;
  }

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

    // 如果 cell 已有 colSpan，保留它
    if (cell.colSpan != null && cell.colSpan >= 1) {
      cell.colSpan = clamp(cell.colSpan, 1, GRID_COLUMNS - nextStart + 1);
    } else {
      // 计算默认宽度：平均分配剩余空间
      const remainingCells = cells.length - index;
      const remainingSpace = GRID_COLUMNS - nextStart + 1;
      const defaultSpan = Math.max(1, Math.floor(remainingSpace / remainingCells));
      cell.colSpan = clamp(defaultSpan, 1, GRID_COLUMNS - nextStart + 1);
    }

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

  // 核心逻辑：同一行的 GridCell 自动平分 24 列
  const count = gridCells.length;
  const spanPerCell = Math.floor(GRID_COLUMNS / count);

  let nextStart = 1;
  gridCells.forEach((cell, index) => {
    cell.colStart = nextStart;
    // 最后一个 cell 占用剩余空间（处理不能整除的情况）
    if (index === count - 1) {
      cell.colSpan = GRID_COLUMNS - nextStart + 1;
    } else {
      cell.colSpan = spanPerCell;
    }
    cell.rowSpan = clamp(cell.rowSpan ?? 1, 1, MAX_ROW_SPAN);
    nextStart += cell.colSpan;
  });
}

function ensureGridCellList() {
  const list = cellList.value;
  for (let i = 0; i < list.length; i++) {
    const node = list[i];
    if (node.type === 'GridCell') continue;
    const wrapped = createBlockNode('GridCell', {
      label: '单元格',
      children: [node],
    }) as GridCell;
    list.splice(i, 1, wrapped);
  }
}

let isNormalizing = false;
function normalizeGridLayout(reason: 'init' | 'add' | 'drag' | 'resize' | 'structure') {
  if (isNormalizing) return;
  isNormalizing = true;

  try {
    if (reason !== 'resize') {
      ensureGridCellList();
    }

    // 拖拽/添加后：重新计算布局
    // 策略：按顺序分行，每行最多放到填满 24 列，然后平分
    if (reason === 'drag' || reason === 'add') {
      const gridCells = cellList.value.filter(n => n.type === 'GridCell') as GridCell[];

      // 计算每个 cell 最小需要多少列（至少 MIN_COL_SPAN）
      const minSpan = MIN_COL_SPAN;
      // 一行能放几个？
      const maxPerRow = Math.floor(GRID_COLUMNS / minSpan);

      // 按顺序分行：每行最多 maxPerRow 个
      let rowStart = 0;
      while (rowStart < gridCells.length) {
        const rowEnd = Math.min(rowStart + maxPerRow, gridCells.length);
        const rowCells = gridCells.slice(rowStart, rowEnd);

        // 这一行有几个 cell，平分 24 列
        const count = rowCells.length;
        const spanPerCell = Math.floor(GRID_COLUMNS / count);
        let nextStart = 1;

        rowCells.forEach((cell, index) => {
          cell.colStart = nextStart;
          if (index === count - 1) {
            cell.colSpan = GRID_COLUMNS - nextStart + 1;
          } else {
            cell.colSpan = spanPerCell;
          }
          cell.rowSpan = clamp(cell.rowSpan ?? 1, 1, MAX_ROW_SPAN);
          nextStart += cell.colSpan;
        });

        rowStart = rowEnd;
      }
    } else {
      // 其他情况：使用原来的 splitRows + normalizeRow 逻辑
      const nodes = cellList.value;
      const rows = splitRows(nodes);
      rows.forEach(row => normalizeRow(row, reason));
    }
  } finally {
    isNormalizing = false;
  }
}

// ============= Resize 状态管理 =============

// 当前正在 resize 的 cell id 和边
const resizingCellId = ref<string | null>(null);
const resizingEdge = ref<ResizeEdge | null>(null);

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

  // gridCanvasRef 是 Draggable 组件引用，需要访问 $el 获取 DOM 元素
  const el = (gridCanvasRef.value as any).$el as HTMLElement | undefined;
  if (!el || typeof el.getBoundingClientRect !== 'function') return null;

  const containerRect = el.getBoundingClientRect();
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
  const { gap } = props.node;

  // 解析间距
  let gapValue = '12px';
  let gapRow = 12;
  let gapCol = 12;
  if (typeof gap === 'number') {
    gapValue = `${gap}px`;
    gapRow = gap;
    gapCol = gap;
  } else if (gap && typeof gap === 'object') {
    gapValue = `${gap.row}px ${gap.col}px`;
    gapRow = gap.row;
    gapCol = gap.col;
  }

  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: gapValue,
    alignItems: 'stretch',
    '--grid-columns': `${GRID_COLUMNS}`,
    '--grid-gap-col': `${gapCol}px`,
    '--grid-gap-row': `${gapRow}px`,
    '--grid-row-unit': `${GRID_ROW_UNIT}px`,
  };
});

// 拖拽组配置 - 使用通用 blocks group，接收任何组件
const blockDragGroup = computed(() => createBlockDragGroup());

const baseMoveValidator = computed(() => {
  return createMoveValidator({
    containerNode: props.node,
    containerType: 'Grid',
    childrenList: cellList.value,
  });
});

// 拖拽验证 - 使用通用规则（Grid 允许任何 Block）
function moveValidator(evt: any): boolean {
  return baseMoveValidator.value(evt);
}

function onGridMove(evt: any): boolean {
  if (!moveValidator(evt)) return false;

  const dragged = evt.draggedContext?.element as LayoutNode | undefined;
  const related = evt.relatedContext?.element as LayoutNode | undefined;
  if (!dragged || !related) return true;

  const draggedRect = evt.draggedRect as DOMRect | undefined;

  // 更新边框感知拖拽状态
  if (edgeDrag.isDragging.value) {
    const point = getClientPoint(evt);
    const fallbackX = draggedRect ? draggedRect.left + draggedRect.width / 2 : 0;
    const fallbackY = draggedRect ? draggedRect.top + draggedRect.height / 2 : 0;
    const clientX = point?.x ?? fallbackX;
    const clientY = point?.y ?? fallbackY;
    edgeDrag.onDragMove({
      clientX,
      clientY,
      draggedRect,
    } as any);
  }

  if (dragged.type !== 'GridCell' || related.type !== 'GridCell') {
    return true;
  }

  const relatedRect = evt.relatedRect as DOMRect | undefined;
  if (!draggedRect || !relatedRect) return true;

  // 根据边框感知的方向来决定插入位置
  const activeEdge = edgeDrag.activeEdge.value;

  if (activeEdge === 'top') {
    // 向上拖：上边框碰到目标 → 插入目标前面
    evt.willInsertAfter = false;
  } else if (activeEdge === 'bottom') {
    // 向下拖：下边框碰到目标 → 插入目标后面
    evt.willInsertAfter = true;
  } else if (activeEdge === 'left') {
    // 向左拖：左边框碰到目标 → 插入目标前面（同行效果）
    evt.willInsertAfter = false;
  } else if (activeEdge === 'right') {
    // 向右拖：右边框碰到目标 → 插入目标后面（同行效果）
    evt.willInsertAfter = true;
  } else {
    // 未检测到明确方向，使用位置判断
    const dragCenterY = draggedRect.top + draggedRect.height / 2;
    const relatedCenterY = relatedRect.top + relatedRect.height / 2;
    evt.willInsertAfter = dragCenterY > relatedCenterY;
  }

  return true;
}

// 添加时选中新节点（Grid 强制使用 GridCell 包裹）
function onAddCell(evt: any) {
  const list = cellList.value;
  const added = list[evt.newIndex];

  if (!added) return;

  if (added.type !== 'GridCell') {
    const wrapped = createBlockNode('GridCell', {
      label: '单元格',
      children: [added],
    }) as GridCell;
    list.splice(evt.newIndex, 1, wrapped);
    normalizeGridLayout('add');
    requestAnimationFrame(() => {
      uiStore.selectNode(wrapped.id);
    });
    return;
  }

  normalizeGridLayout('add');
  requestAnimationFrame(() => {
    uiStore.selectNode(added.id);
  });
}

function onDragStart(evt: any) {
  const index = evt?.oldIndex;
  if (typeof index !== 'number') {
    return;
  }

  const dragged = cellList.value[index];
  if (!dragged || dragged.type !== 'GridCell') {
    return;
  }

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

function onDragEnd() {
  // 清理边框感知拖拽状态
  edgeDrag.onDragEnd();
  // 重新计算布局（同一行的 cells 自动平分）
}


watch(
  () => cellList.value.length,
  () => normalizeGridLayout('structure'),
  { immediate: true }
);
</script>

<template>
  <div
    class="grid-container"
    :class="{ selected: isSelected, hovered: isHovered, nested: isNested }"
    @click.stop="uiStore.selectNode(node.id)"
    @mouseenter.stop="uiStore.hoverNode(node.id)"
    @mouseleave.stop="uiStore.hoverNode(null)"
  >
    <!-- 悬停时显示操作按钮（嵌套模式不显示） -->
    <NodeActions v-if="showActions && !isNested" :node="node" :show="showActions" class="row-actions" />

    <Draggable
      ref="gridCanvasRef"
      :list="cellList"
      item-key="id"
      :group="blockDragGroup"
      :animation="200"
      :fallback-on-body="true"
      :swap-threshold="0.5"
      :invert-swap="true"
      :filter="'.resize-handle, .cell-actions'"
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
            <template #child="{ child, depth: childDepth, nested: childNested }">
              <slot name="child" :child="child" :depth="childDepth" :nested="childNested" />
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
  padding-top: 0;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.grid-container.hovered {
  border-color: var(--border-strong, #999);
}

.grid-container.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.2);
}

/* 嵌套模式：虚拟 Grid，不显示边框和背景 */
.grid-container.nested {
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

.grid-container.nested.hovered,
.grid-container.nested.selected {
  border: none;
  box-shadow: none;
}

/* 操作按钮 - 悬停时显示在右上角 */
.row-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
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
  align-content: flex-start;
}

.grid-item-wrapper {
  display: block;
  min-width: 0;
  flex: 0 0 calc(
    (100% - (var(--grid-gap-col) * (var(--grid-columns) - 1))) / var(--grid-columns) * var(--grid-span)
    + (var(--grid-gap-col) * (var(--grid-span) - 1))
  );
  max-width: calc(
    (100% - (var(--grid-gap-col) * (var(--grid-columns) - 1))) / var(--grid-columns) * var(--grid-span)
    + (var(--grid-gap-col) * (var(--grid-span) - 1))
  );
  box-sizing: border-box;
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
