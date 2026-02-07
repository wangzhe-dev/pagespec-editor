import { hasChildren } from '../model/guards';
import type { GridNode, LayoutNode } from '../model/types';

export function replaceSingleChild(parent: LayoutNode, nextChild: LayoutNode): boolean {
  if (!hasChildren(parent)) return false;
  if (parent.children.length === 0) {
    parent.children.push(nextChild);
    return true;
  }
  parent.children.splice(0, 1, nextChild);
  return true;
}

export function replaceGridItemChild(
  grid: GridNode,
  cellId: string,
  nextChild: LayoutNode,
): boolean {
  if (!Array.isArray(grid.children)) return false;
  const cell = grid.children.find(item => item.id === cellId);
  if (!cell) return false;

  if (!Array.isArray(cell.children)) {
    cell.children = [nextChild];
    return true;
  }

  if (cell.children.length === 0) {
    cell.children.push(nextChild);
    return true;
  }

  cell.children.splice(0, 1, nextChild);
  return true;
}
