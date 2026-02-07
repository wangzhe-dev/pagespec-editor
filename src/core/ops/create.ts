/**
 * Block Registry
 * Block 注册表驱动 UI
 * 新增 Block 只需在此注册，无需修改 Editor UI
 */

import { nanoid } from 'nanoid';
import type { BlockType, LayoutNode } from '../model/types';

// ============================================================================
// Block 元数据类型
// ============================================================================

export interface BlockMeta {
  type: BlockType;
  label: string;
  icon: string; // Lucide icon name
  category: 'layout' | 'container' | 'data' | 'form' | 'overlay' | 'chart' | 'custom';
  description: string;
  allowChildren: boolean;
  maxChildren?: number;
  allowedParents?: BlockType[];
  defaultProps: Partial<LayoutNode>;
  propertySchema: PropertyField[];
  advancedSchema?: PropertyField[];
}

// 属性字段定义
export interface PropertyField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'array' | 'object' | 'code';
  required?: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  arrayItemSchema?: PropertyField[]; // 数组项 schema
}

// ============================================================================
// Block 注册表
// ============================================================================

const blockRegistry = new Map<BlockType, BlockMeta>();

// ============================================================================
// 默认 Block 注册
// ============================================================================

// PageRoot - 页面根节点
blockRegistry.set('PageRoot', {
  type: 'PageRoot',
  label: '页面根',
  icon: 'FileText',
  category: 'container',
  description: '页面的根节点',
  allowChildren: true,
  defaultProps: {
    type: 'PageRoot',
    title: '新页面',
    children: [],
  },
  propertySchema: [
    { key: 'title', label: '页面标题', type: 'text', required: true },
    { key: 'route', label: '路由路径', type: 'text', placeholder: '/example/page' },
  ],
});

// Grid - 栅格容器
blockRegistry.set('Grid', {
  type: 'Grid',
  label: '栅格布局',
  icon: 'LayoutGrid',
  category: 'layout',
  description: 'CSS Grid 栅格容器，灵活的多行多列布局',
  allowChildren: true,
  defaultProps: {
    type: 'Grid',
    columns: 24,
    gap: 12,
    justifyItems: 'stretch',
    alignItems: 'stretch',
    // 默认包含三个 Cell，三等分布局
    children: [
      { id: '__cell1__', type: 'GridCell', label: '左侧区域', colSpan: 8, rowSpan: 6, children: [] },
      { id: '__cell2__', type: 'GridCell', label: '中间区域', colSpan: 8, rowSpan: 6, children: [] },
      { id: '__cell3__', type: 'GridCell', label: '右侧区域', colSpan: 8, rowSpan: 6, children: [] },
    ],
  },
  propertySchema: [
    {
      key: 'columns',
      label: '列数/模板',
      type: 'text',
      placeholder: '3 或 1fr 2fr 1fr',
      description: '数字表示等宽列，字符串支持完整 grid-template-columns',
      defaultValue: '24',
    },
    {
      key: 'rows',
      label: '行数/模板',
      type: 'text',
      placeholder: 'auto 或 repeat(2, 1fr)',
      description: '可选，字符串支持完整 grid-template-rows',
    },
    {
      key: 'gap',
      label: '间距 (px)',
      type: 'number',
      defaultValue: 12,
      min: 0,
      max: 100,
    },
  ],
  advancedSchema: [
    {
      key: 'justifyItems',
      label: '水平对齐',
      type: 'select',
      options: [
        { label: '起始', value: 'start' },
        { label: '居中', value: 'center' },
        { label: '末尾', value: 'end' },
        { label: '拉伸', value: 'stretch' },
      ],
      defaultValue: 'stretch',
    },
    {
      key: 'alignItems',
      label: '垂直对齐',
      type: 'select',
      options: [
        { label: '起始', value: 'start' },
        { label: '居中', value: 'center' },
        { label: '末尾', value: 'end' },
        { label: '拉伸', value: 'stretch' },
      ],
      defaultValue: 'stretch',
    },
    { key: 'minCellHeight', label: '最小单元格高度', type: 'number', placeholder: '80' },
  ],
});

