<script setup lang="ts">
/**
 * GridCellItem - 栅格单元格组件
 */
import { useUIStore } from '@/app/store';
import {
  createBlockDragGroup,
  createMoveValidator,
} from '@/composables/useDragDrop';
import type { GridCell, LayoutNode } from '@/domain/schema';
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';

const props = defineProps<{
  cell: GridCell;
  depth: number;
}>();

const uiStore = useUIStore();

const isSelected = computed(() => uiStore.selectedNodeId === props.cell.id);
const isHovered = computed(() => uiStore.hoveredNodeId === props.cell.id);
const showActions = computed(() => isSelected.value || isHovered.value);

// 单元格样式（支持 CSS Grid 跨行跨列）
const cellStyle = computed(() => {
  const { colSpan, rowSpan, justifySelf, alignSelf, padding } = props.cell;
  return {
    gridColumn: colSpan && colSpan > 1 ? `span ${colSpan}` : undefined,
    gridRow: rowSpan && rowSpan > 1 ? `span ${rowSpan}` : undefined,
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
    class="grid-cell drag-handle"
    :class="{ selected: isSelected, hovered: isHovered }"
    :style="cellStyle"
    @click.stop="uiStore.selectNode(cell.id)"
    @mouseenter.stop="uiStore.hoverNode(cell.id)"
    @mouseleave.stop="uiStore.hoverNode(null)"
  >
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
  min-height: 80px;
  cursor: grab;
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
  box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
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
