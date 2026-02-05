<script setup lang="ts">
import { usePagesStore, useUIStore } from '@/app/store';
import {
  createBlockDragGroup,
  createFieldDragGroup,
  createMoveValidator
} from '@/composables/useDragDrop';
import { createBlockNode, getBlockMeta } from '@/domain/registry';
import type { CardNode, FormNode, GridCell, GridNode, LayoutNode, TabsNode } from '@/domain/schema';
import { Copy, GripVertical, Plus, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import Draggable from 'vuedraggable';
import { CardContainer, GridCellItem, GridContainer, TabsContainer } from './containers';

const props = withDefaults(defineProps<{
  node: LayoutNode;
  depth: number;
  showCard?: boolean;
}>(), {
  showCard: true,
});

const uiStore = useUIStore();
const pagesStore = usePagesStore();

defineOptions({ name: 'TemplateStructureNode' });

// 悬停状态
const isHovered = ref(false);

const isRoot = computed(() => props.node.type === 'PageRoot');
const meta = computed(() => getBlockMeta(props.node.type));
const isSelected = computed(() => uiStore.selectedNodeId === props.node.id);
const allowChildren = computed(() => meta.value?.allowChildren ?? false);
const isForm = computed(() => props.node.type === 'Form');

// 特殊容器类型判断
const isGrid = computed(() => props.node.type === 'Grid');
const isGridCell = computed(() => props.node.type === 'GridCell');
const isCard = computed(() => props.node.type === 'Card');
const isTabs = computed(() => props.node.type === 'Tabs');
const isTab = computed(() => props.node.type === 'Tab');
const isSpecialContainer = computed(() => isGrid.value || isCard.value || isTabs.value || isGridCell.value || isTab.value);

const childrenList = computed<LayoutNode[]>(() => {
  if (!allowChildren.value) return [];
  if (!('children' in props.node) || !Array.isArray(props.node.children)) {
    (props.node as any).children = [];
  }
  return props.node.children as LayoutNode[];
});

const fieldList = computed(() => {
  if (!isForm.value) return [];
  const form = props.node as FormNode;
  if (!Array.isArray(form.fields)) form.fields = [];
  return form.fields;
});

// 拖拽组配置
const blockDragGroup = computed(() => createBlockDragGroup());
const fieldDragGroup = computed(() => createFieldDragGroup());

// 拖拽验证函数
const moveBlockValidator = computed(() => {
  return createMoveValidator({
    containerNode: props.node,
    containerType: props.node.type,
    maxChildren: meta.value?.maxChildren,
    childrenList: childrenList.value,
  });
});

function onAddBlock(evt: any) {
  const list = childrenList.value;
  const added = list[evt.newIndex];
  if (added?.id) {
    // 延迟选中，确保 DOM 更新完成
    requestAnimationFrame(() => {
      uiStore.selectNode(added.id);
    });
  }
}

function onAddField(evt: any) {
  const formNode = props.node as FormNode;
  const list = formNode.fields || [];
  const added = list[evt.newIndex];
  if (added) {
    uiStore.selectNode(formNode.id);
  }
}

const summaryText = computed(() => {
  if (props.node.type === 'Table') {
    const cols = (props.node as any).columns?.length || 0;
    const filters = (props.node as any).filters?.length || 0;
    return `列 ${cols} / 筛选 ${filters}`;
  }
  if (props.node.type === 'Form') {
    const fields = (props.node as any).fields?.length || 0;
    return `字段 ${fields}`;
  }
  if (props.node.type === 'Tree') {
    return '树组件';
  }
  if (props.node.type === 'Tabs') {
    return `Tab ${childrenList.value.length}`;
  }
  if (props.node.type === 'Grid') {
    const cols = (props.node as any).columns || 3;
    const cells = (props.node as any).children?.length || 0;
    return `${cols} 列 / ${cells} 单元格`;
  }
  if (props.node.type === 'Card') {
    const children = (props.node as any).children?.length || 0;
    return children > 0 ? `${children} 个子组件` : '空卡片';
  }
  return meta.value?.description || '';
});

// 复制节点
function duplicateNode() {
  const page = pagesStore.activePage;
  if (!page) return;

  // 深拷贝节点
  const cloned = JSON.parse(JSON.stringify(props.node));
  // 重新生成 ID
  function regenerateIds(node: any) {
    node.id = createBlockNode(node.type).id;
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
  <div class="structure-node" :class="{ selected: isSelected && showCard }">
    <!-- 特殊容器: Grid -->
    <GridContainer
      v-if="isGrid"
      :node="(node as GridNode)"
      :depth="depth"
    >
      <template #child="{ child, depth: childDepth }">
        <TemplateStructureNode
          :node="child"
          :depth="childDepth"
        />
      </template>
    </GridContainer>

    <!-- 特殊容器: Card -->
    <CardContainer
      v-else-if="isCard"
      :node="(node as CardNode)"
      :depth="depth"
    >
      <template #child="{ child, depth: childDepth }">
        <TemplateStructureNode
          :node="child"
          :depth="childDepth"
        />
      </template>
    </CardContainer>

    <!-- 特殊容器: Tabs -->
    <TabsContainer
      v-else-if="isTabs"
      :node="(node as TabsNode)"
      :depth="depth"
    >
      <template #child="{ child, depth: childDepth }">
        <TemplateStructureNode
          :node="child"
          :depth="childDepth"
        />
      </template>
    </TabsContainer>

    <!-- 特殊容器: GridCell（独立模式） -->
    <GridCellItem
      v-else-if="isGridCell"
      :cell="(node as GridCell)"
      :depth="depth"
      :standalone="true"
    >
      <template #child="{ child, depth: childDepth }">
        <TemplateStructureNode
          :node="child"
          :depth="childDepth"
        />
      </template>
    </GridCellItem>

    <!-- Tab 由父组件 TabsContainer 处理 -->
    <template v-else-if="isTab">
      <!-- 由 TabsContainer 内部渲染 -->
    </template>

    <!-- 通用节点卡片 -->
    <template v-else>
      <div
        v-if="showCard"
        class="node-card"
        :class="{ root: isRoot, hovered: isHovered }"
        @click.stop="uiStore.selectNode(node.id)"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <div class="node-header">
          <GripVertical v-if="!isRoot" :size="14" class="drag-handle" />
          <div class="node-title">{{ node.label || meta?.label || node.type }}</div>
          <div class="node-type">{{ node.type }}</div>

          <!-- 悬停操作按钮 -->
          <div v-if="isHovered && !isRoot" class="node-actions">
            <button class="action-btn" @click.stop="duplicateNode" title="复制">
              <Copy :size="12" />
            </button>
            <button class="action-btn delete-btn" @click.stop="deleteNode" title="删除">
              <Trash2 :size="12" />
            </button>
          </div>
        </div>
        <div class="node-summary">{{ summaryText }}</div>
      </div>

      <Draggable
        v-if="allowChildren && !isSpecialContainer"
        :list="childrenList"
        item-key="id"
        :group="blockDragGroup"
        :animation="200"
        :fallback-on-body="true"
        :swap-threshold="0.5"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-dragging"
        :move="moveBlockValidator"
        @add="onAddBlock"
        class="node-children layout-column"
        :class="{ canvas: !showCard }"
      >
        <template #item="{ element }">
          <TemplateStructureNode
            :node="element"
            :depth="depth + 1"
          />
        </template>
        <template #footer>
          <div class="drop-slot" :class="{ empty: childrenList.length === 0 }">
            <Plus :size="12" />
            <span>拖拽组件到此处</span>
          </div>
        </template>
      </Draggable>

      <Draggable
        v-else-if="isForm"
        :list="fieldList"
        item-key="key"
        :group="fieldDragGroup"
        :animation="200"
        :fallback-on-body="true"
        ghost-class="drag-ghost"
        @add="onAddField"
        class="form-fields"
      >
        <template #item="{ element }">
          <div class="form-field-chip">
            <span>{{ element.label }}</span>
            <em>{{ element.type }}</em>
          </div>
        </template>
        <template #footer>
          <div class="drop-slot" :class="{ empty: fieldList.length === 0 }">
            <Plus :size="12" />
            <span>拖拽字段到此处</span>
          </div>
        </template>
      </Draggable>
    </template>
  </div>
</template>

<style scoped>
.structure-node {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-card {
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  border-radius: 10px;
  padding: 10px 12px;
  transition: border 0.15s, box-shadow 0.15s, background 0.15s;
  cursor: pointer;
}

.node-card.root {
  background: var(--bg-subtle);
  border-style: dashed;
}

.structure-node.selected > .node-card {
  border-color: var(--accent-primary);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-handle {
  color: var(--text-muted);
}

.node-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.node-type {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-subtle);
  border-radius: 999px;
}

.node-summary {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.node-children {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 12px;
  border: 1px dashed var(--border-subtle);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.02);
  min-height: 120px;
}

.node-children.canvas {
  padding: 16px;
  min-height: 320px;
  background: var(--bg-subtle);
  border-style: solid;
}

.node-children.layout-column {
  flex-direction: column;
}


.drop-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: 11px;
  transition: all 0.2s;
}

.drop-slot:hover {
  border-color: var(--accent-primary);
  background: var(--accent-subtle);
  color: var(--accent-primary);
}

.drop-slot.empty {
  flex: 1;
  width: 100%;
  min-height: 100px;
}

.form-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border: 1px dashed var(--border-subtle);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.02);
}

.form-field-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  font-size: 11px;
  color: var(--text-secondary);
}

.form-field-chip em {
  font-style: normal;
  color: var(--text-muted);
}

.drag-ghost {
  opacity: 0.6;
}

/* 悬停操作按钮 */
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

.node-card.hovered {
  border-color: var(--border-strong);
}
</style>