// GridCell - 栅格单元格
blockRegistry.set('GridCell', {
  type: 'GridCell',
  label: '单元格',
  icon: 'Square',
  category: 'layout',
  description: '栅格单元格，可跨行跨列',
  allowChildren: true,
  allowedParents: ['Grid'],
  defaultProps: {
    type: 'GridCell',
    colStart: 1,
    colSpan: 12,
    colSpanLocked: false,
    rowStart: 1,
    rowSpan: 6,
    children: [],
  },
  propertySchema: [
    { key: 'colSpan', label: '跨列数', type: 'number', defaultValue: 12, min: 1, max: 24 },
    { key: 'rowSpan', label: '跨行数', type: 'number', defaultValue: 6, min: 1, max: 60 },
  ],
  advancedSchema: [
    { key: 'colSpanLocked', label: '锁定列宽', type: 'boolean', defaultValue: false },
    { key: 'colStart', label: '起始列', type: 'number', defaultValue: 1, min: 1 },
    { key: 'rowStart', label: '起始行', type: 'number', defaultValue: 1, min: 1 },
    {
      key: 'justifySelf',
      label: '水平对齐',
      type: 'select',
      options: [
        { label: '继承', value: '' },
        { label: '起始', value: 'start' },
        { label: '居中', value: 'center' },
        { label: '末尾', value: 'end' },
        { label: '拉伸', value: 'stretch' },
      ],
    },
    {
      key: 'alignSelf',
      label: '垂直对齐',
      type: 'select',
      options: [
        { label: '继承', value: '' },
        { label: '起始', value: 'start' },
        { label: '居中', value: 'center' },
        { label: '末尾', value: 'end' },
        { label: '拉伸', value: 'stretch' },
      ],
    },
    { key: 'padding', label: '内边距', type: 'number', min: 0 },
  ],
});

// Tabs - 标签页容器
blockRegistry.set('Tabs', {
  type: 'Tabs',
  label: '标签页',
  icon: 'SquareStack',
  category: 'container',
  description: '标签页切换容器',
  allowChildren: true,
  defaultProps: {
    type: 'Tabs',
    lazy: false,
    children: [],
  },
  propertySchema: [
    { key: 'defaultTab', label: '默认激活', type: 'text', placeholder: '第一个 Tab 的 key' },
    { key: 'lazy', label: '懒加载', type: 'boolean', defaultValue: false },
  ],
});

// Tab - 单个标签页
blockRegistry.set('Tab', {
  type: 'Tab',
  label: '标签项',
  icon: 'Square',
  category: 'container',
  description: '单个标签页',
  allowChildren: true,
  allowedParents: ['Tabs'],
  defaultProps: {
    type: 'Tab',
    tabKey: '',
    title: '新标签',
    children: [],
  },
  propertySchema: [
    { key: 'tabKey', label: 'Key', type: 'text', required: true },
    { key: 'title', label: '标题', type: 'text', required: true },
    { key: 'icon', label: '图标', type: 'text', placeholder: 'Lucide 图标名' },
  ],
  advancedSchema: [
    { key: 'closable', label: '可关闭', type: 'boolean', defaultValue: false },
  ],
});

// Table - 表格
blockRegistry.set('Table', {
  type: 'Table',
  label: '表格',
  icon: 'Table',
  category: 'data',
  description: '数据表格组件',
  allowChildren: false,
  defaultProps: {
    type: 'Table',
    columns: [],
    pagination: true,
    selection: 'none',
    rowKey: 'id',
    mockCount: 5,
  },
  propertySchema: [
    {
      key: 'columns',
      label: '列配置',
      type: 'array',
      arrayItemSchema: [
        { key: 'key', label: '字段名', type: 'text', required: true },
        { key: 'title', label: '列标题', type: 'text', required: true },
        { key: 'width', label: '宽度', type: 'text' },
        {
          key: 'fixed',
          label: '固定',
          type: 'select',
          options: [
            { label: '不固定', value: '' },
            { label: '左侧', value: 'left' },
            { label: '右侧', value: 'right' },
          ],
        },
        { key: 'sortable', label: '可排序', type: 'boolean' },
      ],
    },
    {
      key: 'selection',
      label: '选择模式',
      type: 'select',
      options: [
        { label: '无', value: 'none' },
        { label: '单选', value: 'single' },
        { label: '多选', value: 'multiple' },
      ],
    },
    { key: 'pagination', label: '分页', type: 'boolean', defaultValue: true },
  ],
  advancedSchema: [
    { key: 'rowKey', label: '行 Key', type: 'text', defaultValue: 'id' },
    { key: 'apiPath', label: 'API 路径', type: 'text', placeholder: '/api/xxx/list' },
    { key: 'mockCount', label: 'Mock 数量', type: 'number', defaultValue: 5 },
    {
      key: 'toolbar',
      label: '工具栏',
      type: 'array',
      description: '选择工具栏按钮',
    },
    {
      key: 'filters',
      label: '筛选条件',
      type: 'array',
      arrayItemSchema: [
        { key: 'key', label: '字段', type: 'text', required: true },
        { key: 'label', label: '标签', type: 'text', required: true },
        {
          key: 'type',
          label: '类型',
          type: 'select',
          options: [
            { label: '输入框', value: 'input' },
            { label: '下拉选择', value: 'select' },
            { label: '日期', value: 'date' },
            { label: '日期范围', value: 'dateRange' },
            { label: '级联选择', value: 'cascader' },
          ],
        },
      ],
    },
  ],
});

