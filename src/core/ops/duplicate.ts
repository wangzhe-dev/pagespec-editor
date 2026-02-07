import { createGridItemId, createNodeId, createSpecId, deepClone } from '../model/id';
import type { ContainerNode, Node, Spec } from '../model/types';
import { assertOrThrow } from './internal';

function remapNode(node: Node, idMap: Map<string, string>): Node {
  const cloned = deepClone(node);
  cloned.id = idMap.get(node.id) || cloned.id;

  if (cloned.kind === 'container' && cloned.slot) {
    if (cloned.slot.kind === 'single') {
      cloned.slot.childId = idMap.get(cloned.slot.childId) || cloned.slot.childId;
    }

    if (cloned.slot.kind === 'grid') {
      cloned.slot.gridId = idMap.get(cloned.slot.gridId) || cloned.slot.gridId;
    }
  }

  if (cloned.kind === 'container' && cloned.type === 'grid') {
    (cloned as ContainerNode).items = ((cloned as ContainerNode).items || []).map(item => ({
      ...item,
      itemId: createGridItemId(),
      childId: idMap.get(item.childId) || item.childId,
    }));
  }

  return cloned;
}

export function duplicateSpec(spec: Spec): Spec {
  const idMap = new Map<string, string>();
  for (const nodeId of Object.keys(spec.nodes)) {
    idMap.set(nodeId, createNodeId());
  }

  const nextNodes: Record<string, Node> = {};
  for (const node of Object.values(spec.nodes)) {
    const mapped = remapNode(node, idMap);
    nextNodes[mapped.id] = mapped;
  }

  const next: Spec = {
    version: 1,
    rootId: idMap.get(spec.rootId) || createNodeId(),
    nodes: nextNodes,
    meta: {
      ...deepClone(spec.meta),
      id: createSpecId(),
      name: `${spec.meta.name} (copy)`,
      updatedAt: Date.now(),
    },
  };

  assertOrThrow(next, 'duplicateSpec');
  return next;
}
