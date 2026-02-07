import { isContainer, isSlotHost } from '@/core/model/guards';
import type { GridItem, Node, Spec } from '@/core/model/types';

export interface DslNodeLine {
  code: string;
  nodeId: string;
  line: string;
  node: Node;
  depth: number;
}

interface ChildRef {
  childId: string;
  geom?: GridItem;
}

function alpha(index: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return alphabet[index] || `X${index + 1}`;
}

function getChildren(node: Node): ChildRef[] {
  if (!isContainer(node)) return [];

  const refs: ChildRef[] = [];

  if (isSlotHost(node) && node.slot) {
    if (node.slot.kind === 'single') {
      refs.push({ childId: node.slot.childId });
    }
    if (node.slot.kind === 'grid') {
      refs.push({ childId: node.slot.gridId });
    }
  }

  if (node.type === 'grid') {
    refs.push(
      ...(node.items || [])
        .slice()
        .sort((a, b) => {
          if (a.y !== b.y) return a.y - b.y;
          if (a.x !== b.x) return a.x - b.x;
          return a.itemId.localeCompare(b.itemId);
        })
        .map(item => ({ childId: item.childId, geom: item })),
    );
  }

  return refs;
}

function describeNode(node: Node): string {
  if (node.kind === 'leaf') {
    return `leaf:${node.type} componentRef=${node.leafMeta.componentRef}`;
  }

  if (node.type === 'grid') {
    const colNum = Number(node.props.colNum || 12);
    const rowHeight = Number(node.props.rowHeight || 30);
    return `container:grid colNum=${colNum} rowHeight=${rowHeight}`;
  }

  return `container:${node.type}`;
}

export function buildDslSection(
  spec: Spec,
  includeGeometry: boolean,
): { lines: string[]; entries: DslNodeLine[] } {
  const entries: DslNodeLine[] = [];
  const visited = new Set<string>();

  const walk = (nodeId: string, code: string, depth: number, geom?: GridItem) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = spec.nodes[nodeId];
    if (!node) return;

    const pad = '  '.repeat(depth);
    const geomText = includeGeometry && geom
      ? ` geom=(${geom.x},${geom.y},${geom.w},${geom.h})`
      : '';

    const line = `${pad}[${code}] ${describeNode(node)}${geomText}`;
    entries.push({ code, nodeId, line, node, depth });

    const children = getChildren(node);
    children.forEach((child, index) => {
      const nextCode = depth === 0 ? alpha(index) : `${code}${index + 1}`;
      walk(child.childId, nextCode, depth + 1, child.geom);
    });
  };

  walk(spec.rootId, 'ROOT', 0);

  return {
    lines: entries.map(item => item.line),
    entries,
  };
}
