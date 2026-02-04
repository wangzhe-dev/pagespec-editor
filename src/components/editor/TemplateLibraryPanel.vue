<script setup lang="ts">
import { computed } from 'vue';
import { nanoid } from 'nanoid';
import Draggable from 'vuedraggable';
import { usePagesStore, useUIStore } from '@/app/store';
import { createBlockNode } from '@/domain/registry';
import type { FormField, LayoutNode } from '@/domain/schema';
import { FileText, Layers, ChevronRight } from 'lucide-vue-next';

type TemplateId = 'filter-table';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

const templates = [
  {
    id: 'filter-table' as TemplateId,
    name: '上筛下表',
    description: '筛选表单 + 结果表格',
  },
];

type PaletteBlock = {
  id: string;
  label: string;
  blockType: 'Stack' | 'Card';
  kind: 'palette-block';
};

type PaletteField = {
  id: string;
  label: string;
  fieldType: 'input' | 'select';
  kind: 'palette-field';
};

const containerPalette: PaletteBlock[] = [
  { id: 'stack', label: '行列容器', blockType: 'Stack', kind: 'palette-block' },
  { id: 'card', label: '卡片容器', blockType: 'Card', kind: 'palette-block' },
];

const fieldPalette: PaletteField[] = [
  { id: 'input', label: '输入框', fieldType: 'input', kind: 'palette-field' },
  { id: 'select', label: '下拉框', fieldType: 'select', kind: 'palette-field' },
];

const activePageName = computed(() => pagesStore.activePage?.name ?? '未创建');

function applyTemplate(templateId: TemplateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  const page = pagesStore.createPage(template.name);

  const form = createBlockNode('Form', { label: '筛选表单' }) as LayoutNode;
  const table = createBlockNode('Table', { label: '结果表格' }) as LayoutNode;
  const stack = createBlockNode('Stack', {
    direction: 'column',
    gap: 12,
    children: [form, table],
  }) as LayoutNode;

  page.root.title = template.name;
  page.root.children = [stack];
  page.updatedAt = Date.now();

  uiStore.selectNode(form.id);
}

function cloneBlock(item: PaletteBlock): LayoutNode {
  return createBlockNode(item.blockType);
}

function cloneField(item: PaletteField): FormField {
  return {
    key: `${item.fieldType}-${nanoid(6)}`,
    label: item.label,
    type: item.fieldType,
    required: false,
    span: 12,
  };
}
</script>

<template>
  <div class="template-library">
    <div class="panel-header">
      <span class="panel-title">模板</span>
    </div>

    <div class="template-list">
      <button
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        @click="applyTemplate(template.id)"
      >
        <div class="template-icon">
          <FileText :size="16" />
        </div>
        <div class="template-info">
          <div class="template-name">{{ template.name }}</div>
          <div class="template-desc">{{ template.description }}</div>
        </div>
        <ChevronRight :size="14" class="template-arrow" />
      </button>
    </div>

    <div class="panel-header">
      <span class="panel-title">小组件</span>
    </div>

    <div class="palette-section">
      <div class="palette-title">容器组件</div>
      <Draggable
        :list="containerPalette"
        :sort="false"
        item-key="id"
        :group="{ name: 'blocks', pull: 'clone', put: false }"
        :clone="cloneBlock"
        class="palette-list"
      >
        <template #item="{ element }">
          <div class="palette-item">
            <Layers :size="14" />
            <span>{{ element.label }}</span>
          </div>
        </template>
      </Draggable>
    </div>

    <div class="palette-section">
      <div class="palette-title">字段组件</div>
      <Draggable
        :list="fieldPalette"
        :sort="false"
        item-key="id"
        :group="{ name: 'fields', pull: 'clone', put: false }"
        :clone="cloneField"
        class="palette-list"
      >
        <template #item="{ element }">
          <div class="palette-item">
            <span class="field-dot" />
            <span>{{ element.label }}</span>
          </div>
        </template>
      </Draggable>
      <div class="palette-hint">拖拽到中间结构视图中的表单块</div>
    </div>

    <div class="current-page">
      当前页面：<span>{{ activePageName }}</span>
    </div>
  </div>
</template>

<style scoped>
.template-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.template-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.template-card:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

.template-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent-subtle);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-info {
  flex: 1;
}

.template-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.template-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.template-arrow {
  color: var(--text-muted);
}

.palette-section {
  padding: 12px 12px 4px;
}

.palette-title {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.palette-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.palette-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: grab;
  user-select: none;
}

.palette-item:active {
  cursor: grabbing;
}

.field-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--accent-primary);
}

.palette-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
}

.current-page {
  margin-top: auto;
  padding: 12px 16px 16px;
  font-size: 12px;
  color: var(--text-muted);
  border-top: 1px solid var(--border-subtle);
}

.current-page span {
  color: var(--text-primary);
  font-weight: 500;
}
</style>
