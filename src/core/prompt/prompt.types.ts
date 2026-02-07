import type { PromptMode } from '../model/types';

export interface PromptBuildOptions {
  mode: PromptMode;
  includeGeometry?: boolean;
}

export interface PromptSections {
  deliverables: string[];
  hardRules: string[];
  dsl: string[];
  leafDetails: string[];
  checklist: string[];
}

export interface PromptResult {
  sections: PromptSections;
  rawText: string;
}
