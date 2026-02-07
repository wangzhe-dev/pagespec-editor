import { isContainer, isLeaf } from '@/core/model/guards';
import type { PromptMode, Spec } from '@/core/model/types';

export function buildDeliverablesSection(spec: Spec, mode: PromptMode): string[] {
  const nodes = Object.values(spec.nodes);
  const leafTypes = new Set(nodes.filter(isLeaf).map(node => node.type));
  const hasOverlay = nodes.some(node => isContainer(node) && (node.type === 'dialog' || node.type === 'drawer'));

  const lines = [
    `1. 页面骨架：${spec.meta.name}/index.vue`,
    '2. 页面布局组件：按 DSL 区域拆分子组件（按需）',
  ];

  if (leafTypes.size > 0) {
    lines.push(`3. 业务叶子组件：${Array.from(leafTypes).join(', ')} 对应实现文件`);
  }

  if (hasOverlay) {
    lines.push('4. Overlay 组件：Dialog/Drawer 相关子模块');
  }

  lines.push('5. 交互联动实现：按 Leaf Details 中 recipes 对齐');

  if (mode !== 'short') {
    lines.push('6. Mock/API 占位：按叶子组件数据需求生成最小可运行数据层');
    lines.push('7. 验收自检：按 Checklist 逐条验证后再交付');
  }

  return lines;
}
