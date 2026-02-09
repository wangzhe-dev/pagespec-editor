<script setup lang="ts">
import { useSpecStore } from '@/core/store';
import { useDragFromOutside } from '@/ui/canvas/useDragFromOutside';
import { computed } from 'vue';

interface LayoutPreset {
  name: string;
  label: string;
  desc: string;
  items: Array<{ x: number; y: number; w: number; h: number }>;
  /** Grid cell layout for preview: [cols, rows] per item */
  preview: Array<{ col: string; row: string }>;
  previewCols: string;
  previewRows: string;
}

const LAYOUT_PRESETS: LayoutPreset[] = [

  {
    name: 'top-bottom',
    label: '上下',
    desc: '两行平分',
    items: [
      { x: 0, y: 0, w: 12, h: 6 },
      { x: 0, y: 6, w: 12, h: 6 },
    ],
    previewCols: '1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '1', row: '2' },
    ],
  },
  {
    name: 'top-2bottom',
    label: '上+下2',
    desc: '上方整行，下方左右两列',
    items: [
      { x: 0, y: 0, w: 12, h: 6 },
      { x: 0, y: 6, w: 6, h: 6 },
      { x: 6, y: 6, w: 6, h: 6 },
    ],
    previewCols: '1fr 1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1 / 3', row: '1' },
      { col: '1', row: '2' },
      { col: '2', row: '2' },
    ],
  },
  {
    name: 'top-mid-bottom',
    label: '上中下',
    desc: '三行平分',
    items: [
      { x: 0, y: 0, w: 12, h: 4 },
      { x: 0, y: 4, w: 12, h: 4 },
      { x: 0, y: 8, w: 12, h: 4 },
    ],
    previewCols: '1fr',
    previewRows: '1fr 1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '1', row: '2' },
      { col: '1', row: '3' },
    ],
  },
  {
    name: 'left-right',
    label: '左右',
    desc: '两列平分',
    items: [
      { x: 0, y: 0, w: 6, h: 12 },
      { x: 6, y: 0, w: 6, h: 12 },
    ],
    previewCols: '1fr 1fr',
    previewRows: '1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '2', row: '1' },
    ],
  },
  {
    name: 'left-mid-right',
    label: '左中右',
    desc: '三列平分',
    items: [
      { x: 0, y: 0, w: 4, h: 12 },
      { x: 4, y: 0, w: 4, h: 12 },
      { x: 8, y: 0, w: 4, h: 12 },
    ],
    previewCols: '1fr 1fr 1fr',
    previewRows: '1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '2', row: '1' },
      { col: '3', row: '1' },
    ],
  },
  {
    name: '2x2',
    label: '2×2',
    desc: '四宫格',
    items: [
      { x: 0, y: 0, w: 6, h: 6 },
      { x: 6, y: 0, w: 6, h: 6 },
      { x: 0, y: 6, w: 6, h: 6 },
      { x: 6, y: 6, w: 6, h: 6 },
    ],
    previewCols: '1fr 1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '2', row: '1' },
      { col: '1', row: '2' },
      { col: '2', row: '2' },
    ],
  },
  {
    name: '2top-bottom',
    label: '上二 + 下',
    desc: '上方两列，下方整行',
    items: [
      { x: 0, y: 0, w: 6, h: 6 },
      { x: 6, y: 0, w: 6, h: 6 },
      { x: 0, y: 6, w: 12, h: 6 },
    ],
    previewCols: '1fr 1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '2', row: '1' },
      { col: '1 / 3', row: '2' },
    ],
  },
  {
    name: 'left-2right',
    label: '左 + 右二',
    desc: '左侧整列，右侧上下',
    items: [
      { x: 0, y: 0, w: 6, h: 12 },
      { x: 6, y: 0, w: 6, h: 6 },
      { x: 6, y: 6, w: 6, h: 6 },
    ],
    previewCols: '1fr 1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1', row: '1 / 3' },
      { col: '2', row: '1' },
      { col: '2', row: '2' },
    ],
  },
  {
    name: '2left-right',
    label: '左二 + 右',
    desc: '左侧上下，右侧整列',
    items: [
      { x: 0, y: 0, w: 6, h: 6 },
      { x: 0, y: 6, w: 6, h: 6 },
      { x: 6, y: 0, w: 6, h: 12 },
    ],
    previewCols: '1fr 1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '1', row: '2' },
      { col: '2', row: '1 / 3' },
    ],
  },

    {
    name: '3x3',
    label: '3×3',
    desc: '三列三行九宫格',
    items: [
      { x: 0, y: 0, w: 4, h: 4 },
      { x: 4, y: 0, w: 4, h: 4 },
      { x: 8, y: 0, w: 4, h: 4 },
      { x: 0, y: 4, w: 4, h: 4 },
      { x: 4, y: 4, w: 4, h: 4 },
      { x: 8, y: 4, w: 4, h: 4 },
      { x: 0, y: 8, w: 4, h: 4 },
      { x: 4, y: 8, w: 4, h: 4 },
      { x: 8, y: 8, w: 4, h: 4 },
    ],
    previewCols: '1fr 1fr 1fr',
    previewRows: '1fr 1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '2', row: '1' },
      { col: '3', row: '1' },
      { col: '1', row: '2' },
      { col: '2', row: '2' },
      { col: '3', row: '2' },
      { col: '1', row: '3' },
      { col: '2', row: '3' },
      { col: '3', row: '3' },
    ],
  },
  {
    name: '3x2',
    label: '3×2',
    desc: '三列两行六宫格',
    items: [
      { x: 0, y: 0, w: 4, h: 6 },
      { x: 4, y: 0, w: 4, h: 6 },
      { x: 8, y: 0, w: 4, h: 6 },
      { x: 0, y: 6, w: 4, h: 6 },
      { x: 4, y: 6, w: 4, h: 6 },
      { x: 8, y: 6, w: 4, h: 6 },
    ],
    previewCols: '1fr 1fr 1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '2', row: '1' },
      { col: '3', row: '1' },
      { col: '1', row: '2' },
      { col: '2', row: '2' },
      { col: '3', row: '2' },
    ],
  },
  {
    name: '4x2',
    label: '4×2',
    desc: '四列两行八宫格',
    items: [
      { x: 0, y: 0, w: 3, h: 6 },
      { x: 3, y: 0, w: 3, h: 6 },
      { x: 6, y: 0, w: 3, h: 6 },
      { x: 9, y: 0, w: 3, h: 6 },
      { x: 0, y: 6, w: 3, h: 6 },
      { x: 3, y: 6, w: 3, h: 6 },
      { x: 6, y: 6, w: 3, h: 6 },
      { x: 9, y: 6, w: 3, h: 6 },
    ],
    previewCols: '1fr 1fr 1fr 1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '2', row: '1' },
      { col: '3', row: '1' },
      { col: '4', row: '1' },
      { col: '1', row: '2' },
      { col: '2', row: '2' },
      { col: '3', row: '2' },
      { col: '4', row: '2' },
    ],
  },
  {
    name: 'top1-mid3-bottom1',
    label: '上1中3下1',
    desc: '上下一整行，中间三列',
    items: [
      { x: 0, y: 0, w: 12, h: 3 },
      { x: 0, y: 3, w: 4, h: 6 },
      { x: 4, y: 3, w: 4, h: 6 },
      { x: 8, y: 3, w: 4, h: 6 },
      { x: 0, y: 9, w: 12, h: 3 },
    ],
    previewCols: '1fr 1fr 1fr',
    previewRows: '0.8fr 1.6fr 0.8fr',
    preview: [
      { col: '1 / 4', row: '1' },
      { col: '1', row: '2' },
      { col: '2', row: '2' },
      { col: '3', row: '2' },
      { col: '1 / 4', row: '3' },
    ],
  },
  {
    name: 'top1-mid2-bottom3',
    label: '上1中2下3',
    desc: '上方一整行，中间两列，下方三列',
    items: [
      { x: 0, y: 0, w: 12, h: 3 },
      { x: 0, y: 3, w: 6, h: 4 },
      { x: 6, y: 3, w: 6, h: 4 },
      { x: 0, y: 7, w: 4, h: 5 },
      { x: 4, y: 7, w: 4, h: 5 },
      { x: 8, y: 7, w: 4, h: 5 },
    ],
    previewCols: '1fr 1fr 1fr 1fr 1fr 1fr',
    previewRows: '0.8fr 1fr 1.2fr',
    preview: [
      { col: '1 / 7', row: '1' },
      { col: '1 / 4', row: '2' },
      { col: '4 / 7', row: '2' },
      { col: '1 / 3', row: '3' },
      { col: '3 / 5', row: '3' },
      { col: '5 / 7', row: '3' },
    ],
  },
  {
    name: 'top3-mid2-bottom1',
    label: '上3中2下1',
    desc: '上方三列，中间两列，下方一整行',
    items: [
      { x: 0, y: 0, w: 4, h: 4 },
      { x: 4, y: 0, w: 4, h: 4 },
      { x: 8, y: 0, w: 4, h: 4 },
      { x: 0, y: 4, w: 6, h: 4 },
      { x: 6, y: 4, w: 6, h: 4 },
      { x: 0, y: 8, w: 12, h: 4 },
    ],
    previewCols: '1fr 1fr 1fr 1fr 1fr 1fr',
    previewRows: '1fr 1fr 1fr',
    preview: [
      { col: '1 / 3', row: '1' },
      { col: '3 / 5', row: '1' },
      { col: '5 / 7', row: '1' },
      { col: '1 / 4', row: '2' },
      { col: '4 / 7', row: '2' },
      { col: '1 / 7', row: '3' },
    ],
  },
];

