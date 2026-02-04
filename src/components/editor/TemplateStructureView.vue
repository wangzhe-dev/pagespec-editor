<script setup lang="ts">
import { usePagesStore } from '@/app/store';
import { createBlockNode } from '@/domain/registry';
import type { LayoutNode } from '@/domain/schema';
import { computed, watch } from 'vue';
import TemplateStructureNode from './TemplateStructureNode.vue';

const pagesStore = usePagesStore();

const activePage = computed(() => pagesStore.activePage);

// 获取根容器（第一个子节点）
const rootContainer = computed(() => {
  const page = activePage.value;
  if (!page) return null;
  const root = page.root as LayoutNode;
  if (root.children?.length > 0) {
    return root.children[0] as LayoutNode;
  }
  return null;
});

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

watch(activePage, (page) => {
  if (!page) return;
  ensureDefaultStructure();
}, { immediate: true });
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
      <TemplateStructureNode
        v-if="rootContainer"
        :node="rootContainer"
        :depth="0"
        :show-card="false"
      />
    </div>
  </div>
</template>

<style scoped>
.structure-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.structure-canvas {
  flex: 1;
  overflow: auto;
  padding: 16px 20px 32px;
  display: flex;
  flex-direction: column;
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
