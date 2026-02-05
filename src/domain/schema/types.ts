/**
 * PageSpec Editor - Schema Layer
 * 所有可序列化的数据结构定义
 * 带版本号与迁移支持
 */

import { z } from 'zod';

// ============================================================================
// 基础类型
// ============================================================================

export const SCHEMA_VERSION = 1;

// 唯一标识符
export type NodeId = string;
export type BlockType =
  | 'PageRoot' | 'Tabs' | 'Tab'
  | 'Grid' | 'GridCell'  // Grid 栅格布局
  | 'Table' | 'Tree' | 'Form' | 'Card' | 'Dialog' | 'Drawer'
  | 'Chart' | 'Custom';

// ============================================================================
// Block 节点定义
// ============================================================================

// 基础节点属性
export const BaseNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    'PageRoot', 'Tabs', 'Tab',
    'Grid', 'GridCell',
    'Table', 'Tree', 'Form', 'Card', 'Dialog', 'Drawer',
    'Chart', 'Custom'
  ]),
  label: z.string().optional(),
  componentOverride: z.string().optional(), // 局部 override 组件映射
  advanced: z.record(z.any()).optional(),   // 高级属性折叠
});

// Tabs 容器
export const TabsNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Tabs'),
  defaultTab: z.string().optional(),
  lazy: z.boolean().optional(),
  children: z.array(z.lazy(() => TabNodeSchema)),
});

// 单个 Tab
export const TabNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Tab'),
  tabKey: z.string(),
  title: z.string(),
  icon: z.string().optional(),
  closable: z.boolean().optional(),
  children: z.array(z.lazy(() => LayoutNodeSchema)).optional(),
});

// ============================================================================
// Grid 栅格布局
// ============================================================================

// GridCell 单元格
export const GridCellSchema = BaseNodeSchema.extend({
  type: z.literal('GridCell'),
  // Flex 布局
  flex: z.number().optional(),           // flex 比例，如 2 表示 flex: 2
  // 位置与尺寸（基于 CSS Grid）
  colStart: z.number().default(1),      // grid-column-start
  colSpan: z.number().default(1),       // 占几列
  colSpanLocked: z.boolean().default(false), // 是否锁定列宽
  rowStart: z.number().default(1),      // grid-row-start
  rowSpan: z.number().default(1),       // 占几行
  // 对齐
  justifySelf: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  alignSelf: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  // 内边距
  padding: z.number().optional(),
  children: z.array(z.lazy(() => LayoutNodeSchema)).optional(),
});

// Grid 容器
export const GridNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Grid'),
  // 列配置
  columns: z.union([
    z.number(),                         // 固定列数，如 3
    z.string(),                         // 自定义模板，如 "1fr 2fr 1fr" 或 "repeat(4, 1fr)"
  ]).default(24),
  // 行配置
  rows: z.union([
    z.number(),                         // 固定行数
    z.string(),                         // 自定义模板，如 "auto 1fr auto"
  ]).optional(),
  // 间距
  gap: z.union([
    z.number(),                         // 统一间距
    z.object({ row: z.number(), col: z.number() }), // 行列分别
  ]).default(12),
  // 对齐
  justifyItems: z.enum(['start', 'center', 'end', 'stretch']).default('stretch'),
  alignItems: z.enum(['start', 'center', 'end', 'stretch']).default('stretch'),
  // 最小单元格高度
  minCellHeight: z.number().optional(),
  children: z.array(z.lazy(() => GridCellSchema)).default([]),
});

// ============================================================================
// 业务 Block 定义
// ============================================================================

// 表格列定义
export const TableColumnSchema = z.object({
  key: z.string(),
  title: z.string(),
  width: z.union([z.number(), z.string()]).optional(),
  fixed: z.enum(['left', 'right']).optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  render: z.string().optional(), // 自定义渲染 slot 名
  formatter: z.string().optional(), // 格式化函数名
});

// 表格 Block
export const TableNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Table'),
  columns: z.array(TableColumnSchema),
  pagination: z.boolean().default(true),
  selection: z.enum(['none', 'single', 'multiple']).default('none'),
  rowKey: z.string().default('id'),
  apiPath: z.string().optional(),
  mockCount: z.number().default(5),
  filters: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['input', 'select', 'date', 'dateRange', 'cascader']),
    options: z.array(z.object({ label: z.string(), value: z.any() })).optional(),
  })).optional(),
  toolbar: z.array(z.enum(['add', 'delete', 'export', 'refresh', 'custom'])).optional(),
});

// 树形 Block
export const TreeNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Tree'),
  showSearch: z.boolean().default(true),
  checkable: z.boolean().default(false),
  expandAll: z.boolean().default(false),
  apiPath: z.string().optional(),
  nodeKey: z.string().default('id'),
  nodeLabel: z.string().default('name'),
  nodeChildren: z.string().default('children'),
});

