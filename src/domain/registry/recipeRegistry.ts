/**
 * Recipe Registry
 * 联动配方注册表
 * 预定义常见的交互联动模式
 */

import type { RecipeType, Recipe } from '../schema';
import { nanoid } from 'nanoid';

// ============================================================================
// Recipe 元数据类型
// ============================================================================

export interface RecipeMeta {
  type: RecipeType;
  label: string;
  icon: string;
  description: string;
  sourceTypes: string[];      // 允许的触发源类型
  targetTypes: string[];      // 允许的目标类型
  paramSchema: RecipeParam[]; // 参数定义
  promptTemplate: string;     // Prompt 模板
  dslTemplate: string;        // DSL 模板
}

export interface RecipeParam {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
  required?: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

// ============================================================================
// Recipe 注册表
// ============================================================================

const recipeRegistry = new Map<RecipeType, RecipeMeta>();

// ============================================================================
// 默认 Recipe 注册
// ============================================================================

// 树选择刷新表格
recipeRegistry.set('TreeSelectRefresh', {
  type: 'TreeSelectRefresh',
  label: '树选择刷新',
  icon: 'GitBranch',
  description: '选中树节点时刷新关联表格',
  sourceTypes: ['Tree'],
  targetTypes: ['Table'],
  paramSchema: [
    { key: 'paramName', label: '参数名', type: 'text', defaultValue: 'treeId' },
    { key: 'resetPage', label: '重置分页', type: 'boolean', defaultValue: true },
  ],
  promptTemplate: `当用户选中【{sourceName}】的节点时，将选中节点的 {paramName} 作为查询参数，刷新【{targetName}】表格数据{resetPageText}`,
  dslTemplate: `{sourceId}.onSelect({paramName}) => reload({targetId}, {{paramName}}{resetPageParam})`,
});

// 主从表联动
recipeRegistry.set('MasterDetailLoad', {
  type: 'MasterDetailLoad',
  label: '主从联动',
  icon: 'Rows',
  description: '点击主表行加载从表详情',
  sourceTypes: ['Table'],
  targetTypes: ['Table', 'Form', 'Card'],
  paramSchema: [
    { key: 'paramName', label: '参数名', type: 'text', defaultValue: 'masterId' },
  ],
  promptTemplate: `当用户点击【{sourceName}】的某一行时，获取该行的 {paramName}，加载【{targetName}】的详情数据`,
  dslTemplate: `{sourceId}.onRowClick({paramName}) => loadDetail({targetId}, {{paramName}})`,
});

// 搜索重载
recipeRegistry.set('SearchReload', {
  type: 'SearchReload',
  label: '搜索重载',
  icon: 'Search',
  description: '搜索条件变化时重载数据',
  sourceTypes: ['Form', 'Table'],
  targetTypes: ['Table'],
  paramSchema: [
    { key: 'debounce', label: '防抖延迟(ms)', type: 'text', defaultValue: '300' },
  ],
  promptTemplate: `当【{sourceName}】的搜索条件变化时，{debounceText}刷新【{targetName}】数据并重置到第一页`,
  dslTemplate: `{sourceId}.onSearch({debounceParam}) => reload({targetId}, {searchParams, page: 1})`,
});

// Tab 懒加载
recipeRegistry.set('TabLazyLoad', {
  type: 'TabLazyLoad',
  label: 'Tab懒加载',
  icon: 'SquareStack',
  description: '切换 Tab 时懒加载内容',
  sourceTypes: ['Tabs'],
  targetTypes: ['Table', 'Form', 'Chart'],
  paramSchema: [],
  promptTemplate: `当用户切换到【{targetName}】所在的 Tab 时，首次激活时加载数据，后续切换不重复请求`,
  dslTemplate: `{sourceId}.onTabChange({targetTabKey}) => lazyLoad({targetId})`,
});

// 表单提交后刷新
recipeRegistry.set('FormSubmitRefresh', {
  type: 'FormSubmitRefresh',
  label: '提交后刷新',
  icon: 'RefreshCw',
  description: '表单提交成功后刷新列表',
  sourceTypes: ['Form', 'Dialog', 'Drawer'],
  targetTypes: ['Table'],
  paramSchema: [
    { key: 'closeAfter', label: '提交后关闭', type: 'boolean', defaultValue: true },
  ],
  promptTemplate: `当【{sourceName}】提交成功后，刷新【{targetName}】列表数据{closeAfterText}`,
  dslTemplate: `{sourceId}.onSubmitSuccess() => {closeAction}reload({targetId})`,
});

// 弹窗确认后刷新
recipeRegistry.set('DialogConfirmRefresh', {
  type: 'DialogConfirmRefresh',
  label: '确认后刷新',
  icon: 'CheckSquare',
  description: '弹窗确认后刷新数据',
  sourceTypes: ['Dialog'],
  targetTypes: ['Table'],
  paramSchema: [],
  promptTemplate: `当【{sourceName}】点击确认按钮并操作成功后，关闭弹窗并刷新【{targetName}】`,
  dslTemplate: `{sourceId}.onConfirm() => close() && reload({targetId})`,
});

// 行操作打开弹窗
recipeRegistry.set('RowActionDialog', {
  type: 'RowActionDialog',
  label: '行操作弹窗',
  icon: 'ExternalLink',
  description: '点击表格行操作按钮打开弹窗',
  sourceTypes: ['Table'],
  targetTypes: ['Dialog'],
  paramSchema: [
    { key: 'actionName', label: '操作名称', type: 'text', defaultValue: '编辑' },
    { key: 'loadDetail', label: '加载详情', type: 'boolean', defaultValue: true },
  ],
  promptTemplate: `当用户点击【{sourceName}】的{actionName}按钮时，{loadDetailText}打开【{targetName}】弹窗`,
  dslTemplate: `{sourceId}.onAction('{actionName}', rowId) => {loadDetailAction}open({targetId})`,
});

// 行操作打开抽屉
recipeRegistry.set('RowActionDrawer', {
  type: 'RowActionDrawer',
  label: '行操作抽屉',
  icon: 'PanelRight',
  description: '点击表格行操作按钮打开抽屉',
  sourceTypes: ['Table'],
  targetTypes: ['Drawer'],
  paramSchema: [
    { key: 'actionName', label: '操作名称', type: 'text', defaultValue: '详情' },
    { key: 'loadDetail', label: '加载详情', type: 'boolean', defaultValue: true },
  ],
  promptTemplate: `当用户点击【{sourceName}】的{actionName}按钮时，{loadDetailText}打开【{targetName}】抽屉`,
  dslTemplate: `{sourceId}.onAction('{actionName}', rowId) => {loadDetailAction}open({targetId})`,
});

// 自定义联动
recipeRegistry.set('Custom', {
  type: 'Custom',
  label: '自定义联动',
  icon: 'Settings2',
  description: '自定义交互逻辑',
  sourceTypes: ['*'],
  targetTypes: ['*'],
  paramSchema: [
    { key: 'customDesc', label: '联动描述', type: 'text', required: true },
  ],
  promptTemplate: `{customDesc}`,
  dslTemplate: `// Custom: {customDesc}`,
});

// ============================================================================
// Recipe 编译器
// ============================================================================

export interface CompiledRecipe {
  prompt: string;
  dsl: string;
  warnings: string[];
}

/**
 * 编译 Recipe 为 Prompt 和 DSL
 */
export function compileRecipe(
  recipe: Recipe,
  sourceNode: { id: string; label?: string; type: string },
  targetNodes: { id: string; label?: string; type: string }[],
): CompiledRecipe {
  const meta = getRecipeMeta(recipe.type);
  if (!meta) {
    return {
      prompt: `[未知联动类型: ${recipe.type}]`,
      dsl: `// Unknown recipe: ${recipe.type}`,
      warnings: [`未知的联动类型: ${recipe.type}`],
    };
  }

  const warnings: string[] = [];
  const params = recipe.params || {};

  // 替换模板变量
  let prompt = meta.promptTemplate;
  let dsl = meta.dslTemplate;

  // 基础变量替换
  const sourceName = sourceNode.label || sourceNode.id;
  const targetName = targetNodes.map(n => n.label || n.id).join('、');
  const targetId = targetNodes.map(n => n.id).join(', ');

  prompt = prompt
    .replace(/{sourceName}/g, sourceName)
    .replace(/{targetName}/g, targetName)
    .replace(/{sourceId}/g, sourceNode.id)
    .replace(/{targetId}/g, targetId);

  dsl = dsl
    .replace(/{sourceName}/g, sourceName)
    .replace(/{targetName}/g, targetName)
    .replace(/{sourceId}/g, sourceNode.id)
    .replace(/{targetId}/g, targetId);

  // 参数替换
  for (const param of meta.paramSchema) {
    const value = params[param.key] ?? param.defaultValue;
    prompt = prompt.replace(new RegExp(`{${param.key}}`, 'g'), String(value));
    dsl = dsl.replace(new RegExp(`{${param.key}}`, 'g'), String(value));

    // 特殊处理
    if (param.key === 'resetPage') {
      prompt = prompt.replace(/{resetPageText}/g, value ? '，并重置到第一页' : '');
      dsl = dsl.replace(/{resetPageParam}/g, value ? ', page: 1' : '');
    }
    if (param.key === 'debounce') {
      const debounceMs = parseInt(value) || 0;
      prompt = prompt.replace(/{debounceText}/g, debounceMs > 0 ? `防抖 ${debounceMs}ms 后` : '');
      dsl = dsl.replace(/{debounceParam}/g, debounceMs > 0 ? `debounce: ${debounceMs}` : '');
    }
    if (param.key === 'closeAfter') {
      prompt = prompt.replace(/{closeAfterText}/g, value ? '，并关闭弹窗/抽屉' : '');
      dsl = dsl.replace(/{closeAction}/g, value ? 'close() && ' : '');
    }
    if (param.key === 'loadDetail') {
      prompt = prompt.replace(/{loadDetailText}/g, value ? '先加载该行详情数据，然后' : '');
      dsl = dsl.replace(/{loadDetailAction}/g, value ? 'loadDetail(rowId) && ' : '');
    }
    if (param.key === 'customDesc') {
      prompt = prompt.replace(/{customDesc}/g, value || '[请填写联动描述]');
      dsl = dsl.replace(/{customDesc}/g, value || 'TODO: describe interaction');
    }
  }

  // 验证
  if (targetNodes.length === 0) {
    warnings.push(`联动【${sourceName}】缺少目标节点`);
  }

  return { prompt, dsl, warnings };
}

// ============================================================================
// Registry API
// ============================================================================

/**
 * 获取 Recipe 元数据
 */
export function getRecipeMeta(type: RecipeType): RecipeMeta | undefined {
  return recipeRegistry.get(type);
}

/**
 * 获取所有 Recipe 元数据
 */
export function getAllRecipeMeta(): RecipeMeta[] {
  return Array.from(recipeRegistry.values());
}

/**
 * 获取适用于指定源类型的 Recipe
 */
export function getRecipesForSource(sourceType: string): RecipeMeta[] {
  return getAllRecipeMeta().filter(
    r => r.sourceTypes.includes('*') || r.sourceTypes.includes(sourceType)
  );
}

/**
 * 注册新 Recipe（用于插件扩展）
 */
export function registerRecipe(meta: RecipeMeta): void {
  recipeRegistry.set(meta.type, meta);
}

/**
 * 创建 Recipe 实例
 */
export function createRecipe(
  type: RecipeType,
  sourceId: string,
  targetIds: string[],
  params?: Record<string, string>,
): Recipe {
  return {
    id: nanoid(8),
    type,
    sourceId,
    targetIds,
    params,
  };
}

// 导出类型
export type { RecipeMeta, RecipeParam, CompiledRecipe };
