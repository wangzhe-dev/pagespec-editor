import type { LayoutNode } from '../model/types';
import { hasChildren } from '../model/guards';
import { createBlockNode } from './create';

export function clearSlot(node: LayoutNode): boolean {
  if (!hasChildren(node)) return false;
  node.children.splice(0, node.children.length);
  return true;
}

export function setSlotSingle(node: LayoutNode, child: LayoutNode): boolean {
  if (!hasChildren(node)) return false;
  node.children.splice(0, node.children.length, child);
  return true;
}

export function upgradeSlotToGrid(node: LayoutNode) {
  if (!hasChildren(node)) return null;
  const grid = createBlockNode('Grid');
  node.children.splice(0, node.children.length, grid);
  return grid;
}

export function downgradeGridToSingle(node: LayoutNode, index: number = 0): LayoutNode | null {
  if (!hasChildren(node) || node.children.length === 0) return null;

  const first = node.children[index] as LayoutNode | undefined;
  if (!first || first.type !== 'Grid' || !('children' in first) || !Array.isArray(first.children)) {
    return null;
  }

  const firstCell = first.children[0];
  const firstLeaf =
    firstCell && 'children' in firstCell && Array.isArray(firstCell.children)
      ? firstCell.children[0]
      : null;

  if (!firstLeaf) return null;

  node.children.splice(0, node.children.length, firstLeaf);
  return firstLeaf;
}
