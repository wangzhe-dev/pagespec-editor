import type { BlockType, LayoutNode } from './types';

const CONTAINER_TYPES = new Set<BlockType>([
  'PageRoot',
  'Grid',
  'GridCell',
  'Tabs',
  'Tab',
  'Card',
  'Dialog',
  'Drawer',
]);

export function isContainerNode(node: LayoutNode): boolean {
  return CONTAINER_TYPES.has(node.type);
}

export function hasChildren(
  node: LayoutNode,
): node is LayoutNode & { children: LayoutNode[] } {
  return 'children' in node && Array.isArray(node.children);
}

export function canContain(parentType: BlockType, childType: BlockType): boolean {
  if (parentType === 'Tabs') return childType === 'Tab';
  if (parentType === 'Grid') return childType === 'GridCell';
  if (childType === 'Tab' || childType === 'GridCell') return false;
  return CONTAINER_TYPES.has(parentType);
}
