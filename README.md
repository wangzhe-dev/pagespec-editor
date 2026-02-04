# PageSpec Editor

> 页面规格编辑器 + 话术编译器

一款用于快速创建可版本化的 PageSpec，并将其编译成 AI Agent 友好的 "短 DSL + 强约束自然语言" 话术的工具。

## 🎯 核心特性

### 三层分离架构

```
src/
├── domain/
│   ├── schema/      # 数据层：Zod 校验 + 类型定义 + 迁移
│   ├── registry/    # 注册表：Block/Recipe 注册驱动 UI
│   └── compiler/    # 编译器：纯函数式 Prompt Builder
├── app/
│   └── store/       # Pinia 状态管理
└── components/
    └── editor/      # 编辑器 UI 组件
```

### Schema 层 - 数据结构版本化

- **PageSpec**: 页面规格定义（布局树、联动配方、弹窗/抽屉）
- **ProjectProfile**: 项目配置（组件映射、禁止规则、目录规范）
- **Workspace**: 工作区（包含多个 PageSpec 和 Profile）
- **Migrations**: 版本迁移系统，确保老数据平滑升级

### Registry 层 - 注册表驱动 UI

- **BlockRegistry**: Block 元数据注册表
  - 新增 Block 只需在此注册，无需修改 UI
  - 自动生成属性面板、图标、默认值
  
- **RecipeRegistry**: 联动配方注册表
  - 预定义常见联动模式（TreeSelectRefresh、MasterDetailLoad 等）
  - 可扩展自定义联动

### Compiler 层 - 纯函数式编译器

**PromptBuilder** 五大核心职责：

1. **结构归一化**: 布局树 → 短 DSL
   ```
   PageRoot("用户管理")
     Grid(cols=2, gap=16)
       C1=Tree#tree1(search)
       C2=Tabs{list:Table#userTable(cols=[name,age,status])}
   ```

2. **规则注入**: 组件映射 + 禁止规则 → 强约束句式
   ```
   【组件使用规范 - 强约束】
   - Table 必须使用 <JrTable> 组件
   - 禁止使用: el-table, a-table, native:table
   ```

3. **联动编译**: Recipe → 事件→动作→目标
   ```
   tree1.onSelect(treeId) => reload(userTable, {treeId, page: 1})
   ```

4. **交付清单生成**: 按页面类型输出可执行交付
   ```
   【交付清单】
   1. src/views/user-manage/index.vue
   2. src/services/user-manage.ts
   3. src/mocks/user-manage.ts
   ```

5. **编译期自检**: 检测问题并给出警告
   - 缺少列配置
   - 筛选字段不在列中
   - 联动目标不存在
   - Tab 内容为空

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📖 使用指南

### 1. 创建页面

点击左侧面板的 `+` 按钮创建新页面，在布局树中构建页面结构。

### 2. 添加节点

选择父节点，点击 `+` 按钮从分类菜单中添加子节点：
- **布局**: Grid（栅格）、GridCell（单元格）
- **容器**: Tabs（标签页）、Card（卡片）
- **数据**: Table（表格）、Tree（树形）
- **表单**: Form（表单）
- **弹层**: Dialog（弹窗）、Drawer（抽屉）
- **图表**: Chart（图表）

### 3. 配置属性

选中节点后，在右侧属性面板中配置：
- 基础属性：列配置、字段配置等
- 高级属性：API 路径、Mock 数量等
- 组件覆盖：临时使用其他组件

### 4. 配置项目

在工具栏点击 ⚙️ 打开项目配置：
- **组件映射**: Table → JrTable, Form → JrForm
- **禁止规则**: 禁止 el-table, 禁止内联样式
- **目录规范**: 页面放 src/views, 服务放 src/services

### 5. 预览和复制

底部面板实时预览编译结果：
- **Prompt**: 完整的提示词（可直接复制给 AI）
- **DSL**: 结构化的短 DSL
- **检查**: Lint 结果和警告

## 🧩 扩展开发

### 注册新 Block

```typescript
// src/domain/registry/blockRegistry.ts
blockRegistry.set('CustomBlock', {
  type: 'CustomBlock',
  label: '自定义块',
  icon: 'Puzzle',
  category: 'custom',
  description: '自定义组件块',
  allowChildren: false,
  defaultProps: {
    type: 'CustomBlock',
    // ...
  },
  propertySchema: [
    { key: 'name', label: '名称', type: 'text', required: true },
    // ...
  ],
});
```

### 注册新 Recipe

```typescript
// src/domain/registry/recipeRegistry.ts
recipeRegistry.set('CustomRecipe', {
  type: 'CustomRecipe',
  label: '自定义联动',
  icon: 'Zap',
  description: '自定义交互逻辑',
  sourceTypes: ['Table'],
  targetTypes: ['Dialog'],
  paramSchema: [],
  promptTemplate: '当【{sourceName}】触发时，执行【{targetName}】',
  dslTemplate: '{sourceId}.onCustom() => open({targetId})',
});
```

## 📁 文件结构

```
pagespec-editor/
├── src/
│   ├── domain/
│   │   ├── schema/
│   │   │   ├── types.ts        # Zod 校验 + TypeScript 类型
│   │   │   ├── migrations.ts   # 版本迁移
│   │   │   └── index.ts
│   │   ├── registry/
│   │   │   ├── blockRegistry.ts   # Block 注册表
│   │   │   ├── recipeRegistry.ts  # Recipe 注册表
│   │   │   └── index.ts
│   │   └── compiler/
│   │       ├── promptBuilder.ts   # Prompt 编译器
│   │       ├── lint.ts            # Lint 检查器
│   │       └── index.ts
│   ├── app/
│   │   └── store/
│   │       ├── pages.ts      # 页面状态
│   │       ├── profiles.ts   # 配置状态
│   │       ├── ui.ts         # UI 状态
│   │       └── index.ts
│   ├── components/
│   │   ├── editor/
│   │   │   ├── EditorLayout.vue
│   │   │   ├── EditorToolbar.vue
│   │   │   ├── PageListPanel.vue
│   │   │   ├── LayoutTreeEditor.vue
│   │   │   ├── PropertyInspector.vue
│   │   │   ├── PromptPreviewDock.vue
│   │   │   └── WelcomeScreen.vue
│   │   └── common/
│   │       └── ToastContainer.vue
│   ├── utils/
│   │   └── index.ts
│   ├── styles/
│   │   └── main.css
│   ├── App.vue
│   └── main.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## 🔮 后续规划

- [ ] VSCode Webview 版本
- [ ] 批量 20 页 Manifest 输出
- [ ] 自定义 Block/Recipe 从 JSON 加载
- [ ] IndexedDB 持久化（Dexie）
- [ ] 协作编辑支持
- [ ] 可视化布局预览

## 📄 License

MIT
