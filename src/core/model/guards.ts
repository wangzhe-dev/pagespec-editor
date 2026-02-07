import type { ContainerNode, LeafNode, Node, NodeId, SlotContent, Spec } from './types';

const SLOT_HOST_TYPES = new Set<ContainerNode['type']>([
  'page',
  'gridItem',
  'section',
  'card',
  'tabs',
  'split',
  'dialog',
  'drawer',
]);

export function isLeaf(node: Node): node is LeafNode {
  return node.kind === 'leaf';
}

export function isContainer(node: Node): node is ContainerNode {
  return node.kind === 'container';
}

export function isSlotHost(node: Node): node is ContainerNode {
  return isContainer(node) && SLOT_HOST_TYPES.has(node.type);
}

export function getSlotHosts(spec: Spec): ContainerNode[] {
  return Object.values(spec.nodes).filter(isSlotHost);
}

function checkSlotReference(spec: Spec, hostId: NodeId, slot: SlotContent, errors: string[]) {
  if (slot.kind === 'empty') return;

  if (slot.kind === 'single') {
    if (!spec.nodes[slot.childId]) {
      errors.push(`[slot.single] host=${hostId} childId=${slot.childId} 不存在`);
    }
    return;
  }

  const grid = spec.nodes[slot.gridId];
  if (!grid) {
    errors.push(`[slot.grid] host=${hostId} gridId=${slot.gridId} 不存在`);
    return;
  }
  if (!isContainer(grid) || grid.type !== 'grid') {
    errors.push(`[slot.grid] host=${hostId} gridId=${slot.gridId} 不是 grid 节点`);
  }
}

function checkGridItems(spec: Spec, node: ContainerNode, errors: string[]) {
  if (node.type !== 'grid') return;

  const seen = new Set<string>();
  for (const item of node.items || []) {
    if (seen.has(item.itemId)) {
      errors.push(`[grid.item] grid=${node.id} itemId=${item.itemId} 重复`);
    }
    seen.add(item.itemId);

    if (!spec.nodes[item.childId]) {
      errors.push(`[grid.item] grid=${node.id} childId=${item.childId} 不存在`);
    }
  }
}

function walkReachable(spec: Spec, nodeId: NodeId, stack: Set<NodeId>, seen: Set<NodeId>, errors: string[]) {
  if (stack.has(nodeId)) {
    errors.push(`[cycle] 检测到环: ${Array.from(stack).join(' -> ')} -> ${nodeId}`);
    return;
  }

  if (seen.has(nodeId)) {
    return;
  }

  const node = spec.nodes[nodeId];
  if (!node) {
    errors.push(`[missing] 可达节点 ${nodeId} 不存在`);
    return;
  }

  stack.add(nodeId);
  seen.add(nodeId);

  if (isContainer(node)) {
    if (isSlotHost(node) && node.slot) {
      if (node.slot.kind === 'single') {
        walkReachable(spec, node.slot.childId, stack, seen, errors);
      } else if (node.slot.kind === 'grid') {
        walkReachable(spec, node.slot.gridId, stack, seen, errors);
      }
    }

    if (node.type === 'grid') {
      for (const item of node.items || []) {
        walkReachable(spec, item.childId, stack, seen, errors);
      }
    }
  }

  stack.delete(nodeId);
}

export function assertInvariants(spec: Spec): string[] {
  const errors: string[] = [];

  if (!spec.nodes[spec.rootId]) {
    errors.push(`[root] rootId=${spec.rootId} 不存在`);
    return errors;
  }

  for (const node of Object.values(spec.nodes)) {
    if (isLeaf(node) && (node as any).slot !== undefined) {
      errors.push(`[leaf] node=${node.id} leaf 不允许 slot`);
    }

    if (isContainer(node)) {
      if (isSlotHost(node) && !node.slot) {
        errors.push(`[slot] host=${node.id} 缺少 slot`);
      }
      if (isSlotHost(node) && node.slot) {
        checkSlotReference(spec, node.id, node.slot, errors);
      }
      checkGridItems(spec, node, errors);
    }
  }

  const seen = new Set<NodeId>();
  walkReachable(spec, spec.rootId, new Set<NodeId>(), seen, errors);

  return errors;
}
