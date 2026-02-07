import { EMPTY_SLOT } from '../model/defaults';
import type { Spec } from '../model/types';
import { addGridItem } from './grid';
import { createGridContainer } from './create';
import { assertOrThrow, getGridContainer, getSlotHost, touch } from './internal';

export function setSlotSingle(spec: Spec, hostId: string, childId: string): void {
  const host = getSlotHost(spec, hostId);
  if (!spec.nodes[childId]) {
    throw new Error(`child node not found: ${childId}`);
  }

  host.slot = { kind: 'single', childId };
  touch(spec);
  assertOrThrow(spec, 'setSlotSingle');
}

export function clearSlot(spec: Spec, hostId: string): void {
  const host = getSlotHost(spec, hostId);
  host.slot = { ...EMPTY_SLOT };
  touch(spec);
  assertOrThrow(spec, 'clearSlot');
}

export function upgradeSlotToGrid(
  spec: Spec,
  hostId: string,
  newChildId: string,
  placement?: Partial<{ x: number; y: number; w: number; h: number }>,
): string {
  const host = getSlotHost(spec, hostId);
  if (!host.slot || host.slot.kind !== 'single') {
    throw new Error(`host slot is not single: ${hostId}`);
  }

  const oldChildId = host.slot.childId;
  if (!spec.nodes[oldChildId] || !spec.nodes[newChildId]) {
    throw new Error('upgradeSlotToGrid child not found');
  }

  const gridId = createGridContainer(spec);
  addGridItem(spec, gridId, oldChildId, { x: 0, y: 0, w: 6, h: 6 });
  addGridItem(spec, gridId, newChildId, placement);
  host.slot = { kind: 'grid', gridId };

  touch(spec);
  assertOrThrow(spec, 'upgradeSlotToGrid');
  return gridId;
}

export function downgradeGridToSingle(spec: Spec, hostId: string): boolean {
  const host = getSlotHost(spec, hostId);
  if (!host.slot || host.slot.kind !== 'grid') {
    return false;
  }

  const gridId = host.slot.gridId;
  const grid = getGridContainer(spec, gridId);
  const items = grid.items || [];
  if (items.length !== 1) {
    return false;
  }

  const childId = items[0].childId;
  if (!spec.nodes[childId]) {
    return false;
  }

  host.slot = { kind: 'single', childId };
  delete spec.nodes[gridId];

  touch(spec);
  assertOrThrow(spec, 'downgradeGridToSingle');
  return true;
}
