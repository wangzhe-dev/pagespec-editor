<script setup lang="ts">
import { usePagesStore, useUIStore } from '@/app/store';
import {
  createBlockDragGroup,
  createMoveValidator,
} from '@/composables/useDragDrop';
import { createBlockNode } from '@/domain/registry';
import type { GridCell, GridNode, LayoutNode, PageSpec } from '@/domain/schema';
import { computed, watchEffect } from 'vue';
import Draggable from 'vuedraggable';
import TemplateStructureNode from './TemplateStructureNode.vue';
import GridContainer from './containers/GridContainer.vue';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

const activePage = computed(() => pagesStore.activePage);
const pageRoot = computed(() => activePage.value?.root as LayoutNode | null);

const rootRows = computed<LayoutNode[]>(() => {
  const root = pageRoot.value;
  if (!root) return [];
  if (!Array.isArray(root.children)) {
    (root as any).children = [];
  }
  return root.children as LayoutNode[];
});

const blockDragGroup = computed(() => createBlockDragGroup());

const moveValidator = computed(() => {
  if (!pageRoot.value) return () => false;
  return createMoveValidator({
    containerNode: pageRoot.value,
    containerType: 'PageRoot',
    childrenList: rootRows.value,
    allowedChildTypes: ['Grid'],
  });
});

let isNormalizing = false;
function normalizeRootRows(page: PageSpec) {
  if (isNormalizing) return;
  isNormalizing = true;

  try {
    const root = page.root as LayoutNode;
    if (!Array.isArray(root.children)) {
      (root as any).children = [];
    }

    const children = root.children as LayoutNode[];
    if (children.length === 0) {
      const grid = createBlockNode('Grid', { label: '主布局' }) as GridNode;
      root.children = [grid];
      page.updatedAt = Date.now();
      return;
    }

    let changed = false;
    const normalized: LayoutNode[] = [];

    children.forEach((node) => {
      if (node.type === 'Grid') {
        normalized.push(node);
        return;
      }

      changed = true;
      const cell = createBlockNode('GridCell', {
        label: node.label ? `${node.label} 列` : '列',
        children: [],
      }) as GridCell;
      cell.children = [node];

      const row = createBlockNode('Grid', {
        label: node.label ? `${node.label} 行` : '行',
        children: [],
      }) as GridNode;
      row.children = [cell];

      normalized.push(row);
    });

    if (changed) {
      root.children = normalized;
      page.updatedAt = Date.now();
    }
  } finally {
    isNormalizing = false;
  }
}

watchEffect(() => {
  const page = activePage.value;
  if (!page) return;
  normalizeRootRows(page);
});

function onAddRow(evt: any) {
  const list = rootRows.value;
  const added = list[evt.newIndex];
  if (added?.id) {
    requestAnimationFrame(() => {
      uiStore.selectNode(added.id);
    });
  }
}
</script>

<template>
  <div class="grid-layout-view">
    <div v-if="!activePage" class="empty-state">
      <div class="empty-state-content">
        <div class="empty-icon">🧩</div>
        <h3>选择一个页面开始布局</h3>
        <p>从左侧拖拽 Grid（Row）或组件到画布</p>
      </div>
    </div>

    <div v-else class="layout-canvas">
      <Draggable
        :list="rootRows"
        item-key="id"
        :group="blockDragGroup"
        :animation="200"
        :fallback-on-body="true"
        :swap-threshold="0.6"
        :filter="'.grid-canvas, .row-actions'"
        :prevent-on-filter="false"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-dragging"
        :move="moveValidator"
        @add="onAddRow"
        class="root-rows"
      >
        <template #item="{ element }">
          <GridContainer
            v-if="element.type === 'Grid'"
            :node="(element as GridNode)"
            :depth="0"
          >
            <template #child="{ child, depth: childDepth }">
              <TemplateStructureNode
                :node="child"
                :depth="childDepth"
              />
            </template>
          </GridContainer>

          <TemplateStructureNode
            v-else
            :node="element"
            :depth="0"
          />
        </template>

        <template #footer>
          <div class="root-drop-slot" :class="{ empty: rootRows.length === 0 }">
            <span>拖拽 Grid 添加新的 Row</span>
          </div>
        </template>
      </Draggable>
    </div>
  </div>
</template>

<style scoped>
.grid-layout-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.layout-canvas {
  flex: 1;
  overflow: auto;
  padding: 16px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  background-image:
    linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px
    );
  background-size: 24px 24px;
}

.root-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 200px;
}

.root-drop-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 10px;
  border: 2px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: 12px;
  transition: all 0.2s;
  background: var(--bg-subtle);
}

.root-drop-slot:hover {
  border-color: var(--accent-primary);
  background: var(--accent-subtle);
  color: var(--accent-primary);
}

.root-drop-slot.empty {
  flex: 1;
  min-height: 160px;
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
