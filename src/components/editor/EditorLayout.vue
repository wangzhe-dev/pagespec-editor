<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePagesStore, useUIStore } from '@/app/store';
import TemplateLibraryPanel from './TemplateLibraryPanel.vue';
import GridLayoutView from './GridLayoutView.vue';
import PropertyInspector from './PropertyInspector.vue';
import PromptPreviewDock from './PromptPreviewDock.vue';
import EditorToolbar from './EditorToolbar.vue';
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

// 面板状态
const leftPanelOpen = computed(() => uiStore.panelVisibility.pages || uiStore.panelVisibility.tree);
const rightPanelOpen = computed(() => uiStore.panelVisibility.properties);
const bottomPanelOpen = computed(() => uiStore.panelVisibility.preview);

// 拖拽调整尺寸
const isResizingLeft = ref(false);
const isResizingRight = ref(false);
const isResizingBottom = ref(false);

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
  <div class="editor-layout" :class="{ 'resizing': isResizingLeft || isResizingRight || isResizingBottom }">
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
        <TemplateLibraryPanel class="panel-section flex-1" />
        
        <!-- Left resize handle -->
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
        <GridLayoutView />
        
        <!-- Bottom Panel -->
        <div 
          v-if="bottomPanelOpen && pagesStore.activePage"
          class="editor-bottom"
          :style="{ height: uiStore.panelSizes.bottomHeight + 'px' }"
        >
          <!-- Bottom resize handle -->
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

.flex-1 {
  flex: 1;
}
</style>
