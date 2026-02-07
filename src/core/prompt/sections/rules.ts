import { HARD_RULES } from '@/core/model/defaults';

export function buildRulesSection(): string[] {
  return [
    ...HARD_RULES.map(rule => `- ${rule}`),
    '- 禁止在未声明区域新增布局块或改动 DSL 结构顺序',
    '- 必须严格复用叶子节点 componentRef，不得替换为其他组件库',
    '- 仅实现结构与联动，不进行视觉装饰升级',
  ];
}
