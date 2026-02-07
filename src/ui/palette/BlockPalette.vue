<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore } from '@/core/store';

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
      { x: 0, y: 0, w: 6, h: 8 },
      { x: 6, y: 0, w: 6, h: 8 },
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
      { x: 0, y: 0, w: 4, h: 8 },
      { x: 4, y: 0, w: 4, h: 8 },
      { x: 8, y: 0, w: 4, h: 8 },
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
    name: 'top-2bottom',
    label: '上 + 下二',
    desc: '上方整行，下方两列',
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
      { x: 0, y: 0, w: 6, h: 8 },
      { x: 6, y: 0, w: 6, h: 4 },
      { x: 6, y: 4, w: 6, h: 4 },
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
      { x: 0, y: 0, w: 6, h: 4 },
      { x: 0, y: 4, w: 6, h: 4 },
      { x: 6, y: 0, w: 6, h: 8 },
    ],
    previewCols: '1fr 1fr',
    previewRows: '1fr 1fr',
    preview: [
      { col: '1', row: '1' },
      { col: '1', row: '2' },
      { col: '2', row: '1 / 3' },
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
</script>

<template>
  <section class="palette">
    <header class="palette-header">
      <h3>布局</h3>
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
  margin-bottom: 12px;
}

.palette-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
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
