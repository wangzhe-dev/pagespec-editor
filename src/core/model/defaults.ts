import type {
  ContainerType,
  GridConfig,
  LeafMeta,
  LeafType,
  PaletteContainerType,
  PaletteLeafType,
  SlotContent,
} from './types';

export const EMPTY_SLOT: SlotContent = { kind: 'empty' };

export const DEFAULT_GRID_CONFIG: GridConfig = {
  colNum: 12,
  rowHeight: 30,
  margin: [8, 8],
  compactType: 'vertical',
  preventCollision: true,
};

export const DEFAULT_LEAF_META: LeafMeta = {
  componentRef: 'ComponentRef',
  description: '',
  fields: {},
  recipes: [],
};

export const DEFAULT_CONTAINER_PROPS: Record<ContainerType, Record<string, unknown>> = {
  page: { title: '新页面' },
  gridItem: { title: 'GridItem' },
  section: { title: 'Section' },
  card: { title: 'Card' },
  tabs: { title: 'Tabs', activeKey: 'tab-1' },
  split: { direction: 'horizontal', ratio: [50, 50] },
  grid: { ...DEFAULT_GRID_CONFIG },
  dialog: { title: 'Dialog' },
  drawer: { title: 'Drawer' },
};

export const DEFAULT_LEAF_COMPONENT: Record<LeafType, string> = {
  table: 'TableView',
  chart: 'ChartView',
  list: 'ListView',
  tree: 'TreeView',
  kpi: 'KpiCard',
  form: 'FormView',
  custom: 'CustomView',
};

export const PALETTE_LEAVES: Array<{ type: PaletteLeafType; label: string }> = [
  { type: 'table', label: 'Table' },
  { type: 'tree', label: 'Tree' },
  { type: 'form', label: 'Form' },
  { type: 'chart', label: 'Chart' },
  { type: 'list', label: 'List' },
  { type: 'kpi', label: 'KPI' },
  { type: 'custom', label: 'Custom' },
];

export const PALETTE_CONTAINERS: Array<{ type: PaletteContainerType; label: string }> = [
  { type: 'gridItem', label: 'GridItem' },
  { type: 'section', label: 'Section' },
  { type: 'card', label: 'Card' },
  { type: 'tabs', label: 'Tabs' },
  { type: 'split', label: 'Split' },
  { type: 'dialog', label: 'Dialog' },
  { type: 'drawer', label: 'Drawer' },
];

export const HARD_RULES = [
  '禁止原生标签替代项目组件',
  '禁止引入新 UI 库',
  '样式仅允许布局、间距、对齐，禁止装饰性脑补',
  'leaf 必须使用 componentRef 指定组件实现',
] as const;
