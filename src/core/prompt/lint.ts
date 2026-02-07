import { assertInvariants, isLeaf } from '../model/guards';
import type { Spec } from '../model/types';

export interface LintIssue {
  level: 'error' | 'warning';
  message: string;
}

export function lintSpec(spec: Spec): LintIssue[] {
  const issues: LintIssue[] = [];

  const invariantErrors = assertInvariants(spec);
  for (const error of invariantErrors) {
    issues.push({ level: 'error', message: error });
  }

  for (const node of Object.values(spec.nodes)) {
    if (isLeaf(node) && !node.leafMeta.componentRef) {
      issues.push({ level: 'warning', message: `leaf ${node.id} 缺少 componentRef` });
    }
  }

  return issues;
}
