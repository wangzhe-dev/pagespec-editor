<script setup lang="ts">
import { usePagesStore, useUIStore } from '@/app/store';
import {
  createBlockDragGroup,
  createMoveValidator,
} from '@/composables/useDragDrop';
import { createBlockNode } from '@/domain/registry';
import type { LayoutNode } from '@/domain/schema';
import { computed, watchEffect } from 'vue';
import Draggable from 'vuedraggable';
import TemplateStructureNode from './TemplateStructureNode.vue';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

const activePage = computed(() => pagesStore.activePage);

// 获取 PageRoot 节点
const pageRoot = computed(() => {
  const page = activePage.value;
  if (!page) return null;
  return page.root as LayoutNode;
});

// 获取根级子节点列表（可拖拽排序）
const rootChildren = computed<LayoutNode[]>(() => {
  const root = pageRoot.value;
  if (!root) return [];
  if (!Array.isArray(root.children)) {
    (root as any).children = [];
  }
  return root.children as LayoutNode[];
});

// 拖拽组配置
const blockDragGroup = computed(() => createBlockDragGroup());

// 拖拽验证函数 - 根级别允许所有容器组件
const moveValidator = computed(() => {
  if (!pageRoot.value) return () => false;
  return createMoveValidator({
    containerNode: pageRoot.value,
    containerType: 'PageRoot',
    childrenList: rootChildren.value,
  });
});

// 添加新节点后选中
function onAddBlock(evt: any) {
  const list = rootChildren.value;
  const added = list[evt.newIndex];
  if (added?.id) {
    requestAnimationFrame(() => {
      uiStore.selectNode(added.id);
    });
  }
}

// 确保有默认的根容器结构
function ensureDefaultStructure() {
  const page = activePage.value;
  if (!page) return;
  const root = page.root as LayoutNode;

  // 如果已有子节点，不重复创建
  if (root.children?.length > 0) return;

  // 创建默认结构: Grid -> [GridCell, GridCell]
  const grid = createBlockNode('Grid', {
    label: '栅格布局',
  }) as LayoutNode;

  root.children = [grid];
  page.updatedAt = Date.now();
}

watchEffect(() => {
  if (!activePage.value) return;
  ensureDefaultStructure();
});
</script>

<template>
  <div class="structure-view">
    <div v-if="!activePage" class="empty-state">
      <div class="empty-state-content">
        <div class="empty-icon">🧩</div>
        <h3>选择一个模板开始</h3>
        <p>左侧模板库选择或拖拽组件</p>
      </div>
    </div>

    <div v-else class="structure-canvas">
      <!-- 根级拖拽区域 - 渲染 PageRoot 的所有子节点 -->
      <Draggable
        :list="rootChildren"
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
        class="root-drop-zone"
      >
        <template #item="{ element }">
          <TemplateStructureNode
            :node="element"
            :depth="0"
            :show-card="true"
          />
        </template>
        <!-- <template #footer>
          <div class="drop-slot" :class="{ empty: rootChildren.length === 0 }">
            <Plus :size="14" />
            <span>拖拽组件到此处添加新区块</span>
          </div>
        </template> -->
      </Draggable>
    </div>
  </div>
</template>

<style scoped>
.structure-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.structure-canvas {
  flex: 1;
  overflow: auto;
  padding: 16px 20px 32px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.root-drop-zone {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 200px;
}

.drop-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  border-radius: 10px;
  border: 2px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: 13px;
  transition: all 0.2s;
  background: var(--bg-subtle);
}

.drop-slot:hover {
  border-color: var(--accent-primary);
  background: var(--accent-subtle);
  color: var(--accent-primary);
}

.drop-slot.empty {
  flex: 1;
  min-height: 200px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-content {
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-state-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.empty-state-content p {
  font-size: 13px;
}
</style>
