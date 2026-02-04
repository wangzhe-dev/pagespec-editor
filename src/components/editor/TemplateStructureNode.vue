<script setup lang="ts">
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import { useUIStore } from '@/app/store';
import { canAddChild, getBlockMeta } from '@/domain/registry';
import type { LayoutNode, FormNode } from '@/domain/schema';
import { GripVertical, Plus } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  node: LayoutNode;
  depth: number;
  showCard?: boolean;
}>(), {
  showCard: true,
});

const uiStore = useUIStore();

defineOptions({ name: 'TemplateStructureNode' });

const isRoot = computed(() => props.node.type === 'PageRoot');
const meta = computed(() => getBlockMeta(props.node.type));
const isSelected = computed(() => uiStore.selectedNodeId === props.node.id);
const allowChildren = computed(() => meta.value?.allowChildren ?? false);
const isForm = computed(() => props.node.type === 'Form');

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

function isDescendant(root: LayoutNode, targetId: string): boolean {
  if (root.id === targetId) return true;
  if ('children' in root && Array.isArray(root.children)) {
    return root.children.some(child => isDescendant(child, targetId));
  }
  return false;
}

function resolveDraggedType(element: any): string | null {
  if (!element || typeof element !== 'object') return null;
  if (element.kind === 'palette-block') return element.blockType;
  if (element.type) return element.type;
  return null;
}

function moveBlock(evt: any) {
  const dragged = evt.draggedContext?.element;
  const targetList = evt.relatedContext?.list as LayoutNode[] | undefined;
  const sourceList = evt.draggedContext?.list as LayoutNode[] | undefined;
  const parentMeta = meta.value;
  const childType = resolveDraggedType(dragged);

  if (!allowChildren.value || !childType || !parentMeta) return false;
  if (props.node.type === 'Tabs' && childType !== 'Tab') return false;
  if (!canAddChild(props.node.type, childType)) return false;

  if (dragged?.id && isDescendant(dragged as LayoutNode, props.node.id)) return false;

  if (parentMeta.maxChildren && targetList && sourceList !== targetList) {
    if (targetList.length >= parentMeta.maxChildren) return false;
  }

  return true;
}

function onAddBlock(evt: any) {
  const list = childrenList.value;
  const added = list[evt.newIndex];
  if (added?.id) {
    uiStore.selectNode(added.id);
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

const layoutClass = computed(() => {
  if (props.node.type === 'Split') {
    return props.node.direction === 'horizontal' ? 'layout-row' : 'layout-column';
  }
  if (props.node.type === 'Stack') {
    return props.node.direction === 'row' ? 'layout-row' : 'layout-column';
  }
  if (props.node.type === 'Tabs') return 'layout-row';
  return 'layout-column';
});

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
  if (props.node.type === 'Split') {
    return props.node.direction === 'horizontal' ? '左右分栏' : '上下分栏';
  }
  if (props.node.type === 'Stack') {
    return props.node.direction === 'row' ? '水平堆叠' : '垂直堆叠';
  }
  return meta.value?.description || '';
});
</script>

<template>
  <div class="structure-node" :class="{ selected: isSelected && showCard }">
    <div
      v-if="showCard"
      class="node-card"
      :class="{ root: isRoot }"
      @click.stop="uiStore.selectNode(node.id)"
    >
      <div class="node-header">
        <GripVertical v-if="!isRoot" :size="14" class="drag-handle" />
        <div class="node-title">{{ node.label || meta?.label || node.type }}</div>
        <div class="node-type">{{ node.type }}</div>
      </div>
      <div class="node-summary">{{ summaryText }}</div>
    </div>

    <Draggable
      v-if="allowChildren"
      :list="childrenList"
      item-key="id"
      :group="{ name: 'blocks', pull: true, put: true }"
      :animation="150"
      ghost-class="drag-ghost"
      handle=".drag-handle"
      :move="moveBlock"
      @add="onAddBlock"
      class="node-children"
      :class="[layoutClass, { canvas: !showCard }]"
    >
      <template #item="{ element }">
        <TemplateStructureNode
          :node="element"
          :depth="depth + 1"
        />
      </template>
      <template #footer>
        <div class="drop-slot">
          <Plus :size="12" />
          <span>拖拽组件到此处</span>
        </div>
      </template>
    </Draggable>

    <Draggable
      v-else-if="isForm"
      :list="fieldList"
      item-key="key"
      :group="{ name: 'fields', pull: true, put: true }"
      :animation="150"
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
        <div class="drop-slot">
          <Plus :size="12" />
          <span>拖拽字段到此处</span>
        </div>
      </template>
    </Draggable>
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
  gap: 10px;
  padding: 12px;
  border: 1px dashed var(--border-subtle);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.02);
  min-height: 80px;
}

.node-children.canvas {
  padding: 16px;
  min-height: 260px;
  background: var(--bg-subtle);
  border-style: solid;
}

.node-children.layout-column {
  flex-direction: column;
}

.node-children.layout-row {
  flex-direction: row;
}

.drop-slot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px dashed var(--border-subtle);
  color: var(--text-muted);
  font-size: 11px;
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
</style>
