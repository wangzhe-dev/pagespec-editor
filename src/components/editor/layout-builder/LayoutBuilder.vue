<script setup lang="ts">
/**
 * LayoutBuilder - Row/Col 拖拽布局编辑器
 *
 * 核心架构：
 * ┌──────────────────────────────────────────────────────┐
 * │  左侧调色板 (pull: 'clone', put: false)              │
 * │    └─ 拖拽克隆新 Row/Col                             │
 * └──────────────────────────────────────────────────────┘
 *                        ↓
 * ┌──────────────────────────────────────────────────────┐
 * │  画布根层 (group: 'layoutBuilder')                   │
 * │    ├─ Row (group: 'layoutBuilder')                  │
 * │    │    └─ Col (group: 'layoutBuilder')             │
 * │    │         └─ Row (嵌套，继续递归)                 │
 * │    └─ Row (group: 'layoutBuilder')                  │
 * │         └─ ...                                      │
 * └──────────────────────────────────────────────────────┘
 */
import { computed, ref } from 'vue';
import Draggable from 'vuedraggable';
import LayoutBuilderItem from './LayoutBuilderItem.vue';
import {
  canDropChild,
  createInitialLayout,
  createLayoutNode,
  LAYOUT_BUILDER_CONFIG,
  LAYOUT_PALETTE,
  type LayoutBuilderNode,
  type LayoutNodeType,
  type PaletteItem,
} from './layoutBuilderConfig';

// ============================================================================
// 拖拽组配置（每个组件独立创建，避免引用共享问题）
// ============================================================================

const paletteGroup = {
  name: LAYOUT_BUILDER_CONFIG.groupName,
  pull: 'clone' as const,
  put: false,
};

/**
 * 根层画布组配置
 * 使用 put 函数控制只接收 Row，不接收 Col
 */
const canvasGroup = {
  name: LAYOUT_BUILDER_CONFIG.groupName,
  pull: true,
  put: (_to: any, _from: any, dragged: HTMLElement) => {
    const draggedData = (dragged as any).__draggable_context?.element;
    const childType = draggedData?.type as LayoutNodeType | undefined;
    const allowed = canDropChild('root', childType || null);
    console.log('[root put check]', { childType, allowed });
    return allowed;
  },
};

// ============================================================================
// State
// ============================================================================

/** 画布数据 */
const drawingList = ref<LayoutBuilderNode[]>(createInitialLayout());

/** 当前选中节点 ID */
const activeId = ref(drawingList.value[0]?.id || '');

// ============================================================================
// Computed
// ============================================================================

/** 当前选中的节点 */
const activeNode = computed(() => findNodeById(drawingList.value, activeId.value));

/** 布局 JSON 预览 */
const drawingTreeJson = computed(() => JSON.stringify(drawingList.value, null, 2));

// ============================================================================
// 工具函数
// ============================================================================

