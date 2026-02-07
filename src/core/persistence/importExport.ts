import { assertInvariants } from '../model/guards';
import { createGridItemId, createNodeId, createSpecId, deepClone } from '../model/id';
import { migrateSpec, needsMigration } from '../model/migrations';
import type { Node, Spec } from '../model/types';

function remapIds(spec: Spec): Spec {
  const idMap = new Map<string, string>();
  for (const oldId of Object.keys(spec.nodes)) {
    idMap.set(oldId, createNodeId());
  }

  const nodes: Record<string, Node> = {};
  for (const node of Object.values(spec.nodes)) {
    const mapped = deepClone(node);
    mapped.id = idMap.get(node.id) || mapped.id;

    if (mapped.kind === 'container' && mapped.slot) {
      if (mapped.slot.kind === 'single') {
        mapped.slot.childId = idMap.get(mapped.slot.childId) || mapped.slot.childId;
      }
      if (mapped.slot.kind === 'grid') {
        mapped.slot.gridId = idMap.get(mapped.slot.gridId) || mapped.slot.gridId;
      }
    }

    if (mapped.kind === 'container' && mapped.type === 'grid') {
      mapped.items = (mapped.items || []).map(item => ({
        ...item,
        itemId: createGridItemId(),
        childId: idMap.get(item.childId) || item.childId,
      }));
    }

    nodes[mapped.id] = mapped;
  }

  const next: Spec = {
    version: 1,
    rootId: idMap.get(spec.rootId) || spec.rootId,
    nodes,
    meta: {
      ...spec.meta,
      id: createSpecId(),
      updatedAt: Date.now(),
    },
  };

  return next;
}

export function exportJSON(spec: Spec): string {
  return JSON.stringify(spec, null, 2);
}

export function importJSON(raw: string): Spec {
  const parsed = JSON.parse(raw) as unknown;
  const migrated = needsMigration(parsed) ? migrateSpec(parsed) : (parsed as Spec);
  const remapped = remapIds(migrated);

  const errors = assertInvariants(remapped);
  if (errors.length > 0) {
    throw new Error(`import spec invariant failed:\n${errors.join('\n')}`);
  }

  return remapped;
}
