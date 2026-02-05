<script setup lang="ts">
/**
 * CardContainer - 卡片容器组件
 * 简洁的加粗边框盒子，支持拖拽和嵌套
 */
import { useUIStore } from '@/app/store';
import {
    createBlockDragGroup,
    createMoveValidator,
} from '@/composables/useDragDrop';
import type { CardNode, LayoutNode } from '@/domain/schema';
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';

const props = defineProps<{
  node: CardNode;
  depth: number;
}>();

const uiStore = useUIStore();

const isSelected = computed(() => uiStore.selectedNodeId === props.node.id);
const isHovered = computed(() => uiStore.hoveredNodeId === props.node.id);
const showActions = computed(() => isSelected.value || isHovered.value);

// 获取子节点列表
const childrenList = computed<LayoutNode[]>(() => {
  if (!Array.isArray(props.node.children)) {
    (props.node as any).children = [];
  }
  return props.node.children as LayoutNode[];
});

// 拖拽组配置
const blockDragGroup = computed(() => createBlockDragGroup());

// 拖拽验证
const moveValidator = computed(() => {
  return createMoveValidator({
    containerNode: props.node,
    containerType: props.node.type,
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
    class="card-container drag-handle"
    :class="{ selected: isSelected, hovered: isHovered }"
    @click.stop="uiStore.selectNode(node.id)"
    @mouseenter.stop="uiStore.hoverNode(node.id)"
    @mouseleave.stop="uiStore.hoverNode(null)"
  >
    <!-- 右下角类型标签 -->
    <div v-if="showActions" class="type-badge">
      <span>Card</span>
      <NodeActions :node="node" :show="showActions" />
    </div>

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
      class="card-content"
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
.card-container {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--border-default, #d0d0d0);
  background: var(--bg-elevated);
  border-radius: 8px;
  padding: 8px;
  min-height: 80px;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  cursor: grab;
}

.card-container:active {
  cursor: grabbing;
}

.card-container.hovered {
  border-color: var(--border-strong, #999);
}

.card-container.selected {
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

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 60px;
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

/* 空状态提示 - 绝对定位，不影响布局 */
.empty-hint {
  position: absolute;
  inset: 8px;
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

.card-container:hover .empty-hint,
.card-container.selected .empty-hint {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-subtle);
}
</style>
