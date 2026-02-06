<script setup lang="ts">
import { usePagesStore, useUIStore } from '@/app/store';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import EditorToolbar from './EditorToolbar.vue';
import draggable from 'vuedraggable';
import DraggableItem from '@/components/tool/build/DraggableItem.vue';
import { formConf, layoutComponents } from '@/components/tool/build/utils/config.ts';
import { randomString } from '@/utils/index.ts';
import PropertyInspector from './PropertyInspector.vue';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

type FormId = string | number;

interface CanvasNode {
  formId?: FormId;
  renderKey?: string | number;
  layout?: string;
  oneOf?: string;
  basis?: string;
  tempComponents?: boolean;
  tag?: string;
  tagIcon?: string;
  label?: string;
  placeholder?: string;
  vModel?: string;
  componentName?: string;
  gutter?: number;
  dictCode?: string;
  options?: unknown[];
  span?: number;
  children?: CanvasNode[];
  [key: string]: unknown;
}

let oldActiveId: FormId | undefined;
let tempActiveData: CanvasNode | undefined;
let oldBodyOnDrop: ((this: GlobalEventHandlers, ev: DragEvent) => unknown) | null = null;

const drawingList = ref<CanvasNode[]>([]);
const activeData = ref<CanvasNode>({});
const activeId = ref<FormId>(1);
const draggableFormConf = formConf as unknown as Record<string, unknown>;

// 面板状态
const leftPanelOpen = computed(() => uiStore.panelVisibility.pages || uiStore.panelVisibility.tree);
const rightPanelOpen = computed(() => uiStore.panelVisibility.properties);
const bottomPanelOpen = computed(() => uiStore.panelVisibility.preview);

// 拖拽调整尺寸
const isResizingLeft = ref(false);
const isResizingRight = ref(false);
const isResizingBottom = ref(false);

function buildDefaultGridCol(): CanvasNode {
  return {
    formId: randomString(8),
    renderKey: Date.now(),
    layout: 'gridCol',
    oneOf: 'gridCol',
    tagIcon: 'component',
    label: 'GridCol',
    basis: 'basis-1/2',
    componentName: `col${randomString(8)}`,
    children: [],
  };
}

function activeFormItem(element: CanvasNode) {
  activeData.value = element;
  activeId.value = element.formId ?? randomString(8);
}

function onEnd(obj: { from: unknown; to: unknown }) {
  if (obj.from !== obj.to) {
    activeData.value = tempActiveData ?? {};
    activeId.value = randomString(8);
  }
}

function addComponent(item: CanvasNode) {
  const clone = cloneComponent(item);
  drawingList.value.push(clone);
  activeFormItem(clone);
}

function cloneComponent(origin: CanvasNode): CanvasNode {
  const clone = JSON.parse(JSON.stringify(origin)) as CanvasNode;
  clone.formId = randomString(8);
  clone.span = formConf.span;
  clone.renderKey = Date.now();
  tempActiveData = clone;

  if (!clone.layout) clone.layout = 'colFormItem';
  if (clone.layout === 'colFormItem') {
    if (clone.tag === 'el-divider') {
      delete clone.label;
    } else {
      clone.vModel = `field${randomString(8)}`;
      if (typeof clone.placeholder === 'string' && typeof clone.label === 'string') {
        clone.placeholder += clone.label;
      }
    }
    tempActiveData = clone;
  } else if (clone.layout === 'rowFormItem' && !clone.oneOf) {
    delete clone.label;
    clone.componentName = `row${randomString(8)}`;
    clone.gutter = formConf.gutter;
    tempActiveData = clone;
  } else if (clone.layout === 'subTable') {
    clone.vModel = `sub_field${randomString(8)}`;
    tempActiveData = clone;
  } else if (clone.layout === 'card' && !clone.oneOf) {
    delete clone.label;
    if (clone.tagIcon === 'ocr') {
      clone.vModel = `field${randomString(8)}`;
    }
    clone.componentName = `row${randomString(8)}`;
    clone.gutter = formConf.gutter;
    tempActiveData = clone;
  } else if (clone.layout === 'gridRow') {
    clone.componentName = `row${randomString(8)}`;
    if (!Array.isArray(clone.children) || !clone.children.length) {
      clone.children = [buildDefaultGridCol()];
    } else {
      clone.children = clone.children.map((child: CanvasNode) => createIdAndKey(child));
    }
    tempActiveData = clone;
  } else if (clone.layout === 'gridCol') {
    clone.componentName = `col${randomString(8)}`;
    clone.basis = typeof clone.basis === 'string' ? clone.basis : 'basis-1/2';
    if (!Array.isArray(clone.children)) {
      clone.children = [];
    }
    tempActiveData = clone;
  }
  return tempActiveData ?? clone;
}

