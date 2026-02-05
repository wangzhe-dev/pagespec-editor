<script setup lang="ts">
/**
 * TabsContainer - 标签页容器组件（简化版）
 * 加粗边框盒子风格，右下角类型标签
 */
import { useUIStore } from '@/app/store';
import {
    createBlockDragGroup,
    createMoveValidator,
} from '@/composables/useDragDrop';
import { createBlockNode, getBlockMeta } from '@/domain/registry';
import type { LayoutNode, TabNode, TabsNode } from '@/domain/schema';
import { Plus, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import Draggable from 'vuedraggable';
import NodeActions from '../NodeActions.vue';

const props = defineProps<{
  node: TabsNode;
  depth: number;
}>();

const uiStore = useUIStore();

const meta = computed(() => getBlockMeta(props.node.type));
const isSelected = computed(() => uiStore.selectedNodeId === props.node.id);
const isHovered = computed(() => uiStore.hoveredNodeId === props.node.id);
const showActions = computed(() => isSelected.value || isHovered.value);

// 获取 Tab 列表
const tabList = computed<TabNode[]>(() => {
  if (!Array.isArray(props.node.children)) {
    (props.node as any).children = [];
  }
  return props.node.children as TabNode[];
});

// 当前激活的 Tab key
const activeTabKey = ref<string>('');

// 初始化激活 Tab
watch(tabList, (tabs) => {
  if (tabs.length > 0 && !activeTabKey.value) {
    activeTabKey.value = props.node.defaultTab || tabs[0].tabKey;
  }
}, { immediate: true });

// 当前激活的 Tab 节点
const activeTab = computed(() =>
  tabList.value.find(t => t.tabKey === activeTabKey.value)
);

// 当前 Tab 的子节点列表
const activeTabChildren = computed<LayoutNode[]>(() => {
  if (!activeTab.value) return [];
  if (!Array.isArray(activeTab.value.children)) {
    (activeTab.value as any).children = [];
  }
  return activeTab.value.children as LayoutNode[];
});

// 切换 Tab
function switchTab(tabKey: string) {
  activeTabKey.value = tabKey;
}

// 添加新 Tab
function addTab() {
  const index = tabList.value.length + 1;
  const newTab = createBlockNode('Tab', {
    tabKey: `tab${index}`,
    title: `标签 ${index}`,
    children: [],
  }) as TabNode;
  tabList.value.push(newTab);
  activeTabKey.value = newTab.tabKey;
  uiStore.selectNode(newTab.id);
}

// 删除 Tab
function removeTab(tabKey: string, e: Event) {
  e.stopPropagation();
  const index = tabList.value.findIndex(t => t.tabKey === tabKey);
  if (index !== -1) {
    tabList.value.splice(index, 1);
    if (activeTabKey.value === tabKey && tabList.value.length > 0) {
      activeTabKey.value = tabList.value[0].tabKey;
    }
  }
}

// 拖拽组配置
const blockDragGroup = computed(() => createBlockDragGroup());

// Tab 内容拖拽验证
const moveContentValidator = computed(() => {
  if (!activeTab.value) return () => false;
  return createMoveValidator({
    containerNode: activeTab.value,
    containerType: 'Tab',
    disallowedChildTypes: ['Tab', 'Tabs'], // Tab 内不允许嵌套 Tab 或 Tabs
    childrenList: activeTabChildren.value,
  });
});

function onAddContent(evt: any) {
  if (activeTab.value) {
    const list = activeTab.value.children || [];
    const added = list[evt.newIndex];
    if (added?.id) {
      requestAnimationFrame(() => {
        uiStore.selectNode(added.id);
      });
    }
  }
}
</script>

<template>
  <div
    class="tabs-container drag-handle"
    :class="{ selected: isSelected, hovered: isHovered }"
    @click.stop="uiStore.selectNode(node.id)"
    @mouseenter.stop="uiStore.hoverNode(node.id)"
    @mouseleave.stop="uiStore.hoverNode(null)"
  >
    <!-- 标签栏 -->
    <div class="tabs-bar">
      <div
        v-for="tab in tabList"
        :key="tab.tabKey"
        class="tab-item"
        :class="{
          active: tab.tabKey === activeTabKey,
          'tab-selected': uiStore.selectedNodeId === tab.id
        }"
        @click.stop="switchTab(tab.tabKey); uiStore.selectNode(tab.id)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <button
          v-if="tab.closable !== false && tabList.length > 1"
          class="tab-close"
          @click="removeTab(tab.tabKey, $event)"
        >
          <X :size="10" />
        </button>
      </div>
      <button class="add-tab-btn" @click.stop="addTab">
        <Plus :size="12" />
      </button>
    </div>

    <!-- 当前 Tab 内容 -->
    <div class="tabs-content">
      <div v-if="!activeTab" class="empty-tabs">
        <span>暂无标签页</span>
        <button @click="addTab">添加</button>
      </div>

      <Draggable
        v-else
        :list="activeTabChildren"
        item-key="id"
        :group="blockDragGroup"
        :animation="200"
        :fallback-on-body="true"
        :swap-threshold="0.5"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-dragging"
        :move="moveContentValidator"
        @add="onAddContent"
        class="tab-panel"
      >
        <template #item="{ element }">
          <slot name="child" :child="element" :depth="depth + 1" />
        </template>
      </Draggable>
      <!-- 空状态提示 -->
      <div v-if="activeTabChildren.length === 0" class="empty-hint">
        <span>拖放组件到这里</span>
      </div>
    </div>

    <!-- 类型标签 -->
    <span class="type-badge" v-show="showActions">
      {{ meta?.label || 'Tabs' }}
    </span>

    <!-- 操作按钮 -->
    <NodeActions :node="node" :show="showActions" />
  </div>
</template>

<style scoped>
.tabs-container {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-elevated);
  cursor: grab;
  transition: border-color 0.15s;
}

.tabs-container:active {
  cursor: grabbing;
}

.tabs-container.hovered {
  border-color: var(--text-muted);
}

.tabs-container.selected {
  border-color: var(--accent-primary);
}

/* 标签栏 */
.tabs-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-item:hover {
  background: var(--bg-elevated);
}

.tab-item.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-weight: 500;
}

.tab-item.tab-selected {
  outline: 1px solid var(--accent-primary);
}

.tab-title {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  display: flex;
  padding: 2px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 2px;
}

.tab-close:hover {
  background: var(--danger-muted);
  color: var(--danger);
}

.add-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
}

.add-tab-btn:hover {
  background: var(--bg-elevated);
  color: var(--accent-primary);
}

/* Tab 内容区 */
.tabs-content {
  position: relative;
  padding: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 80px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.empty-tabs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 60px;
  color: var(--text-muted);
  font-size: 11px;
}

.empty-tabs button {
  padding: 4px 10px;
  font-size: 11px;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  cursor: pointer;
}

.empty-tabs button:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* 空状态提示 - 绝对定位，不影响布局 */
.empty-hint {
  position: absolute;
  inset: 8px;
  top: auto;
  bottom: 8px;
  height: 60px;
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

.tabs-container:hover .empty-hint,
.tabs-container.selected .empty-hint {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-subtle);
}

/* 类型标签 */
.type-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 6px;
  font-size: 9px;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border-radius: 3px;
  pointer-events: none;
}

/* 拖拽样式 */
.drag-ghost {
  opacity: 0.4;
}
</style>
