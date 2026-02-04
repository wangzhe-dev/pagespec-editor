/**
 * Prompt Builder
 * TypeScript 纯函数式 Prompt 编译器
 * 
 * 核心职责：
 * 1. 结构归一化 - 布局树标准化输出成短 DSL
 * 2. 规则注入 - 组件映射/禁用项/目录规范编译成强约束句式
 * 3. 联动编译 - Recipe 转成明确的事件→动作→目标
 * 4. 交付清单生成 - 按页面类型输出可执行交付
 * 5. 编译期自检与警告 - 缺失/错误检测
 */

import type { PageSpec, ProjectProfile, LayoutNode, Recipe, TableNode, FormNode, TreeNode } from '../schema';
import { compileRecipe, getRecipeMeta } from '../registry';

// ============================================================================
// 编译配置
// ============================================================================

export interface PromptStyle {
  length: 'short' | 'medium' | 'long';
  language: 'zh' | 'en' | 'zh-en';
  strictness: 'strict' | 'normal' | 'loose';
  includeDeliverables: boolean;
  includeManifest: boolean;
  skeletonMode: boolean;      // 骨架模式 vs 完整模式
  diffMode: boolean;          // 差异模式（只输出变更部分）
}

export const DEFAULT_STYLE: PromptStyle = {
  length: 'medium',
  language: 'zh',
  strictness: 'strict',
  includeDeliverables: true,
  includeManifest: false,
  skeletonMode: false,
  diffMode: false,
};

// ============================================================================
// 编译结果
// ============================================================================

export interface PromptResult {
  mainPrompt: string;         // 主提示词
  dsl: string;                // 结构 DSL
  constraints: string[];      // 约束列表
  interactions: string[];     // 交互描述
  deliverables: string[];     // 交付清单
  warnings: string[];         // 警告信息
  tokenEstimate: number;      // Token 估算
  metadata: {
    pageId: string;
    pageName: string;
    blockCount: number;
    recipeCount: number;
    compiledAt: number;
  };
}

// ============================================================================
// DSL 生成器
// ============================================================================

/**
 * 将布局树转换为短 DSL
 */