function drawingItemCopy(item: CanvasNode, parent: CanvasNode[]) {
  let clone = JSON.parse(JSON.stringify(item)) as CanvasNode;
  clone = createIdAndKey(clone);
  parent.push(clone);
  activeFormItem(clone);
}

function createIdAndKey(item: CanvasNode): CanvasNode {
  item.formId = randomString(8);
  item.renderKey = Date.now();
  if (item.layout === 'colFormItem') {
    item.vModel = `field${randomString(8)}`;
  } else if (item.layout === 'rowFormItem' || item.layout === 'gridRow') {
    item.componentName = `row${randomString(8)}`;
  } else if (item.layout === 'gridCol') {
    item.componentName = `col${randomString(8)}`;
    item.basis = typeof item.basis === 'string' ? item.basis : 'basis-1/2';
  } else if (item.layout === 'card') {
    item.vModel = `field${randomString(8)}`;
  } else if (item.layout === 'subTable') {
    item.vModel = `field${randomString(8)}`;
    item.activeds = true;
    item.border = false;
    item.align = 'center';
    item.size = 'medium';
    item.stripe = false;
    item.addExpandJs = '';
    item.delExpandJs = '';
    item.expand = { js: '' };
    item.children = [];
    item.rangeFlag = false;
  }
  if (Array.isArray(item.children)) {
    item.children = item.children.map((childItem) => createIdAndKey(childItem));
  }

  return item;
}

function drawingItemDelete(index: number, parent: CanvasNode[]) {
  parent.splice(index, 1);
  void nextTick(() => {
    const len = drawingList.value.length;
    if (len) {
      activeFormItem(drawingList.value[len - 1]);
    }
  });
}

watch(
  () => activeData.value.label,
  (val, oldVal) => {
    const current = activeData.value;
    if (
      typeof current.placeholder !== 'string' ||
      !current.tag ||
      oldActiveId !== activeId.value
    ) {
      return;
    }
    current.placeholder = current.placeholder.replace(oldVal ?? '', '') + (val ?? '');
  },
);

watch(
  activeId,
  (val) => {
    oldActiveId = val;
  },
  { immediate: true },
);

onMounted(() => {
  oldBodyOnDrop = document.body.ondrop;
  document.body.ondrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
});

onBeforeUnmount(() => {
  document.body.ondrop = oldBodyOnDrop;
});