const specStore = useSpecStore();

const hostId = computed(() => {
  return specStore.selectedSlotHostId || specStore.currentSpec?.rootId || null;
});

function applyPreset(preset: LayoutPreset) {
  if (!hostId.value) return;
  specStore.applyLayoutPreset(hostId.value, preset.items);
}

// ── Drag GridItem from palette into canvas ──
const { startDrag, endDrag } = useDragFromOutside();

function onDragStart(e: DragEvent) {
  startDrag({ kind: 'container', type: 'gridItem' });
  // Required for HTML5 DnD
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', 'gridItem');
  }
}

function onDragEnd() {
  endDrag();
}
</script>

<template>
  <section class="palette">
    <header class="palette-header">
      <h3>布局</h3>
      <div
        class="drag-block"
        draggable="true"
        title="拖动到右侧画布添加 GridItem"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
      >
        <span class="drag-block-icon">+</span>
        <span class="drag-block-label">GridItem</span>
      </div>
    </header>

    <div class="preset-grid">
      <button
        v-for="preset in LAYOUT_PRESETS"
        :key="preset.name"
        class="preset-card"
        :title="preset.desc"
        @click="applyPreset(preset)"
      >
        <div
          class="preset-preview"
          :style="{
            gridTemplateColumns: preset.previewCols,
            gridTemplateRows: preset.previewRows,
          }"
        >
          <div
            v-for="(cell, idx) in preset.preview"
            :key="idx"
            class="preview-cell"
            :style="{
              gridColumn: cell.col,
              gridRow: cell.row,
            }"
          />
        </div>
        <span class="preset-label">{{ preset.label }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.palette {
  padding: 12px;
}

.palette-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.palette-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.drag-block {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px dashed var(--border-strong);
  border-radius: 6px;
  background: var(--bg-base);
  cursor: grab;
  font-size: 11px;
  color: var(--text-secondary);
  user-select: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.drag-block:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
}

.drag-block:active {
  cursor: grabbing;
}

.drag-block-icon {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.drag-block-label {
  font-size: 11px;
  white-space: nowrap;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-base);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.preset-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
}

.preset-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  display: grid;
  gap: 2px;
  border-radius: 4px;
  overflow: hidden;
}

.preview-cell {
  background: var(--border-strong);
  border-radius: 2px;
  min-height: 0;
}

.preset-label {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
