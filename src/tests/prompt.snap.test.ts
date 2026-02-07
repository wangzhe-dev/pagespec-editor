import { describe, expect, it } from 'vitest';
import { buildPrompt } from '@/core/prompt/buildPrompt';
import type { PageSpec, ProjectProfile } from '@/core/model/types';

const now = 1700000000000;

const pageSpec: PageSpec = {
  id: 'page-1',
  name: '示例页面',
  root: {
    id: 'root-1',
    type: 'PageRoot',
    title: '示例页面',
    children: [],
  },
  recipes: [],
  dialogs: [],
  drawers: [],
  createdAt: now,
  updatedAt: now,
};

const profile: ProjectProfile = {
  id: 'profile-1',
  name: '默认配置',
  componentMapping: {
    Table: 'JrTable',
    Tree: 'JrTree',
    Form: 'JrForm',
    Tabs: 'JrTabs',
    Dialog: 'JrDialog',
    Drawer: 'JrDrawer',
    Card: 'JrCard',
    Chart: 'JrChart',
    Input: 'JrInput',
    Select: 'JrSelect',
    DatePicker: 'JrDatePicker',
    Button: 'JrButton',
  },
  forbiddenRules: {
    forbiddenComponents: [],
    forbiddenLibraries: [],
    forbiddenPatterns: [],
  },
  directoryConvention: {
    pageDir: 'src/views',
    componentDir: 'src/components',
    serviceDir: 'src/services',
    mockDir: 'src/mocks',
    storeDir: 'src/stores',
    typeDir: 'src/types',
  },
  namingConvention: {
    pageFile: 'kebab',
    componentFile: 'pascal',
    serviceFile: 'kebab',
    functionName: 'camel',
    variableName: 'camel',
  },
  customConstraints: [],
  createdAt: now,
  updatedAt: now,
};

describe('buildPrompt', () => {
  it('should include page name in output', () => {
    const result = buildPrompt(pageSpec, profile, { includeDeliverables: false });
    expect(result.mainPrompt).toContain('示例页面');
  });
});
