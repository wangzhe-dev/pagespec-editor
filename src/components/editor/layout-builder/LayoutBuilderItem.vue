<script setup lang="ts">
/**
 * LayoutBuilderItem - 递归拖拽布局节点
 *
 * 核心设计：
 * 1. 递归组件，Row/Col 都用同一个组件渲染
 * 2. Row: 100% 宽，内部 flex-wrap 放 Col
 * 3. Col: span/24 计算宽度，内部可嵌套 Row
 * 4. 统一 group 实现跨层级拖拽
 */
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import {
  canDropChild,
  cloneLayoutNode,
  LAYOUT_BUILDER_CONFIG,
  normalizeSpan,
  type LayoutBuilderNode,
  type LayoutNodeType,
} from './layoutBuilderConfig';

defineOptions({
  name: 'LayoutBuilderItem',
});

// ============================================================================
// Props & Emits
// ============================================================================

const props = defineProps<{
  /** 当前节点 */
  item: LayoutBuilderNode;
  /** 在父列表中的索引 */
  index: number;
  /** 父列表引用（用于删除/复制） */
  parentList: LayoutBuilderNode[];
  /** 当前选中的节点 ID */
  activeId: string;
}>();

const emit = defineEmits<{
  (e: 'select', node: LayoutBuilderNode): void;
}>();

// ============================================================================
// Computed
// ============================================================================

const isRow = computed(() => props.item.type === 'row');
const isCol = computed(() => props.item.type === 'col');

/**
 * 动态拖拽组配置
 * 使用 put 函数控制是否接收，这样当不接收时会自动尝试父级容器
 */
const canvasGroup = computed(() => ({
  name: LAYOUT_BUILDER_CONFIG.groupName,
  pull: true,
  put: (_to: any, _from: any, dragged: HTMLElement) => {
    // 从 DOM 元素获取被拖拽节点的数据
    const draggedData = (dragged as any).__draggable_context?.element;
    const childType = draggedData?.type as LayoutNodeType | undefined;
    const allowed = canDropChild(props.item.type, childType || null);
    console.log('[put check]', { container: props.item.type, childType, allowed });
    return allowed;
  },
}));

/** 规范化的 span 值 */
const span = computed(() => normalizeSpan(props.item.span));

/** Col 宽度百分比 */
const widthPercent = computed(() => `${(span.value / 24) * 100}%`);

/** 外层包装样式 - Col 按 span 分配宽度，Row 占满 */
const wrapperStyle = computed(() => {
  if (!isCol.value) {
    return { width: '100%', flex: '0 0 100%' };
  }
  return {
    width: widthPercent.value,
    flex: `0 0 ${widthPercent.value}`,
    maxWidth: widthPercent.value,
  };
});

/** 节点 class */
const nodeClass = computed(() => ({
  'is-active': props.activeId === props.item.id,
  'is-row': isRow.value,
  'is-col': isCol.value,
}));

/** 子节点列表（响应式双向绑定） */
const itemChildren = computed({
  get() {
    if (!Array.isArray(props.item.children)) {
      props.item.children = [];
    }
    return props.item.children;
  },
  set(newValue: LayoutBuilderNode[]) {
    props.item.children = newValue;
  },
});

/** 空白提示文字 */
const emptyHint = computed(() => {
  return isRow.value ? '拖入 Col' : '拖入 Row';
});

// ============================================================================
// Event Handlers
// ============================================================================

function handleSelect(event: MouseEvent) {
  event.stopPropagation();
  emit('select', props.item);
}

function handleDelete(event: MouseEvent) {
  event.stopPropagation();
  props.parentList.splice(props.index, 1);
}

function handleCopy(event: MouseEvent) {
  event.stopPropagation();
  const clone = cloneLayoutNode(props.item);
  props.parentList.splice(props.index + 1, 0, clone);
  emit('select', clone);
}

/** 调整 Col 的 span */
function adjustSpan(delta: number, event: MouseEvent) {
  event.stopPropagation();
  if (!isCol.value) return;
  const next = span.value + delta;
  props.item.span = Math.max(
    LAYOUT_BUILDER_CONFIG.minColSpan,
    Math.min(LAYOUT_BUILDER_CONFIG.maxColSpan, next)
  );
}

