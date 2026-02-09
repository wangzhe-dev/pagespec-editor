<script setup lang="ts">
import { ref } from 'vue';
import CanvasRoot from '@/ui/canvas/CanvasRoot.vue';
import InspectorPanel from '@/ui/inspector/InspectorPanel.vue';
import BlockPalette from '@/ui/palette/BlockPalette.vue';
import PromptPreview from '@/ui/promptPreview/PromptPreview.vue';
import { useDragFromOutside } from '@/ui/canvas/useDragFromOutside';

const { updateMouse } = useDragFromOutside();

function onGlobalDragOver(e: DragEvent) {
  e.preventDefault();
  updateMouse(e.clientX, e.clientY);
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
        <CanvasRoot />
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
  height: 100vh;
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
  overflow: auto;
}

.main-preview {
  flex: 2;
  min-height: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: auto;
}

/* ── Resize handle ── */

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