export function generateDSL(node: LayoutNode, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  
  switch (node.type) {
    case 'PageRoot':
      const rootChildren = (node.children || [])
        .map(c => generateDSL(c, indent + 1))
        .join('\n');
      return `PageRoot("${node.title}")\n${rootChildren}`;

    case 'Split': {
      const dir = node.direction === 'horizontal' ? 'H' : 'V';
      const sizes = node.sizes?.join(',') || '50,50';
      const children = (node.children || [])
        .map((c, i) => {
          const label = node.direction === 'horizontal' 
            ? (i === 0 ? 'L' : 'R') 
            : (i === 0 ? 'T' : 'B');
          return `${pad}  ${label}=${generateDSL(c, 0).trim()}`;
        })
        .join('\n');
      return `${pad}Split${dir}(${sizes})\n${children}`;
    }

    case 'Stack': {
      const dir = node.direction === 'row' ? 'Row' : 'Col';
      const gap = node.gap || 0;
      const children = (node.children || [])
        .map(c => `${pad}  ${generateDSL(c, 0).trim()}`)
        .join('\n');
      return `${pad}Stack${dir}(gap=${gap})\n${children}`;
    }

    case 'Tabs': {
      const tabs = (node.children || [])
        .map(tab => {
          const tabContent = tab.children?.length 
            ? generateDSL(tab.children[0], 0).trim()
            : 'Empty';
          return `${tab.tabKey}:${tabContent}`;
        })
        .join(', ');
      return `${pad}Tabs{${tabs}}`;
    }

    case 'Tab':
      return `Tab("${node.title}")`;

    case 'Table': {
      const cols = (node.columns || []).map(c => c.key).join(',');
      const filters = node.filters?.map(f => f.key).join(',') || '';
      const parts = [`cols=[${cols}]`];
      if (filters) parts.push(`filters=[${filters}]`);
      if (node.selection !== 'none') parts.push(`sel=${node.selection}`);
      if (node.pagination === false) parts.push('noPaging');
      return `${pad}Table#${node.id}(${parts.join(', ')})`;
    }

    case 'Tree': {
      const parts: string[] = [];
      if (node.showSearch) parts.push('search');
      if (node.checkable) parts.push('check');
      if (node.expandAll) parts.push('expandAll');
      return `${pad}Tree#${node.id}(${parts.join(', ')})`;
    }

    case 'Form': {
      const fields = (node.fields || []).map(f => f.key).join(',');
      return `${pad}Form#${node.id}(fields=[${fields}], layout=${node.layout}, cols=${node.columns})`;
    }

    case 'Card':
      const cardContent = (node.children || [])
        .map(c => generateDSL(c, indent + 1))
        .join('\n');
      return `${pad}Card("${node.title || ''}")\n${cardContent}`;

    case 'Dialog': {
      const dialogContent = (node.children || [])
        .map(c => generateDSL(c, 0).trim())
        .join(', ');
      return `${pad}Dialog#${node.id}("${node.title}", width=${node.width})[${dialogContent}]`;
    }

    case 'Drawer': {
      const drawerContent = (node.children || [])
        .map(c => generateDSL(c, 0).trim())
        .join(', ');
      return `${pad}Drawer#${node.id}("${node.title}", ${node.placement}, width=${node.width})[${drawerContent}]`;
    }

    case 'Chart':
      return `${pad}Chart#${node.id}(type=${node.chartType}, h=${node.height})`;

    case 'Custom':
      return `${pad}Custom#${node.id}("${node.componentName}")`;

    default:
      return `${pad}Unknown(${(node as any).type})`;
  }
}

// ============================================================================
// 约束生成器
// ============================================================================

/**
 * 生成组件映射约束
 */
function generateComponentConstraints(profile: ProjectProfile): string[] {
  const constraints: string[] = [];
  const mapping = profile.componentMapping;

  constraints.push('【组件使用规范 - 强约束】');
  
  for (const [blockType, componentName] of Object.entries(mapping)) {
    constraints.push(`- ${blockType} 必须使用 <${componentName}> 组件`);
  }

  return constraints;
}

/**
 * 生成禁止规则约束
 */
function generateForbiddenConstraints(profile: ProjectProfile): string[] {
  const constraints: string[] = [];
  const rules = profile.forbiddenRules;

  constraints.push('【禁止事项 - 违反即返工】');
  
  if (rules.forbiddenComponents?.length) {
    constraints.push(`- 禁止使用以下组件: ${rules.forbiddenComponents.join(', ')}`);
  }
  
  if (rules.forbiddenLibraries?.length) {
    constraints.push(`- 禁止引入以下 UI 库: ${rules.forbiddenLibraries.join(', ')}`);
  }
  
  if (rules.forbiddenPatterns?.length) {
    constraints.push(`- 禁止使用内联样式、动态样式绑定`);
  }

  constraints.push('- 禁止脑补 UI 细节，只做布局/间距/对齐');
  constraints.push('- 禁止新增未在组件映射中声明的 UI 组件');

  return constraints;
}

/**
 * 生成目录规范约束
 */
function generateDirectoryConstraints(profile: ProjectProfile): string[] {
  const dir = profile.directoryConvention;
  const naming = profile.namingConvention;

  return [
    '【目录与命名规范】',
    `- 页面文件放置于: ${dir.pageDir}`,
    `- 组件文件放置于: ${dir.componentDir}`,
    `- 服务文件放置于: ${dir.serviceDir}`,
    `- Mock 文件放置于: ${dir.mockDir}`,
    `- 页面文件命名: ${naming.pageFile}-case`,
    `- 组件文件命名: ${naming.componentFile}Case`,
    `- 函数命名: ${naming.functionName}Case`,
  ];
}

