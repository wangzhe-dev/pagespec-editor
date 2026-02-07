import type { PageSpec } from '../../model/types';

export function buildDeliverablesSection(spec: PageSpec): string[] {
  return [`交付页面：${spec.name}`];
}
