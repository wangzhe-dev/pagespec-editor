<script setup lang="ts">
import { computed, ref } from 'vue';
import CanvasRoot from '@/ui/canvas/CanvasRoot.vue';
import InspectorPanel from '@/ui/inspector/InspectorPanel.vue';
import BlockPalette from '@/ui/palette/BlockPalette.vue';
import PromptPreview from '@/ui/promptPreview/PromptPreview.vue';
import { useDragFromOutside } from '@/ui/canvas/useDragFromOutside';
import { useSpecStore, useUIStore } from '@/core/store';
import { buildPrompt } from '@/core/prompt';

const specStore = useSpecStore();
const uiStore = useUIStore();
const { updateMouse } = useDragFromOutside();

function onGlobalDragOver(e: DragEvent) {
  e.preventDefault();
  updateMouse(e.clientX, e.clientY);
}

// ── Copy DSL ──

const specName = computed(() => specStore.currentSpec?.meta.name ?? '');

async function copyDsl() {
  if (!specStore.currentSpec) return;
  const result = buildPrompt(specStore.currentSpec, {
    mode: 'long',
    includeGeometry: true,
  });
  try {
    await navigator.clipboard.writeText(result.rawText);
    uiStore.showToast('success', 'DSL 已复制');
  } catch {
    uiStore.showToast('error', '复制失败');
  }
}

// ── Clear layout ──

function clearLayout() {
  specStore.createNewSpec(specName.value || '新页面');
}

// ── Resizable bottom panel ──

const mainRef = ref<HTMLElement | null>(null);
const canvasFlex = ref(8);
const previewFlex = ref(2);
const isResizing = ref(false);

function startResize(e: MouseEvent) {
  e.preventDefault();
  const mainEl = mainRef.value;
  if (!mainEl) return;

  isResizing.value = true;
  const startY = e.clientY;
  const startCanvasFlex = canvasFlex.value;
  const startPreviewFlex = previewFlex.value;
  const totalFlex = startCanvasFlex + startPreviewFlex;
  const mainHeight = mainEl.clientHeight;

  function onMouseMove(ev: MouseEvent) {
    const dy = ev.clientY - startY;
    const dFlex = (dy / mainHeight) * totalFlex;
    canvasFlex.value = Math.max(1, startCanvasFlex + dFlex);
    previewFlex.value = Math.max(1, startPreviewFlex - dFlex);
  }

  function onMouseUp() {
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
</script>

<template>
  <main class="designer-page" @dragover="onGlobalDragOver" @drop.prevent>
    <aside class="panel panel-left">
      <BlockPalette />
    </aside>

    <section ref="mainRef" class="panel-main" :class="{ resizing: isResizing }">
      <div class="main-canvas" :style="{ flex: canvasFlex }">
        <header class="canvas-header">
          <span class="header-name">{{ specName || 'Untitled' }}</span>
          <button class="header-btn copy-btn" @click="copyDsl" title="复制 DSL">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            复制 DSL
          </button>
          <button class="header-btn clear-btn" @click="clearLayout" title="清空布局">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            清空
          </button>
        </header>
        <div class="canvas-body">
          <CanvasRoot />
        </div>
      </div>
      <div class="resize-handle" @mousedown="startResize">
        <div class="resize-grip" />
      </div>
      <div class="main-preview" :style="{ flex: previewFlex }">
        <PromptPreview />
      </div>
    </section>

    <aside class="panel panel-right">
      <InspectorPanel />
    </aside>
  </main>
</template>

<style scoped>
.designer-page {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 8px;
  padding: 8px;
  background: var(--bg-base);
}

.panel {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.panel-left {
  width: 300px;
  flex-shrink: 0;
}

.panel-right {
  width: 340px;
  flex-shrink: 0;
}

.panel-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.panel-main.resizing {
  user-select: none;
}

.main-canvas {
  flex: 8;
  min-height: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Canvas header ── */

.canvas-header {
  flex-shrink: 0;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  border-radius: 10px 10px 0 0;
}

.header-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-right: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.header-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.clear-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.canvas-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* ── Preview & resize ── */

.main-preview {
  flex: 2;
  min-height: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: auto;
}

.resize-handle {
  flex-shrink: 0;
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: row-resize;
}

.resize-grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--border-subtle);
  transition: background 0.15s;
}

.resize-handle:hover .resize-grip {
  background: var(--accent-primary);
}

@media (max-width: 1280px) {
  .designer-page {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }

  .panel-left,
  .panel-right {
    width: 100%;
    flex-shrink: 0;
  }
}
</style>