// ============================================================================
// 交互编译器
// ============================================================================

/**
 * 编译所有 Recipe 为交互描述
 */
function compileInteractions(
  recipes: Recipe[],
  nodeMap: Map<string, LayoutNode>,
): { interactions: string[]; dslLines: string[]; warnings: string[] } {
  const interactions: string[] = [];
  const dslLines: string[] = [];
  const warnings: string[] = [];

  if (recipes.length === 0) {
    return { interactions, dslLines, warnings };
  }

  interactions.push('【交互联动规则】');
  dslLines.push('// Interactions');

  for (const recipe of recipes) {
    const sourceNode = nodeMap.get(recipe.sourceId);
    const targetNodes = recipe.targetIds
      .map(id => nodeMap.get(id))
      .filter((n): n is LayoutNode => n !== undefined);

    if (!sourceNode) {
      warnings.push(`联动源节点不存在: ${recipe.sourceId}`);
      continue;
    }

    if (targetNodes.length === 0) {
      warnings.push(`联动【${sourceNode.label || sourceNode.id}】没有有效的目标节点`);
      continue;
    }

    const compiled = compileRecipe(
      recipe,
      { id: recipe.sourceId, label: sourceNode.label, type: sourceNode.type },
      targetNodes.map(n => ({ id: n.id, label: n.label, type: n.type })),
    );

    interactions.push(`- ${compiled.prompt}`);
    dslLines.push(compiled.dsl);
    warnings.push(...compiled.warnings);
  }

  return { interactions, dslLines, warnings };
}

// ============================================================================
// 交付清单生成器
// ============================================================================

/**
 * 生成交付清单
 */
function generateDeliverables(
  pageSpec: PageSpec,
  profile: ProjectProfile,
  style: PromptStyle,
): string[] {
  const dir = profile.directoryConvention;
  const pageName = pageSpec.name.replace(/\s+/g, '-').toLowerCase();
  
  const deliverables: string[] = ['【交付清单】'];

  // 页面文件
  deliverables.push(`1. ${dir.pageDir}/${pageName}/index.vue - 页面主文件`);
  
  // 组件文件
  const componentCount = countComponents(pageSpec.root);
  if (componentCount > 0) {
    deliverables.push(`2. ${dir.componentDir}/${pageName}/ - 页面组件目录`);
  }

  // 服务文件
  deliverables.push(`3. ${dir.serviceDir}/${pageName}.ts - API 服务封装`);

  // Mock 文件
  deliverables.push(`4. ${dir.mockDir}/${pageName}.ts - Mock 数据（至少 5 条）`);

  // 类型文件
  deliverables.push(`5. ${dir.typeDir}/${pageName}.ts - TypeScript 类型定义`);

  // 附加要求
  deliverables.push('');
  deliverables.push('【交付要求】');
  deliverables.push('- 所有文件必须可直接运行，不得有语法错误');
  deliverables.push('- Mock 数据必须真实合理，字段齐全');
  deliverables.push('- 组件引用必须使用项目组件映射中声明的组件');
  deliverables.push('- 不得引入任何新的 UI 库或第三方依赖');

  if (style.skeletonMode) {
    deliverables.push('- 【骨架模式】仅生成结构框架，业务逻辑用 TODO 标注');
  }

  return deliverables;
}

/**
 * 计算组件数量
 */
function countComponents(node: LayoutNode): number {
  let count = 0;
  
  if (['Table', 'Tree', 'Form', 'Chart'].includes(node.type)) {
    count = 1;
  }
  
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      count += countComponents(child);
    }
  }
  
  return count;
}

// ============================================================================
// 警告检测器
// ============================================================================

/**
 * 检测 PageSpec 中的问题
 */
