<script setup lang="ts">
/**
 * GridCellItem - 栅格单元格组件
 * Resize 逻辑由父组件 GridContainer 统一处理，实现相邻 cell 联动
 */
import { useUIStore } from '@/app/store';
import {
    createBlockDragGroup,
    createMoveValidator,
} from '@/composables/useDragDrop';
import type { GridCell, LayoutNode } from '@/domain/schema';
import { computed, ref, watch } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';

export type ResizeEdge = 'left' | 'right' | 'top' | 'bottom';

export interface ResizeStartPayload {
  cellId: string;
  edge: ResizeEdge;
  event: PointerEvent;
  cellEl: HTMLElement;
}

const props = defineProps<{
  cell: GridCell;
  depth: number;
  totalColumns: number;
  rowUnit: number;
  maxRowSpan: number;
  activeResizeEdge?: ResizeEdge | null;
  /** 拖拽时的边框方向高亮（区别于 resize） */
  dragEdge?: ResizeEdge | null;
  /** 是否为拖拽目标（放置指示） */
  isDropTarget?: boolean;
}>();

const emit = defineEmits<{
  (e: 'resize-start', payload: ResizeStartPayload): void;
}>();

const uiStore = useUIStore();

const isSelected = computed(() => uiStore.selectedNodeId === props.cell.id);
const isHovered = computed(() => uiStore.hoveredNodeId === props.cell.id);
const showActions = computed(() => isSelected.value || isHovered.value);
const cellRef = ref<HTMLElement | null>(null);

const hoverEdge = ref<ResizeEdge | null>(null);

// 激活的边来自父组件（统一 resize 状态）或拖拽状态
const edgeHighlight = computed(() => {
  // 拖拽边框优先级最高
  if (props.dragEdge) return props.dragEdge;
  // 然后是 resize 边框
  return props.activeResizeEdge ?? hoverEdge.value;
});

// 单元格样式（使用 colStart 明确定位，支持独立调整宽度）
const cellStyle = computed(() => {
  const { colStart, colSpan, rowStart, rowSpan, justifySelf, alignSelf, padding } = props.cell;
  const start = colStart ?? 1;
  const span = colSpan ?? 1;
  const rStart = rowStart ?? 1;
  const rSpan = rowSpan ?? 1;

  return {
    // 使用明确的起始位置 + span，而不是自动流动
    gridColumn: `${start} / span ${span}`,
    gridRow: rSpan > 1 ? `${rStart} / span ${rSpan}` : undefined,
    justifySelf: justifySelf || undefined,
    alignSelf: alignSelf || undefined,
    padding: padding ? `${padding}px` : undefined,
  };
});

// 子节点
const childrenList = computed<LayoutNode[]>(() => {
  if (!Array.isArray(props.cell.children)) {
    (props.cell as any).children = [];
  }
  return props.cell.children as LayoutNode[];
});

// 拖拽组配置
const blockDragGroup = computed(() => createBlockDragGroup());

// 拖拽验证
const moveValidator = computed(() => {
  return createMoveValidator({
    containerNode: props.cell,
    containerType: 'GridCell',
    disallowedChildTypes: ['GridCell'], // GridCell 内不允许嵌套 GridCell
    childrenList: childrenList.value,
  });
});

function setHover(edge: ResizeEdge) {
  if (props.activeResizeEdge) return;
  hoverEdge.value = edge;
}

function clearHover(edge: ResizeEdge) {
  if (props.activeResizeEdge) return;
  if (hoverEdge.value === edge) {
    hoverEdge.value = null;
  }
}

function onResizeStart(edge: ResizeEdge, event: PointerEvent) {
  event.stopPropagation();
  event.preventDefault();
  const cellEl = cellRef.value;
  if (!cellEl) return;

  // 通知父组件开始 resize，由父组件统一处理相邻 cell 联动
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

// 当父组件结束 resize 时清理 hover 状态
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
    class="grid-cell drag-handle"
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

    <div v-if="showActions" class="type-badge">
      <span>Cell</span>
      <NodeActions :node="cell" :show="showActions" />
    </div>

    <!-- 单元格内容区域 - 始终显示拖拽区域 -->
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
        <slot name="child" :child="element" :depth="depth + 1">
          <div class="child-placeholder">
            <span>{{ element.label || element.type }}</span>
          </div>
        </slot>
      </template>
    </Draggable>
    <!-- 空状态提示 - 不参与拖拽布局 -->
    <div v-if="childrenList.length === 0" class="empty-hint">
      <span>拖放组件到这里</span>
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
  cursor: grab;
  --edge-shadow: none;
  box-shadow: var(--edge-shadow);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
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

.type-badge {
  position: absolute;
  bottom: -8px;
  right: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  background: var(--bg-elevated);
  border: 2px solid var(--accent-primary);
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  color: var(--accent-primary);
  z-index: 1;
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

/* 空状态提示 - 绝对定位，不影响布局 */
.empty-hint {
  position: absolute;
  inset: 6px;
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
