<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePagesStore, useUIStore } from '@/app/store';
import { canAddChild, getBlockMeta } from '@/domain/registry';
import type { LayoutNode, FormField, FormNode } from '@/domain/schema';
import { GripVertical, Plus } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  node: LayoutNode;
  depth: number;
  showCard?: boolean;
}>(), {
  showCard: true,
});

const pagesStore = usePagesStore();
const uiStore = useUIStore();

defineOptions({ name: 'TemplateStructureNode' });

const isRoot = computed(() => props.node.type === 'PageRoot');
const meta = computed(() => getBlockMeta(props.node.type));
const isSelected = computed(() => uiStore.selectedNodeId === props.node.id);
const allowChildren = computed(() => meta.value?.allowChildren ?? false);
const children = computed(() => ('children' in props.node && Array.isArray(props.node.children))
  ? props.node.children
  : [],
);
const isForm = computed(() => props.node.type === 'Form');

const dragOver = ref(false);

function setDragPayload(e: DragEvent, payload: Record<string, any>) {
  if (!e.dataTransfer) return;
  const data = JSON.stringify(payload);
  e.dataTransfer.setData('application/x-pagespec', data);
  e.dataTransfer.setData('text/plain', data);
  e.dataTransfer.effectAllowed = 'move';
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

function onDragStartNode(e: DragEvent) {
  if (isRoot.value || !props.showCard) return;
  setDragPayload(e, { kind: 'node', nodeId: props.node.id });
}

function onDragOver(e: DragEvent) {
  if (!allowChildren.value && !isForm.value) return;
  e.preventDefault();
  dragOver.value = true;
}

function onDragLeave() {
  dragOver.value = false;
}

function isDescendant(root: LayoutNode, targetId: string): boolean {
  if (root.id === targetId) return true;
  if ('children' in root && Array.isArray(root.children)) {
    return root.children.some(child => isDescendant(child, targetId));
  }
  return false;
}

function addFieldToForm(fieldType: FormField['type']) {
  const activePage = pagesStore.activePage;
  if (!activePage) return;

  const formNode = props.node as FormNode;
  const fields = Array.isArray(formNode.fields) ? [...formNode.fields] : [];
  const index = fields.length + 1;
  const labelMap: Record<string, string> = {
    input: '输入框',
    select: '下拉框',
  };
  const keyBase = fieldType === 'select' ? 'select' : 'input';
  const key = `${keyBase}${index}`;

  fields.push({
    key,
    label: labelMap[fieldType] || '字段',
    type: fieldType,
    required: false,
    span: 12,
  });

  pagesStore.updateNode(activePage.id, formNode.id, { fields });
  uiStore.selectNode(formNode.id);
}

function handleDrop(e: DragEvent) {
  dragOver.value = false;
  if (!allowChildren.value && !isForm.value) return;
  e.preventDefault();

  const payload = getDragPayload(e);
  if (!payload) return;

  const activePage = pagesStore.activePage;
  if (!activePage) return;

  if (payload.kind === 'field') {
    if (!isForm.value) {
      uiStore.showToast('warning', '字段只能拖入表单块');
      return;
    }
    addFieldToForm(payload.fieldType);
    return;
  }

  if (payload.kind === 'block') {
    if (!allowChildren.value) return;
    const parentMeta = meta.value;
    if (!parentMeta) return;
    if (parentMeta.maxChildren && children.value.length >= parentMeta.maxChildren) {
      uiStore.showToast('warning', `该容器最多只能添加 ${parentMeta.maxChildren} 个子块`);
      return;
    }
    if (props.node.type === 'Tabs' && payload.blockType !== 'Tab') {
      uiStore.showToast('warning', 'Tabs 只能添加 Tab');
      return;
    }

    const newNode = pagesStore.addNode(activePage.id, props.node.id, payload.blockType, children.value.length);
    if (newNode) {
      uiStore.selectNode(newNode.id);
    }
    return;
  }

  if (payload.kind === 'node') {
    if (!allowChildren.value) return;
    const dragged = pagesStore.findNode(activePage.root as LayoutNode, payload.nodeId);
    if (!dragged) return;
    if (dragged.id === props.node.id) return;
    if (isDescendant(dragged, props.node.id)) {
      uiStore.showToast('warning', '不能把父节点拖进自己的子节点');
      return;
    }
    if (props.node.type === 'Tabs' && dragged.type !== 'Tab') {
      uiStore.showToast('warning', 'Tabs 只能添加 Tab');
      return;
    }
    if (!canAddChild(props.node.type, dragged.type)) {
      uiStore.showToast('warning', '该容器不允许放入此类型');
      return;
    }
    pagesStore.moveNode(activePage.id, dragged.id, props.node.id, children.value.length);
    uiStore.selectNode(dragged.id);
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
    return `Tab ${children.value.length}`;
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
      :class="{ root: isRoot, dragover: dragOver }"
      :draggable="!isRoot"
      @dragstart="onDragStartNode"
      @click.stop="uiStore.selectNode(node.id)"
    >
      <div class="node-header">
        <GripVertical v-if="!isRoot" :size="14" class="drag-handle" />
        <div class="node-title">{{ node.label || meta?.label || node.type }}</div>
        <div class="node-type">{{ node.type }}</div>
      </div>
      <div class="node-summary">{{ summaryText }}</div>
    </div>

    <div
      v-if="allowChildren"
      class="node-children"
      :class="[layoutClass, { canvas: !showCard }]"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="handleDrop"
    >
      <TemplateStructureNode
        v-for="child in children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
      <div class="drop-slot">
        <Plus :size="12" />
        <span>拖拽组件到此处</span>
      </div>
    </div>

    <div
      v-else-if="isForm"
      class="form-fields"
      :class="{ dragover: dragOver }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="handleDrop"
    >
      <div
        v-for="(field, index) in (node as any).fields || []"
        :key="field.key + index"
        class="form-field-chip"
      >
        <span>{{ field.label }}</span>
        <em>{{ field.type }}</em>
      </div>
      <div class="drop-slot">
        <Plus :size="12" />
        <span>拖拽字段到此处</span>
      </div>
    </div>
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

.node-card.dragover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-subtle);
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

.form-fields.dragover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-subtle);
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
</style>
