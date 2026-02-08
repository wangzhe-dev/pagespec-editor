<script setup lang="ts">
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
</script>

<template>
  <main class="designer-page" @dragover="onGlobalDragOver" @drop.prevent>
    <aside class="panel panel-left">
      <BlockPalette />
    </aside>
    <section class="panel panel-main">
      <CanvasRoot />
    </section>
    <aside class="panel panel-right">
      <InspectorPanel />
    </aside>
    <footer class="panel panel-bottom">
      <PromptPreview />
    </footer>
  </main>
</template>

<style scoped>
.designer-page {
  display: grid;
  grid-template-columns: 300px 1fr 340px;
  grid-template-rows: 1fr 260px;
  grid-template-areas:
    'left main right'
    'bottom bottom bottom';
  height: calc(100vh - 48px);
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
  grid-area: left;
}

.panel-main {
  grid-area: main;
}

.panel-right {
  grid-area: right;
}

.panel-bottom {
  grid-area: bottom;
}

@media (max-width: 1280px) {
  .designer-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
    grid-template-areas:
      'left'
      'main'
      'right'
      'bottom';
    height: auto;
    min-height: calc(100vh - 48px);
  }
}
</style>