// Tree - 树形控件
blockRegistry.set('Tree', {
  type: 'Tree',
  label: '树形',
  icon: 'GitBranch',
  category: 'data',
  description: '树形结构展示',
  allowChildren: false,
  defaultProps: {
    type: 'Tree',
    showSearch: true,
    checkable: false,
    expandAll: false,
    nodeKey: 'id',
    nodeLabel: 'name',
    nodeChildren: 'children',
  },
  propertySchema: [
    { key: 'showSearch', label: '显示搜索', type: 'boolean', defaultValue: true },
    { key: 'checkable', label: '可勾选', type: 'boolean', defaultValue: false },
    { key: 'expandAll', label: '默认展开', type: 'boolean', defaultValue: false },
  ],
  advancedSchema: [
    { key: 'apiPath', label: 'API 路径', type: 'text' },
    { key: 'nodeKey', label: '节点 Key', type: 'text', defaultValue: 'id' },
    { key: 'nodeLabel', label: '节点标签', type: 'text', defaultValue: 'name' },
    { key: 'nodeChildren', label: '子节点字段', type: 'text', defaultValue: 'children' },
  ],
});

// Form - 表单
blockRegistry.set('Form', {
  type: 'Form',
  label: '表单',
  icon: 'ClipboardList',
  category: 'form',
  description: '数据录入表单',
  allowChildren: false,
  defaultProps: {
    type: 'Form',
    fields: [],
    layout: 'horizontal',
    labelWidth: 100,
    columns: 2,
    submitText: '提交',
    resetText: '重置',
  },
  propertySchema: [
    {
      key: 'fields',
      label: '表单字段',
      type: 'array',
      arrayItemSchema: [
        { key: 'key', label: '字段名', type: 'text', required: true },
        { key: 'label', label: '标签', type: 'text', required: true },
        {
          key: 'type',
          label: '类型',
          type: 'select',
          options: [
            { label: '输入框', value: 'input' },
            { label: '文本域', value: 'textarea' },
            { label: '下拉选择', value: 'select' },
            { label: '单选', value: 'radio' },
            { label: '复选', value: 'checkbox' },
            { label: '日期', value: 'date' },
            { label: '日期范围', value: 'dateRange' },
            { label: '数字', value: 'number' },
            { label: '开关', value: 'switch' },
            { label: '级联选择', value: 'cascader' },
            { label: '文件上传', value: 'upload' },
          ],
        },
        { key: 'required', label: '必填', type: 'boolean' },
        { key: 'span', label: '栅格', type: 'number', defaultValue: 12 },
      ],
    },
    {
      key: 'layout',
      label: '布局',
      type: 'select',
      options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' },
        { label: '行内', value: 'inline' },
      ],
    },
    { key: 'columns', label: '列数', type: 'number', defaultValue: 2, min: 1, max: 4 },
  ],
  advancedSchema: [
    { key: 'labelWidth', label: '标签宽度', type: 'number', defaultValue: 100 },
    { key: 'submitText', label: '提交按钮文字', type: 'text', defaultValue: '提交' },
    { key: 'resetText', label: '重置按钮文字', type: 'text', defaultValue: '重置' },
  ],
});

// Card - 卡片
blockRegistry.set('Card', {
  type: 'Card',
  label: '卡片',
  icon: 'CreditCard',
  category: 'container',
  description: '卡片容器',
  allowChildren: true,
  defaultProps: {
    type: 'Card',
    bordered: true,
    hoverable: false,
    children: [],
  },
  propertySchema: [
    { key: 'title', label: '标题', type: 'text' },
    { key: 'bordered', label: '显示边框', type: 'boolean', defaultValue: true },
    { key: 'hoverable', label: '悬停效果', type: 'boolean', defaultValue: false },
  ],
});

// Dialog - 弹窗
blockRegistry.set('Dialog', {
  type: 'Dialog',
  label: '弹窗',
  icon: 'Square',
  category: 'overlay',
  description: '模态弹窗',
  allowChildren: true,
  defaultProps: {
    type: 'Dialog',
    title: '弹窗标题',
    width: '600px',
    closable: true,
    maskClosable: false,
    footer: true,
    children: [],
  },
  propertySchema: [
    { key: 'title', label: '标题', type: 'text', required: true },
    { key: 'width', label: '宽度', type: 'text', defaultValue: '600px' },
    { key: 'closable', label: '显示关闭', type: 'boolean', defaultValue: true },
    { key: 'footer', label: '显示底部', type: 'boolean', defaultValue: true },
  ],
  advancedSchema: [
    { key: 'maskClosable', label: '点击遮罩关闭', type: 'boolean', defaultValue: false },
  ],
});

