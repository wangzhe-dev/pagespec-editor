import { hasChildren } from '../model/guards';
import type { LayoutNode } from '../model/types';

function deleteInChildren(parent: LayoutNode, nodeId: string): boolean {
  if (!hasChildren(parent)) return false;

  const index = parent.children.findIndex((child: LayoutNode) => child.id === nodeId);
  if (index >= 0) {
    parent.children.splice(index, 1);
    return true;
  }

  for (const child of parent.children) {
    if (deleteInChildren(child, nodeId)) {
      return true;
    }
  }

  return false;
}

export function deleteNodeCascade(root: LayoutNode, nodeId: string): boolean {
  if (root.id === nodeId) {
    return false;
  }
  return deleteInChildren(root, nodeId);
}

export function cleanupOrphans(root: LayoutNode): void {
  if (!hasChildren(root)) return;

  root.children = root.children.filter((child: LayoutNode) => {
    if (child.type === 'Tab') {
      return Boolean(child.tabKey);
    }
    return true;
  });

  for (const child of root.children) {
    cleanupOrphans(child);
  }
}
