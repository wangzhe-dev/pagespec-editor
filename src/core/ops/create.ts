import {
  DEFAULT_CONTAINER_PROPS,
  DEFAULT_GRID_CONFIG,
  DEFAULT_LEAF_COMPONENT,
  DEFAULT_LEAF_META,
  EMPTY_SLOT,
} from '../model/defaults';
import { createGridItemId, createNodeId, createSpecId, deepClone } from '../model/id';
import { assertOrThrow, touch } from './internal';
import type { ContainerType, LeafMeta, LeafType, SlotContent, Spec } from '../model/types';

function createMeta(name: string) {
  const now = Date.now();
  return {
    id: createSpecId(),
    name,
    tags: [],
    updatedAt: now,
    isTemplate: false,
  };
}

export function createEmptySpec(name: string = 'Untitled Spec'): Spec {
  const rootId = createNodeId();
  const spec: Spec = {
    version: 1,
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        kind: 'container',
        type: 'page',
        props: deepClone(DEFAULT_CONTAINER_PROPS.page),
        slot: deepClone(EMPTY_SLOT),
      },
    },
    meta: createMeta(name),
  };

  assertOrThrow(spec, 'createEmptySpec');
  return spec;
}

export function createLeaf(spec: Spec, type: LeafType, leafMetaDefaults?: Partial<LeafMeta>): string {
  const id = createNodeId();

  spec.nodes[id] = {
    id,
    kind: 'leaf',
    type,
    props: {},
    leafMeta: {
      ...deepClone(DEFAULT_LEAF_META),
      componentRef: leafMetaDefaults?.componentRef || DEFAULT_LEAF_COMPONENT[type],
      ...leafMetaDefaults,
      fields: {
        ...(DEFAULT_LEAF_META.fields || {}),
        ...(leafMetaDefaults?.fields || {}),
      },
      recipes: [...(leafMetaDefaults?.recipes || [])],
    },
  };

  touch(spec);
  assertOrThrow(spec, 'createLeaf');
  return id;
}

export function createContainer(spec: Spec, type: ContainerType, propsDefaults?: Record<string, unknown>): string {
  const id = createNodeId();
  const baseProps = deepClone(DEFAULT_CONTAINER_PROPS[type]);

  const node = {
    id,
    kind: 'container' as const,
    type,
    props: {
      ...baseProps,
      ...(propsDefaults || {}),
    },
  };

  if (type !== 'grid') {
    (node as any).slot = deepClone(EMPTY_SLOT);
  }

  spec.nodes[id] = node as any;

  touch(spec);
  assertOrThrow(spec, 'createContainer');
  return id;
}

export function createGridContainer(
  spec: Spec,
  gridDefaults?: Partial<typeof DEFAULT_GRID_CONFIG>,
): string {
  const id = createNodeId();
  spec.nodes[id] = {
    id,
    kind: 'container',
    type: 'grid',
    props: {
      ...deepClone(DEFAULT_GRID_CONFIG),
      ...(gridDefaults || {}),
    },
    items: [],
  };

  touch(spec);
  assertOrThrow(spec, 'createGridContainer');
  return id;
}

export function createDemoSpec(name: string = '示例页面'): Spec {
  const rootId = createNodeId();
  const gridId = createNodeId();

  const demoLeaves = [
    { id: createNodeId(), type: 'table' as LeafType, ref: 'TableView', x: 0, y: 0, w: 6, h: 4 },
    { id: createNodeId(), type: 'chart' as LeafType, ref: 'ChartView', x: 6, y: 0, w: 6, h: 4 },
    { id: createNodeId(), type: 'form' as LeafType, ref: 'FormView', x: 0, y: 4, w: 4, h: 3 },
    { id: createNodeId(), type: 'kpi' as LeafType, ref: 'KpiCard', x: 4, y: 4, w: 4, h: 3 },
    { id: createNodeId(), type: 'list' as LeafType, ref: 'ListView', x: 8, y: 4, w: 4, h: 3 },
  ];

  const nodes: Record<string, any> = {};

  nodes[rootId] = {
    id: rootId,
    kind: 'container',
    type: 'page',
    props: deepClone(DEFAULT_CONTAINER_PROPS.page),
    slot: { kind: 'grid' as const, gridId },
  };

  nodes[gridId] = {
    id: gridId,
    kind: 'container',
    type: 'grid',
    props: deepClone(DEFAULT_GRID_CONFIG),
    items: demoLeaves.map(l => ({
      itemId: createGridItemId(),
      childId: l.id,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
    })),
  };

  for (const l of demoLeaves) {
    nodes[l.id] = {
      id: l.id,
      kind: 'leaf',
      type: l.type,
      props: {},
      leafMeta: {
        ...deepClone(DEFAULT_LEAF_META),
        componentRef: l.ref,
      },
    };
  }

  const spec: Spec = {
    version: 1,
    rootId,
    nodes,
    meta: createMeta(name),
  };

  assertOrThrow(spec, 'createDemoSpec');
  return spec;
}

export function attachToSlot(spec: Spec, hostId: string, slot: SlotContent): void {
  const host = spec.nodes[hostId];
  if (!host || host.kind !== 'container' || host.type === 'grid') {
    throw new Error(`host is not slot container: ${hostId}`);
  }

  host.slot = slot;
  touch(spec);
  assertOrThrow(spec, 'attachToSlot');
}