function startResizeLeft(e: MouseEvent) {
  isResizingLeft.value = true;
  const startX = e.clientX;
  const startWidth = uiStore.panelSizes.leftWidth;

  const onMove = (e: MouseEvent) => {
    const diff = e.clientX - startX;
    uiStore.setPanelSize('left', Math.max(200, Math.min(500, startWidth + diff)));
  };

  const onUp = () => {
    isResizingLeft.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function startResizeRight(e: MouseEvent) {
  isResizingRight.value = true;
  const startX = e.clientX;
  const startWidth = uiStore.panelSizes.rightWidth;

  const onMove = (e: MouseEvent) => {
    const diff = startX - e.clientX;
    uiStore.setPanelSize('right', Math.max(280, Math.min(500, startWidth + diff)));
  };

  const onUp = () => {
    isResizingRight.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function startResizeBottom(e: MouseEvent) {
  isResizingBottom.value = true;
  const startY = e.clientY;
  const startHeight = uiStore.panelSizes.bottomHeight;

  const onMove = (e: MouseEvent) => {
    const diff = startY - e.clientY;
    uiStore.setPanelSize('bottom', Math.max(120, Math.min(500, startHeight + diff)));
  };

  const onUp = () => {
    isResizingBottom.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function toggleLeftPanel() {
  const isOpen = uiStore.panelVisibility.pages || uiStore.panelVisibility.tree;
  uiStore.setPanelVisibility('pages', !isOpen);
  uiStore.setPanelVisibility('tree', !isOpen);
}
</script>

<template>
  <div class="editor-layout tool-workspace" :class="{ 'resizing': isResizingLeft || isResizingRight || isResizingBottom }">
    <!-- Toolbar -->
    <EditorToolbar class="editor-toolbar" />

    <!-- Main Content -->
    <div class="editor-main">
      <!-- Left Panel -->
      <aside
        v-if="leftPanelOpen"
        class="editor-left"
        :style="{ width: uiStore.panelSizes.leftWidth + 'px' }"
      >
        <el-scrollbar class="tool-left-scrollbar">
          <div class="tool-components-list">
            <div class="tool-components-title">
              <svg-icon icon-class="component" /> 布局型组件
            </div>
            <draggable
              class="tool-components-draggable"
              :list="layoutComponents"
              :group="{ name: 'componentsGroup', pull: 'clone', put: false }"
              :clone="cloneComponent"
              draggable=".tool-components-item"
              :sort="false"
              item-key="label"
              @end="onEnd"
            >
              <template #item="{ element }">
                <div class="tool-components-item" @click="addComponent(element)">
                  <div class="tool-components-body">
                    <svg-icon :icon-class="String(element.tagIcon ?? 'component')" />
                    {{ element.label }}
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </el-scrollbar>

        <div
          class="resize-handle resize-handle-right"
          @mousedown="startResizeLeft"
        />
      </aside>

      <!-- Left collapse button -->
      <button
        class="panel-toggle panel-toggle-left"
        @click="toggleLeftPanel"
        :title="leftPanelOpen ? '收起左侧面板' : '展开左侧面板'"
      >
        <ChevronLeft v-if="leftPanelOpen" :size="16" />
        <ChevronRight v-else :size="16" />
      </button>

      <!-- Center (Structure View) -->
      <main class="editor-center">
        <section class="tool-center-area">
          <draggable
            class="tool-drawing-board"
            :list="drawingList"
            :animation="340"
            group="componentsGroup"
            item-key="formId"
          >
            <template #item="{ element, index }">
              <DraggableItem
                :key="element.renderKey ?? element.formId ?? index"
                :drawing-list="drawingList"
                :element="element"
                :index="index"
                :active-id="activeId"
                :form-conf="draggableFormConf"
                @activeItem="activeFormItem"
                @copyItem="drawingItemCopy"
                @deleteItem="drawingItemDelete"
              />
            </template>
          </draggable>
          <div v-show="!drawingList.length" class="tool-empty-info">
            从左侧拖入或点选组件进行表单设计
          </div>
        </section>
        <!-- Bottom Panel -->
        <div
          v-if="bottomPanelOpen && pagesStore.activePage"
          class="editor-bottom"
          :style="{ height: uiStore.panelSizes.bottomHeight + 'px' }"
        >
          <div
            class="resize-handle resize-handle-top"
            @mousedown="startResizeBottom"
          />
          <PromptPreviewDock />
        </div>

        <!-- Bottom toggle -->
        <button
          v-if="pagesStore.activePage"
          class="panel-toggle panel-toggle-bottom"
          @click="uiStore.togglePanel('preview')"
          :title="bottomPanelOpen ? '收起预览面板' : '展开预览面板'"
        >
          <ChevronDown v-if="bottomPanelOpen" :size="16" />
          <ChevronUp v-else :size="16" />
          <span>Prompt 预览</span>
        </button>
      </main>

      <!-- Right Panel -->
      <aside
        v-if="rightPanelOpen"
        class="editor-right"
        :style="{ width: uiStore.panelSizes.rightWidth + 'px' }"
      >
        <!-- Right resize handle -->
        <div
          class="resize-handle resize-handle-left"
          @mousedown="startResizeRight"
        />
        <PropertyInspector />
      </aside>

      <!-- Right toggle -->
      <button
        class="panel-toggle panel-toggle-right"
        @click="uiStore.togglePanel('properties')"
        :title="rightPanelOpen ? '收起属性面板' : '展开属性面板'"
      >
        <ChevronRight v-if="rightPanelOpen" :size="16" />
        <ChevronLeft v-else :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
}

.editor-layout.resizing {
  user-select: none;
  cursor: col-resize;
}

.editor-toolbar {
  flex-shrink: 0;
  height: 48px;
  border-bottom: 1px solid var(--border-subtle);
}

.editor-main {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.editor-left,
.editor-right {
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  border-right: 1px solid var(--border-subtle);
  position: relative;
  flex-shrink: 0;
}

.editor-right {
  border-right: none;
  border-left: 1px solid var(--border-subtle);
}

.editor-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--bg-base);
  min-width: 0;
}

.editor-bottom {
  position: relative;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  flex-shrink: 0;
}

.panel-section {
  overflow: auto;
}

.panel-divider {
  height: 1px;
  background: var(--border-subtle);
  flex-shrink: 0;
}

.resize-handle {
  position: absolute;
  z-index: 10;
  background: transparent;
  transition: background 0.15s;
}

.resize-handle:hover,
.resize-handle:active {
  background: var(--accent-primary);
}

.resize-handle-right {
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
}

.resize-handle-left {
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
}

.resize-handle-top {
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  cursor: row-resize;
}

.panel-toggle {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}

.panel-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.panel-toggle-left {
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  border-left: none;
  border-radius: 0 4px 4px 0;
}

.panel-toggle-right {
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.panel-toggle-bottom {
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
}

.tool-left-scrollbar {
  height: 100%;
  overflow: hidden;
}

.tool-left-scrollbar :deep(.el-scrollbar__wrap) {
  box-sizing: border-box;
  overflow-x: hidden !important;
  margin-bottom: 0 !important;
}

.tool-left-scrollbar :deep(.el-scrollbar__view) {
  overflow-x: hidden;
}

.tool-components-list {
  padding: 8px;
  box-sizing: border-box;
  height: 100%;
}

.tool-components-item {
  display: inline-block;
  width: 48%;
  margin: 1%;
  transition: transform 0ms !important;
}

.tool-components-draggable {
  padding-bottom: 20px;
}

.tool-components-title {
  font-size: 14px;
  color: var(--text-primary);
  margin: 6px 2px;
}

.tool-components-title :deep(.svg-icon) {
  color: var(--text-secondary);
  font-size: 18px;
}

.tool-components-body {
  padding: 8px 10px;
  background: #f6f7ff;
  font-size: 12px;
  cursor: move;
  border: 1px dashed #f6f7ff;
  border-radius: 3px;
}

.tool-components-body :deep(.svg-icon) {
  color: #777;
  font-size: 15px;
}

.tool-components-body:hover {
  border: 1px dashed #787be8;
  color: #787be8;
}

.tool-components-body:hover :deep(.svg-icon) {
  color: #787be8;
}

.tool-center-area {
  flex: 1;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 15px 10px 150px 10px;
  min-height: 100px;
}

.tool-drawing-board {
  width: 100%;
  min-height: 100px;
  flex: 1;
}

.tool-empty-info {
  color: var(--text-muted);
  font-size: 12px;
  padding: 12px;
}

.tool-workspace :deep(.field-content) {
  margin-bottom: 15px;
  padding: 12px 10px;
}

.tool-workspace :deep(.field-label) {
  font-size: 12px;
  color: #606266;
  line-height: 20px;
  margin-bottom: 6px;
}

.tool-workspace :deep(.drawing-item),
.tool-workspace :deep(.drawing-row-item) {
  position: relative;
}

.tool-workspace :deep(.drawing-row-item) {
  border: 1px dashed #ccc;
  border-radius: 3px;
  margin-bottom: 15px;
  padding: 0 2px;
}

.tool-workspace :deep(.drawing-item-copy),
.tool-workspace :deep(.drawing-item-delete) {
  display: none;
  position: absolute;
  top: -10px;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 50%;
  font-size: 12px;
  border: 1px solid;
  cursor: pointer;
  z-index: 1;
}

.tool-workspace :deep(.drawing-item-copy) {
  right: 56px;
  border-color: #409eff;
  color: #409eff;
  background: #fff;
}

.tool-workspace :deep(.drawing-item-delete) {
  right: 24px;
  border-color: #f56c6c;
  color: #f56c6c;
  background: #fff;
}

.tool-workspace :deep(.drawing-item:hover > .drawing-item-copy),
.tool-workspace :deep(.drawing-item:hover > .drawing-item-delete),
.tool-workspace :deep(.drawing-row-item:hover > .drawing-item-copy),
.tool-workspace :deep(.drawing-row-item:hover > .drawing-item-delete),
.tool-workspace :deep(.active-from-item > .drawing-item-copy),
.tool-workspace :deep(.active-from-item > .drawing-item-delete) {
  display: initial;
}

.tool-workspace :deep(.active-from-item > .field-content),
.tool-workspace :deep(.drawing-item:hover > .field-content),
.tool-workspace :deep(.drawing-row-item:hover > .field-content) {
  background: #f6f7ff;
  border-radius: 6px;
}

.tool-workspace :deep(.grid-row-item .grid-row-wrapper) {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: stretch;
  min-height: 120px;
}

.tool-workspace :deep(.grid-col-item) {
  min-width: 160px;
  flex-shrink: 0;
}

.tool-workspace :deep(.grid-col-item .grid-col-wrapper) {
  min-height: 90px;
  width: 100%;
}

.flex-1 {
  flex: 1;
}
</style>
