import type { GridCell, GridNode } from '../model/types';
import { createBlockNode } from './create';

export interface GridGeomPatch {
  colStart?: number;
  colSpan?: number;
  rowStart?: number;
  rowSpan?: number;
}

export function findAutoPlace(grid: GridNode): Pick<GridCell, 'colStart' | 'colSpan' | 'rowStart' | 'rowSpan'> {
  const cells = Array.isArray(grid.children) ? grid.children : [];
  const nextRow =
    cells.length === 0
      ? 1
      : Math.max(...cells.map(cell => (cell.rowStart || 1) + (cell.rowSpan || 1) - 1)) + 1;

  return {
    colStart: 1,
    colSpan: 6,
    rowStart: nextRow,
    rowSpan: 6,
  };
}

export function addGridItem(grid: GridNode, overrides: Partial<GridCell> = {}): GridCell {
  const base = createBlockNode('GridCell') as GridCell;
  const auto = findAutoPlace(grid);
  const cell: GridCell = {
    ...base,
    ...auto,
    ...overrides,
  };

  if (!Array.isArray(grid.children)) {
    grid.children = [];
  }
  grid.children.push(cell);
  return cell;
}

export function removeGridItem(grid: GridNode, cellId: string): boolean {
  if (!Array.isArray(grid.children)) return false;
  const index = grid.children.findIndex(cell => cell.id === cellId);
  if (index < 0) return false;
  grid.children.splice(index, 1);
  return true;
}

export function updateGridGeom(grid: GridNode, cellId: string, patch: GridGeomPatch): boolean {
  if (!Array.isArray(grid.children)) return false;
  const cell = grid.children.find(item => item.id === cellId);
  if (!cell) return false;

  if (patch.colStart !== undefined) cell.colStart = patch.colStart;
  if (patch.colSpan !== undefined) cell.colSpan = patch.colSpan;
  if (patch.rowStart !== undefined) cell.rowStart = patch.rowStart;
  if (patch.rowSpan !== undefined) cell.rowSpan = patch.rowSpan;
  return true;
}
