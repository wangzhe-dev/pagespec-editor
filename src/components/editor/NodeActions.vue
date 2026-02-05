<script setup lang="ts">
/**
 * NodeActions - 节点操作按钮组件
 * 悬停时显示复制和删除按钮
 */
import { usePagesStore, useUIStore } from '@/app/store';
import type { GridCell, LayoutNode } from '@/domain/schema';
import { Copy, Trash2 } from 'lucide-vue-next';
import { nanoid } from 'nanoid';

const props = defineProps<{
  node: LayoutNode;
  show: boolean;
}>();

const pagesStore = usePagesStore();
const uiStore = useUIStore();

const GRID_COLUMNS = 24;
const MIN_COL_SPAN = 3;

function clampSpan(value: number): number {
  if (Number.isNaN(value)) return 1;
  return Math.min(Math.max(Math.round(value), 1), GRID_COLUMNS);
}

function splitRows(nodes: LayoutNode[]): LayoutNode[][] {
  const rows: LayoutNode[][] = [];
  let current: LayoutNode[] = [];
  let currentSpan = 0;

  const getSpan = (node: LayoutNode) => {
    if (node.type === 'GridCell') {
      return clampSpan((node as GridCell).colSpan ?? 1);
    }
    return GRID_COLUMNS;
  };

  nodes.forEach((node) => {
    const span = getSpan(node);
    if (current.length > 0 && currentSpan + span > GRID_COLUMNS) {
      rows.push(current);
      current = [];
      currentSpan = 0;
    }
    current.push(node);
    currentSpan += span;
  });

  if (current.length > 0) rows.push(current);
  return rows;
}

function findParent(root: LayoutNode, nodeId: string): { parent: LayoutNode; index: number } | null {
  if ('children' in root && Array.isArray(root.children)) {
    for (let i = 0; i < root.children.length; i++) {
      if (root.children[i].id === nodeId) {
        return { parent: root, index: i };
      }
      const found = findParent(root.children[i], nodeId);
      if (found) return found;
    }
  }
  return null;
}

function splitSpanWithMin(span: number): [number, number] {
  let left = Math.floor(span / 2);
  let right = span - left;

  if (left < MIN_COL_SPAN || right < MIN_COL_SPAN) {
    left = Math.ceil(span / 2);
    right = span - left;
  }

  if (left < MIN_COL_SPAN || right < MIN_COL_SPAN) {
    // 无法满足最小值时，退化为尽量平均
    left = Math.max(1, Math.floor(span / 2));
    right = Math.max(1, span - left);
  }

  return [left, right];
}

function adjustRowTotal(
  rowCells: GridCell[],
  primaryGrow: GridCell,
  primaryShrink: GridCell,
) {
  let total = rowCells.reduce((sum, cell) => sum + clampSpan(cell.colSpan ?? 1), 0);
  let diff = GRID_COLUMNS - total;

  if (diff === 0) return;

  if (diff > 0) {
    primaryGrow.colSpan = clampSpan((primaryGrow.colSpan ?? 1) + diff);
    return;
  }

  let remaining = -diff;
  const order = [
    primaryGrow,
    primaryShrink,
    ...rowCells.filter(cell => cell.id !== primaryGrow.id && cell.id !== primaryShrink.id),
  ];

  for (const cell of order) {
    if (remaining <= 0) break;
    const current = clampSpan(cell.colSpan ?? 1);
    const minSpan = Math.min(MIN_COL_SPAN, current);
    const available = current - minSpan;
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    cell.colSpan = current - take;
    remaining -= take;
  }

  if (remaining > 0) {
    const fallback = order[order.length - 1];
    fallback.colSpan = Math.max(1, clampSpan(fallback.colSpan ?? 1) - remaining);
  }
}

function applyRowLayout(rowCells: GridCell[]) {
  let nextStart = 1;
  rowCells.forEach((cell) => {
    cell.colStart = nextStart;
    cell.colSpan = clampSpan(cell.colSpan ?? 1);
    cell.colSpanLocked = true;
    nextStart += cell.colSpan;
  });
}

function duplicateGridCell(): boolean {
  const page = pagesStore.activePage;
  if (!page) return false;

  const root = page.root as LayoutNode;
  const result = findParent(root, props.node.id);
  if (!result || !('children' in result.parent)) return false;

  const siblings = result.parent.children as LayoutNode[];
  const rows = splitRows(siblings);
  const targetRow = rows.find(row => row.some(node => node.id === props.node.id)) ?? null;

  const cloned = JSON.parse(JSON.stringify(props.node)) as GridCell;
  function regenerateIds(node: any) {
    node.id = nanoid(8);
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(regenerateIds);
    }
  }
  regenerateIds(cloned);
  cloned.label = (cloned.label || cloned.type) + ' 副本';

  siblings.splice(result.index + 1, 0, cloned);
  page.updatedAt = Date.now();

  if (targetRow) {
    const rowCells = targetRow.filter(node => node.type === 'GridCell') as GridCell[];
    const originalCell = rowCells.find(cell => cell.id === props.node.id);
    if (originalCell) {
      const insertAt = rowCells.findIndex(cell => cell.id === originalCell.id);
      const rowCellsAfter = rowCells.slice();
      rowCellsAfter.splice(insertAt + 1, 0, cloned);

      const totalBefore = rowCells.reduce((sum, cell) => sum + clampSpan(cell.colSpan ?? 1), 0);
      const remaining = GRID_COLUMNS - totalBefore;
      const originalSpan = clampSpan(originalCell.colSpan ?? 1);

      if (remaining >= MIN_COL_SPAN) {
        cloned.colSpan = remaining;
      } else {
        const [left, right] = splitSpanWithMin(originalSpan);
        originalCell.colSpan = left;
        cloned.colSpan = right + Math.max(remaining, 0);
      }

      adjustRowTotal(rowCellsAfter, cloned, originalCell);
      applyRowLayout(rowCellsAfter);
    }
  }

  uiStore.selectNode(cloned.id);
  return true;
}

// 复制节点
function duplicateNode() {
  const page = pagesStore.activePage;
  if (!page) return;

  if (props.node.type === 'GridCell') {
    if (duplicateGridCell()) return;
  }

  // 深拷贝节点
  const cloned = JSON.parse(JSON.stringify(props.node));
  // 重新生成唯一 ID
  function regenerateIds(node: any) {
    node.id = nanoid(8);
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(regenerateIds);
    }
  }
  regenerateIds(cloned);
  cloned.label = (cloned.label || cloned.type) + ' 副本';

  // 找到父节点并插入
  pagesStore.insertAfterNode(page.id, props.node.id, cloned);
  uiStore.selectNode(cloned.id);
}

// 删除节点
function deleteNode() {
  const page = pagesStore.activePage;
  if (!page) return;
  pagesStore.removeNode(page.id, props.node.id);
  uiStore.selectNode(null);
}
</script>

<template>
  <div v-if="show" class="node-actions">
    <button class="action-btn" @click.stop="duplicateNode" title="复制">
      <Copy :size="12" />
    </button>
    <button class="action-btn delete-btn" @click.stop="deleteNode" title="删除">
      <Trash2 :size="12" />
    </button>
  </div>
</template>

<style scoped>
.node-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.action-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: #ef4444;
}
</style>
