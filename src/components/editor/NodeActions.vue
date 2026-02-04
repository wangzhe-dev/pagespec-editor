<script setup lang="ts">
/**
 * NodeActions - 节点操作按钮组件
 * 悬停时显示复制和删除按钮
 */
import { usePagesStore, useUIStore } from '@/app/store';
import type { LayoutNode } from '@/domain/schema';
import { Copy, Trash2 } from 'lucide-vue-next';
import { nanoid } from 'nanoid';

const props = defineProps<{
  node: LayoutNode;
  show: boolean;
}>();

const pagesStore = usePagesStore();
const uiStore = useUIStore();

// 复制节点
function duplicateNode() {
  const page = pagesStore.activePage;
  if (!page) return;

  // 深拷贝节点
  const cloned = JSON.parse(JSON.stringify(props.node));
  // 重新生成唯一 ID
  function regenerateIds(node: any) {
    node.id = nanoid(8);
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(regenerateIds);
    }
  }
  regenerateIds(cloned);
  cloned.label = (cloned.label || cloned.type) + ' 副本';

  // 找到父节点并插入
  pagesStore.insertAfterNode(page.id, props.node.id, cloned);
  uiStore.selectNode(cloned.id);
}

// 删除节点
function deleteNode() {
  const page = pagesStore.activePage;
  if (!page) return;
  pagesStore.removeNode(page.id, props.node.id);
  uiStore.selectNode(null);
}
</script>

<template>
  <div v-if="show" class="node-actions">
    <button class="action-btn" @click.stop="duplicateNode" title="复制">
      <Copy :size="12" />
    </button>
    <button class="action-btn delete-btn" @click.stop="deleteNode" title="删除">
      <Trash2 :size="12" />
    </button>
  </div>
</template>

<style scoped>
.node-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.action-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: #ef4444;
}
</style>