// 表单字段
export const FormFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum([
    'input', 'textarea', 'select', 'radio', 'checkbox',
    'date', 'dateRange', 'number', 'switch', 'cascader',
    'upload', 'custom'
  ]),
  required: z.boolean().default(false),
  rules: z.array(z.object({
    type: z.string(),
    message: z.string(),
  })).optional(),
  options: z.array(z.object({ label: z.string(), value: z.any() })).optional(),
  span: z.number().default(12), // 栅格占比
  disabled: z.boolean().optional(),
  placeholder: z.string().optional(),
});

// 表单 Block
export const FormNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Form'),
  fields: z.array(FormFieldSchema),
  layout: z.enum(['horizontal', 'vertical', 'inline']).default('horizontal'),
  labelWidth: z.number().default(100),
  columns: z.number().default(2),
  submitText: z.string().default('提交'),
  resetText: z.string().default('重置'),
});

// 卡片 Block
export const CardNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Card'),
  title: z.string().optional(),
  bordered: z.boolean().default(true),
  hoverable: z.boolean().default(false),
  children: z.array(z.lazy(() => LayoutNodeSchema)).optional(),
});

// 弹窗 Block
export const DialogNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Dialog'),
  title: z.string(),
  width: z.union([z.number(), z.string()]).default('600px'),
  closable: z.boolean().default(true),
  maskClosable: z.boolean().default(false),
  footer: z.boolean().default(true),
  children: z.array(z.lazy(() => LayoutNodeSchema)).optional(),
});

// 抽屉 Block
export const DrawerNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Drawer'),
  title: z.string(),
  width: z.union([z.number(), z.string()]).default('400px'),
  placement: z.enum(['left', 'right', 'top', 'bottom']).default('right'),
  closable: z.boolean().default(true),
  maskClosable: z.boolean().default(true),
  children: z.array(z.lazy(() => LayoutNodeSchema)).optional(),
});

// 图表 Block
export const ChartNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Chart'),
  chartType: z.enum(['line', 'bar', 'pie', 'scatter', 'radar', 'custom']),
  title: z.string().optional(),
  apiPath: z.string().optional(),
  height: z.number().default(300),
});

// 自定义 Block
export const CustomNodeSchema = BaseNodeSchema.extend({
  type: z.literal('Custom'),
  componentName: z.string(),
  props: z.record(z.any()).optional(),
});

// PageRoot 根节点
export const PageRootSchema = BaseNodeSchema.extend({
  type: z.literal('PageRoot'),
  title: z.string(),
  route: z.string().optional(),
  children: z.array(z.lazy(() => LayoutNodeSchema)),
});

// 联合布局节点类型
export const LayoutNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion('type', [
    TabsNodeSchema,
    TabNodeSchema,
    GridNodeSchema,
    GridCellSchema,
    TableNodeSchema,
    TreeNodeSchema,
    FormNodeSchema,
    CardNodeSchema,
    DialogNodeSchema,
    DrawerNodeSchema,
    ChartNodeSchema,
    CustomNodeSchema,
  ])
);

// ============================================================================
// Recipe（联动配方）定义
// ============================================================================

export type RecipeType =
  | 'TreeSelectRefresh'      // 树选择刷新表格
  | 'MasterDetailLoad'       // 主从表加载
  | 'SearchReload'           // 搜索重载
  | 'TabLazyLoad'            // Tab 懒加载
  | 'FormSubmitRefresh'      // 表单提交后刷新
  | 'DialogConfirmRefresh'   // 弹窗确认后刷新
  | 'RowActionDialog'        // 行操作打开弹窗
  | 'RowActionDrawer'        // 行操作打开抽屉
  | 'Custom';                // 自定义联动

export const RecipeSchema = z.object({
  id: z.string(),
  type: z.enum([
    'TreeSelectRefresh',
    'MasterDetailLoad',
    'SearchReload',
    'TabLazyLoad',
    'FormSubmitRefresh',
    'DialogConfirmRefresh',
    'RowActionDialog',
    'RowActionDrawer',
    'Custom'
  ]),
  sourceId: z.string(),              // 触发源节点 ID
  targetIds: z.array(z.string()),    // 目标节点 ID 列表
  params: z.record(z.string()).optional(), // 参数映射
  description: z.string().optional(), // 自定义描述（Custom 类型用）
});

export type Recipe = z.infer<typeof RecipeSchema>;

// ============================================================================
// PageSpec 完整定义
// ============================================================================