/** 递归查找节点 */
function findNodeById(list: LayoutBuilderNode[], id: string): LayoutBuilderNode | null {
  if (!id) return null;
  for (const node of list) {
    if (node.id === id) return node;
    if (Array.isArray(node.children) && node.children.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// ============================================================================
// 调色板操作
// ============================================================================

/** 克隆调色板项到画布 */
function clonePaletteItem(item: PaletteItem): LayoutBuilderNode {
  const cloned = createLayoutNode(item.type);
  console.log('[clone]', { from: item, to: cloned });
  return cloned;
}

/** 点击添加节点（快捷方式） */
function addNodeByClick(item: PaletteItem) {
  if (!canDropChild('root', item.type)) return;
  const node = createLayoutNode(item.type);
  drawingList.value.push(node);
  activeId.value = node.id;
}

// ============================================================================
// 画布操作
// ============================================================================

/** 根层添加节点后选中 */
function handleRootAdd(evt: any) {
  const addedNode = drawingList.value[evt.newIndex];
  if (addedNode) {
    activeId.value = addedNode.id;
  }
}

/** 选中节点 */
function handleSelect(node: LayoutBuilderNode) {
  activeId.value = node.id;
}

/** 新增 Row */
function appendRow() {
  const row = createLayoutNode('row');
  drawingList.value.push(row);
  activeId.value = row.id;
}

/** 重置画布 */
function resetCanvas() {
  drawingList.value = createInitialLayout();
  activeId.value = drawingList.value[0]?.id || '';
}

/** 清空画布 */
function clearCanvas() {
  if (confirm('确定要清空画布吗？')) {
    drawingList.value = [];
    activeId.value = '';
  }
}
</script>

<template>
  <div class="layout-builder">
    <!-- 左侧调色板 -->
    <aside class="left-panel">
      <div class="panel-title">布局组件</div>
      <Draggable
        :list="LAYOUT_PALETTE"
        :group="paletteGroup"
        item-key="id"
        :sort="false"
        :clone="clonePaletteItem"
        class="palette-list"
      >
        <template #item="{ element }">
          <button class="palette-item" type="button" @click="addNodeByClick(element)">
            <span class="palette-name">{{ element.label }}</span>
            <span class="palette-desc">{{ element.description }}</span>
          </button>
        </template>
      </Draggable>
    </aside>

    <!-- 中心画布 -->
    <main class="center-panel">
      <!-- 工具栏 -->
      <div class="action-bar">
        <button class="toolbar-btn primary" type="button" @click="appendRow">新增 Row</button>
        <button class="toolbar-btn" type="button" @click="resetCanvas">重置</button>
        <button class="toolbar-btn danger" type="button" @click="clearCanvas">清空</button>
      </div>

      <!-- 可滚动画布区域 -->
      <div class="center-scrollbar">
        <div class="center-container">
          <div class="center-row">
            <Draggable
              class="drawing-board"
              :list="drawingList"
              :animation="220"
              item-key="id"
              :group="canvasGroup"
              handle=".node-handle"
              ghost-class="drag-ghost"
              chosen-class="drag-chosen"
              @add="handleRootAdd"
            >
              <template #item="{ element, index }">
                <LayoutBuilderItem
                  :item="element"
                  :index="index"
                  :parent-list="drawingList"
                  :active-id="activeId"
                  @select="handleSelect"
                />
              </template>
            </Draggable>

            <!-- 空状态提示 -->
            <div v-show="!drawingList.length" class="empty-info">
              拖入 Row 开始搭建布局
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 右侧信息面板 -->
    <aside class="right-panel">
      <div class="panel-title">当前节点</div>
      <div v-if="activeNode" class="active-node">
        <div class="info-row">
          <span>类型</span>
          <strong>{{ activeNode.type }}</strong>
        </div>
        <div class="info-row">
          <span>ID</span>
          <strong class="id-text">{{ activeNode.id }}</strong>
        </div>
        <div class="info-row">
          <span>标签</span>
          <strong>{{ activeNode.label || '-' }}</strong>
        </div>
        <div v-if="activeNode.type === 'col'" class="info-row">
          <span>列宽</span>
          <strong>{{ activeNode.span }}/24</strong>
        </div>
      </div>
      <div v-else class="placeholder">点击任意节点查看信息</div>

      <div class="panel-title json-title">布局 JSON</div>
      <pre class="json-preview">{{ drawingTreeJson }}</pre>
    </aside>
  </div>
</template>

<style scoped>
.layout-builder {
  height: 100%;
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  gap: 0;
  background: var(--bg-base, #f5f5f5);
}

/* 面板通用 */
.left-panel,
.right-panel {
  background: var(--bg-elevated, #fff);
  border: 1px solid var(--border-subtle, #eef0f3);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.left-panel {
  border-right: none;
}

.right-panel {
  border-left: none;
  padding: 10px;
}

.panel-title {
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #606266);
  border-bottom: 1px solid var(--border-subtle, #eef0f3);
  flex-shrink: 0;
}

/* 调色板 */
.palette-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  flex: 1;
}

.palette-item {
  width: 100%;
  text-align: left;
  padding: 10px;
  border: 1px dashed var(--border-subtle, #d7dce5);
  border-radius: 6px;
  background: var(--bg-subtle, #fafcff);
  cursor: move;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.palette-item:hover {
  border-color: var(--accent-primary, #409eff);
  background: var(--bg-hover, #ecf5ff);
}

.palette-name {
  font-size: 13px;
  color: var(--text-primary, #303133);
}

.palette-desc {
  font-size: 12px;
  color: var(--text-muted, #909399);
}

/* 中心画布 */
.center-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--border-subtle, #eef0f3);
  border-right: none;
  border-left: none;
}

.action-bar {
  height: 42px;
  border-bottom: 1px solid var(--border-subtle, #eef0f3);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 12px;
  background: var(--bg-elevated, #fff);
  flex-shrink: 0;
}

.toolbar-btn {
  height: 28px;
  border: 1px solid var(--border-subtle, #d8dde6);
  background: var(--bg-base, #fff);
  color: var(--text-secondary, #606266);
  border-radius: 5px;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
}

.toolbar-btn:hover {
  border-color: var(--accent-primary, #409eff);
  color: var(--accent-primary, #409eff);
}

.toolbar-btn.primary {
  border-color: var(--accent-primary, #409eff);
  color: var(--accent-primary, #409eff);
}

.toolbar-btn.danger:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}

/* 核心：可滚动区域 */
.center-scrollbar {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--bg-subtle, #f7f9fc);
}

.center-container {
  min-height: 100%;
  padding: 14px;
  box-sizing: border-box;
}

.center-row {
  min-height: calc(100% - 28px);
  padding: 4px;
}

.drawing-board {
  width: 100%;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-info {
  margin-top: 16px;
  width: 100%;
  min-height: 80px;
  border: 2px dashed var(--border-subtle, #d8dde6);
  border-radius: 6px;
  color: var(--text-muted, #909399);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右侧信息 */
.active-node {
  border: 1px solid var(--border-subtle, #eef0f3);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
  background: var(--bg-base, #fff);
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary, #606266);
  margin-bottom: 6px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row strong {
  color: var(--text-primary, #303133);
  text-align: right;
}

.info-row .id-text {
  font-size: 10px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placeholder {
  font-size: 12px;
  color: var(--text-muted, #909399);
  margin-bottom: 12px;
}

.json-title {
  margin-top: 2px;
}

.json-preview {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--border-subtle, #eef0f3);
  border-radius: 6px;
  background: var(--bg-base, #fff);
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-primary, #2f3a4a);
}

/* 拖拽效果 */
.drag-ghost {
  opacity: 0.45;
}

.drag-chosen {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
}
</style>
