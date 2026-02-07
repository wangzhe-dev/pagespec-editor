/**
 * Lint - 编译期自检
 * 检测 PageSpec 中的问题并给出建议
 */

import type { PageSpec, ProjectProfile, LayoutNode, TableNode, FormNode, Recipe } from '../model/types';

// ============================================================================
// Lint 规则类型
// ============================================================================

export type LintSeverity = 'error' | 'warning' | 'info';

export interface LintIssue {
  severity: LintSeverity;
  code: string;
  message: string;
  path: string;
  nodeId?: string;
  suggestion?: string;
}

export interface LintResult {
  issues: LintIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passed: boolean;
}

// ============================================================================
// Lint Context
// ============================================================================

interface LintContext {
  pageSpec: PageSpec;
  profile: ProjectProfile;
  nodeMap: Map<string, LayoutNode>;
}

type LintRule = (node: LayoutNode, path: string, context: LintContext) => LintIssue[];
type RecipeLintRule = (recipe: Recipe, context: LintContext) => LintIssue[];

// ============================================================================
// Node 规则
// ============================================================================

const tableColumnsRequired: LintRule = (node, path) => {
  if (node.type !== 'Table') return [];
  const table = node as TableNode;
  
  if (!table.columns || table.columns.length === 0) {
    return [{
      severity: 'error',
      code: 'TABLE_NO_COLUMNS',
      message: `表格【${node.label || node.id}】缺少列配置`,
      path,
      nodeId: node.id,
      suggestion: '请在属性面板中添加至少一个列定义',
    }];
  }
  return [];
};

const tableFiltersInColumns: LintRule = (node, path) => {
  if (node.type !== 'Table') return [];
  const table = node as TableNode;
  if (!table.filters || !table.columns) return [];
  
  const issues: LintIssue[] = [];
  const colKeys = new Set(table.columns.map(c => c.key));
  
  for (const filter of table.filters) {
    const baseKey = filter.key.split('.')[0];
    if (!colKeys.has(filter.key) && !colKeys.has(baseKey)) {
      issues.push({
        severity: 'warning',
        code: 'FILTER_NOT_IN_COLUMNS',
        message: `筛选字段【${filter.key}】不在表格列中`,
        path: `${path}.filters`,
        nodeId: node.id,
        suggestion: `考虑将 ${filter.key} 添加到列配置中`,
      });
    }
  }
  return issues;
};

const formFieldsRequired: LintRule = (node, path) => {
  if (node.type !== 'Form') return [];
  const form = node as FormNode;
  
  if (!form.fields || form.fields.length === 0) {
    return [{
      severity: 'error',
      code: 'FORM_NO_FIELDS',
      message: `表单【${node.label || node.id}】缺少字段配置`,
      path,
      nodeId: node.id,
      suggestion: '请在属性面板中添加表单字段',
    }];
  }
  return [];
};

const tabsNotEmpty: LintRule = (node, path) => {
  if (node.type !== 'Tabs') return [];
  
  if (!node.children || node.children.length === 0) {
    return [{
      severity: 'error',
      code: 'TABS_EMPTY',
      message: `标签页【${node.label || node.id}】没有任何 Tab`,
      path,
      nodeId: node.id,
      suggestion: '请添加至少一个 Tab 标签项',
    }];
  }
  return [];
};

const tabKeyRequired: LintRule = (node, path) => {
  if (node.type !== 'Tab') return [];
  const issues: LintIssue[] = [];
  
  if (!node.tabKey) {
    issues.push({
      severity: 'error',
      code: 'TAB_NO_KEY',
      message: `标签项【${node.title}】缺少 tabKey`,
      path,
      nodeId: node.id,
      suggestion: '请设置唯一的 tabKey',
    });
  }
  return issues;
};

const tabContentNotEmpty: LintRule = (node, path) => {
  if (node.type !== 'Tab') return [];
  
  if (!node.children || node.children.length === 0) {
    return [{
      severity: 'info',
      code: 'TAB_EMPTY_CONTENT',
      message: `标签项【${node.title}】内容为空`,
      path,
      nodeId: node.id,
      suggestion: '建议确认是否需要添加内容',
    }];
  }
  return [];
};