function detectWarnings(pageSpec: PageSpec, nodeMap: Map<string, LayoutNode>): string[] {
  const warnings: string[] = [];

  // 遍历所有节点检测问题
  function checkNode(node: LayoutNode, path: string) {
    // Table 检查
    if (node.type === 'Table') {
      const table = node as TableNode;
      if (!table.columns || table.columns.length === 0) {
        warnings.push(`表格【${node.label || node.id}】缺少列配置`);
      }
      // 检查 filters 是否在 columns 中
      if (table.filters) {
        for (const filter of table.filters) {
          const colKeys = table.columns?.map(c => c.key) || [];
          if (!colKeys.includes(filter.key) && !filter.key.includes('.')) {
            warnings.push(`表格【${node.label || node.id}】的筛选字段 "${filter.key}" 不在列配置中`);
          }
        }
      }
    }

    // Form 检查
    if (node.type === 'Form') {
      const form = node as FormNode;
      if (!form.fields || form.fields.length === 0) {
        warnings.push(`表单【${node.label || node.id}】缺少字段配置`);
      }
    }

    // Split 检查
    if (node.type === 'Split') {
      if (!node.children || node.children.length < 2) {
        warnings.push(`分割布局【${node.label || node.id}】子节点不足（至少需要 2 个）`);
      }
    }

    // Tabs 检查
    if (node.type === 'Tabs') {
      if (!node.children || node.children.length === 0) {
        warnings.push(`标签页【${node.label || node.id}】没有任何 Tab`);
      }
    }

    // Tab 检查
    if (node.type === 'Tab') {
      if (!node.tabKey) {
        warnings.push(`标签项【${node.label || node.title}】缺少 tabKey`);
      }
      if (!node.children || node.children.length === 0) {
        warnings.push(`标签项【${node.title}】内容为空`);
      }
    }

    // 递归检查子节点
    if ('children' in node && Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        checkNode(node.children[i], `${path}[${i}]`);
      }
    }
  }

  checkNode(pageSpec.root as unknown as LayoutNode, 'root');

  // 检查 Recipe 目标
  for (const recipe of pageSpec.recipes) {
    for (const targetId of recipe.targetIds) {
      if (!nodeMap.has(targetId)) {
        warnings.push(`联动目标节点不存在: ${targetId}`);
      }
    }
  }

  return warnings;
}

// ============================================================================
// 节点映射构建器
// ============================================================================

/**
 * 构建节点 ID 到节点的映射
 */
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
// Token 估算器
// ============================================================================

/**
 * 估算 Token 数量
 */
function estimateTokens(text: string): number {
  // 粗略估算：中文 1 字符 ≈ 1.5 token，英文 4 字符 ≈ 1 token
  const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherCount = text.length - chineseCount;
  return Math.ceil(chineseCount * 1.5 + otherCount / 4);
}

// ============================================================================
// 主编译函数
// ============================================================================

/**
 * 编译 PageSpec 为 Prompt
 */