/** 子节点添加后选中 */
function handleChildAdd(evt: any) {
  const addedNode = itemChildren.value[evt.newIndex];
  if (addedNode) {
    emit('select', addedNode);
  }
}
</script>

<template>
  <div class="layout-wrapper" :style="wrapperStyle">
    <div class="layout-node" :class="nodeClass" @click="handleSelect">
      <!-- 节点头部（拖拽手柄） -->
      <div class="node-header node-handle">
        <span class="node-tag">{{ isRow ? 'Row' : 'Col' }}</span>
        <span class="node-title">{{ item.label || (isRow ? 'Row' : 'Col') }}</span>

        <!-- Col 宽度调节器 -->
        <div v-if="isCol" class="span-tools">
          <button class="span-btn" type="button" @click="adjustSpan(-1, $event)">-</button>
          <span class="span-text">{{ span }}/24</span>
          <button class="span-btn" type="button" @click="adjustSpan(1, $event)">+</button>
        </div>

        <!-- 操作按钮 -->
        <div class="node-actions">
          <button class="action-btn" type="button" @click="handleCopy">复制</button>
          <button class="action-btn delete" type="button" @click="handleDelete">删除</button>
        </div>
      </div>

      <!-- 节点内容（子节点区域） -->
      <div class="node-body">
        <Draggable
          v-model="itemChildren"
          item-key="id"
          :group="canvasGroup"
          :animation="200"
          handle=".node-handle"
          ghost-class="drag-ghost"
          chosen-class="drag-chosen"
          class="child-list"
          @add="handleChildAdd"
        >
          <template #item="{ element, index: childIndex }">
            <LayoutBuilderItem
              :item="element"
              :index="childIndex"
              :parent-list="itemChildren"
              :active-id="activeId"
              @select="emit('select', $event)"
            />
          </template>
        </Draggable>

        <!-- 空白提示 -->
        <div v-if="!itemChildren.length" class="empty-zone">
          {{ emptyHint }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-wrapper {
  padding: 4px;
  box-sizing: border-box;
}

.layout-node {
  border: 1px dashed var(--border-subtle, #c7ccd6);
  border-radius: 6px;
  background: var(--bg-base, #fff);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.layout-node.is-active {
  border-color: var(--accent-primary, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.14);
}

.layout-node.is-row {
  border-style: solid;
  border-color: var(--border-default, #cfd8e3);
}

.layout-node.is-col {
  background: var(--bg-elevated, #fbfcfe);
}

.node-header {
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-bottom: 1px solid var(--border-subtle, #eceff4);
  cursor: move;
  user-select: none;
}

.node-tag {
  min-width: 30px;
  height: 18px;
  line-height: 18px;
  border-radius: 10px;
  text-align: center;
  font-size: 11px;
  color: #fff;
  background: var(--accent-primary, #409eff);
}

.is-row .node-tag {
  background: #67c23a;
}

.node-title {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary, #303133);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.span-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.span-btn {
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-subtle, #d8dde6);
  background: var(--bg-base, #fff);
  color: var(--text-secondary, #606266);
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
  font-size: 12px;
}

.span-btn:hover {
  border-color: var(--accent-primary, #409eff);
  color: var(--accent-primary, #409eff);
}

.span-text {
  min-width: 38px;
  font-size: 11px;
  color: var(--text-secondary, #606266);
  text-align: center;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--border-subtle, #d8dde6);
  border-radius: 4px;
  font-size: 12px;
  background: var(--bg-base, #fff);
  color: var(--text-secondary, #606266);
  cursor: pointer;
}

.action-btn:hover {
  border-color: var(--accent-primary, #409eff);
  color: var(--accent-primary, #409eff);
}

.action-btn.delete:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}

.node-body {
  padding: 8px;
}

.child-list {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  min-height: 40px;
}

.empty-zone {
  width: 100%;
  min-height: 44px;
  border: 1px dashed var(--border-subtle, #dce2ea);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted, #909399);
  font-size: 12px;
}

/* 拖拽效果 */
.drag-ghost {
  opacity: 0.45;
}

.drag-chosen {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
}
</style>
