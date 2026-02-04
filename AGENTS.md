项目背景说明（AI 请先读）

这是一个面向前端开发者的工具：AI 页面约束 / 话术生成器。我在真实项目中经常用 Codex / Cursor / Copilot 等 agent 通过“截图 + 一句话”生成页面，但复杂页面（上下左右多区域、每块组件不同、带联动/弹框/主从表等）非常容易跑偏：AI 会脑补样式、混用原生标签和项目 UI 组件、目录结构不符合项目习惯、遗漏交互联动，导致我需要大量返工。本项目的目标不是“用 AI 自动写代码”，而是把我脑子里对页面的结构与约束，变成一个 结构化 PageSpec（页面规格），并由 **Prompt Builder（话术编译器）**输出一段 agent 最容易理解且不易跑偏的“强约束话术”，让我一键复制粘贴到 agent 对话框中执行，从而显著降低复杂页面生成后的返工成本。

本工具的核心工作流非常明确：用户在工具中用最快方式配置页面骨架（布局树：Split/Stack/Tabs 等）、各区域使用的组件块（Table/Tree/Form/Card/Dialog/Drawer/Chart…）、字段信息（columns/filters/formFields）、交互联动（通过预置 Recipe 选择：Tree.select→reload、Master.rowClick→load detail、Search→reload&reset 等）、以及项目级组件映射与约束（ProjectProfile：每个 BlockType 对应项目中的组件别名/路径、禁止原生标签、禁止引入新 UI 库、样式极简仅布局间距、目录命名规范等）。然后 Prompt Builder 将 PageSpec + ProjectProfile 编译成两部分输出：短 DSL（结构骨架）+ 强约束自然语言（规则/交付/联动/字段），并提供短/长两种话术版本以及批量（Batch Manifest）输出。工具本身不负责生成业务代码；真正的页面代码由外部 agent 执行话术生成。

为了可维护与可扩展，本项目采用三层分离：
	•	Schema（数据层）：定义 PageSpec / ProjectProfile / Registry / Recipe 等可序列化结构，必须带 schemaVersion 并支持 migrations，保证未来升级不破坏旧数据；
	•	Editor（编辑器层）：只负责 UI 交互（页面列表、布局树编辑、属性面板、话术预览/复制），不在 UI 中写死业务逻辑；新增一个 BlockType 应尽量只通过 Registry 注册实现；
	•	Compiler（编译器层）：Prompt Builder 是纯函数，输入结构化数据输出 PromptResult，必须可单元测试、可复用（网页端/VSCode Webview/CLI）。

技术栈：Vue3 + TypeScript + shadcn-vue。初期是网页端 MVP，后续会迁移为 VSCode Webview，但核心 Schema 与 Compiler 需要保持跨端复用。

非目标（请不要跑偏）
	•	不做低配 Figma/低代码页面渲染器：工具不需要渲染出真实 UI，仅需表达结构与约束（“快、清楚、稳定”优先）。
	•	不实现拦截 Copilot/Cursor 对话流：agent 的对话由用户自行粘贴话术触发，本工具只生成话术。
	•	不内置在线 LLM 调用：MVP 不依赖任何第三方 AI API Key，避免增加成本与复杂度。
	•	不强行扫描代码仓库：组件映射优先通过 ProjectProfile 配置（用户手填/导入），未来再考虑可选的 repo 扫描能力。

成功标准
	•	用户在 30~60 秒内完成一个复杂页面的 PageSpec 配置，并复制出话术；
	•	话术能显著减少 agent 的跑偏（组件不混用、目录不乱、样式不乱加、联动不漏）；
	•	支持批量页面清单（Batch Manifest）输出，便于分批生成多页；
	•	新增组件块（BlockType）不会导致大规模重构（Registry 驱动）。
