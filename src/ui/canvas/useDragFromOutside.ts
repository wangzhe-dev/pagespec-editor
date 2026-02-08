import { reactive, ref } from 'vue';
import type { BlockPick } from '@/core/store/specStore';

export const DROP_ITEM_ID = '__drop__';
export const DEFAULT_DROP_W = 4;
export const DEFAULT_DROP_H = 4;

export interface DropResult {
  gridId: string;
  payload: BlockPick;
}

interface GridRegistration {
  el: HTMLElement;
  getLayoutRef: () => any;
}

// ── Module-level singleton state (shared across all GridCanvas instances) ──

const mouseXY = reactive({ x: 0, y: 0 });
const isDragging = ref(false);
const dragPayload = ref<BlockPick | null>(null);
const dropResult = ref<DropResult | null>(null);

const gridRegistry = new Map<string, GridRegistration>();

function registerGrid(gridId: string, reg: GridRegistration) {
  gridRegistry.set(gridId, reg);
}

function unregisterGrid(gridId: string) {
  gridRegistry.delete(gridId);
}

function startDrag(payload: BlockPick) {
  isDragging.value = true;
  dragPayload.value = payload;
}

/**
 * Called on dragend. If the mouse is over a registered grid, sets `dropResult`
 * so the matching GridCanvas can finalize the drop. Otherwise just cleans up.
 */
function endDrag() {
  if (isDragging.value && dragPayload.value) {
    const targetId = findDeepestGrid(mouseXY.x, mouseXY.y);
    if (targetId && gridRegistry.has(targetId)) {
      dropResult.value = {
        gridId: targetId,
        payload: { ...dragPayload.value },
      };
      // GridCanvas watches dropResult and calls confirmDrop() after handling.
      // Safety fallback: auto-cleanup if nothing handles within 200ms.
      setTimeout(() => {
        if (dropResult.value) confirmDrop();
      }, 200);
      return;
    }
  }
  isDragging.value = false;
  dragPayload.value = null;
}

/** Called by the target GridCanvas after it has created the real node. */
function confirmDrop() {
  dropResult.value = null;
  isDragging.value = false;
  dragPayload.value = null;
}

function updateMouse(x: number, y: number) {
  mouseXY.x = x;
  mouseXY.y = y;
}

/**
 * Finds the smallest registered grid element whose bounding rect contains (x, y).
 * Smallest area = deepest nested grid.
 */
function findDeepestGrid(x: number, y: number): string | null {
  let bestId: string | null = null;
  let bestArea = Infinity;

  for (const [gridId, reg] of gridRegistry) {
    const rect = reg.el.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      const area = rect.width * rect.height;
      if (area < bestArea) {
        bestArea = area;
        bestId = gridId;
      }
    }
  }

  return bestId;
}

export function useDragFromOutside() {
  return {
    mouseXY,
    isDragging,
    dragPayload,
    dropResult,
    gridRegistry,
    registerGrid,
    unregisterGrid,
    startDrag,
    endDrag,
    confirmDrop,
    updateMouse,
    findDeepestGrid,
  };
}
