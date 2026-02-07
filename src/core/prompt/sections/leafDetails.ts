import { applyRecipe } from '@/core/recipes';
import type { LeafNode } from '@/core/model/types';
import type { DslNodeLine } from './dsl';

function fmtFieldList(label: string, values?: string[]): string {
  if (!values || values.length === 0) return '';
  return `  - ${label}: ${values.join(', ')}`;
}

export function buildLeafDetailsSection(entries: DslNodeLine[]): string[] {
  const lines: string[] = [];

  const leaves = entries.filter(
    (entry): entry is DslNodeLine & { node: LeafNode } => entry.node.kind === 'leaf',
  );
  if (leaves.length === 0) {
    return ['- 无 leaf 节点'];
  }

  for (const leaf of leaves) {
    const meta = leaf.node.leafMeta;
    lines.push(`- [${leaf.code}] ${leaf.node.type} -> ${meta.componentRef}`);
    if (meta.description) {
      lines.push(`  - description: ${meta.description}`);
    }

    const fieldLines = [
      fmtFieldList('columns', meta.fields?.columns),
      fmtFieldList('form', meta.fields?.form),
      fmtFieldList('series', meta.fields?.series),
      fmtFieldList('items', meta.fields?.items),
    ].filter(Boolean);

    lines.push(...fieldLines);

    if (meta.recipes && meta.recipes.length > 0) {
      lines.push(`  - recipes:`);
      for (const recipeId of meta.recipes) {
        const mapped = applyRecipe(recipeId);
        lines.push(`    - ${mapped.promptLine}`);
      }
    }
  }

  return lines;
}
