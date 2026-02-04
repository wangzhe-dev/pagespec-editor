<script setup lang="ts">
/**
 * GridCellItem - 栅格单元格组件
 */
import { useUIStore } from '@/app/store';
import { canAddChild } from '@/domain/registry';
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

// 拖拽验证
function moveBlock(evt: any) {
  const dragged = evt.draggedContext?.element;
  const childType = dragged?.kind === 'palette-block'
    ? dragged.blockType
    : dragged?.type;

  if (!childType) return false;
  // GridCell 内不允许嵌套 GridCell
  if (childType === 'GridCell') return false;
  return canAddChild('GridCell', childType);
}

function onAddBlock(evt: any) {
  const list = childrenList.value;
  const added = list[evt.newIndex];
  if (added?.id) {
    uiStore.selectNode(added.id);
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
      :group="{ name: 'blocks', pull: true, put: true }"
      :animation="150"
      ghost-class="drag-ghost"
      handle=".drag-handle"
      :move="moveBlock"
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
      <template #footer>
        <div v-if="childrenList.length === 0" class="drop-zone" />
      </template>
    </Draggable>
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
  cursor: pointer;
  transition: border-color 0.15s;
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

.grid-cell {
  cursor: grab;
}

.grid-cell:active {
  cursor: grabbing;
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
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

.drop-zone {
  flex: 1;
  min-height: 100%;
}

.drag-ghost {
  opacity: 0.6;
}
</style>