export const PageSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  root: PageRootSchema,
  recipes: z.array(RecipeSchema).default([]),
  dialogs: z.array(DialogNodeSchema).default([]),  // 独立弹窗列表
  drawers: z.array(DrawerNodeSchema).default([]),  // 独立抽屉列表
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type PageSpec = z.infer<typeof PageSpecSchema>;

// ============================================================================
// ProjectProfile（项目配置）定义
// ============================================================================

// 组件映射策略
export const ComponentMappingSchema = z.object({
  Table: z.string().default('JrTable'),
  Tree: z.string().default('JrTree'),
  Form: z.string().default('JrForm'),
  Tabs: z.string().default('JrTabs'),
  Dialog: z.string().default('JrDialog'),
  Drawer: z.string().default('JrDrawer'),
  Card: z.string().default('JrCard'),
  Chart: z.string().default('JrChart'),
  Input: z.string().default('JrInput'),
  Select: z.string().default('JrSelect'),
  DatePicker: z.string().default('JrDatePicker'),
  Button: z.string().default('JrButton'),
  // 可扩展更多...
});

// 禁止规则
export const ForbiddenRulesSchema = z.object({
  forbiddenComponents: z.array(z.string()).default([
    'el-table', 'el-form', 'el-dialog', 'el-drawer', 'el-tabs',
    'a-table', 'a-form', 'a-modal', 'a-drawer', 'a-tabs',
    'native:table', 'native:form', 'native:dialog',
  ]),
  forbiddenLibraries: z.array(z.string()).default([
    'element-plus', 'ant-design-vue', 'naive-ui', 'vuetify',
  ]),
  forbiddenPatterns: z.array(z.string()).default([
    'style=".*"',  // 禁止内联样式
    ':style=',     // 禁止动态样式
  ]),
});

// 目录规范
export const DirectoryConventionSchema = z.object({
  pageDir: z.string().default('src/views'),
  componentDir: z.string().default('src/components'),
  serviceDir: z.string().default('src/services'),
  mockDir: z.string().default('src/mocks'),
  storeDir: z.string().default('src/stores'),
  typeDir: z.string().default('src/types'),
});

// 命名规范
export const NamingConventionSchema = z.object({
  pageFile: z.enum(['kebab', 'pascal', 'camel']).default('kebab'),
  componentFile: z.enum(['kebab', 'pascal', 'camel']).default('pascal'),
  serviceFile: z.enum(['kebab', 'pascal', 'camel']).default('kebab'),
  functionName: z.enum(['camel', 'pascal']).default('camel'),
  variableName: z.enum(['camel', 'snake']).default('camel'),
});

// 项目配置完整定义
export const ProjectProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  componentMapping: ComponentMappingSchema.default({}),
  forbiddenRules: ForbiddenRulesSchema.default({}),
  directoryConvention: DirectoryConventionSchema.default({}),
  namingConvention: NamingConventionSchema.default({}),
  customConstraints: z.array(z.string()).default([]), // 自定义约束句子
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ProjectProfile = z.infer<typeof ProjectProfileSchema>;

// ============================================================================
// Workspace（工作区）定义
// ============================================================================

export const WorkspaceSchema = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  id: z.string(),
  name: z.string(),
  pages: z.array(PageSpecSchema).default([]),
  profiles: z.array(ProjectProfileSchema).default([]),
  activePageId: z.string().optional(),
  activeProfileId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

// ============================================================================
// 导出所有类型推断
// ============================================================================

export type BaseNode = z.infer<typeof BaseNodeSchema>;
export type TabsNode = z.infer<typeof TabsNodeSchema>;
export type TabNode = z.infer<typeof TabNodeSchema>;
export type GridNode = z.infer<typeof GridNodeSchema>;
export type GridCell = z.infer<typeof GridCellSchema>;
export type TableNode = z.infer<typeof TableNodeSchema>;
export type TreeNode = z.infer<typeof TreeNodeSchema>;
export type FormNode = z.infer<typeof FormNodeSchema>;
export type CardNode = z.infer<typeof CardNodeSchema>;
export type DialogNode = z.infer<typeof DialogNodeSchema>;
export type DrawerNode = z.infer<typeof DrawerNodeSchema>;
export type ChartNode = z.infer<typeof ChartNodeSchema>;
export type CustomNode = z.infer<typeof CustomNodeSchema>;
export type PageRoot = z.infer<typeof PageRootSchema>;
export type LayoutNode = z.infer<typeof LayoutNodeSchema>;
export type TableColumn = z.infer<typeof TableColumnSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type ComponentMapping = z.infer<typeof ComponentMappingSchema>;
export type ForbiddenRules = z.infer<typeof ForbiddenRulesSchema>;
export type DirectoryConvention = z.infer<typeof DirectoryConventionSchema>;
export type NamingConvention = z.infer<typeof NamingConventionSchema>;
