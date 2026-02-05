<script setup lang="ts">
/**
 * GridCellItem - 栅格单元格组件（统一版）
 * - 在 Grid 内部：Resize 由父组件 GridContainer 处理（colSpan/rowSpan 联动）
 * - 独立/嵌套模式：自己处理 Resize（width/height 像素值）
 */
import { useUIStore } from '@/app/store';
import {
  createBlockDragGroup,
  createMoveValidator,
} from '@/composables/useDragDrop';
import { createBlockNode } from '@/domain/registry';
import type { GridCell, GridNode, LayoutNode } from '@/domain/schema';
import { computed, ref, watch } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';

// 递归组件名称定义
defineOptions({ name: 'GridCellItem' });

export type ResizeEdge = 'left' | 'right' | 'top' | 'bottom';

export interface ResizeStartPayload {
  cellId: string;
  edge: ResizeEdge;
  event: PointerEvent;
  cellEl: HTMLElement;
}

const props = withDefaults(defineProps<{
  cell: GridCell;
  depth: number;
  /** 独立模式：自己处理 resize（修改 width/height 像素值） */
  standalone?: boolean;
  // 以下 props 仅在 Grid 内部使用
  totalColumns?: number;
  rowUnit?: number;
  maxRowSpan?: number;
  activeResizeEdge?: ResizeEdge | null;
  /** 拖拽时的边框方向高亮（区别于 resize） */
  dragEdge?: ResizeEdge | null;
  /** 是否为拖拽目标（放置指示） */
  isDropTarget?: boolean;
}>(), {
  standalone: false,
  totalColumns: 24,
  rowUnit: 8,
  maxRowSpan: 60,
});

const emit = defineEmits<{
  (e: 'resize-start', payload: ResizeStartPayload): void;
}>();

const uiStore = useUIStore();

const isSelected = computed(() => uiStore.selectedNodeId === props.cell.id);
const isHovered = computed(() => uiStore.hoveredNodeId === props.cell.id);
const showActions = computed(() => isSelected.value || isHovered.value);
const cellRef = ref<HTMLElement | null>(null);

const hoverEdge = ref<ResizeEdge | null>(null);
// 独立模式下的 activeResizeEdge
const standaloneActiveEdge = ref<ResizeEdge | null>(null);

// 激活的边来自父组件（统一 resize 状态）或拖拽状态
const edgeHighlight = computed(() => {
  // 拖拽边框优先级最高
  if (props.dragEdge) return props.dragEdge;
  // 独立模式用自己的状态
  if (props.standalone) return standaloneActiveEdge.value ?? hoverEdge.value;
  // Grid 模式用父组件的状态
  return props.activeResizeEdge ?? hoverEdge.value;
});

// 单元格样式
const cellStyle = computed(() => {
  const { colStart, colSpan, rowStart, rowSpan, justifySelf, alignSelf, padding, width, height } = props.cell;

  // 独立模式：使用像素尺寸
  if (props.standalone) {
    return {
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
      justifySelf: justifySelf || undefined,
      alignSelf: alignSelf || undefined,
      padding: padding ? `${padding}px` : undefined,
    };
  }

  // Grid 模式：使用栅格定位
  const start = colStart ?? 1;
  const span = colSpan ?? 1;
  const rStart = rowStart ?? 1;
  const rSpan = rowSpan ?? 1;

  return {
    gridColumn: `${start} / span ${span}`,
    gridRow: rSpan > 1 ? `${rStart} / span ${rSpan}` : undefined,
    justifySelf: justifySelf || undefined,
    alignSelf: alignSelf || undefined,
    padding: padding ? `${padding}px` : undefined,
  };
});

// 单元格信息显示
const cellInfo = computed(() => {
  if (props.standalone) {
    const { width, height } = props.cell;
    if (width || height) {
      const w = width ? `${width}px` : 'auto';
      const h = height ? `${height}px` : 'auto';
      return `${w} × ${h}`;
    }
    return 'auto';
  }
  return null;
});

const badgeInfo = computed(() => {
  if (props.standalone) return cellInfo.value;
  const span = props.cell.colSpan ?? 1;
  return `span ${span}`;
});

