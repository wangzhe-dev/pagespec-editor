import { applyRecipe } from '@/core/recipes';
import type { LeafNode } from '@/core/model/types';
import type { DslNodeLine } from './dsl';

export function buildChecklistSection(entries: DslNodeLine[]): string[] {
  const lines: string[] = [
    '- [ ] 按 DSL 保持结构与区域编号一致',
    '- [ ] 每个 leaf 均使用对应 componentRef 实现',
    '- [ ] 禁止引入新增 UI 库，禁止原生标签替代项目组件',
  ];

  const leaves = entries.filter(
    (entry): entry is DslNodeLine & { node: LeafNode } => entry.node.kind === 'leaf',
  );
  for (const leaf of leaves) {
    lines.push(`- [ ] [${leaf.code}] 完成 ${leaf.node.type} 组件落位与数据占位`);

    const recipes = leaf.node.leafMeta.recipes || [];
    for (const recipeId of recipes) {
      const mapped = applyRecipe(recipeId);
      lines.push(`- [ ] [${leaf.code}] ${mapped.checklistLine}`);
    }
  }

  return lines;
}
