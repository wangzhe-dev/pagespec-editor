import { assertInvariants, isContainer, isSlotHost } from '../model/guards';
import type { ContainerNode, Node, NodeId, Spec } from '../model/types';

export function getNode(spec: Spec, nodeId: NodeId): Node {
  const node = spec.nodes[nodeId];
  if (!node) {
    throw new Error(`node not found: ${nodeId}`);
  }
  return node;
}

export function getContainer(spec: Spec, nodeId: NodeId): ContainerNode {
  const node = getNode(spec, nodeId);
  if (!isContainer(node)) {
    throw new Error(`node is not a container: ${nodeId}`);
  }
  return node;
}

export function getSlotHost(spec: Spec, nodeId: NodeId): ContainerNode {
  const node = getContainer(spec, nodeId);
  if (!isSlotHost(node)) {
    throw new Error(`node has no slot host capability: ${nodeId}`);
  }
  return node;
}

export function getGridContainer(spec: Spec, gridId: NodeId): ContainerNode {
  const node = getContainer(spec, gridId);
  if (node.type !== 'grid') {
    throw new Error(`node is not grid container: ${gridId}`);
  }
  return node;
}

export function assertOrThrow(spec: Spec, opName: string): void {
  const errors = assertInvariants(spec);
  if (errors.length > 0) {
    throw new Error(`[${opName}] invariant violation:\n${errors.join('\n')}`);
  }
}

export function touch(spec: Spec): void {
  spec.meta.updatedAt = Date.now();
}

export function findHostByGridId(spec: Spec, gridId: NodeId): ContainerNode | null {
  for (const node of Object.values(spec.nodes)) {
    if (!isContainer(node) || !isSlotHost(node) || !node.slot) {
      continue;
    }
    if (node.slot.kind === 'grid' && node.slot.gridId === gridId) {
      return node;
    }
  }
  return null;
}
