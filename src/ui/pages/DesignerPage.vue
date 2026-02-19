<script setup lang="ts">
import { computed, ref } from 'vue';
import CanvasRoot from '@/ui/canvas/CanvasRoot.vue';
import InspectorPanel from '@/ui/inspector/InspectorPanel.vue';
import BlockPalette from '@/ui/palette/BlockPalette.vue';
import PromptPreview from '@/ui/promptPreview/PromptPreview.vue';
import { useDragFromOutside } from '@/ui/canvas/useDragFromOutside';
import { useSpecStore, useUIStore } from '@/core/store';
import { buildPrompt } from '@/core/prompt';
import { ElButton, ElTooltip } from 'element-plus';
import { Copy, Trash2 } from 'lucide-vue-next';

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
const isPreviewCollapsed = ref(true);
const isResizing = ref(false);

function setPreviewCollapsed(value: boolean) {
  isPreviewCollapsed.value = value;
}

function startResize(e: MouseEvent) {
  if (isPreviewCollapsed.value) return;

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
          <ElTooltip content="复制 DSL Prompt" placement="bottom" :show-after="400">
            <ElButton class="header-btn copy-btn" size="small" @click="copyDsl">
              <Copy :size="14" />
              复制 DSL
            </ElButton>
          </ElTooltip>
          <ElTooltip content="清空当前布局" placement="bottom" :show-after="400">
            <ElButton class="header-btn clear-btn" size="small" @click="clearLayout">
              <Trash2 :size="14" />
              清空
            </ElButton>
          </ElTooltip>
        </header>
        <div class="canvas-body">
          <CanvasRoot />
        </div>
      </div>

      <div v-if="!isPreviewCollapsed" class="resize-handle" @mousedown="startResize">
        <div class="resize-grip" />
      </div>

      <div class="main-preview" :class="{ collapsed: isPreviewCollapsed }" :style="!isPreviewCollapsed ? { flex: previewFlex } : undefined">
        <PromptPreview :collapsed="isPreviewCollapsed" @update:collapsed="setPreviewCollapsed" />
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
  gap: 12px;
  padding: 12px;
  background: transparent;
}

.panel {
  position: relative;
  background: linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.06) 0%, var(--bg-elevated) 24%, var(--bg-elevated) 100%);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  box-shadow:
    0 14px 36px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.38);
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal), transform var(--transition-normal);
}

.panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
  pointer-events: none;
}

.panel:hover {
  border-color: color-mix(in srgb, var(--accent-primary) 26%, var(--border-subtle) 74%);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.panel-left {
  width: clamp(260px, 21vw, 320px);
  flex-shrink: 0;
}

.panel-right {
  width: clamp(300px, 24vw, 370px);
  flex-shrink: 0;
}

.panel-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-main.resizing {
  user-select: none;
}

.main-canvas {
  flex: 8;
  min-height: 0;
  background: linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.03), var(--bg-elevated) 16%);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.1);
}

/* ── Canvas header ── */

.canvas-header {
  flex-shrink: 0;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.12) 0%, rgba(var(--accent-primary-rgb), 0.03) 100%);
  border-radius: 14px 14px 0 0;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.35);
}

.header-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--text-primary);
  margin-right: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Base header button via ElButton */
:deep(.header-btn.el-button) {
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all var(--transition-normal);
  --el-button-bg-color: var(--bg-base);
  --el-button-border-color: var(--border-subtle);
  --el-button-text-color: var(--text-secondary);
  --el-button-hover-border-color: rgba(var(--accent-primary-rgb), 0.45);
  --el-button-hover-text-color: var(--accent-primary);
  --el-button-hover-bg-color: var(--bg-base);
}

:deep(.header-btn.el-button:hover) {
  transform: translateY(-1px);
}

/* Copy DSL button */
:deep(.copy-btn.el-button) {
  --el-button-bg-color: rgba(var(--accent-primary-rgb), 0.08);
  --el-button-border-color: rgba(var(--accent-primary-rgb), 0.28);
  --el-button-text-color: var(--accent-primary);
  --el-button-hover-bg-color: rgba(var(--accent-primary-rgb), 0.14);
  --el-button-hover-border-color: rgba(var(--accent-primary-rgb), 0.45);
  --el-button-hover-text-color: var(--accent-primary);
}

/* Clear button */
:deep(.clear-btn.el-button:hover) {
  --el-button-hover-border-color: var(--danger);
  --el-button-hover-text-color: var(--danger);
  --el-button-hover-bg-color: var(--danger-subtle);
}

.canvas-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background:
    radial-gradient(circle at top right, rgba(var(--accent-primary-rgb), 0.08) 0%, transparent 32%),
    transparent;
}

/* ── Preview & resize ── */

.main-preview {
  flex: 2;
  min-height: 0;
  display: flex;
  background: linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.04), var(--bg-elevated) 20%);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.1);
}

.main-preview.collapsed {
  flex: 0 0 112px;
  min-height: 112px;
  border-style: dashed;
  background: linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.08), rgba(var(--accent-primary-rgb), 0.02));
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.resize-handle {
  flex-shrink: 0;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: row-resize;
}

.resize-grip {
  width: 56px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(var(--accent-primary-rgb), 0.16), rgba(var(--accent-primary-rgb), 0.42), rgba(var(--accent-primary-rgb), 0.16));
  transition: transform var(--transition-normal), filter var(--transition-normal);
}

.resize-handle:hover .resize-grip {
  transform: scaleX(1.08);
  filter: brightness(1.1);
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel {
  animation: panel-in 260ms ease both;
}

.panel-left {
  animation-delay: 40ms;
}

.panel-main {
  animation: panel-in 260ms ease both;
  animation-delay: 90ms;
}

.panel-right {
  animation-delay: 130ms;
}

@media (max-width: 1280px) {
  .designer-page {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    overflow: auto;
  }

  .panel-left,
  .panel-right {
    width: 100%;
    flex-shrink: 0;
    max-height: 280px;
  }

  .panel-main {
    min-height: 560px;
  }

  .main-preview {
    min-height: 220px;
  }

  .main-preview.collapsed {
    flex-basis: 104px;
    min-height: 104px;
  }
}

@media (max-width: 768px) {
  .canvas-header {
    padding: 8px 10px;
    gap: 6px;
    flex-wrap: wrap;
  }

  .header-name {
    width: 100%;
    margin-right: 0;
  }

  .header-btn {
    flex: 1;
    justify-content: center;
  }

  .panel-left,
  .panel-right {
    max-height: 240px;
  }
}
</style>
