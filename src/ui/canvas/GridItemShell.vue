<script setup lang="ts">
import { computed, defineAsyncComponent, inject, watch, type Ref } from 'vue';
import { useSpecStore } from '@/core/store';
import { isContainer, isLeaf, isSlotHost } from '@/core/model/guards';
import { PALETTE_CONTAINERS, PALETTE_LEAVES } from '@/core/model/defaults';

const GridCanvas = defineAsyncComponent(() => import('./GridCanvas.vue'));
const NodeRenderer = defineAsyncComponent(() => import('./NodeRenderer.vue'));

const props = defineProps<{
  gridId: string;
  itemId: string;
  childId: string;
}>();

const specStore = useSpecStore();

const childNode = computed(() => specStore.currentSpec?.nodes[props.childId] || null);
const isLeafChild = computed(() => childNode.value != null && isLeaf(childNode.value));
const isSlotHostChild = computed(() => childNode.value != null && isContainer(childNode.value) && isSlotHost(childNode.value));

const childSlot = computed(() => {
  const node = childNode.value;
  if (!node || !isContainer(node) || !isSlotHost(node)) return null;
  return node.slot || null;
});

const childType = computed(() => childNode.value?.type || '');

const canAddSubItems = computed(() => isSlotHostChild.value || isLeafChild.value);

watch(
  childNode,
  node => {
    if (!node || !isContainer(node) || !isSlotHost(node)) return;
    if (node.slot?.kind === 'grid') return;
    specStore.ensureContainerGrid(node.id);
  },
  { immediate: true },
);

function onTypeChange(event: Event) {
  const newType = (event.target as HTMLSelectElement).value;
  if (!newType || newType === childType.value) return;

  specStore.select(props.childId);
  const newId = specStore.replaceSelected(newType);

  // Container types always get an internal grid
  if (newId) {
    specStore.ensureContainerGrid(newId);
  }
}

function addSubItem() {
  if (!specStore.currentSpec) return;

  if (isLeafChild.value) {
    // Convert leaf → gridItem container with internal grid, then add item
    specStore.select(props.childId);
    const newContainerId = specStore.replaceSelected('gridItem');
    if (!newContainerId) return;
    specStore.ensureContainerGrid(newContainerId);
    specStore.addToSlot(newContainerId, { kind: 'container', type: 'gridItem' }, 'append');
    return;
  }

  if (isSlotHostChild.value) {
    // Ensure internal grid exists before adding
    specStore.ensureContainerGrid(props.childId);
    specStore.addToSlot(props.childId, { kind: 'container', type: 'gridItem' }, 'append');
  }
}

function removeItem() {
  specStore.removeGridItemById(props.gridId, props.itemId);
}

// ── Auto-height: propagate nested grid content height to parent item ──

const SHELL_HEADER_HEIGHT = 26;
const NESTED_CANVAS_PADDING_Y = 16;

const parentRowHeight = inject<Ref<number>>('gridConfiguredRowHeight');
const parentMargin = inject<Ref<[number, number]>>('gridMargin');

const nestedGridNode = computed(() => {
  const slot = childSlot.value;
  if (!slot || slot.kind !== 'grid') return null;
  const node = specStore.currentSpec?.nodes[slot.gridId];
  if (!node || !isContainer(node) || node.type !== 'grid') return null;
  return node;
});

const nestedOccupiedRows = computed(() => {
  const grid = nestedGridNode.value;
  if (!grid?.items?.length) return 0;
  return grid.items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
});

const neededParentH = computed(() => {
  const rows = nestedOccupiedRows.value;
  if (rows <= 0) return 0;

  const nestedRowH = Number(nestedGridNode.value?.props.rowHeight || 30);
  const nestedMarginRaw = nestedGridNode.value?.props.margin;
  const nestedMarginY = Array.isArray(nestedMarginRaw) ? Number(nestedMarginRaw[1]) || 8 : 8;

  // Pixel height the nested grid content needs
  const contentPx =
    rows * nestedRowH +
    Math.max(0, rows - 1) * nestedMarginY +
    NESTED_CANVAS_PADDING_Y +
    SHELL_HEADER_HEIGHT;

  const pRowH = parentRowHeight?.value ?? 30;
  const pMarginY = parentMargin?.value?.[1] ?? 8;

  // vue-grid-layout: pixelH = h * rowH + (h-1) * marginY  →  h = (pixelH + marginY) / (rowH + marginY)
  return Math.max(2, Math.ceil((contentPx + pMarginY) / (pRowH + pMarginY)));
});

watch(
  neededParentH,
  (newH) => {
    if (newH <= 0) return;
    specStore.updateGridItemGeometry(props.gridId, props.itemId, { h: newH });
  },
  { immediate: true },
);
</script>

<template>
  <div class="grid-item-shell">
    <header class="shell-header">
      <select
        class="type-select"
        :value="childType"
        @change="onTypeChange"
        @mousedown.stop
        @pointerdown.stop
      >
        <optgroup label="容器">
          <option v-for="c in PALETTE_CONTAINERS" :key="c.type" :value="c.type">{{ c.label }}</option>
        </optgroup>
        <optgroup label="组件">
          <option v-for="l in PALETTE_LEAVES" :key="l.type" :value="l.type">{{ l.label }}</option>
        </optgroup>
      </select>

      <div class="shell-actions">
        <button v-if="canAddSubItems" class="action-btn add-btn" @click.stop="addSubItem" title="添加子项">+</button>
        <button class="action-btn remove-btn" @click.stop="removeItem" title="移除">×</button>
      </div>
    </header>

    <div class="shell-body">
      <!-- Slot host container with grid slot -> nested GridCanvas -->
      <template v-if="isSlotHostChild && childSlot">
        <div v-if="childSlot.kind === 'grid'" class="nested-grid" @mousedown.stop @touchstart.stop>
          <GridCanvas :grid-id="childSlot.gridId" compact />
        </div>
        <NodeRenderer v-else-if="childSlot.kind === 'single'" :node-id="childSlot.childId" />
        <div v-else class="empty-slot">
          <span class="empty-label">Empty</span>
          <button class="action-btn add-btn" @click.stop="addSubItem">+ 添加内容</button>
        </div>
      </template>

      <!-- Leaf node -->
      <div v-else-if="isLeafChild && childNode && isLeaf(childNode)" class="leaf-display">
        <code class="leaf-ref">{{ childNode.leafMeta.componentRef }}</code>
        <p v-if="childNode.leafMeta.description" class="leaf-desc">{{ childNode.leafMeta.description }}</p>
      </div>

      <!-- Fallback -->
      <div v-else class="empty-slot">
        <span class="empty-label">{{ childType || '未知' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-item-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shell-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 3px 6px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
}

.type-select {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 11px;
  padding: 2px 4px;
  cursor: pointer;
  outline: none;
}

.type-select:hover {
  border-color: var(--accent-primary);
}

.shell-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.action-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 4px;
}

.action-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.remove-btn:hover {
  color: var(--danger);
  background: rgba(255, 0, 0, 0.08);
}

.add-btn:hover {
  color: var(--accent-primary);
}

.shell-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  position: relative;
}

.nested-grid {
  height: 100%;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.empty-label {
  opacity: 0.6;
}

.leaf-display {
  padding: 6px 8px;
  font-size: 12px;
}

.leaf-ref {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  padding: 1px 4px;
  border-radius: 3px;
}

.leaf-desc {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 11px;
}
</style>