export function buildPrompt(
  pageSpec: PageSpec,
  profile: ProjectProfile,
  style: Partial<PromptStyle> = {},
): PromptResult {
  const mergedStyle: PromptStyle = { ...DEFAULT_STYLE, ...style };
  const nodeMap = buildNodeMap(pageSpec.root as unknown as LayoutNode);

  // 1. 生成 DSL
  const dsl = generateDSL(pageSpec.root as unknown as LayoutNode);

  // 2. 生成约束
  const componentConstraints = generateComponentConstraints(profile);
  const forbiddenConstraints = generateForbiddenConstraints(profile);
  const directoryConstraints = generateDirectoryConstraints(profile);
  const customConstraints = profile.customConstraints.length > 0
    ? ['【项目自定义约束】', ...profile.customConstraints.map(c => `- ${c}`)]
    : [];

  const allConstraints = [
    ...componentConstraints,
    '',
    ...forbiddenConstraints,
    '',
    ...directoryConstraints,
    ...(customConstraints.length > 0 ? ['', ...customConstraints] : []),
  ];

  // 3. 编译交互
  const { interactions, dslLines, warnings: interactionWarnings } = compileInteractions(
    pageSpec.recipes,
    nodeMap,
  );

  // 4. 生成交付清单
  const deliverables = mergedStyle.includeDeliverables
    ? generateDeliverables(pageSpec, profile, mergedStyle)
    : [];

  // 5. 检测警告
  const structureWarnings = detectWarnings(pageSpec, nodeMap);
  const allWarnings = [...structureWarnings, ...interactionWarnings];

  // 6. 组装主 Prompt
  const promptParts: string[] = [];

  // 开头总约束
  promptParts.push(`请为我生成【${pageSpec.name}】页面的完整代码。`);
  promptParts.push('');
  promptParts.push('='.repeat(50));
  promptParts.push('【页面结构 DSL】');
  promptParts.push('='.repeat(50));
  promptParts.push(dsl);
  if (dslLines.length > 1) {
    promptParts.push('');
    promptParts.push(dslLines.join('\n'));
  }

  promptParts.push('');
  promptParts.push('='.repeat(50));
  promptParts.push(...allConstraints);

  if (interactions.length > 0) {
    promptParts.push('');
    promptParts.push('='.repeat(50));
    promptParts.push(...interactions);
  }

  if (deliverables.length > 0) {
    promptParts.push('');
    promptParts.push('='.repeat(50));
    promptParts.push(...deliverables);
  }

  // 结尾再次强调约束
  promptParts.push('');
  promptParts.push('='.repeat(50));
  promptParts.push('【再次强调】');
  promptParts.push('- 严格按照上述 DSL 结构生成，不得自行增减组件');
  promptParts.push('- 所有组件必须使用组件映射中指定的项目组件');
  promptParts.push('- 禁止引入任何新的 UI 库或使用原生 HTML 标签替代');
  promptParts.push('- 只做布局、间距、对齐，不得脑补额外的 UI 装饰');

  if (allWarnings.length > 0) {
    promptParts.push('');
    promptParts.push('【需要确认的 TODO】');
    allWarnings.forEach(w => promptParts.push(`⚠️ ${w}`));
  }

  const mainPrompt = promptParts.join('\n');

  // 7. 计算 Token 估算
  const tokenEstimate = estimateTokens(mainPrompt);

  return {
    mainPrompt,
    dsl,
    constraints: allConstraints,
    interactions,
    deliverables,
    warnings: allWarnings,
    tokenEstimate,
    metadata: {
      pageId: pageSpec.id,
      pageName: pageSpec.name,
      blockCount: nodeMap.size,
      recipeCount: pageSpec.recipes.length,
      compiledAt: Date.now(),
    },
  };
}

// ============================================================================
// 批量编译
// ============================================================================

/**
 * 批量编译多个 PageSpec
 */
export function buildBatchPrompt(
  pageSpecs: PageSpec[],
  profile: ProjectProfile,
  style: Partial<PromptStyle> = {},
): { manifest: string; results: PromptResult[] } {
  const results = pageSpecs.map(spec => buildPrompt(spec, profile, style));

  const manifestParts: string[] = [
    '# 批量页面生成清单',
    '',
    `共 ${pageSpecs.length} 个页面`,
    '',
    '## 页面列表',
    '',
  ];

  results.forEach((result, i) => {
    manifestParts.push(`### ${i + 1}. ${result.metadata.pageName}`);
    manifestParts.push(`- 节点数: ${result.metadata.blockCount}`);
    manifestParts.push(`- 联动数: ${result.metadata.recipeCount}`);
    manifestParts.push(`- Token 估算: ${result.tokenEstimate}`);
    if (result.warnings.length > 0) {
      manifestParts.push(`- ⚠️ 警告: ${result.warnings.length} 条`);
    }
    manifestParts.push('');
  });

  return {
    manifest: manifestParts.join('\n'),
    results,
  };
}

// 导出类型
export type { PromptStyle, PromptResult };