// Drawer - 抽屉
blockRegistry.set('Drawer', {
  type: 'Drawer',
  label: '抽屉',
  icon: 'PanelRight',
  category: 'overlay',
  description: '侧边抽屉',
  allowChildren: true,
  defaultProps: {
    type: 'Drawer',
    title: '抽屉标题',
    width: '400px',
    placement: 'right',
    closable: true,
    maskClosable: true,
    children: [],
  },
  propertySchema: [
    { key: 'title', label: '标题', type: 'text', required: true },
    { key: 'width', label: '宽度', type: 'text', defaultValue: '400px' },
    {
      key: 'placement',
      label: '位置',
      type: 'select',
      options: [
        { label: '右侧', value: 'right' },
        { label: '左侧', value: 'left' },
        { label: '顶部', value: 'top' },
        { label: '底部', value: 'bottom' },
      ],
    },
  ],
  advancedSchema: [
    { key: 'closable', label: '显示关闭', type: 'boolean', defaultValue: true },
    { key: 'maskClosable', label: '点击遮罩关闭', type: 'boolean', defaultValue: true },
  ],
});

// Chart - 图表
blockRegistry.set('Chart', {
  type: 'Chart',
  label: '图表',
  icon: 'BarChart3',
  category: 'chart',
  description: '数据图表',
  allowChildren: false,
  defaultProps: {
    type: 'Chart',
    chartType: 'bar',
    height: 300,
  },
  propertySchema: [
    {
      key: 'chartType',
      label: '图表类型',
      type: 'select',
      options: [
        { label: '折线图', value: 'line' },
        { label: '柱状图', value: 'bar' },
        { label: '饼图', value: 'pie' },
        { label: '散点图', value: 'scatter' },
        { label: '雷达图', value: 'radar' },
      ],
    },
    { key: 'title', label: '标题', type: 'text' },
    { key: 'height', label: '高度', type: 'number', defaultValue: 300 },
  ],
  advancedSchema: [
    { key: 'apiPath', label: 'API 路径', type: 'text' },
  ],
});

// Custom - 自定义
blockRegistry.set('Custom', {
  type: 'Custom',
  label: '自定义',
  icon: 'Puzzle',
  category: 'custom',
  description: '自定义组件',
  allowChildren: false,
  defaultProps: {
    type: 'Custom',
    componentName: '',
  },
  propertySchema: [
    { key: 'componentName', label: '组件名', type: 'text', required: true },
    { key: 'props', label: '属性', type: 'code', description: 'JSON 格式的 props' },
  ],
});

// ============================================================================
// Registry API
// ============================================================================

/**
 * 获取 Block 元数据
 */
export function getBlockMeta(type: BlockType): BlockMeta | undefined {
  return blockRegistry.get(type);
}

/**
 * 获取所有 Block 元数据
 */
export function getAllBlockMeta(): BlockMeta[] {
  return Array.from(blockRegistry.values());
}

/**
 * 按分类获取 Block
 */
export function getBlocksByCategory(category: BlockMeta['category']): BlockMeta[] {
  return getAllBlockMeta().filter(b => b.category === category);
}

/**
 * 注册新 Block（用于插件扩展）
 */
export function registerBlock(meta: BlockMeta): void {
  blockRegistry.set(meta.type, meta);
}

/**
 * 创建 Block 节点
 * 自动为节点和子节点生成唯一 ID
 */
export function createBlockNode(type: BlockType, overrides: Partial<LayoutNode> = {}): LayoutNode {
  const meta = getBlockMeta(type);
  if (!meta) {
    throw new Error(`Unknown block type: ${type}`);
  }

  // 深拷贝 defaultProps 并生成唯一 ID
  const node = JSON.parse(JSON.stringify({
    ...meta.defaultProps,
    label: meta.label,
    ...overrides,
  }));

  // 为节点生成唯一 ID
  node.id = nanoid(8);

  // 递归为子节点生成唯一 ID
  function regenerateIds(n: any) {
    if (n.id) {
      n.id = nanoid(8);
    }
    if (Array.isArray(n.children)) {
      n.children.forEach(regenerateIds);
    }
  }

  if (Array.isArray(node.children)) {
    node.children.forEach(regenerateIds);
  }

  return node as LayoutNode;
}

/**
 * 检查是否可以添加子节点
 */
export function canAddChild(parentType: BlockType, childType: BlockType): boolean {
  const parentMeta = getBlockMeta(parentType);
  const childMeta = getBlockMeta(childType);

  if (!parentMeta || !childMeta) return false;
  if (!parentMeta.allowChildren) return false;
  if (childMeta.allowedParents && !childMeta.allowedParents.includes(parentType)) {
    return false;
  }

  return true;
}
