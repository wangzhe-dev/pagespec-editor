import { nanoid } from 'nanoid';
import type { LayoutNode, PageSpec } from './types';

export function createNodeId(): string {
  return nanoid(8);
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function remapNodeIds(node: LayoutNode): LayoutNode {
  const cloned = deepClone(node);

  const walk = (current: LayoutNode) => {
    current.id = createNodeId();
    if ('children' in current && Array.isArray(current.children)) {
      for (const child of current.children) {
        walk(child);
      }
    }
  };

  walk(cloned);
  return cloned;
}

export function clonePageSpec(spec: PageSpec): PageSpec {
  const copy = deepClone(spec);
  copy.id = createNodeId();
  copy.root = remapNodeIds(copy.root as unknown as LayoutNode) as any;
  copy.recipes = [];
  copy.dialogs = [];
  copy.drawers = [];
  copy.updatedAt = Date.now();
  copy.createdAt = Date.now();
  return copy;
}
