import type { ProjectProfile } from '../../model/types';

export function buildRulesSection(profile: ProjectProfile): string[] {
  const lines: string[] = [];
  lines.push('禁止引入未声明 UI 库');
  lines.push('禁止使用原生标签替代项目组件');

  if (profile.customConstraints.length > 0) {
    lines.push(...profile.customConstraints);
  }

  return lines;
}
