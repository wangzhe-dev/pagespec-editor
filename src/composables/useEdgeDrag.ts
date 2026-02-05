/**
 * useEdgeDrag - 边框感知拖拽系统
 *
 * 核心概念：
 * 1. 拖拽时根据移动方向高亮被拖拽元素的边框（向左拖→左边框高亮）
 * 2. 检测被拖拽元素的边框进入目标区域的位置
 * 3. 根据边框位置决定插入位置（左侧/右侧/上方/下方/替换）
 */

import { computed, ref } from 'vue';

// ============================================================================
// 类型定义
// ============================================================================

/** 边框方向 */
export type EdgeDirection = 'left' | 'right' | 'top' | 'bottom' | null;

/** 插入位置类型 */
export type DropPosition =
  | { type: 'before'; targetId: string }   // 插入到目标前面
  | { type: 'after'; targetId: string }    // 插入到目标后面
  | { type: 'row-start'; rowIndex: number } // 放到某行开头
  | { type: 'row-end'; rowIndex: number }   // 放到某行末尾
  | null;

/** Cell 矩形信息 */
export interface CellRect {
  id: string;
  rect: DOMRect;
  rowIndex: number;
}

/** 拖拽状态 */
export interface EdgeDragState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 被拖拽元素的 ID */
  draggedId: string | null;
  /** 拖拽起始位置 */
  startX: number;
  startY: number;
  /** 当前位置 */
  currentX: number;
  currentY: number;
  /** 主移动方向的边框 */
  activeEdge: EdgeDirection;
  /** 目标插入位置 */
  dropPosition: DropPosition;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 计算主移动方向
 * 基于移动距离判断用户主要想往哪个方向移动
 */
export function computePrimaryDirection(
  deltaX: number,
  deltaY: number,
  threshold: number = 10
): EdgeDirection {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  // 移动距离太小，不确定方向
  if (absX < threshold && absY < threshold) {
    return null;
  }

  // 判断主方向
  if (absX > absY) {
    return deltaX < 0 ? 'left' : 'right';
  } else {
    return deltaY < 0 ? 'top' : 'bottom';
  }
}

/**
 * 根据方向获取被拖拽元素的边框位置
 */
export function getDraggedEdgePosition(
  draggedRect: DOMRect,
  edge: EdgeDirection
): number {
  switch (edge) {
    case 'left': return draggedRect.left;
    case 'right': return draggedRect.right;
    case 'top': return draggedRect.top;
    case 'bottom': return draggedRect.bottom;
    default: return 0;
  }
}

/**
 * 检测边框进入了哪个 Cell 的哪个区域
 *
 * 核心逻辑（以向左拖动为例）：
 * - 左边框在 cell-2 内部 → 插入到 cell-2 的后面（after）
 * - 左边框超出 cell-2 的左边界（在 cell-1 和 cell-2 之间）→ 插入到 cell-2 的前面（before）
 *
 * @param edgePosition 边框当前位置（像素）
 * @param edge 边框方向
 * @param cells 所有 Cell 的矩形信息
 * @param draggedId 被拖拽的 Cell ID（排除自己）
 * @param draggedRect 被拖拽元素的矩形（用于判断同行）
 */
