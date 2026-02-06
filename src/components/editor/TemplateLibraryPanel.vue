<script setup lang="ts">
import { usePagesStore, useUIStore } from '@/app/store';
import {
  clonePaletteBlock,
  createFieldDragGroup,
  createPaletteDragGroup,
} from '@/composables/useDragDrop';
import { createBlockNode } from '@/domain/registry';
import type { FormField, LayoutNode } from '@/domain/schema';
import {
  BarChart3,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  GitBranch,
  LayoutGrid,
  SquareStack,
  Table,
} from 'lucide-vue-next';
import { nanoid } from 'nanoid';
import { computed, ref } from 'vue';
import Draggable from 'vuedraggable';

// ============================================================================
// 模板配置
// ============================================================================

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  create: () => LayoutNode[];
}

const templates: PageTemplate[] = [
  {
    id: 'tree-table',
    name: '左树右表',
    description: '左侧树形导航 + 右侧数据表格',
    create: () => {
      const tree = createBlockNode('Tree', { label: '分类树' }) as LayoutNode;
      const table = createBlockNode('Table', { label: '数据表格' }) as LayoutNode;
      const leftCell = createBlockNode('GridCell', {
        label: '左侧区域',
        children: [tree],
      }) as LayoutNode;
      const rightCell = createBlockNode('GridCell', {
        label: '右侧区域',
        children: [table],
      }) as LayoutNode;
      const grid = createBlockNode('Grid', {
        columns: '1fr 3fr',
        gap: 16,
        children: [leftCell, rightCell],
        label: '左树右表',
      }) as LayoutNode;
      return [grid];
    },
  },
];

// ============================================================================
// 组件调色板
// ============================================================================

// 容器组件（可嵌套子组件）
const containerBlocks = [
  { type: 'Grid', label: 'Row 行容器', icon: LayoutGrid, description: '类似 el-row，内部放 Col' },
  { type: 'GridCell', label: 'Col 列容器', icon: LayoutGrid, description: '类似 el-col，可继续嵌套 Row' },
  { type: 'Card', label: '卡片容器', icon: CreditCard, description: '带标题的卡片' },
  { type: 'Tabs', label: '标签页', icon: SquareStack, description: '多标签切换' },
];

// 单元组件（叶子节点，不可嵌套）
const unitBlocks = [
  { type: 'Table', label: '表格', icon: Table, description: '数据表格' },
  { type: 'Tree', label: '树形', icon: GitBranch, description: '树形结构' },
  { type: 'Form', label: '表单', icon: ClipboardList, description: '数据录入表单' },
  { type: 'Chart', label: '图表', icon: BarChart3, description: '数据图表' },
];

// 字段组件（表单字段）
const fieldTypes = [
  { type: 'input', label: '输入框' },
  { type: 'select', label: '下拉框' },
  { type: 'date', label: '日期' },
  { type: 'number', label: '数字' },
];

// ============================================================================
// 状态
// ============================================================================

const pagesStore = usePagesStore();
const uiStore = useUIStore();

const showTemplateDropdown = ref(false);
const selectedTemplate = ref<PageTemplate | null>(null);

const activePageName = computed(() => pagesStore.activePage?.name ?? '未创建');

// ============================================================================
// 方法
// ============================================================================

// 拖拽组配置
const paletteDragGroup = createPaletteDragGroup();
const fieldPaletteDragGroup = createFieldDragGroup({ pull: 'clone', put: false });

function applyTemplate(template: PageTemplate) {
  const page = pagesStore.createPage(template.name);
  const children = template.create();

  page.root.title = template.name;
  page.root.children = children;
  page.updatedAt = Date.now();

  selectedTemplate.value = template;
  showTemplateDropdown.value = false;

  if (children.length > 0) {
    uiStore.selectNode(children[0].id);
  }
}

function createDefaultRowNode(): LayoutNode {
  const defaultCol = createBlockNode('GridCell', {
    label: 'Col 1',
    colSpan: 24,
    children: [],
  }) as LayoutNode;

  return createBlockNode('Grid', {
    label: 'Row',
    columns: 24,
    gap: 12,
    children: [defaultCol],
  }) as LayoutNode;
}

function createDefaultColNode(): LayoutNode {
  return createBlockNode('GridCell', {
    label: 'Col',
    colSpan: 24,
    children: [],
  }) as LayoutNode;
}

// 使用公共克隆函数，并给 Row/Col 设置更轻量的默认结构
function cloneBlock(item: { type: string }): LayoutNode {
  if (item.type === 'Grid') {
    return createDefaultRowNode();
  }
  if (item.type === 'GridCell') {
    return createDefaultColNode();
  }
  return clonePaletteBlock(item);
}