// 子节点（带自动修正：如果直接嵌套 GridCell，自动包裹 Grid）
const childrenList = computed<LayoutNode[]>(() => {
  if (!Array.isArray(props.cell.children)) {
    (props.cell as any).children = [];
  }
  const children = props.cell.children as LayoutNode[];

  // 检查是否有直接嵌套的 GridCell（不是被 Grid 包裹的）
  const hasDirectGridCell = children.some(child => child.type === 'GridCell');

  if (hasDirectGridCell && children.length > 0) {
    // 收集所有连续的 GridCell，包裹成一个 Grid
    const gridCells = children.filter(child => child.type === 'GridCell');
    const otherNodes = children.filter(child => child.type !== 'GridCell');

    if (gridCells.length > 0) {
      // 创建一个新的 Grid 来包裹这些 GridCell
      const wrapperGrid = createBlockNode('Grid', {
        label: '自动包裹',
        children: [],
      }) as GridNode;
      // 直接修改数据结构
      wrapperGrid.children = gridCells as GridCell[];

      // 替换原 children
      props.cell.children = [...otherNodes, wrapperGrid];
      return props.cell.children as LayoutNode[];
    }
  }

  return children;
});

// 拖拽组配置
const blockDragGroup = computed(() => createBlockDragGroup());

// 拖拽验证 - Cell 可以包含 Grid/Table/Form 等，但不能直接包含 GridCell
const moveValidator = computed(() => {
  return createMoveValidator({
    containerNode: props.cell,
    containerType: 'GridCell',
    childrenList: childrenList.value,
    // GridCell 只能放在 Grid 中，不能直接放在 Cell 中
    disallowedChildTypes: ['GridCell'],
  });
});

function setHover(edge: ResizeEdge) {
  if (props.standalone) {
    if (standaloneActiveEdge.value) return;
  } else {
    if (props.activeResizeEdge) return;
  }
  hoverEdge.value = edge;
}

function clearHover(edge: ResizeEdge) {
  if (props.standalone) {
    if (standaloneActiveEdge.value) return;
  } else {
    if (props.activeResizeEdge) return;
  }
  if (hoverEdge.value === edge) {
    hoverEdge.value = null;
  }
}

function onResizeStart(edge: ResizeEdge, event: PointerEvent) {
  event.stopPropagation();
  event.preventDefault();
  const cellEl = cellRef.value;
  if (!cellEl) return;

  // 独立模式：自己处理 resize
  if (props.standalone) {
    standaloneActiveEdge.value = edge;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = cellEl.offsetWidth;
    const startHeight = cellEl.offsetHeight;

    const onMove = (e: PointerEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (edge === 'right') {
        props.cell.width = Math.max(60, startWidth + deltaX);
      } else if (edge === 'left') {
        props.cell.width = Math.max(60, startWidth - deltaX);
      }

      if (edge === 'bottom') {
        props.cell.height = Math.max(40, startHeight + deltaY);
      } else if (edge === 'top') {
        props.cell.height = Math.max(40, startHeight - deltaY);
      }
    };

    const onUp = () => {
      standaloneActiveEdge.value = null;
      hoverEdge.value = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return;
  }

  // Grid 模式：通知父组件处理
  emit('resize-start', {
    cellId: props.cell.id,
    edge,
    event,
    cellEl,
  });
}

function onCellLeave() {
  uiStore.hoverNode(null);
  hoverEdge.value = null;
}

// 当父组件结束 resize 时清理 hover 状态（仅 Grid 模式）
watch(() => props.activeResizeEdge, (val) => {
  if (!val) {
    hoverEdge.value = null;
  }
});

function onAddBlock(evt: any) {
  const list = childrenList.value;
  const added = list[evt.newIndex];
  if (added?.id) {
    requestAnimationFrame(() => {
      uiStore.selectNode(added.id);
    });
  }
}
</script>

<template>
  <div
    ref="cellRef"
    class="grid-cell"
    :class="[
      { selected: isSelected, hovered: isHovered, 'drop-target': isDropTarget },
      edgeHighlight && `edge-${edgeHighlight}`
    ]"
    :style="cellStyle"
    @click.stop="uiStore.selectNode(cell.id)"
    @mouseenter.stop="uiStore.hoverNode(cell.id)"
    @mouseleave.stop="onCellLeave"
  >
    <div
      class="resize-handle handle-left"
      @pointerdown="onResizeStart('left', $event)"
      @mouseenter="setHover('left')"
      @mouseleave="clearHover('left')"
    />
    <div
      class="resize-handle handle-right"
      @pointerdown="onResizeStart('right', $event)"
      @mouseenter="setHover('right')"
      @mouseleave="clearHover('right')"
    />
    <div
      class="resize-handle handle-top"
      @pointerdown="onResizeStart('top', $event)"
      @mouseenter="setHover('top')"
      @mouseleave="clearHover('top')"
    />
    <div
      class="resize-handle handle-bottom"
      @pointerdown="onResizeStart('bottom', $event)"
      @mouseenter="setHover('bottom')"
      @mouseleave="clearHover('bottom')"
    />

    <!-- 悬停时显示操作按钮 -->
    <NodeActions v-if="showActions" :node="cell" :show="showActions" class="cell-actions" />

    <!-- Cell 内容区域 -->
    <div class="cell-row">
      <!-- 子节点拖拽区域：用于接收拖入的子组件 -->
      <Draggable
        :list="childrenList"
        item-key="id"
        :group="blockDragGroup"
        :animation="200"
        :fallback-on-body="true"
        :swap-threshold="0.5"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-dragging"
        :move="moveValidator"
        @add="onAddBlock"
        class="cell-content"
      >
        <template #item="{ element }">
          <div class="cell-item-wrapper">
            <!-- 所有子节点统一通过 slot 渲染（由 TemplateStructureNode 处理具体类型） -->
            <slot name="child" :child="element" :depth="depth + 1">
              <div class="child-placeholder">
                <span>{{ element.label || element.type }}</span>
              </div>
            </slot>
          </div>
        </template>
      </Draggable>
      <!-- 空状态提示 - 不参与拖拽布局 -->
      <div v-if="childrenList.length === 0" class="empty-hint">
        <span>拖放组件到这里</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--border-default, #d0d0d0);
  background: var(--bg-elevated);
  border-radius: 6px;
  padding: 6px;
  min-height: calc(var(--grid-row-unit, 8px) * 2);
  --edge-shadow: none;
  box-shadow: var(--edge-shadow);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  cursor: grab;
}