export function detectDropZone(
  edgePosition: number,
  edge: EdgeDirection,
  cells: CellRect[],
  draggedId: string,
  draggedRect?: DOMRect
): DropPosition {
  if (!edge) return null;

  const isHorizontal = edge === 'left' || edge === 'right';

  // 过滤掉自己，并按位置排序
  const otherCells = cells.filter(c => c.id !== draggedId);

  if (isHorizontal) {
    // 水平拖动：检测左/右边框
    // 筛选同一行的 cells（Y 坐标有重叠）
    const samRowCells = draggedRect
      ? otherCells.filter(c => {
          const overlap = !(c.rect.bottom < draggedRect.top || c.rect.top > draggedRect.bottom);
          return overlap;
        })
      : otherCells;

    // 按 left 位置排序
    samRowCells.sort((a, b) => a.rect.left - b.rect.left);

    if (edge === 'left') {
      // 向左拖动，检测左边框位置
      for (const cell of samRowCells) {
        const { rect } = cell;

        // 左边框在 cell 内部 → 插入到这个 cell 的后面
        if (edgePosition >= rect.left && edgePosition <= rect.right) {
          return { type: 'after', targetId: cell.id };
        }

        // 左边框在 cell 的左边（超出了这个 cell）→ 插入到这个 cell 前面
        if (edgePosition < rect.left) {
          return { type: 'before', targetId: cell.id };
        }
      }
    } else {
      // 向右拖动，检测右边框位置
      // 从右往左遍历
      for (let i = samRowCells.length - 1; i >= 0; i--) {
        const cell = samRowCells[i];
        const { rect } = cell;

        // 右边框在 cell 内部 → 插入到这个 cell 的前面
        if (edgePosition >= rect.left && edgePosition <= rect.right) {
          return { type: 'before', targetId: cell.id };
        }

        // 右边框在 cell 的右边（超出了这个 cell）→ 插入到这个 cell 后面
        if (edgePosition > rect.right) {
          return { type: 'after', targetId: cell.id };
        }
      }
    }
  } else {
    // 垂直拖动：检测上/下边框
    // 按 top 位置排序
    const sortedCells = [...otherCells].sort((a, b) => a.rect.top - b.rect.top);

    if (edge === 'top') {
      // 向上拖动，检测上边框位置
      for (const cell of sortedCells) {
        const { rect } = cell;

        if (edgePosition >= rect.top && edgePosition <= rect.bottom) {
          // 上边框在 cell 内部 → 移动到这个 cell 所在行的下方
          return { type: 'row-end', rowIndex: cell.rowIndex };
        }

        if (edgePosition < rect.top) {
          // 上边框在 cell 上方 → 移动到这个 cell 所在行的上方
          return { type: 'row-start', rowIndex: cell.rowIndex };
        }
      }
    } else {
      // 向下拖动，检测下边框位置
      for (let i = sortedCells.length - 1; i >= 0; i--) {
        const cell = sortedCells[i];
        const { rect } = cell;

        if (edgePosition >= rect.top && edgePosition <= rect.bottom) {
          // 下边框在 cell 内部 → 移动到这个 cell 所在行的上方
          return { type: 'row-start', rowIndex: cell.rowIndex };
        }

        if (edgePosition > rect.bottom) {
          // 下边框在 cell 下方 → 移动到这个 cell 所在行的下方
          return { type: 'row-end', rowIndex: cell.rowIndex };
        }
      }
    }
  }

  return null;
}

// ============================================================================
// Composable
// ============================================================================

export interface UseEdgeDragOptions {
  /** 获取所有 Cell 元素的方法 */
  getCellElements: () => Map<string, HTMLElement>;
  /** 获取 Cell 所在行索引的方法 */
  getCellRowIndex: (cellId: string) => number;
  /** 触发距离阈值 */
  threshold?: number;
}

