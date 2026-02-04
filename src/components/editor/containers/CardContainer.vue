<script setup lang="ts">
/**
 * CardContainer - 卡片容器组件
 * 简洁的加粗边框盒子，支持拖拽和嵌套
 */
import { useUIStore } from '@/app/store';
import { canAddChild } from '@/domain/registry';
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

// 拖拽验证
function moveBlock(evt: any) {
  const dragged = evt.draggedContext?.element;
  const childType = dragged?.kind === 'palette-block'
    ? dragged.blockType
    : dragged?.type;

  if (!childType) return false;
  return canAddChild(props.node.type, childType);
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
      :group="{ name: 'blocks', pull: true, put: true }"
      :animation="150"
      ghost-class="drag-ghost"
      handle=".drag-handle"
      :move="moveBlock"
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
      <template #footer>
        <div v-if="childrenList.length === 0" class="drop-zone" />
      </template>
    </Draggable>
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
  transition: border-color 0.15s, box-shadow 0.15s;
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
  min-height: 0;
  overflow-y: auto;
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

.drop-zone {
  flex: 1;
  min-height: 100%;
}

.drag-ghost {
  opacity: 0.6;
}
</style>
