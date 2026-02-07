import { describe, expect, it } from 'vitest';
import { buildPrompt } from '@/core/prompt/buildPrompt';
import type { Spec } from '@/core/model/types';

const spec: Spec = {
  version: 1,
  rootId: 'root',
  nodes: {
    root: {
      id: 'root',
      kind: 'container',
      type: 'page',
      props: { title: '示例页' },
      slot: { kind: 'single', childId: 'leaf-a' },
    },
    'leaf-a': {
      id: 'leaf-a',
      kind: 'leaf',
      type: 'table',
      props: {},
      leafMeta: {
        componentRef: 'JrTable',
        description: '主列表',
        fields: { columns: ['id', 'name'] },
        recipes: ['search.submit.reload'],
      },
    },
  },
  meta: {
    id: 'spec-1',
    name: '示例页面',
    tags: [],
    updatedAt: 1700000000000,
  },
};

describe('buildPrompt', () => {
  it('should output fixed sections order', () => {
    const result = buildPrompt(spec, { mode: 'long', includeGeometry: false });

    const text = result.rawText;
    const idxDeliverables = text.indexOf('## Deliverables');
    const idxRules = text.indexOf('## Hard Rules');
    const idxDsl = text.indexOf('## DSL');
    const idxLeaf = text.indexOf('## Leaf Details');
    const idxChecklist = text.indexOf('## Checklist');

    expect(idxDeliverables).toBeGreaterThanOrEqual(0);
    expect(idxRules).toBeGreaterThan(idxDeliverables);
    expect(idxDsl).toBeGreaterThan(idxRules);
    expect(idxLeaf).toBeGreaterThan(idxDsl);
    expect(idxChecklist).toBeGreaterThan(idxLeaf);

    expect(result.rawText).toContain('JrTable');
    expect(result.rawText).toContain('Search.submit -> reload');
  });
});
