<script setup lang="ts">
/**
 * GridContainer - 栅格容器组件
 * 用于在编辑器中可视化 Grid 布局结构
 */
import { useUIStore } from '@/app/store';
import type { GridCell, GridNode } from '@/domain/schema';
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';
import GridCellItem from './GridCellItem.vue';

const props = defineProps<{
  node: GridNode;
  depth: number;
}>();

const uiStore = useUIStore();

const isSelected = computed(() => uiStore.selectedNodeId === props.node.id);
const isHovered = computed(() => uiStore.hoveredNodeId === props.node.id);
const showActions = computed(() => isSelected.value || isHovered.value);

// 获取子节点列表
const cellList = computed<GridCell[]>(() => {
  if (!Array.isArray(props.node.children)) {
    (props.node as any).children = [];
  }
  return props.node.children as GridCell[];
});

// 计算 Grid 样式（使用真正的 CSS Grid）
const gridStyle = computed(() => {
  const { gap, columns, rows } = props.node;

  // 解析间距
  let gapValue = '12px';
  if (typeof gap === 'number') {
    gapValue = `${gap}px`;
  } else if (gap && typeof gap === 'object') {
    gapValue = `${gap.row}px ${gap.col}px`;
  }

  // 解析列模板
  let gridTemplateColumns = 'repeat(2, 1fr)'; // 默认 2 列
  if (columns) {
    if (typeof columns === 'number') {
      gridTemplateColumns = `repeat(${columns}, 1fr)`;
    } else if (typeof columns === 'string') {
      // 如果是纯数字字符串，转换为 repeat
      const num = parseInt(columns, 10);
      if (!isNaN(num) && String(num) === columns.trim()) {
        gridTemplateColumns = `repeat(${num}, 1fr)`;
      } else {
        // 自定义模板如 "1fr 2fr 1fr"
        gridTemplateColumns = columns;
      }
    }
  }

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
    gridAutoRows: 'minmax(140px, auto)',
    gap: gapValue,
    alignItems: 'stretch',
  };
});

// 拖拽验证 - 只允许 GridCell
function moveBlock(evt: any) {
  const dragged = evt.draggedContext?.element;
  const childType = dragged?.kind === 'palette-block'
    ? dragged.blockType
    : dragged?.type;

  if (childType && childType !== 'GridCell') {
    return false;
  }

  return true;
}

function onAddCell(evt: any) {
  const list = cellList.value;
  const added = list[evt.newIndex];
  if (added?.id) {
    uiStore.selectNode(added.id);
  }
}
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
      :group="{ name: 'grid-cells', pull: true, put: true }"
      :animation="150"
      ghost-class="drag-ghost"
      handle=".drag-handle"
      :move="moveBlock"
      @add="onAddCell"
      class="grid-canvas"
      :style="gridStyle"
    >
      <template #item="{ element }">
        <GridCellItem
          :cell="element"
          :depth="depth + 1"
        >
          <template #child="{ child, depth: childDepth }">
            <slot name="child" :child="child" :depth="childDepth" />
          </template>
        </GridCellItem>
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
