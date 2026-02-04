<script setup lang="ts">
import { computed, watch } from 'vue';
import { usePagesStore, useUIStore } from '@/app/store';
import { canAddChild, createBlockNode } from '@/domain/registry';
import type { LayoutNode, StackDirection } from '@/domain/schema';
import TemplateStructureNode from './TemplateStructureNode.vue';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

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
  const root = page.root as LayoutNode;
  if (root.children?.length && !(root.children.length === 1 && root.children[0].type === 'Stack')) {
    ensureRootContainer();
  }
}, { immediate: true });

function setLayout(direction: StackDirection) {
  ensureRootContainer(direction);
}

function getDragPayload(e: DragEvent): { kind: string; [key: string]: any } | null {
  const raw = e.dataTransfer?.getData('application/x-pagespec')
    || e.dataTransfer?.getData('text/plain');
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data && typeof data.kind === 'string') return data;
  } catch {
    return null;
  }
  return null;
}

function onRootDragOver(e: DragEvent) {
  if (!rootContainer.value) {
    e.preventDefault();
  }
}

function onRootDrop(e: DragEvent) {
  e.preventDefault();
  if (rootContainer.value) return;
  const payload = getDragPayload(e);
  if (!payload) return;

  const page = activePage.value;
  if (!page) return;

  if (payload.kind === 'field') {
    uiStore.showToast('warning', '字段只能拖入表单块');
    return;
  }

  const container = ensureRootContainer();
  if (!container) return;

  if (payload.kind === 'block') {
    if (!canAddChild(container.type, payload.blockType)) {
      uiStore.showToast('warning', '该容器不允许放入此类型');
      return;
    }
    const newNode = pagesStore.addNode(page.id, container.id, payload.blockType);
    if (newNode) {
      uiStore.selectNode(newNode.id);
    }
    return;
  }

  if (payload.kind === 'node') {
    const dragged = pagesStore.findNode(page.root as LayoutNode, payload.nodeId);
    if (!dragged) return;
    if (!canAddChild(container.type, dragged.type)) {
      uiStore.showToast('warning', '该容器不允许放入此类型');
      return;
    }
    pagesStore.moveNode(page.id, dragged.id, container.id, (container as any).children?.length || 0);
    uiStore.selectNode(dragged.id);
  }
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

      <div class="structure-dropzone" @dragover="onRootDragOver" @drop="onRootDrop">
        <TemplateStructureNode
          v-if="rootContainer"
          :node="rootContainer"
          :depth="0"
          :show-card="false"
        />
        <div v-else class="empty-drop">
          拖拽组件到这里
        </div>
      </div>
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

.structure-dropzone {
  flex: 1;
}

.empty-drop {
  border: 1px dashed var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  color: var(--text-muted);
  text-align: center;
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
