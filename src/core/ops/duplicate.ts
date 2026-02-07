import { clonePageSpec } from '../model/id';
import type { PageSpec } from '../model/types';

export function duplicateSpec(spec: PageSpec): PageSpec {
  return clonePageSpec(spec);
}
