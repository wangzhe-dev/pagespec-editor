<script setup lang="ts">
/**
 * GridCellContainer - 栅格单元格容器组件（独立版）
 * 支持手动拖拽调整 colSpan/rowSpan
 */
import { useUIStore } from '@/app/store';
import {
    createBlockDragGroup,
    createMoveValidator,
} from '@/composables/useDragDrop';
import type { GridCell, LayoutNode } from '@/domain/schema';
import { computed, ref } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';

type ResizeEdge = 'left' | 'right' | 'top' | 'bottom';

const props = defineProps<{
  node: GridCell;
  depth: number;
}>();

const uiStore = useUIStore();

const isSelected = computed(() => uiStore.selectedNodeId === props.node.id);
const isHovered = computed(() => uiStore.hoveredNodeId === props.node.id);
const showActions = computed(() => isSelected.value || isHovered.value);

const cellRef = ref<HTMLElement | null>(null);
const hoverEdge = ref<ResizeEdge | null>(null);
const activeResizeEdge = ref<ResizeEdge | null>(null);

// 获取子节点列表
const childrenList = computed<LayoutNode[]>(() => {
  if (!Array.isArray(props.node.children)) {
    (props.node as any).children = [];
  }
  return props.node.children as LayoutNode[];
});

// 单元格样式信息
const cellInfo = computed(() => {
  const { width, height } = props.node;
  if (width || height) {
    const w = width ? `${width}px` : 'auto';
    const h = height ? `${height}px` : 'auto';
    return `${w} × ${h}`;
  }
  return 'auto';
});

// 单元格尺寸样式
const cellSizeStyle = computed(() => {
  const { width, height } = props.node;
  return {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  };
});

// 边缘高亮
const edgeHighlight = computed(() => activeResizeEdge.value ?? hoverEdge.value);

// 拖拽组配置
const blockDragGroup = computed(() => createBlockDragGroup());

// 拖拽验证 - 允许嵌套 GridCell
const moveValidator = computed(() => {
  return createMoveValidator({
    containerNode: props.node,
    containerType: 'GridCell',
    childrenList: childrenList.value,
  });
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

function setHover(edge: ResizeEdge) {
  if (activeResizeEdge.value) return;
  hoverEdge.value = edge;
}

function clearHover(edge: ResizeEdge) {
  if (activeResizeEdge.value) return;
  if (hoverEdge.value === edge) {
    hoverEdge.value = null;
  }
}

// Resize 逻辑 - 直接修改 width/height 像素值
function onResizeStart(edge: ResizeEdge, event: PointerEvent) {
  event.stopPropagation();
  event.preventDefault();

  const cellEl = cellRef.value;
  if (!cellEl) return;

  activeResizeEdge.value = edge;

  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = cellEl.offsetWidth;
  const startHeight = cellEl.offsetHeight;

  const onMove = (e: PointerEvent) => {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (edge === 'right') {
      props.node.width = Math.max(60, startWidth + deltaX);
    } else if (edge === 'left') {
      props.node.width = Math.max(60, startWidth - deltaX);
    }

    if (edge === 'bottom') {
      props.node.height = Math.max(40, startHeight + deltaY);
    } else if (edge === 'top') {
      props.node.height = Math.max(40, startHeight - deltaY);
    }
  };

  const onUp = () => {
    activeResizeEdge.value = null;
    hoverEdge.value = null;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}
</script>

<template>
  <div
    ref="cellRef"
    class="grid-cell-container drag-handle"
    :class="[
      { selected: isSelected, hovered: isHovered },
      edgeHighlight && `edge-${edgeHighlight}`
    ]"
    :style="cellSizeStyle"
    @click.stop="uiStore.selectNode(node.id)"
    @mouseenter.stop="uiStore.hoverNode(node.id)"
    @mouseleave.stop="uiStore.hoverNode(null)"
  >
    <!-- Resize handles -->
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

    <!-- 类型标签 -->
    <div v-if="showActions" class="type-badge">
      <span>Col</span>
      <span class="cell-info">{{ cellInfo }}</span>
      <NodeActions :node="node" :show="showActions" />
    </div>

    <!-- Row 容器 - 高度等于 cell 自身高度 -->
    <div class="cell-row">
      <!-- 内容区域 -->
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
      <!-- 空状态提示 -->
      <div v-if="childrenList.length === 0" class="empty-hint">
        <span>拖放组件到这里</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-cell-container {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--border-default, #d0d0d0);
  background: var(--bg-elevated);
  border-radius: 6px;
  padding: 8px;
  min-height: 60px;
  --edge-shadow: none;
  box-shadow: var(--edge-shadow);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  cursor: grab;
}

.grid-cell-container:active {
  cursor: grabbing;
}

.grid-cell-container.hovered {
  border-color: var(--border-strong, #999);
}

.grid-cell-container.selected {
  border-color: var(--accent-primary);
  box-shadow: var(--edge-shadow), 0 0 0 2px rgba(var(--accent-primary-rgb), 0.2);
}

/* 边缘高亮 */
.grid-cell-container.edge-left {
  --edge-shadow: inset 3px 0 0 var(--accent-primary);
}

.grid-cell-container.edge-right {
  --edge-shadow: inset -3px 0 0 var(--accent-primary);
}

.grid-cell-container.edge-top {
  --edge-shadow: inset 0 3px 0 var(--accent-primary);
}

.grid-cell-container.edge-bottom {
  --edge-shadow: inset 0 -3px 0 var(--accent-primary);
}

/* Resize handles */
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

.cell-info {
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 2px;
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
  min-height: 40px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.child-placeholder {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  background: var(--bg-elevated);
  font-size: 11px;
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
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 11px;
  pointer-events: none;
  transition: all 0.2s;
}

.grid-cell-container:hover .empty-hint,
.grid-cell-container.selected .empty-hint {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-subtle);
}
</style>