const componentMappingCheck: LintRule = (node, path, context) => {
  const { profile } = context;
  const mapping = profile.componentMapping;
  
  const typeMapping: Record<string, keyof typeof mapping> = {
    'Table': 'Table',
    'Tree': 'Tree',
    'Form': 'Form',
    'Tabs': 'Tabs',
    'Dialog': 'Dialog',
    'Drawer': 'Drawer',
    'Card': 'Card',
    'Chart': 'Chart',
  };
  
  const componentType = typeMapping[node.type];
  if (!componentType) return [];
  
  const mappedComponent = mapping[componentType];
  if (!mappedComponent) {
    return [{
      severity: 'warning',
      code: 'COMPONENT_MAPPING_MISSING',
      message: `组件类型【${node.type}】没有配置组件映射`,
      path,
      nodeId: node.id,
      suggestion: `在项目配置中为 ${node.type} 设置组件映射`,
    }];
  }
  return [];
};

// ============================================================================
// Recipe 规则
// ============================================================================

const recipeSourceExists: RecipeLintRule = (recipe, context) => {
  if (!context.nodeMap.has(recipe.sourceId)) {
    return [{
      severity: 'error',
      code: 'RECIPE_SOURCE_NOT_FOUND',
      message: `联动源节点【${recipe.sourceId}】不存在`,
      path: `recipes[${recipe.id}]`,
      suggestion: '请选择有效的触发源节点',
    }];
  }
  return [];
};

const recipeTargetsExist: RecipeLintRule = (recipe, context) => {
  const issues: LintIssue[] = [];
  for (const targetId of recipe.targetIds) {
    if (!context.nodeMap.has(targetId)) {
      issues.push({
        severity: 'error',
        code: 'RECIPE_TARGET_NOT_FOUND',
        message: `联动目标节点【${targetId}】不存在`,
        path: `recipes[${recipe.id}]`,
        suggestion: '请选择有效的目标节点',
      });
    }
  }
  return issues;
};

const recipeHasTargets: RecipeLintRule = (recipe) => {
  if (!recipe.targetIds || recipe.targetIds.length === 0) {
    return [{
      severity: 'error',
      code: 'RECIPE_NO_TARGETS',
      message: `联动【${recipe.id}】没有设置目标节点`,
      path: `recipes[${recipe.id}]`,
      suggestion: '请为联动选择至少一个目标节点',
    }];
  }
  return [];
};

// ============================================================================
// 规则注册表
// ============================================================================

const nodeRules: LintRule[] = [
  tableColumnsRequired,
  tableFiltersInColumns,
  formFieldsRequired,
  tabsNotEmpty,
  tabKeyRequired,
  tabContentNotEmpty,
  componentMappingCheck,
];

const recipeRules: RecipeLintRule[] = [
  recipeSourceExists,
  recipeTargetsExist,
  recipeHasTargets,
];

// ============================================================================
// 辅助函数
// ============================================================================

function traverseNodes(
  node: LayoutNode,
  path: string,
  callback: (node: LayoutNode, path: string) => void,
): void {
  callback(node, path);
  if ('children' in node && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      traverseNodes(node.children[i], `${path}.children[${i}]`, callback);
    }
  }
}

function buildNodeMap(node: LayoutNode, map: Map<string, LayoutNode> = new Map()): Map<string, LayoutNode> {
  map.set(node.id, node);
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      buildNodeMap(child, map);
    }
  }
  return map;
}

// ============================================================================
// 主函数
// ============================================================================

export function lint(pageSpec: PageSpec, profile: ProjectProfile): LintResult {
  const issues: LintIssue[] = [];
  const nodeMap = buildNodeMap(pageSpec.root as unknown as LayoutNode);
  
  const context: LintContext = { pageSpec, profile, nodeMap };

  traverseNodes(pageSpec.root as unknown as LayoutNode, 'root', (node, path) => {
    for (const rule of nodeRules) {
      issues.push(...rule(node, path, context));
    }
  });

  for (const recipe of pageSpec.recipes) {
    for (const rule of recipeRules) {
      issues.push(...rule(recipe, context));
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  return {
    issues,
    errorCount,
    warningCount,
    infoCount,
    passed: errorCount === 0,
  };
}

export function hasErrors(pageSpec: PageSpec, profile: ProjectProfile): boolean {
  return lint(pageSpec, profile).errorCount > 0;
}

export function getErrorSummary(pageSpec: PageSpec, profile: ProjectProfile): string[] {
  return lint(pageSpec, profile).issues
    .filter(i => i.severity === 'error')
    .map(i => i.message);
}