export function useEdgeDrag(options: UseEdgeDragOptions) {
  const { getCellElements, getCellRowIndex, threshold = 15 } = options;

  // 状态
  const isDragging = ref(false);
  const draggedId = ref<string | null>(null);
  const startX = ref(0);
  const startY = ref(0);
  const currentX = ref(0);
  const currentY = ref(0);
  const activeEdge = ref<EdgeDirection>(null);
  const dropPosition = ref<DropPosition>(null);
  const dragOffsetX = ref(0);
  const dragOffsetY = ref(0);
  const dragWidth = ref(0);
  const dragHeight = ref(0);
  const hasDragRect = ref(false);

  // 计算属性
  const deltaX = computed(() => currentX.value - startX.value);
  const deltaY = computed(() => currentY.value - startY.value);

  // 获取所有 Cell 的矩形信息
  function collectCellRects(): CellRect[] {
    const elements = getCellElements();
    const result: CellRect[] = [];

    elements.forEach((el, id) => {
      result.push({
        id,
        rect: el.getBoundingClientRect(),
        rowIndex: getCellRowIndex(id),
      });
    });

    return result;
  }

  // 开始拖拽
  function onDragStart(cellId: string, event: MouseEvent | DragEvent | { clientX: number; clientY: number; draggedRect?: DOMRect }) {
    isDragging.value = true;
    draggedId.value = cellId;
    startX.value = event.clientX;
    startY.value = event.clientY;
    currentX.value = event.clientX;
    currentY.value = event.clientY;
    activeEdge.value = null;
    dropPosition.value = null;

    const explicitRect = (event as any).draggedRect as DOMRect | undefined;
    let initialRect = explicitRect;
    if (!initialRect) {
      const cells = collectCellRects();
      initialRect = cells.find(c => c.id === cellId)?.rect;
    }

    if (initialRect) {
      dragOffsetX.value = event.clientX - initialRect.left;
      dragOffsetY.value = event.clientY - initialRect.top;
      dragWidth.value = initialRect.width;
      dragHeight.value = initialRect.height;
      hasDragRect.value = true;
    } else {
      dragOffsetX.value = 0;
      dragOffsetY.value = 0;
      dragWidth.value = 0;
      dragHeight.value = 0;
      hasDragRect.value = false;
    }
  }

  // 拖拽移动
  function onDragMove(event: MouseEvent | DragEvent | { clientX: number; clientY: number; draggedRect?: DOMRect }) {
    if (!isDragging.value || !draggedId.value) return;

    currentX.value = event.clientX;
    currentY.value = event.clientY;

    // 计算主移动方向
    const dx = deltaX.value;
    const dy = deltaY.value;
    activeEdge.value = computePrimaryDirection(dx, dy, threshold);

    // 如果有明确方向，检测目标位置
    if (activeEdge.value) {
      const cells = collectCellRects();

      // 如果事件包含拖拽元素的 rect，使用它；否则从 cells 中查找
      const draggedRect = (event as any).draggedRect as DOMRect | undefined;

      if (!hasDragRect.value && draggedRect) {
        dragOffsetX.value = currentX.value - draggedRect.left;
        dragOffsetY.value = currentY.value - draggedRect.top;
        dragWidth.value = draggedRect.width;
        dragHeight.value = draggedRect.height;
        hasDragRect.value = true;
      }

      const virtualRect = hasDragRect.value && dragWidth.value > 0 && dragHeight.value > 0
        ? ({
            left: currentX.value - dragOffsetX.value,
            top: currentY.value - dragOffsetY.value,
            right: currentX.value - dragOffsetX.value + dragWidth.value,
            bottom: currentY.value - dragOffsetY.value + dragHeight.value,
            width: dragWidth.value,
            height: dragHeight.value,
          } as DOMRect)
        : undefined;

      const resolvedRect = virtualRect ?? draggedRect;
      const draggedCell = resolvedRect
        ? { id: draggedId.value, rect: resolvedRect, rowIndex: getCellRowIndex(draggedId.value) }
        : cells.find(c => c.id === draggedId.value);

      if (draggedCell) {
        // 使用拖拽元素的实际边框位置
        const edgePos = getDraggedEdgePosition(draggedCell.rect, activeEdge.value);

        dropPosition.value = detectDropZone(
          edgePos,
          activeEdge.value,
          cells,
          draggedId.value,
          draggedCell.rect  // 传入被拖拽元素的 rect 用于判断同行
        );
      }
    } else {
      dropPosition.value = null;
    }
  }

  // 结束拖拽
  function onDragEnd() {
    const result = {
      draggedId: draggedId.value,
      dropPosition: dropPosition.value,
      activeEdge: activeEdge.value,
    };

    // 重置状态
    isDragging.value = false;
    draggedId.value = null;
    startX.value = 0;
    startY.value = 0;
    currentX.value = 0;
    currentY.value = 0;
    activeEdge.value = null;
    dropPosition.value = null;
    dragOffsetX.value = 0;
    dragOffsetY.value = 0;
    dragWidth.value = 0;
    dragHeight.value = 0;
    hasDragRect.value = false;

    return result;
  }

  // 获取某个 Cell 是否应该高亮边框
  function getCellDragEdge(cellId: string): EdgeDirection {
    if (!isDragging.value) return null;
    if (cellId !== draggedId.value) return null;
    return activeEdge.value;
  }

  return {
    // 状态
    isDragging,
    draggedId,
    activeEdge,
    dropPosition,
    deltaX,
    deltaY,

    // 方法
    onDragStart,
    onDragMove,
    onDragEnd,
    getCellDragEdge,
    collectCellRects,
  };
}

// ============================================================================
// 插入指示器位置计算
// ============================================================================

export interface IndicatorPosition {
  type: 'horizontal' | 'vertical';
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 计算插入指示器的位置
 */
export function computeIndicatorPosition(
  dropPosition: DropPosition,
  cells: CellRect[],
  containerRect: DOMRect
): IndicatorPosition | null {
  if (!dropPosition) return null;

  const targetCell = cells.find(c =>
    dropPosition.type === 'before' || dropPosition.type === 'after'
      ? c.id === (dropPosition as any).targetId
      : false
  );

  switch (dropPosition.type) {
    case 'before':
      if (targetCell) {
        return {
          type: 'vertical',
          x: targetCell.rect.left - containerRect.left - 2,
          y: targetCell.rect.top - containerRect.top,
          width: 4,
          height: targetCell.rect.height,
        };
      }
      break;

    case 'after':
      if (targetCell) {
        return {
          type: 'vertical',
          x: targetCell.rect.right - containerRect.left - 2,
          y: targetCell.rect.top - containerRect.top,
          width: 4,
          height: targetCell.rect.height,
        };
      }
      break;

    case 'row-start':
    case 'row-end': {
      // 找到该行的所有 cells
      const rowCells = cells.filter(c => c.rowIndex === dropPosition.rowIndex);
      if (rowCells.length === 0) return null;

      const minTop = Math.min(...rowCells.map(c => c.rect.top));
      const maxBottom = Math.max(...rowCells.map(c => c.rect.bottom));
      const y = dropPosition.type === 'row-start'
        ? minTop - containerRect.top - 2
        : maxBottom - containerRect.top - 2;

      return {
        type: 'horizontal',
        x: 0,
        y,
        width: containerRect.width,
        height: 4,
      };
    }
  }

  return null;
}
