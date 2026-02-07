export const SPEC_VERSION = 1;

export type NodeId = string;
export type GridItemId = string;

export type NodeKind = 'container' | 'leaf';

export type ContainerType =
  | 'page'
  | 'section'
  | 'card'
  | 'tabs'
  | 'split'
  | 'grid'
  | 'dialog'
  | 'drawer';

export type LeafType = 'table' | 'chart' | 'list' | 'tree' | 'kpi' | 'form' | 'custom';

export type NodeType = ContainerType | LeafType;

export interface LeafFields {
  columns?: string[];
  form?: string[];
  series?: string[];
  items?: string[];
  [key: string]: string[] | undefined;
}

export interface LeafMeta {
  componentRef: string;
  description?: string;
  fields?: LeafFields;
  recipes?: string[];
}

export type SlotContent =
  | { kind: 'empty' }
  | { kind: 'single'; childId: NodeId }
  | { kind: 'grid'; gridId: NodeId };

export interface GridConfig {
  colNum: number;
  rowHeight: number;
  margin: [number, number];
  compactType: 'vertical' | 'horizontal' | null;
  preventCollision: boolean;
}

export interface GridItem {
  itemId: GridItemId;
  childId: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface BaseNode {
  id: NodeId;
  kind: NodeKind;
  type: NodeType;
  props: Record<string, unknown>;
}

export interface ContainerNode extends BaseNode {
  kind: 'container';
  type: ContainerType;
  slot?: SlotContent;
  items?: GridItem[];
}

export interface LeafNode extends BaseNode {
  kind: 'leaf';
  type: LeafType;
  slot?: undefined;
  items?: undefined;
  leafMeta: LeafMeta;
}

export type Node = ContainerNode | LeafNode;

export interface SpecMeta {
  id: string;
  name: string;
  tags: string[];
  updatedAt: number;
  isTemplate?: boolean;
}

export interface Spec {
  version: 1;
  rootId: NodeId;
  nodes: Record<NodeId, Node>;
  meta: SpecMeta;
}

export type PromptMode = 'short' | 'long' | 'batch';

export interface PromptOptions {
  mode: PromptMode;
  includeGeometry?: boolean;
}

export interface PromptResult {
  sections: {
    deliverables: string[];
    hardRules: string[];
    dsl: string[];
    leafDetails: string[];
    checklist: string[];
  };
  rawText: string;
}

export interface SpecSummary {
  id: string;
  name: string;
  tags: string[];
  updatedAt: number;
  isTemplate?: boolean;
}

export type PaletteLeafType = LeafType;
export type PaletteContainerType = Exclude<ContainerType, 'grid'>;