.grid-cell:active {
  cursor: grabbing;
}

.grid-cell.hovered {
  border-color: var(--border-strong, #999);
}

.grid-cell.selected {
  border-color: var(--accent-primary);
  box-shadow: var(--edge-shadow), 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
}

/* 拖拽目标高亮 */
.grid-cell.drop-target {
  border-color: var(--accent-secondary, #10b981);
  background: rgba(16, 185, 129, 0.08);
  box-shadow: var(--edge-shadow), 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.grid-cell.edge-left {
  --edge-shadow: inset 3px 0 0 var(--accent-primary);
}

.grid-cell.edge-right {
  --edge-shadow: inset -3px 0 0 var(--accent-primary);
}

.grid-cell.edge-top {
  --edge-shadow: inset 0 3px 0 var(--accent-primary);
}

.grid-cell.edge-bottom {
  --edge-shadow: inset 0 -3px 0 var(--accent-primary);
}

.resize-handle {
  position: absolute;
  z-index: 2;
  background: transparent;
}

.handle-left {
  top: -2px;
  left: -2px;
  width: 8px;
  height: calc(100% + 4px);
  cursor: ew-resize;
}

.handle-right {
  top: -2px;
  right: -2px;
  width: 8px;
  height: calc(100% + 4px);
  cursor: ew-resize;
}

.handle-top {
  top: -2px;
  left: -2px;
  width: calc(100% + 4px);
  height: 8px;
  cursor: ns-resize;
}

.handle-bottom {
  bottom: -2px;
  left: -2px;
  width: calc(100% + 4px);
  height: 8px;
  cursor: ns-resize;
}

/* 操作按钮 - 悬停时显示在右上角 */
.cell-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
}

/* Row 容器 - 撑满 cell 高度 */
.cell-row {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: inherit;
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 60px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

/* GridCell 包裹器 - 拖拽项必须有实际盒模型 */
.cell-item-wrapper {
  display: block;
  cursor: grab;
}

.cell-item-wrapper:hover {
  outline: 1px solid var(--border-strong);
  outline-offset: -1px;
}

.cell-item-wrapper:active {
  cursor: grabbing;
}

/* 拖拽悬停时高亮内容区域 */
.cell-content:empty,
.cell-content.sortable-ghost-parent {
  background: var(--accent-subtle);
}

.child-placeholder {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  background: var(--bg-elevated);
  font-size: 10px;
  color: var(--text-secondary);
}

/* 空状态提示 - 相对于 cell-row 定位 */
.empty-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-subtle);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 11px;
  pointer-events: none;
  transition: all 0.2s;
}

.grid-cell:hover .empty-hint,
.grid-cell.selected .empty-hint {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-subtle);
}
</style>
