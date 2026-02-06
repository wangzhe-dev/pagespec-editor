/**
 * 布局构建器配置
 * 简化版 Row/Col 嵌套拖拽系统
 */

// ============================================================================
// 类型定义
// ============================================================================

export type LayoutNodeType = 'row' | 'col';

export interface LayoutBuilderNode {
  id: string;
  type: LayoutNodeType;
  label: string;
  span: number; // 仅 col 有效，1-24
  children: LayoutBuilderNode[];
}

export interface PaletteItem {
  id: string;
  type: LayoutNodeType;
  label: string;
  description: string;
}

// ============================================================================
// 配置常量
// ============================================================================

export const LAYOUT_BUILDER_CONFIG = {
  /** 拖拽组名 */
  groupName: 'layoutBuilder',
  /** 默认列宽 */
  defaultColSpan: 24,
  /** 最小列宽 */
  minColSpan: 1,
  /** 最大列宽 */
  maxColSpan: 24,
} as const;

// ============================================================================
// 调色板数据
// ============================================================================

export const LAYOUT_PALETTE: PaletteItem[] = [
  {
    id: 'palette-row',
    type: 'row',
    label: 'Row 行容器',
    description: '水平布局，内部放多个 Col',
  },
  {
    id: 'palette-col',
    type: 'col',
    label: 'Col 列容器',
    description: '列布局，可继续嵌套 Row',
  },
];

// ============================================================================
// ID 生成
// ============================================================================

let idCounter = 0;

function generateId(): string {
  return `layout_${Date.now()}_${++idCounter}`;
}

// ============================================================================
// 节点创建
// ============================================================================

/**
 * 规范化 span 值
 */
export function normalizeSpan(rawSpan?: number): number {
  const span = Number(rawSpan ?? LAYOUT_BUILDER_CONFIG.defaultColSpan);
  return Math.max(
    LAYOUT_BUILDER_CONFIG.minColSpan,
    Math.min(LAYOUT_BUILDER_CONFIG.maxColSpan, span)
  );
}

/**
 * 递归规范化子节点
 */
function normalizeChildren(rawChildren?: LayoutBuilderNode[]): LayoutBuilderNode[] {
  if (!Array.isArray(rawChildren)) return [];
  return rawChildren
    .filter((child) => child && typeof child === 'object' && child.type)
    .map((child) => createLayoutNode(child.type, child));
}

/**
 * 创建布局节点
 */
export function createLayoutNode(
  type: LayoutNodeType,
  overrides: Partial<LayoutBuilderNode> = {}
): LayoutBuilderNode {
  // 默认值
  const defaults: Record<LayoutNodeType, Omit<LayoutBuilderNode, 'id'>> = {
    row: {
      type: 'row',
      label: 'Row',
      span: 24,
      // Row 默认自带一个 Col
      children: [{ type: 'col', label: 'Col', span: 24, children: [] }] as any,
    },
    col: {
      type: 'col',
      label: 'Col',
      span: 24,
      children: [],
    },
  };

  const base = defaults[type];
  const merged = { ...base, ...overrides };

  // 确定 children 来源
  const childrenSource = Array.isArray(overrides.children)
    ? overrides.children
    : (base.children as LayoutBuilderNode[]);

  return {
    ...merged,
    id: generateId(),
    span: type === 'col' ? normalizeSpan(merged.span) : 24,
    children: normalizeChildren(childrenSource),
  };
}

/**
 * 深度克隆节点树
 */
export function cloneLayoutNode(node: LayoutBuilderNode): LayoutBuilderNode {
  if (!node || typeof node !== 'object' || !node.type) {
    return createLayoutNode('row');
  }
  return createLayoutNode(node.type, {
    ...node,
    children: node.children?.map(cloneLayoutNode) || [],
  });
}

// ============================================================================
// 嵌套规则
// ============================================================================

/**
 * 获取容器允许的子节点类型
 * - root: 只能放 row
 * - row: 只能放 col
 * - col: 只能放 row
 */
export function getAllowedChildTypes(containerType: 'root' | LayoutNodeType): LayoutNodeType[] {
  switch (containerType) {
    case 'root':
      return ['row'];
    case 'row':
      return ['col'];
    case 'col':
      return ['row'];
    default:
      return [];
  }
}

/**
 * 判断是否可以放置子节点
 */
export function canDropChild(
  containerType: 'root' | LayoutNodeType,
  childType: LayoutNodeType | null
): boolean {
  if (!childType) return false;
  return getAllowedChildTypes(containerType).includes(childType);
}

// ============================================================================
// 初始化数据
// ============================================================================

/**
 * 创建默认的初始布局
 */
export function createInitialLayout(): LayoutBuilderNode[] {
  return [
    createLayoutNode('row', {
      label: '主 Row',
      children: [
        { type: 'col', label: '主 Col', span: 24, children: [] },
      ] as any,
    }),
  ];
}

// ============================================================================
// 拖拽组配置
// ============================================================================

/** 调色板组配置 - 只能拖出 */
export const PALETTE_GROUP = {
  name: LAYOUT_BUILDER_CONFIG.groupName,
  pull: 'clone' as const,
  put: false,
};

/** 画布组配置 - 可以互相拖拽 */
export const CANVAS_GROUP = {
  name: LAYOUT_BUILDER_CONFIG.groupName,
  pull: true,
  put: true,
};
