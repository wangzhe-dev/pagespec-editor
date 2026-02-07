import type { PromptSections } from './prompt.types';

export function formatPromptSections(sections: PromptSections): string {
  return [
    '## Deliverables',
    ...sections.deliverables,
    '',
    '## Hard Rules',
    ...sections.hardRules,
    '',
    '## DSL',
    ...sections.dsl,
    '',
    '## Leaf Details',
    ...sections.leafDetails,
    '',
    '## Checklist',
    ...sections.checklist,
  ].join('\n');
}
