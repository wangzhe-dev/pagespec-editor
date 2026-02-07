export function formatSection(title: string, lines: string[]): string {
  const body = lines.join('\n');
  return [`【${title}】`, body].join('\n');
}
