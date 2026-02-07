import type { Spec } from '../model/types';
import { assertOrThrow, getGridContainer, getSlotHost, touch } from './internal';

export function replaceSingleChild(spec: Spec, hostId: string, newChildId: string): void {
  const host = getSlotHost(spec, hostId);
  if (!spec.nodes[newChildId]) {
    throw new Error(`new child node not found: ${newChildId}`);
  }

  host.slot = { kind: 'single', childId: newChildId };
  touch(spec);
  assertOrThrow(spec, 'replaceSingleChild');
}

export function replaceGridItemChild(
  spec: Spec,
  gridId: string,
  itemId: string,
  newChildId: string,
): boolean {
  if (!spec.nodes[newChildId]) {
    throw new Error(`new child node not found: ${newChildId}`);
  }

  const grid = getGridContainer(spec, gridId);
  const item = (grid.items || []).find(entry => entry.itemId === itemId);
  if (!item) {
    return false;
  }

  item.childId = newChildId;
  touch(spec);
  assertOrThrow(spec, 'replaceGridItemChild');
  return true;
}
