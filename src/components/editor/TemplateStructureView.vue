<script setup lang="ts">
import { computed, watch } from 'vue';
import { usePagesStore } from '@/app/store';
import { createBlockNode } from '@/domain/registry';
import type { LayoutNode, StackDirection } from '@/domain/schema';
import TemplateStructureNode from './TemplateStructureNode.vue';

const pagesStore = usePagesStore();

const activePage = computed(() => pagesStore.activePage);

const rootContainer = computed(() => {
  const page = activePage.value;
  if (!page) return null;
  const root = page.root as LayoutNode;
  if (root.children?.length === 1 && root.children[0].type === 'Stack') {
    return root.children[0] as LayoutNode;
  }
  return null;
});

const layoutDirection = computed<StackDirection>(() => {
  const container = rootContainer.value as any;
  if (container && container.direction) return container.direction;
  return 'column';
});

function ensureRootContainer(direction?: StackDirection) {
  const page = activePage.value;
  if (!page) return null;
  const root = page.root as LayoutNode;

  if (root.children?.length === 1 && root.children[0].type === 'Stack') {
    const existing = root.children[0] as LayoutNode;
    if (direction && (existing as any).direction !== direction) {
      pagesStore.updateNode(page.id, existing.id, { direction });
    }
    return existing;
  }

  const oldChildren = Array.isArray(root.children) ? root.children : [];
  const stack = createBlockNode('Stack', {
    direction: direction ?? 'column',
    gap: 12,
    children: oldChildren,
    label: '布局容器',
  }) as LayoutNode;

  root.children = [stack];
  page.updatedAt = Date.now();
  return stack;
}

watch(activePage, (page) => {
  if (!page) return;
  ensureRootContainer();
}, { immediate: true });

function setLayout(direction: StackDirection) {
  ensureRootContainer(direction);
}

</script>

<template>
  <div class="structure-view">
    <div v-if="!activePage" class="empty-state">
      <div class="empty-state-content">
        <div class="empty-icon">🧩</div>
        <h3>选择一个模板开始</h3>
        <p>左侧模板库点击即可生成结构</p>
      </div>
    </div>

    <div v-else class="structure-canvas">
      <div class="structure-toolbar">
        <span>布局方向</span>
        <button
          :class="{ active: layoutDirection === 'row' }"
          @click="setLayout('row')"
        >
          Row
        </button>
        <button
          :class="{ active: layoutDirection === 'column' }"
          @click="setLayout('column')"
        >
          Col
        </button>
      </div>

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
  gap: 16px;
}

.structure-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.structure-toolbar button {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.structure-toolbar button.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
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
