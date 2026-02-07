import { createGridItemId } from '../model/id';
import type { GridItem, Spec } from '../model/types';
import { assertOrThrow, getGridContainer, touch } from './internal';

interface Size {
  w: number;
  h: number;
}

function normalizeSize(size?: Partial<Size>): Size {
  const w = Math.max(1, Math.floor(size?.w ?? 4));
  const h = Math.max(1, Math.floor(size?.h ?? 4));
  return { w, h };
}

function collides(a: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>, b: Pick<GridItem, 'x' | 'y' | 'w' | 'h'>): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

export function findAutoPlace(
  spec: Spec,
  gridId: string,
  preferredSize?: Partial<Size>,
): Pick<GridItem, 'x' | 'y' | 'w' | 'h'> {
  const grid = getGridContainer(spec, gridId);
  const size = normalizeSize(preferredSize);
  const colNum = Math.max(1, Number(grid.props.colNum || 12));
  const w = Math.min(size.w, colNum);
  const h = size.h;

  const items = (grid.items || []).slice();
  const maxY = items.length ? Math.max(...items.map(item => item.y + item.h)) : 0;

  for (let y = 0; y <= maxY + 100; y += 1) {
    for (let x = 0; x <= colNum - w; x += 1) {
      const candidate = { x, y, w, h };
      const blocked = items.some(item => collides(candidate, item));
      if (!blocked) {
        return candidate;
      }
    }
  }

  return { x: 0, y: maxY, w, h };
}

export function addGridItem(
  spec: Spec,
  gridId: string,
  childId: string,
  placement?: Partial<Pick<GridItem, 'x' | 'y' | 'w' | 'h'>>,
): string {
  const grid = getGridContainer(spec, gridId);
  const child = spec.nodes[childId];
  if (!child) {
    throw new Error(`child node not found: ${childId}`);
  }

  const auto = findAutoPlace(spec, gridId, placement);
  const item: GridItem = {
    itemId: createGridItemId(),
    childId,
    x: placement?.x ?? auto.x,
    y: placement?.y ?? auto.y,
    w: placement?.w ?? auto.w,
    h: placement?.h ?? auto.h,
  };

  if (!Array.isArray(grid.items)) {
    grid.items = [];
  }
  grid.items.push(item);

  touch(spec);
  assertOrThrow(spec, 'addGridItem');
  return item.itemId;
}

export function removeGridItem(spec: Spec, gridId: string, itemId: string): boolean {
  const grid = getGridContainer(spec, gridId);
  if (!Array.isArray(grid.items)) {
    return false;
  }

  const index = grid.items.findIndex(item => item.itemId === itemId);
  if (index < 0) {
    return false;
  }

  grid.items.splice(index, 1);

  touch(spec);
  assertOrThrow(spec, 'removeGridItem');
  return true;
}

export function updateGridGeom(
  spec: Spec,
  gridId: string,
  itemId: string,
  patch: Partial<Pick<GridItem, 'x' | 'y' | 'w' | 'h'>>,
): boolean {
  const grid = getGridContainer(spec, gridId);
  const item = (grid.items || []).find(entry => entry.itemId === itemId);
  if (!item) {
    return false;
  }

  if (patch.x !== undefined) item.x = Math.max(0, Math.floor(patch.x));
  if (patch.y !== undefined) item.y = Math.max(0, Math.floor(patch.y));
  if (patch.w !== undefined) item.w = Math.max(1, Math.floor(patch.w));
  if (patch.h !== undefined) item.h = Math.max(1, Math.floor(patch.h));

  touch(spec);
  assertOrThrow(spec, 'updateGridGeom');
  return true;
}
