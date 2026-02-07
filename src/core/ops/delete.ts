import { isContainer, isSlotHost } from '../model/guards';
import type { NodeId, Spec } from '../model/types';
import { assertOrThrow, touch } from './internal';

function collectDescendants(spec: Spec, nodeId: NodeId, set: Set<NodeId>) {
  if (set.has(nodeId)) return;
  const node = spec.nodes[nodeId];
  if (!node) return;

  set.add(nodeId);

  if (!isContainer(node)) return;

  if (isSlotHost(node) && node.slot) {
    if (node.slot.kind === 'single') {
      collectDescendants(spec, node.slot.childId, set);
    } else if (node.slot.kind === 'grid') {
      collectDescendants(spec, node.slot.gridId, set);
    }
  }

  if (node.type === 'grid') {
    for (const item of node.items || []) {
      collectDescendants(spec, item.childId, set);
    }
  }
}

function removeAllReferences(spec: Spec, deleted: Set<NodeId>) {
  for (const node of Object.values(spec.nodes)) {
    if (!isContainer(node)) continue;

    if (isSlotHost(node) && node.slot) {
      if (node.slot.kind === 'single' && deleted.has(node.slot.childId)) {
        node.slot = { kind: 'empty' };
      }

      if (node.slot.kind === 'grid' && deleted.has(node.slot.gridId)) {
        node.slot = { kind: 'empty' };
      }
    }

    if (node.type === 'grid' && Array.isArray(node.items)) {
      node.items = node.items.filter(item => !deleted.has(item.childId));
    }
  }
}

function collectReachable(spec: Spec, nodeId: NodeId, seen: Set<NodeId>) {
  if (seen.has(nodeId)) return;
  const node = spec.nodes[nodeId];
  if (!node) return;

  seen.add(nodeId);

  if (!isContainer(node)) return;

  if (isSlotHost(node) && node.slot) {
    if (node.slot.kind === 'single') {
      collectReachable(spec, node.slot.childId, seen);
    } else if (node.slot.kind === 'grid') {
      collectReachable(spec, node.slot.gridId, seen);
    }
  }

  if (node.type === 'grid') {
    for (const item of node.items || []) {
      collectReachable(spec, item.childId, seen);
    }
  }
}

export function cleanupOrphans(spec: Spec): void {
  for (const node of Object.values(spec.nodes)) {
    if (!isContainer(node)) continue;

    if (isSlotHost(node) && node.slot) {
      if (node.slot.kind === 'single' && !spec.nodes[node.slot.childId]) {
        node.slot = { kind: 'empty' };
      }

      if (node.slot.kind === 'grid') {
        const grid = spec.nodes[node.slot.gridId];
        if (!grid || !isContainer(grid) || grid.type !== 'grid') {
          node.slot = { kind: 'empty' };
          continue;
        }

        grid.items = (grid.items || []).filter(item => Boolean(spec.nodes[item.childId]));

        if (grid.items.length === 0) {
          node.slot = { kind: 'empty' };
          delete spec.nodes[grid.id];
        } else if (grid.items.length === 1) {
          node.slot = { kind: 'single', childId: grid.items[0].childId };
          delete spec.nodes[grid.id];
        }
      }
    }

    if (node.type === 'grid') {
      node.items = (node.items || []).filter(item => Boolean(spec.nodes[item.childId]));
    }
  }

  const reachable = new Set<NodeId>();
  collectReachable(spec, spec.rootId, reachable);
  for (const nodeId of Object.keys(spec.nodes)) {
    if (!reachable.has(nodeId)) {
      delete spec.nodes[nodeId];
    }
  }

  touch(spec);
  assertOrThrow(spec, 'cleanupOrphans');
}

export function deleteNodeCascade(spec: Spec, nodeId: NodeId): boolean {
  if (nodeId === spec.rootId) {
    return false;
  }

  if (!spec.nodes[nodeId]) {
    return false;
  }

  const toDelete = new Set<NodeId>();
  collectDescendants(spec, nodeId, toDelete);

  removeAllReferences(spec, toDelete);

  for (const id of toDelete) {
    delete spec.nodes[id];
  }

  cleanupOrphans(spec);
  touch(spec);
  assertOrThrow(spec, 'deleteNodeCascade');
  return true;
}