function cloneField(item: { type: string; label: string }): FormField {
  return {
    key: `${item.type}-${nanoid(6)}`,
    label: item.label,
    type: item.type as any,
    required: false,
    span: 12,
  };
}

function toggleDropdown() {
  showTemplateDropdown.value = !showTemplateDropdown.value;
}

function closeDropdown() {
  showTemplateDropdown.value = false;
}
</script>

<template>
  <div class="template-library" @click="closeDropdown">
    <!-- 模板选择器 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">页面模板</span>
      </div>
      <div class="template-selector" @click.stop>
        <button class="template-trigger" @click="toggleDropdown">
          <span v-if="selectedTemplate">{{ selectedTemplate.name }}</span>
          <span v-else class="placeholder">选择模板快速创建...</span>
          <ChevronDown :size="14" :class="{ rotated: showTemplateDropdown }" />
        </button>
        <div v-if="showTemplateDropdown" class="template-dropdown">
          <button
            v-for="template in templates"
            :key="template.id"
            class="template-option"
            @click="applyTemplate(template)"
          >
            <div class="template-option-info">
              <div class="template-option-name">{{ template.name }}</div>
              <div class="template-option-desc">{{ template.description }}</div>
            </div>
            <Check v-if="selectedTemplate?.id === template.id" :size="14" class="check-icon" />
          </button>
        </div>
      </div>
    </div>

    <!-- 容器组件 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">容器组件</span>
        <span class="section-hint">可嵌套</span>
      </div>
      <Draggable
        :list="containerBlocks"
        :sort="false"
        item-key="type"
        :group="paletteDragGroup"
        :clone="cloneBlock"
        class="block-grid"
      >
        <template #item="{ element }">
          <div class="block-item container-block draggable-item">
            <component :is="element.icon" :size="16" class="block-icon" />
            <span class="block-label">{{ element.label }}</span>
          </div>
        </template>
      </Draggable>
    </div>

    <!-- 单元组件 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">单元组件</span>
        <span class="section-hint">叶子节点</span>
      </div>
      <Draggable
        :list="unitBlocks"
        :sort="false"
        item-key="type"
        :group="paletteDragGroup"
        :clone="cloneBlock"
        class="block-grid"
      >
        <template #item="{ element }">
          <div class="block-item unit-block draggable-item">
            <component :is="element.icon" :size="16" class="block-icon" />
            <span class="block-label">{{ element.label }}</span>
          </div>
        </template>
      </Draggable>
    </div>

    <!-- 字段组件 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title">表单字段</span>
        <span class="section-hint">拖入表单</span>
      </div>
      <Draggable
        :list="fieldTypes"
        :sort="false"
        item-key="type"
        :group="fieldPaletteDragGroup"
        :clone="cloneField"
        class="field-list"
      >
        <template #item="{ element }">
          <div class="field-item draggable-item">
            <span class="field-dot" />
            <span>{{ element.label }}</span>
          </div>
        </template>
      </Draggable>
    </div>

    <!-- 当前页面 -->
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

.section {
  padding: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.section-hint {
  font-size: 10px;
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-subtle);
  border-radius: 999px;
}

/* 模板选择器 */
.template-selector {
  position: relative;
}

.template-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s;
}

.template-trigger:hover {
  border-color: var(--border-strong);
}

.template-trigger .placeholder {
  color: var(--text-muted);
}

.template-trigger svg {
  color: var(--text-muted);
  transition: transform 0.15s;
}

.template-trigger svg.rotated {
  transform: rotate(180deg);
}

.template-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
}

.template-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.template-option:hover {
  background: var(--bg-hover);
}

.template-option-info {
  flex: 1;
}

.template-option-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.template-option-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.check-icon {
  color: var(--accent-primary);
}

/* 组件网格 */
.block-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.block-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  cursor: grab;
  user-select: none;
  transition: all 0.15s;
}

.block-item:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
}

.block-item:active {
  cursor: grabbing;
}

.block-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.block-label {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 容器组件样式 */
.container-block {
  border-left: 3px solid var(--accent-primary);
}

.container-block .block-icon {
  color: var(--accent-primary);
}

/* 单元组件样式 */
.unit-block {
  border-left: 3px solid #10b981;
}

.unit-block .block-icon {
  color: #10b981;
}

/* 字段列表 */
.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-item {
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
  transition: all 0.15s;
}

.field-item:hover {
  border-color: var(--border-strong);
}

.field-item:active {
  cursor: grabbing;
}

.field-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #f59e0b;
}

/* 当前页面 */
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
