import type { Spec } from '../model/types';
import { formatPromptSections } from './format';
import type { PromptBuildOptions, PromptResult } from './prompt.types';
import { buildChecklistSection } from './sections/checklist';
import { buildDeliverablesSection } from './sections/deliverables';
import { buildDslSection } from './sections/dsl';
import { buildLeafDetailsSection } from './sections/leafDetails';
import { buildRulesSection } from './sections/rules';

export function buildPrompt(spec: Spec, options: PromptBuildOptions): PromptResult {
  const includeGeometry = options.includeGeometry ?? false;

  const deliverables = buildDeliverablesSection(spec, options.mode);
  const hardRules = buildRulesSection();
  const dslResult = buildDslSection(spec, includeGeometry);
  const leafDetails = buildLeafDetailsSection(dslResult.entries);
  const checklist = buildChecklistSection(dslResult.entries);

  const sections = {
    deliverables,
    hardRules,
    dsl: dslResult.lines,
    leafDetails,
    checklist,
  };

  return {
    sections,
    rawText: formatPromptSections(sections),
  };
}
